#!/bin/bash
# Napi mentés (E-35). A NAS-on fut — a Synology feladatütemezőjéből vagy kézzel:
#   sudo bash /volume2/docker/aitmetica-saas/forras/nas/mentes.sh
#
# D-18 (Vilmos, 2026-09-09): a mentés a NAS MÁSIK KÖTETÉRE megy. A projekt a volume2-n él,
# a mentés a volume1-re — így egy kötet elvesztése nem viszi el mindkettőt.
# (Ez NEM véd tűz, lopás vagy a teljes gép elvesztése ellen; házon kívüli mentés külön döntés.)
#
# Amit ment:
#   1. a PostgreSQL adatbázist (sima SQL, tömörítve — kézzel is olvasható és visszatölthető)
#   2. a második befogadó rendszer (referencia-host) SQLite-fájlját, KÖZBEN IS BIZTONSÁGOSAN:
#      `VACUUM INTO` egy pillanatkép-másolatot ír, nem a futó fájlt másoljuk
#
# NAS-szabályok (NAS-szabalyok.md): mér, mielőtt bármit tenne; a közös kapun át megy;
# nem töröl — a lejárt mentéseket a `_torolni/` mappába teszi.
set -euo pipefail

CEL=${MENTES_CEL:-/volume1/homes/Portik/mentesek/aitmetica-saas}
DB_DOBOZ=aitmetica-saas-db
REF_DOBOZ=aitmetica-saas-referencia
DB_NEV=km
DB_TULAJ=km_tulaj
NAPI_MEGORZES=7        # ennyi napnál régebbi napi mentés a _torolni/ mappába kerül
HETI_MEGORZES_NAP=28   # a vasárnapi mentéseket eddig tartjuk meg
BELYEG=$(date +%Y%m%d-%H%M)
NAP=$(date +%u)        # 7 = vasárnap

ir() { echo "[$(date '+%H:%M:%S')] $*"; }

# --- 1. mérés (NAS-szabályok: 3 GB szabad alatt vagy 20 fölötti terhelésnél nem indul) ---
SZABAD=$(free -m | awk '/^Mem:/{print $7}')
TERH=$(uptime | sed 's/.*load average: //' | cut -d, -f1 | cut -d. -f1)
ir "mérés: felszabadítható ${SZABAD} MB, terhelés ${TERH}"
if [ "${SZABAD:-0}" -lt 3000 ] || [ "${TERH:-99}" -gt 20 ]; then
  ir "MEGÁLLÍTVA: a NAS-szabályok szerint most nem indulhat nehéz munka."
  exit 2
fi

# --- 2. a közös kapu: egyszerre csak EGY projekt dolgozhat nehezen a gépen ---
K=/volume1/homes/Portik/kozos
if [ -x "$K/szabad-e.sh" ]; then
  "$K/szabad-e.sh" aitmetica-saas || { ir "a közös kapu nem engedett át"; exit 5; }
  trap '"$K/elenged.sh" aitmetica-saas' EXIT
fi

# A mentes mappaja a gazdajae legyen, ne a rendszergazdae: a szkript root-kent fut, es egy
# root tulajdonu mappat Vilmos a File Stationben nem tudna kezelni (a _torolni/ uritese az o dolga).
SZULO=$(dirname "$CEL")
while [ "$SZULO" != "/" ] && [ "$(stat -c %u "$SZULO" 2>/dev/null)" = "0" ]; do SZULO=$(dirname "$SZULO"); done
TULAJ=$(stat -c '%u:%g' "$SZULO" 2>/dev/null || echo 0:0)
mkdir -p "$CEL" "$CEL/_torolni"
[ "$TULAJ" != "0:0" ] && chown -R "$TULAJ" "$CEL" 2>/dev/null || true

# --- 3. adatbázis ---
DB_FAJL="$CEL/db-$BELYEG.sql.gz"
ir "adatbázis mentése → $(basename "$DB_FAJL")"
# A socketen át, a doboz saját postgres felhasználójaként — jelszó nem kell és nem is jelenik meg sehol.
docker exec -u postgres "$DB_DOBOZ" pg_dump -U "$DB_TULAJ" -d "$DB_NEV" | gzip -9 > "$DB_FAJL.reszleges"
mv "$DB_FAJL.reszleges" "$DB_FAJL"   # csak a KÉSZ fájl kapja a végleges nevét
DB_MERET=$(du -h "$DB_FAJL" | cut -f1)
ir "adatbázis kész: $DB_MERET"

