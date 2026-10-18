#!/bin/bash
# Visszaállítási próba (E-35, A-15). A NAS-on fut:
#   sudo bash /volume2/docker/aitmetica-saas/forras/nas/visszaallit-proba.sh
#
# MIÉRT KELL: a mentés önmagában semmit nem bizonyít. Az A-15 feltétel azt kéri, hogy a
# visszaállítás legyen TÉNYLEGESEN kipróbálva. Ez a szkript ezt teszi meg, ÉLES ADAT ÉRINTÉSE NÉLKÜL:
#   - a legfrissebb mentést visszatölti egy KÜLÖN, ideiglenes adatbázisba,
#   - összeveti a sorszámokat az élessel tábláról táblára,
#   - a második rendszer SQLite-mentésének épségét is ellenőrzi,
#   - végül eldobja az ideiglenes adatbázist.
#
# Az ÉLES `km` adatbázishoz hozzá sem nyúl — csak olvassa a sorszámokat összehasonlításhoz.
set -euo pipefail

CEL=${MENTES_CEL:-/volume1/homes/Portik/mentesek/aitmetica-saas}
DB_DOBOZ=aitmetica-saas-db
REF_DOBOZ=aitmetica-saas-referencia
DB_NEV=km
DB_TULAJ=km_tulaj
PROBA_DB=km_visszaallitas_proba

ir() { echo "[$(date '+%H:%M:%S')] $*"; }
pszql() { docker exec -i -u postgres "$DB_DOBOZ" psql -U "$DB_TULAJ" -X -q -t -A "$@"; }

KEZDET=$(date +%s)

# --- a legfrissebb mentés ---
DB_FAJL=$(ls -1t "$CEL"/db-*.sql.gz 2>/dev/null | head -1 || true)
[ -n "$DB_FAJL" ] || { ir "NINCS mentés a $CEL mappában — előbb futtasd a mentes.sh-t."; exit 1; }
ir "a próbához használt mentés: $(basename "$DB_FAJL") ($(du -h "$DB_FAJL" | cut -f1), készült: $(date -r "$DB_FAJL" '+%Y-%m-%d %H:%M'))"

# --- a tömörített fájl épsége ---
# MIÉRT ELŐBB: sérült fájlon a `zcat` a visszatöltés közben halna el, és a `set -e` miatt a szkript
# NÉMÁN kilépne — azt hinnéd, minden rendben. Mérve: egy félbevágott gz fájllal pontosan ez történt.
if ! gzip -t "$DB_FAJL" 2>/dev/null; then
  ir "EREDMÉNY: A MENTÉS SÉRÜLT — a tömörített fájl nem olvasható végig: $(basename "$DB_FAJL")"
  ir "Ez a fájl NEM használható visszaállításra. Nézd meg a korábbiakat, és futtass új mentést."
  echo "$(date '+%Y-%m-%d %H:%M') | visszaállítási próba | $(basename "$DB_FAJL") | SÉRÜLT TÖMÖRÍTETT FÁJL" >> "$CEL/mentes-naplo.txt"
  exit 3
fi
ir "a tömörített fájl ép (gzip -t)"

# --- ideiglenes adatbázis (ha egy korábbi próba után ottmaradt, eldobjuk) ---
ir "ideiglenes adatbázis készítése: $PROBA_DB"
pszql -d postgres -c "DROP DATABASE IF EXISTS $PROBA_DB;" >/dev/null
pszql -d postgres -c "CREATE DATABASE $PROBA_DB OWNER $DB_TULAJ;" >/dev/null
# a próba végén MINDIG eldobjuk, akkor is, ha a szkript hibára fut
trap 'docker exec -i -u postgres "$DB_DOBOZ" psql -U "$DB_TULAJ" -X -q -c "DROP DATABASE IF EXISTS $PROBA_DB;" >/dev/null 2>&1 || true' EXIT

