#!/bin/bash
# Rögtön — nightly backup on the HOST, as gyorsadmin (docker group, no sudo). Started by the user timer gma-mentes.timer (03:40
# Europe/Budapest). Design and reasons: docs/decisions/2026-10-18-g8-mentes.md.
#
#   bash uzem/mentes.sh            # one backup now → ~/gma/mentes/napi/<YYYYMMDD-HHMM>.age
#
# What goes in (one age-encrypted tar):
#   km.dump          `pg_dump -Fc` of the km database, taken inside gma-db (one consistent snapshot)
#   fajlok-album.tar ~/gma/adatok/fajlok + ~/gma/adatok/album — read through a throwaway container as root, because the app
#                    owns those folders (uid 1000, mode 770) and gyorsadmin cannot read them directly
#   MANIFEST         date, live commit, sizes, sha256 of both parts, row counts of fiok / szervezet (the restore drill compares)
#
# Encryption: `age -R ~/gma/mentes-kulcs.pub`. That file holds only the PUBLIC key; the private key lives only in Csilla's vault on
# her Mac. This box can write backups but cannot read them back — a stolen copy (or a stolen box's backup folder) is useless.
# The plaintext parts exist only during the run, in ~/gma/mentes/.munka (mode 700), and are removed right after encryption:
# they are by-products of this run, not data (moving them to _torolni/ would leave an unencrypted copy behind).
#
# Retention: the newest 14 stay in napi/; older ones move to ~/gma/_torolni/mentes-napi/ (never deleted — deleting is Csilla's click).
# Off-box copy: uzem/mentes-lehuz.sh, run on the Mac, pulls napi/ to ~/saas/mentes/rogton/.
# Restore drill: uzem/mentes-visszatolt.sh.
#
# Log: ~/gma/naplo/mentes-<YYYYMM>.log. A successful run ends with:  mentés kész: <file> <size>
# Exit codes: 0 done · 2 environment (no key, no age, no db, lock) · 3 dump failed · 4 files failed · 5 encryption failed
set -uo pipefail
umask 077

GMA=${GMA_GYOKER:-$HOME/gma}
KULCS=${MENTES_KULCS:-$GMA/mentes-kulcs.pub}
NAPI=$GMA/mentes/napi
MUNKA=$GMA/mentes/.munka
MEGORZES=${MENTES_MEGORZES:-14}
mkdir -p "$GMA/naplo" "$GMA/allapot" "$NAPI" "$GMA/_torolni/mentes-napi" || exit 2
NAPLO="$GMA/naplo/mentes-$(date +%Y%m).log"
[ -n "${MENTES_NAPLOZVA:-}" ] || { export MENTES_NAPLOZVA=1; exec > >(tee -a "$NAPLO") 2>&1; }

echo "=== $(date '+%F %T') mentés ==="
megall() { echo "MEGÁLL: $2"; [ -d "$MUNKA" ] && rm -rf "$MUNKA"; exit "$1"; }

command -v age >/dev/null || megall 2 "nincs age a gépen (sudo apt install age — lásd uzem/README.md, G8 sudo batch)"
[ -s "$KULCS" ] || megall 2 "nincs nyilvános kulcs: $KULCS (Mac: age-keygen — lásd uzem/README.md)"
grep -q '^age1' "$KULCS" || megall 2 "a $KULCS nem age nyilvános kulcs (age1… sor kell; titkos kulcs NEM lehet ezen a gépen)"
grep -q 'AGE-SECRET-KEY' "$KULCS" && megall 2 "a $KULCS TITKOS kulcsot tartalmaz — ennek csak a Macen van helye; cseréld a nyilvánosra"
[ "$(docker inspect -f '{{.State.Running}}' gma-db 2>/dev/null)" = "true" ] || megall 2 "a gma-db nem fut"

# not during a deploy (migrations would race with the counts); kirak.sh holds this lock for its whole run
exec 8>"$GMA/allapot/zar"
flock -w 3600 8 || megall 2 "egy kirakás egy órája tart — most kihagyom"

rm -rf "$MUNKA"; mkdir -p "$MUNKA" && chmod 700 "$MUNKA" || megall 2 "nem tudom létrehozni: $MUNKA"
NEV=$(date +%Y%m%d-%H%M)

# 1. database: custom format, one snapshot; pg_restore -l proves it is readable before it is encrypted
docker exec gma-db pg_dump -Fc -U km_tulaj -d km > "$MUNKA/km.dump" || megall 3 "a pg_dump hibával állt le"
[ -s "$MUNKA/km.dump" ] || megall 3 "a pg_dump üres fájlt adott"
TABLAK=$(docker exec -i gma-db pg_restore -l < "$MUNKA/km.dump" | grep -c ' TABLE DATA ') || megall 3 "a dump nem olvasható vissza (pg_restore -l)"
SZAMOK=$(docker exec gma-db psql -U km_tulaj -d km -tAc "SELECT (SELECT count(*) FROM fiok) || ' ' || (SELECT count(*) FROM szervezet)") \
  || megall 3 "a sorok száma nem kérdezhető le"
echo "adatbázis: $(stat -c %s "$MUNKA/km.dump") bájt, $TABLAK tábla adattal, fiok/szervezet: $SZAMOK"

# 2. files: through a throwaway container (no network, read-only mount) — the app image is always there
docker run --rm --network none --user 0 -v "$GMA/adatok:/a:ro" --entrypoint tar gma-app:aktiv -cf - -C /a fajlok album \
  > "$MUNKA/fajlok-album.tar" || megall 4 "a fájlok kimentése hibával állt le"
DB_FAJL=$(tar -tf "$MUNKA/fajlok-album.tar" | grep -vc '/$') || DB_FAJL=0
echo "fájlok: $(stat -c %s "$MUNKA/fajlok-album.tar") bájt, $DB_FAJL fájl"

# 3. manifest
{
  echo "mentes=$NEV"
  echo "keszult=$(date -Is)"
  echo "kint=$(cat "$GMA/allapot/kint" 2>/dev/null || echo ismeretlen)"
  echo "fiok_szervezet=$SZAMOK"
  echo "tablak_adattal=$TABLAK"
  echo "fajlok=$DB_FAJL"
  (cd "$MUNKA" && sha256sum km.dump fajlok-album.tar | sed 's/^/sha256 /')
} > "$MUNKA/MANIFEST"

# 4. one encrypted file; written under a temporary name, renamed only when complete
tar -cf - -C "$MUNKA" MANIFEST km.dump fajlok-album.tar | age -R "$KULCS" -o "$NAPI/$NEV.age.resz" \
  || { mv -f "$NAPI/$NEV.age.resz" "$GMA/_torolni/mentes-napi/$NEV.age.felkesz" 2>/dev/null; megall 5 "a titkosítás hibával állt le"; }
head -c 22 "$NAPI/$NEV.age.resz" | grep -q '^age-encryption.org/v1' || megall 5 "a kimenet nem age-fájl"
mv "$NAPI/$NEV.age.resz" "$NAPI/$NEV.age" || megall 5 "nem tudom a helyére tenni"
rm -rf "$MUNKA"

# 5. retention: newest $MEGORZES stay
ls -1 "$NAPI"/*.age 2>/dev/null | sort | head -n -"$MEGORZES" | while read -r regi; do
  mv "$regi" "$GMA/_torolni/mentes-napi/" && echo "régi mentés → _torolni/mentes-napi/: $(basename "$regi")"
done

echo "mentés kész: $NAPI/$NEV.age $(numfmt --to=iec --suffix=B "$(stat -c %s "$NAPI/$NEV.age")")"