# --- 4. a második rendszer SQLite-fájlja ---
# NEM másoljuk a futó fájlt: a `VACUUM INTO` egy ép, önmagában teljes pillanatképet ír.
REF_FAJL="$CEL/referencia-$BELYEG.sqlite.gz"
if docker inspect "$REF_DOBOZ" >/dev/null 2>&1; then
  ir "referencia-host mentése → $(basename "$REF_FAJL")"
  docker exec "$REF_DOBOZ" node -e '
    const { DatabaseSync } = require("node:sqlite");
    const fs = require("node:fs");
    try { fs.unlinkSync("/adat/_pillanatkep.sqlite"); } catch {}
    const db = new DatabaseSync("/adat/referencia.sqlite", { readOnly: true });
    db.exec("VACUUM INTO \x27/adat/_pillanatkep.sqlite\x27");
    db.close();
  '
  docker exec "$REF_DOBOZ" cat /adat/_pillanatkep.sqlite | gzip -9 > "$REF_FAJL.reszleges"
  mv "$REF_FAJL.reszleges" "$REF_FAJL"
  docker exec "$REF_DOBOZ" rm -f /adat/_pillanatkep.sqlite
  REF_MERET=$(du -h "$REF_FAJL" | cut -f1)
  ir "referencia-host kész: $REF_MERET"
else
  ir "referencia-host doboz nem fut — kihagyva"
fi

# --- 4b. az arculati fájlok mappája (F-6, R-6): a feltöltött logók, kézikönyvek, referenciák ---
# c30 F9, D7 (Csilla 2026-10-17): a helyszíni fotóalbum (./adatok/album) SZÁNDÉKOSAN NINCS a mentésben — 30 napos munkapéldányok,
# az eredetik a telefonon. Az album mappa az ./adatok/fajlok MELLETT van, nem alatta, így ez a tar eleve nem éri; az --exclude
# biztosíték: ha az ALBUM_MAPPA egyszer hiányozna a compose-ból, az alkalmazás a fájlok mappájának `_album` almappájába írna
# (apps/web/fajl/tar.ts `albumMappa`) — azt sem visszük. Az adatbázis-mentés (3.) a fotók meta-sorait viszi
# (név, méret, idő) — visszaállítás után a 30 napon belüli albumfotók bájtjai hiányozhatnak; ez a D7 vállalt ára.
FAJL_MAPPA_NAS="$(dirname "$0")/adatok/fajlok"
[ -d "$FAJL_MAPPA_NAS" ] || FAJL_MAPPA_NAS="/volume2/docker/aitmetica-saas/adatok/fajlok"
FAJL_FAJL="$CEL/fajlok-$BELYEG.tar.gz"
if [ -d "$FAJL_MAPPA_NAS" ] && [ -n "$(ls -A "$FAJL_MAPPA_NAS" 2>/dev/null)" ]; then
  ir "fájlok mentése → $(basename "$FAJL_FAJL") (az album nélkül — D7)"
  tar -C "$FAJL_MAPPA_NAS" --exclude='./_album' --exclude='./album' -czf "$FAJL_FAJL.reszleges" . && mv "$FAJL_FAJL.reszleges" "$FAJL_FAJL"
  ir "fájlok kész: $(du -h "$FAJL_FAJL" | cut -f1)"
else
  ir "fájlok mappája üres vagy nincs — kihagyva"
fi

# --- 5. forgatás: nem törlünk, a lejártakat a _torolni/ mappába tesszük (D-03) ---
MOZGATOTT=0
for f in "$CEL"/db-*.sql.gz "$CEL"/referencia-*.sqlite.gz "$CEL"/fajlok-*.tar.gz; do
  [ -e "$f" ] || continue
  KOR_NAP=$(( ( $(date +%s) - $(date -r "$f" +%s) ) / 86400 ))
  VASARNAPI=$(date -r "$f" +%u)
  if [ "$KOR_NAP" -le "$NAPI_MEGORZES" ]; then continue; fi
  if [ "$VASARNAPI" = "7" ] && [ "$KOR_NAP" -le "$HETI_MEGORZES_NAP" ]; then continue; fi
  mv "$f" "$CEL/_torolni/" && MOZGATOTT=$((MOZGATOTT+1))
done
[ "$MOZGATOTT" -gt 0 ] && ir "$MOZGATOTT lejárt mentés a _torolni/ mappába került (törölni Vilmos szokta)"

# --- 6. jelentés ---
DARAB=$(ls -1 "$CEL"/db-*.sql.gz 2>/dev/null | wc -l)
OSSZ=$(du -sh "$CEL" 2>/dev/null | cut -f1)
ir "KÉSZ — $DARAB adatbázis-mentés a mappában, összesen $OSSZ"
echo "$(date '+%Y-%m-%d %H:%M') | db $DB_MERET | ref ${REF_MERET:-nincs} | mappa $OSSZ | darab $DARAB" >> "$CEL/mentes-naplo.txt"
# a most keszult fajlok is a gazdaje legyenek (a szkript root-kent fut)
[ "$TULAJ" != "0:0" ] && chown -R "$TULAJ" "$CEL" 2>/dev/null || true