# --- visszatöltés ---
ir "visszatöltés…"
VISSZA_KEZDET=$(date +%s)
# a km_app szerep már létezik a kiszolgálón, a GRANT sorok tehát lefutnak; a hibákat kiírjuk
# a `|| true`: a visszatöltés hibáit MI jelentjük, nem a `set -e` némán
zcat "$DB_FAJL" | docker exec -i -u postgres "$DB_DOBOZ" psql -U "$DB_TULAJ" -X -q -d "$PROBA_DB" -v ON_ERROR_STOP=0 2>/tmp/visszaallitas-hibak.txt >/dev/null || {
  ir "EREDMÉNY: A VISSZATÖLTÉS ELSZÁLLT — a mentés nem használható."
  grep -E "^(ERROR|gzip)" /tmp/visszaallitas-hibak.txt 2>/dev/null | head -5 | sed 's/^/    /' || true
  echo "$(date '+%Y-%m-%d %H:%M') | visszaállítási próba | $(basename "$DB_FAJL") | A VISSZATÖLTÉS ELSZÁLLT" >> "$CEL/mentes-naplo.txt"
  exit 4
}
VISSZA_MP=$(( $(date +%s) - VISSZA_KEZDET ))
# FIGYELEM: a `grep -c` találat nélkül "0"-t ÍR KI és 1-gyel lép ki. Ha ide `|| echo 0` kerül,
# a változóba KÉT nulla kerül ("0\n0"), és a későbbi számösszehasonlítás elszáll. (Mérve, 2026-09-09.)
HIBA_DB=$(grep -c "^ERROR" /tmp/visszaallitas-hibak.txt 2>/dev/null || true)
HIBA_DB=${HIBA_DB:-0}
ir "visszatöltés kész: ${VISSZA_MP} másodperc, ${HIBA_DB} hibaüzenet"
if [ "$HIBA_DB" -gt 0 ]; then
  ir "a hibaüzenetek első öt sora:"
  grep "^ERROR" /tmp/visszaallitas-hibak.txt | head -5 | sed 's/^/    /'
fi

# --- összevetés: minden tábla sorszáma élesben és a visszaállítottban ---
ir "összevetés tábláról táblára…"
TABLAK=$(pszql -d "$DB_NEV" -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;")
ELTERES=0
OSSZ_TABLA=0
OSSZ_SOR=0
for t in $TABLAK; do
  ELES=$(pszql -d "$DB_NEV" -c "SELECT count(*) FROM \"$t\";")
  UJ=$(pszql -d "$PROBA_DB" -c "SELECT count(*) FROM \"$t\";" 2>/dev/null || echo "NINCS")
  OSSZ_TABLA=$((OSSZ_TABLA+1))
  OSSZ_SOR=$((OSSZ_SOR+ELES))
  if [ "$ELES" != "$UJ" ]; then
    printf "    ELTÉRÉS  %-28s éles: %-8s visszaállított: %s\n" "$t" "$ELES" "$UJ"
    ELTERES=$((ELTERES+1))
  fi
done
ir "$OSSZ_TABLA tábla, $OSSZ_SOR sor élesben — eltérés: $ELTERES"

# --- a második rendszer mentésének épsége ---
REF_FAJL=$(ls -1t "$CEL"/referencia-*.sqlite.gz 2>/dev/null | head -1 || true)
REF_ALLAPOT="nincs mentés"
if [ -n "$REF_FAJL" ] && docker inspect "$REF_DOBOZ" >/dev/null 2>&1; then
  ir "a referencia-host mentésének ellenőrzése: $(basename "$REF_FAJL")"
  zcat "$REF_FAJL" > /tmp/ref-proba.sqlite
  REF_ALLAPOT=$(docker exec -i "$REF_DOBOZ" node -e '
    const { DatabaseSync } = require("node:sqlite");
    const fs = require("node:fs");
    fs.writeFileSync("/tmp/ref-proba.sqlite", fs.readFileSync(0));
    const d = new DatabaseSync("/tmp/ref-proba.sqlite", { readOnly: true });
    const ep = d.prepare("PRAGMA integrity_check").get().integrity_check;
    const tablak = d.prepare("SELECT count(*) AS db FROM sqlite_master WHERE type=\x27table\x27").get().db;
    const talalat = d.prepare("SELECT count(*) AS db FROM talalat").get().db;
    console.log(`${ep}, ${tablak} tábla, ${talalat} találat`);
    d.close();
    fs.unlinkSync("/tmp/ref-proba.sqlite");
  ' < /tmp/ref-proba.sqlite)
  rm -f /tmp/ref-proba.sqlite
  ir "referencia-host mentés: $REF_ALLAPOT"
fi

OSSZ_MP=$(( $(date +%s) - KEZDET ))
echo
if [ "$ELTERES" -eq 0 ] && [ "$HIBA_DB" -eq 0 ]; then
  ir "EREDMÉNY: A VISSZAÁLLÍTÁS MŰKÖDIK. $OSSZ_TABLA tábla, $OSSZ_SOR sor hiánytalanul visszajött ${VISSZA_MP} mp alatt."
else
  ir "EREDMÉNY: FIGYELEM — $ELTERES eltérő tábla, $HIBA_DB hibaüzenet. Nézd meg a fenti sorokat."
fi
ir "a próba teljes ideje: ${OSSZ_MP} másodperc; az ideiglenes adatbázis eldobva"
echo "$(date '+%Y-%m-%d %H:%M') | visszaállítási próba | $(basename "$DB_FAJL") | $OSSZ_TABLA tábla / $OSSZ_SOR sor | eltérés $ELTERES | hiba $HIBA_DB | ${VISSZA_MP} mp | ref: $REF_ALLAPOT" >> "$CEL/mentes-naplo.txt"
