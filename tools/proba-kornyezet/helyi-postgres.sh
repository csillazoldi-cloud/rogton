#!/bin/bash
# Helyi PRÓBA-Postgres Docker NÉLKÜL (a Dellen a Docker hitelesítő-tárolója nem interaktív ülésben hibázik — TEENDOK T-4).
# A PostgreSQL 18 Windows-os binárisai (EDB zip) egy mappában; az adat a mellette lévő `adat/` mappában. Nem éles, nem a NAS.
#
# Használat:  PG_BIN=<pgsql/bin mappa> bash tools/proba-kornyezet/helyi-postgres.sh indit|leallit|migral|allapot
# Titkok: a $PROBA_ENV fájl (KM_TULAJ_JELSZO=…, KM_APP_JELSZO=…) — a tárhelyen kívül. Port: 5433.
set -euo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"; GYOKER="$(cd "$ITT/../.." && pwd)"
: "${PG_BIN:?PG_BIN hiányzik (a pgsql/bin mappa)}"; : "${PROBA_ENV:?PROBA_ENV hiányzik (a titkos .env fájl)}"
set -a; . "$PROBA_ENV"; set +a
ADAT="${PG_ADAT:-$(dirname "$PG_BIN")/../adat}"; PORT="${PG_PORT:-5433}"
PSQL="$PG_BIN/psql -v ON_ERROR_STOP=1 -q -h 127.0.0.1 -p $PORT -U km_tulaj"
case "${1:-allapot}" in
  indit)
    if [ ! -f "$ADAT/PG_VERSION" ]; then
      mkdir -p "$ADAT"; printf '%s' "$KM_TULAJ_JELSZO" > "$ADAT/../.pw"
      "$PG_BIN/initdb" -D "$ADAT" -U km_tulaj --pwfile="$ADAT/../.pw" --auth=scram-sha-256 --locale-provider=icu --icu-locale=hu-HU --encoding=UTF8 >/dev/null
      rm -f "$ADAT/../.pw"
      echo "port = $PORT
listen_addresses = '127.0.0.1'" >> "$ADAT/postgresql.conf"
    fi
    "$PG_BIN/pg_ctl" -D "$ADAT" -l "$ADAT/../pg.log" -w start >/dev/null
    export PGPASSWORD="$KM_TULAJ_JELSZO"
    if [ "$($PSQL -d postgres -tAc "select 1 from pg_database where datname='km'")" != "1" ]; then
      $PSQL -d postgres -c "CREATE DATABASE km;"
      $PSQL -d km -c "CREATE ROLE km_app LOGIN PASSWORD '$KM_APP_JELSZO' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;"
      echo "km adatbázis és km_app szerep létrehozva"
    fi
    echo "fut: 127.0.0.1:$PORT";;
  migral)
    export PGPASSWORD="$KM_TULAJ_JELSZO"
    $PSQL -d km -c 'CREATE TABLE IF NOT EXISTS "_migracio" (nev text PRIMARY KEY, futott timestamptz NOT NULL DEFAULT now());'
    for f in $(ls "$GYOKER"/apps/web/adatbazis/migraciok/*.sql | sort); do
      n=$(basename "$f" .sql)
      if [ "$($PSQL -d km -tAc "SELECT 1 FROM \"_migracio\" WHERE nev='$n'")" = "1" ]; then continue; fi
      $PSQL -d km -1 -f "$f"; $PSQL -d km -c "INSERT INTO \"_migracio\" (nev) VALUES ('$n');"; echo "lefutott: $n"
    done; echo "migrációk rendben";;
  leallit) "$PG_BIN/pg_ctl" -D "$ADAT" -m fast stop;;
  allapot) "$PG_BIN/pg_ctl" -D "$ADAT" status || true;;
esac
