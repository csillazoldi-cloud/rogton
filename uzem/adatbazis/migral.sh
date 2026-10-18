#!/bin/bash
# Migrációk futtatása — a db dobozban fut (docker compose exec -T db bash /migral/migral.sh).
# Sorban, név szerint; ami már lefutott, kihagyja (_migracio tábla). Minden fájl egy tranzakció.
#
# R-16 TERV 1.7 R1 + NAS-szabályok (2026-09-30): MENTÉS MINDEN ADATOT ÉRINTŐ KIRAKÁS ELŐTT. Ha van új (még nem futott)
# migráció, előbb a teljes adatbázis kimentődik (pg_dump, sima SQL, gzip); ha a mentés nem sikerül vagy üres, a migráció
# NEM fut (1-es kilépés) — a sikertelen mentés megállítja a migrációt, soha nem ugorja át. Új migráció nélkül nincs mentés.
# Hova kerül: a dobozban /var/lib/postgresql/mentes/ — ez a db adatmappájának csatolása (./adatok/postgres), tehát a NAS-on:
#   /volume2/docker/aitmetica-saas/adatok/postgres/mentes/<ÉÉÉÉHHNN-ÓÓPP>-elotte-<az első új migráció>.sql.gz
# Megőrzés: az utolsó 10; a régebbiek a mentes/_torolni/ mappába kerülnek (nem törlünk — a törlés Csilla kattintása).
# Visszaállítás egy sorban (a NAS-on, a projekt mappájában; ÜRES/újra létrehozott km adatbázisba):
#   gunzip -c adatok/postgres/mentes/<fájl>.sql.gz | sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km
# Próbához kívülről is futtatható: MENTES_GYOKER (alap /var/lib/postgresql) és MIGRACIOK (alap /migraciok) átírható.
set -euo pipefail
# T-21 (2026-09-12): egy KÜLÖN, eldobható dobozból is futhat (docker compose run --rm db …), hogy a futó db dobozt ne kelljen újraalkotni
# a kirakásnál — akkor a PGHOST a „db", és a jelszó a POSTGRES_PASSWORD-ből megy. A db dobozban (exec) változatlanul: nincs PGHOST, helyi socket.
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"
H=""; [ -n "${PGHOST:-}" ] && H="-h $PGHOST"
P="psql -v ON_ERROR_STOP=1 -q $H --username $POSTGRES_USER --dbname $POSTGRES_DB"
MIGRACIOK="${MIGRACIOK:-/migraciok}"
MENTES_MAPPA="${MENTES_GYOKER:-/var/lib/postgresql}/mentes"
MEGORZES=10
$P -c 'CREATE TABLE IF NOT EXISTS "_migracio" (nev text PRIMARY KEY, futott timestamptz NOT NULL DEFAULT now());'

# 1. Az új (még nem futott) migrációk listája. A -tA sorai körül nincs szóköz; az üres _migracio tábla üres listát ad.
MAR_FUTOTT=$($P -tAc 'SELECT nev FROM "_migracio"' | tr -d '[:blank:]\r')
UJAK=()
for f in $(ls "$MIGRACIOK"/*.sql | sort); do
  n=$(basename "$f" .sql)
  if ! grep -qxF -- "$n" <<<"$MAR_FUTOTT"; then UJAK+=("$n"); fi
done

# 2. Mentés, ha van új migráció — sikertelen mentésnél MEGÁLL.
if [ "${#UJAK[@]}" -eq 0 ]; then
  echo "nincs új migráció, mentés nem kell"
else
  echo "új migráció: ${#UJAK[@]} db (${UJAK[*]}) — előbb mentés"
  MENTES="$MENTES_MAPPA/$(date +%Y%m%d-%H%M)-elotte-${UJAK[0]}.sql.gz"
  megall() {
    # a félkész fájl nem maradhat a mentések között (a megőrzés és a visszaállítás is jónak hinné): áthelyezzük, nem töröljük
    if [ -f "$MENTES" ]; then mkdir -p "$MENTES_MAPPA/_torolni" 2>/dev/null && mv -- "$MENTES" "$MENTES_MAPPA/_torolni/$(basename "$MENTES").hibas" 2>/dev/null || true; fi
    echo "MEGÁLL: a migráció előtti mentés nem sikerült — migráció nem fut ($1)"
    exit 1
  }
  mkdir -p "$MENTES_MAPPA" || megall "a mappa nem hozható létre: $MENTES_MAPPA"
  # shellcheck disable=SC2086 # a $H szándékosan szóra bomlik (-h <gazda>, vagy semmi)
  if ! pg_dump $H --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --no-password | gzip -c > "$MENTES"; then
    megall "a pg_dump vagy az írás hibát adott: $MENTES"
  fi
  gzip -t "$MENTES" 2>/dev/null || megall "a mentés nem ép gzip: $MENTES"
  MERET=$(wc -c < "$MENTES")
  # egy üres adatbázis dumpja is több száz bájt (fejléc); 100 bájt alatt biztosan nincs benne semmi
  [ "$MERET" -gt 100 ] || megall "a mentés üres ($MERET bájt): $MENTES"
  [ "$(gunzip -c "$MENTES" | head -c 4096 | grep -c 'PostgreSQL database dump')" -ge 1 ] || megall "a mentés nem pg_dump-kimenet: $MENTES"
  echo "mentés kész: $MENTES ($MERET bájt)"
  # Megőrzés: az utolsó 10 marad, a régebbiek a _torolni/ mappába (áthelyezés, nem törlés).
  mapfile -t REGIEK < <(ls -1 "$MENTES_MAPPA"/*-elotte-*.sql.gz 2>/dev/null | sort | head -n -"$MEGORZES")
  if [ "${#REGIEK[@]}" -gt 0 ]; then
    mkdir -p "$MENTES_MAPPA/_torolni"
    mv -- "${REGIEK[@]}" "$MENTES_MAPPA/_torolni/"
    echo "régi mentések a _torolni/ mappába: ${#REGIEK[@]} db"
  fi
fi

# 3. A migrációk — változatlanul.
for f in $(ls "$MIGRACIOK"/*.sql | sort); do
  n=$(basename "$f" .sql)
  if [ "$($P -tAc "SELECT 1 FROM \"_migracio\" WHERE nev='$n'")" = "1" ]; then echo "kihagyva (már futott): $n"; continue; fi
  $P -1 -f "$f"
  $P -c "INSERT INTO \"_migracio\" (nev) VALUES ('$n');"
  echo "lefutott: $n"
done
echo "migrációk rendben"
