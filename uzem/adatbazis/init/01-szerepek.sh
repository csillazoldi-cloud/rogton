#!/bin/bash
# Csak az adatbázis ELSŐ létrehozásakor fut (postgres kép: docker-entrypoint-initdb.d).
# Létrehozza az alkalmazás szerepét. A jelszó a gép .env fájlából jön, sehol nem íródik ki.
set -euo pipefail
: "${KM_APP_JELSZO:?KM_APP_JELSZO hiányzik az .env fájlból}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE km_app LOGIN PASSWORD '${KM_APP_JELSZO}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
SQL
echo "km_app szerep létrehozva"
