#!/bin/bash
# Rögtön — restore drill. Restores ONE backup into a throwaway container `gma-proba-db` (no network, data in tmpfs), prints the
# row counts of fiok and szervezet next to the counts recorded at backup time, then removes the throwaway container.
# The live gma-db is never touched. Design: docs/decisions/2026-10-18-g8-mentes.md.
#
# The Gigabyte cannot decrypt a backup (it holds only the public key), so the drill is fed the DECRYPTED tar on stdin, from the Mac:
#   age -d -i ~/saas/vault/rogton-mentes-kulcs ~/saas/mentes/rogton/<file>.age | ssh gma 'bash ~/admin/uzem/mentes-visszatolt.sh -'
# On a machine that has the private key (never the Gigabyte), an .age file can be given directly:
#   MENTES_TITKOS_KULCS=<key file> bash uzem/mentes-visszatolt.sh <file>.age
#
# Real restore into the live system (not this script — a decision, after a drill): see "Restore a backup" in uzem/README.md.
# Exit codes: 0 drill green · 2 usage / environment · 3 archive broken (sha256 mismatch, missing part) · 4 restore failed
#             5 restored, but the counts differ from the manifest
set -uo pipefail
umask 077

GMA=${GMA_GYOKER:-$HOME/gma}
BE=${1:-}
[ -n "$BE" ] || { echo "használat: mentes-visszatolt.sh - | <fájl>.tar | <fájl>.age (ez utóbbi csak MENTES_TITKOS_KULCS-csal)" >&2; exit 2; }
PROBA=gma-proba-db
MUNKA=$GMA/mentes/.proba
mkdir -p "$GMA/mentes" || exit 2
rm -rf "$MUNKA"; mkdir -m 700 "$MUNKA" || exit 2
# the plaintext copy and the throwaway container exist only for this run
takarit() { docker rm -f "$PROBA" >/dev/null 2>&1; rm -rf "$MUNKA"; }
trap takarit EXIT

case "$BE" in
  -) tar -xf - -C "$MUNKA" || { echo "MEGÁLL: a bemenet nem tar (vissza lett fejtve? age -d …)"; exit 3; } ;;
  *.age)
    [ -n "${MENTES_TITKOS_KULCS:-}" ] || { echo "MEGÁLL: .age fájlhoz MENTES_TITKOS_KULCS kell (ezen a gépen nincs titkos kulcs — fejtsd vissza a Macen)"; exit 2; }
    age -d -i "$MENTES_TITKOS_KULCS" "$BE" | tar -xf - -C "$MUNKA" || { echo "MEGÁLL: nem fejthető vissza: $BE"; exit 3; } ;;
  *) tar -xf "$BE" -C "$MUNKA" || { echo "MEGÁLL: nem olvasható: $BE"; exit 3; } ;;
esac
for f in MANIFEST km.dump fajlok-album.tar; do [ -s "$MUNKA/$f" ] || { echo "MEGÁLL: hiányzik a mentésből: $f"; exit 3; }; done
(cd "$MUNKA" && sed -n 's/^sha256 //p' MANIFEST | sha256sum -c --quiet -) || { echo "MEGÁLL: sha256 eltér — sérült mentés"; exit 3; }
mez() { sed -n "s/^$1=//p" "$MUNKA/MANIFEST"; }
echo "mentés: $(mez mentes) · készült $(mez keszult) · a kint lévő commit akkor: $(mez kint)"

# the same image and locale as the live database
KEP=$(docker inspect -f '{{.Config.Image}}' gma-db 2>/dev/null) || KEP=postgres:18-alpine
docker rm -f "$PROBA" >/dev/null 2>&1
JELSZO=$(head -c 18 /dev/urandom | base64 | tr -d '/+=')
# PGPASSWORD inside: psql/pg_restore over 127.0.0.1 work whether the image's pg_hba trusts loopback or asks for scram
docker run -d --name "$PROBA" --network none --tmpfs /var/lib/postgresql:size=4g \
  -e POSTGRES_USER=km_tulaj -e POSTGRES_DB=km -e POSTGRES_PASSWORD="$JELSZO" -e PGPASSWORD="$JELSZO" \
  -e POSTGRES_INITDB_ARGS="--locale-provider=icu --icu-locale=hu-HU --encoding=UTF8" "$KEP" >/dev/null \
  || { echo "MEGÁLL: a próba-adatbázis nem indul ($KEP)"; exit 2; }
# the image's init runs a socket-only server first; TCP on 127.0.0.1 answers only from the final server
for _ in $(seq 1 60); do docker exec "$PROBA" pg_isready -q -h 127.0.0.1 -U km_tulaj -d km && break; sleep 1; done
docker exec "$PROBA" pg_isready -q -h 127.0.0.1 -U km_tulaj -d km || { echo "MEGÁLL: a próba-adatbázis 60 s alatt sem áll fel"; exit 2; }

# the app role the policies and grants name (created by the live init script, which is not part of the dump)
docker exec "$PROBA" psql -q -h 127.0.0.1 -U km_tulaj -d km -c "DO \$\$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='km_app') THEN CREATE ROLE km_app NOLOGIN; END IF; END\$\$;" \
  || { echo "MEGÁLL: a km_app szerep nem hozható létre"; exit 4; }
docker exec -i "$PROBA" pg_restore -h 127.0.0.1 -U km_tulaj -d km --exit-on-error --no-owner < "$MUNKA/km.dump" \
  || { echo "MEGÁLL: a pg_restore hibával állt le"; exit 4; }

MOST=$(docker exec "$PROBA" psql -h 127.0.0.1 -U km_tulaj -d km -tAc "SELECT (SELECT count(*) FROM fiok) || ' ' || (SELECT count(*) FROM szervezet)") \
  || { echo "MEGÁLL: a visszatöltött adatbázis nem kérdezhető"; exit 4; }
AKKOR=$(mez fiok_szervezet)
FAJL_MOST=$(tar -tf "$MUNKA/fajlok-album.tar" | grep -vc '/$') || FAJL_MOST=0
echo "fiok: ${MOST% *}  szervezet: ${MOST#* }   (a mentéskor: fiok ${AKKOR% *}, szervezet ${AKKOR#* })"
echo "fájlok a mentésben: $FAJL_MOST   (a mentéskor: $(mez fajlok))"
if [ "$MOST" = "$AKKOR" ] && [ "$FAJL_MOST" = "$(mez fajlok)" ]; then
  echo "visszatöltési próba: ZÖLD — a próba-adatbázis eltávolítva"
else
  echo "visszatöltési próba: ELTÉR — nézd meg, mielőtt erre a mentésre építesz"; exit 5
fi
