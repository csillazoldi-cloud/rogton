#!/bin/bash
# c4 kapu — ELDOBHATÓ próbakörnyezet egyetlen változathoz: Postgres 18 (minden migráció a nulláról) + az alkalmazás.
# Csak 127.0.0.1-en hallgat, véletlen jelszavakkal, a végén lebontjuk. A NAS-hoz, a Dellhez, kifelé SEMMI nem nyúl.
#
#   proba-kornyezet.sh fel <id> <munkafa> <futásmappa>   → <futásmappa>/kornyezet.env (a próbák ezt töltik be)
#   proba-kornyezet.sh le  <id> <futásmappa>             → mindent lebont, és ELLENŐRZI, hogy semmi nem maradt
#
# Két mód (KAPU_MOD):
#   docker (alap, a Gigabyte-on): postgres:18-alpine + a kapu által épített aitmetica-saas-app:<id> kép, saját docker-hálózaton.
#          A migrációt a tárhely SAJÁT nas/adatbazis/migral.sh-ja futtatja (a mentéssel együtt — ugyanaz az út, mint a NAS-on).
#   helyi  (fejlesztői gép, docker-képek nélkül): PG_BIN alatti Postgres 18 binárisok + `next start` a munkafából (előtte `pnpm epit`).
#          Itt a migráció a migral.sh 3. lépésével egyező ciklus (fájlonként egy tranzakció + _migracio), MENTÉS NÉLKÜL — mert a
#          helyi pg_dump verziója eltérhet a szerverétől, és ez az adatbázis úgyis eldobható.
#
# Biztonsági jelölő: az adatbázis megjegyzése 'kapu-<id>'; a próbák segédje (apps/web/probak/segedek.ts) KAPU_JELOLO nélkül
# vagy eltérő megjegyzésnél egyetlen sort sem ír/töröl.
set -uo pipefail
# A hívó (kapu/robot) zárja a 9-es leírón él; az itt indított, tovább élő folyamatok (postgres, alkalmazás) NE örököljék,
# különben a zár a kör után is foglalt marad (mérve 10-07: egy árva next-server tartotta).
exec 9>&-

PARANCS=${1:-}; ID=${2:-}
[ -n "$PARANCS" ] && [ -n "$ID" ] || { echo "használat: proba-kornyezet.sh fel <id> <munkafa> <futásmappa> | le <id> <futásmappa>" >&2; exit 2; }
[[ "$ID" =~ ^[0-9a-f]{7,40}$ ]] || { echo "MEGÁLL: az id egy git-változat rövid neve legyen: $ID" >&2; exit 2; }
MOD=${KAPU_MOD:-docker}
CIMKE="km.kapu=$ID"
PG_KEP=${KAPU_PG_KEP:-postgres:18-alpine}
KEPGYAR=${KAPU_KEPGYAR_URL:-http://192.168.1.249:8601}   # a Gigabyte élő képgyártója (V-6); a próbák csak képet kérnek tőle

szabad_port() { local p; for _ in $(seq 1 50); do p=$(( 20000 + RANDOM % 10000 )); (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null || { echo "$p"; return 0; }; done; return 1; }
var_egeszseg() { # var_egeszseg <url> <másodperc>
  for _ in $(seq 1 "$2"); do curl -fsS -m 3 "$1" >/dev/null 2>&1 && return 0; sleep 1; done; return 1; }
jelszo() { head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

fel_docker() {
  local W=$1 F=$2 TJ AJ
  docker image inspect "aitmetica-saas-app:$ID" >/dev/null 2>&1 || { echo "MEGÁLL: nincs aitmetica-saas-app:$ID kép (a kapu építi)"; return 2; }
  TJ=$(jelszo); AJ=$(jelszo)
  docker network create --label "$CIMKE" "kapu-$ID" >/dev/null || return 2
  docker volume create --label "$CIMKE" "kapu-$ID-adat" >/dev/null || return 2
  docker run -d --name "kapu-$ID-db" --label "$CIMKE" --network "kapu-$ID" \
    -e POSTGRES_DB=km -e POSTGRES_USER=km_tulaj -e "POSTGRES_PASSWORD=$TJ" -e "KM_APP_JELSZO=$AJ" \
    -e POSTGRES_INITDB_ARGS="--locale-provider=icu --icu-locale=hu-HU --encoding=UTF8" \
    -v "kapu-$ID-adat:/var/lib/postgresql" \
    -v "$W/nas/adatbazis/init:/docker-entrypoint-initdb.d:ro" \
    -v "$W/nas/adatbazis/migral.sh:/migral/migral.sh:ro" \
    -v "$W/apps/web/adatbazis/migraciok:/migraciok:ro" \
    -p 127.0.0.1::5432 "$PG_KEP" >/dev/null || return 2
  # az első indításkor a postgres kétszer indul (kezdeti feltöltés, majd a végleges) — a hálózati készenlétet várjuk
  for _ in $(seq 1 60); do docker exec "kapu-$ID-db" pg_isready -q -h 127.0.0.1 -U km_tulaj -d km 2>/dev/null && break; sleep 1; done
  docker exec "kapu-$ID-db" pg_isready -q -h 127.0.0.1 -U km_tulaj -d km || { echo "MEGÁLL: az adatbázis nem indult el"; return 2; }
  echo "-- migrációk (a tárhely migral.sh-ja, mentéssel) --"
  docker exec "kapu-$ID-db" bash /migral/migral.sh > "$F/migral.log" 2>&1 || { echo "PIROS: a migráció elbukott (migral.log)"; tail -5 "$F/migral.log"; return 3; }
  tail -1 "$F/migral.log"
  docker exec "kapu-$ID-db" psql -v ON_ERROR_STOP=1 -q -U km_tulaj -d km -c "COMMENT ON DATABASE km IS 'kapu-$ID'" || return 2
  mkdir -p "$F/fajlok" "$F/album" && chmod 777 "$F/fajlok" "$F/album"
  docker run -d --name "kapu-$ID-app" --label "$CIMKE" --network "kapu-$ID" \
    -e NODE_ENV=production -e "DATABASE_URL=postgres://km_app:$AJ@kapu-$ID-db:5432/km" \
    -e AI_SZOLGALTATO=teszt -e HF_AI_SZOLGALTATO=teszt -e HF_FUTTATO=0 -e AI_HAVI_KERET_USD=5 \
    -e AI_HID_CIM=http://127.0.0.1:9 -e OLLAMA_URL=http://127.0.0.1:9 -e MEGBIZHATO_PROXY_DB=1 \
    -e FAJL_MAPPA=/adatok/fajlok -v "$F/fajlok:/adatok/fajlok" -e ALBUM_MAPPA=/adatok/album -v "$F/album:/adatok/album" -e "KEPGYAR_URL=$KEPGYAR" \
    -p 127.0.0.1::3000 "aitmetica-saas-app:$ID" >/dev/null || return 2
  local DBP APP
  DBP=$(docker port "kapu-$ID-db" 5432/tcp | head -1 | sed 's/.*://')
  APP=$(docker port "kapu-$ID-app" 3000/tcp | head -1 | sed 's/.*://')
  var_egeszseg "http://127.0.0.1:$APP/api/egeszseg" 90 || { echo "PIROS: az alkalmazás nem válaszol"; docker logs --tail 20 "kapu-$ID-app" 2>&1; return 3; }
  ki_env "$F" "$APP" "$DBP" "$TJ" "$AJ"
}

fel_helyi() {
  local W=$1 F=$2 TJ AJ DBP APP PGU
  : "${PG_BIN:?helyi módban a PG_BIN kell (a Postgres 18 bin mappája)}"
  "$PG_BIN/postgres" --version | grep -q " 18\." || { echo "MEGÁLL: a PG_BIN nem Postgres 18"; return 2; }
  TJ=$(jelszo); AJ=$(jelszo); DBP=$(szabad_port) || return 2; APP=$(szabad_port) || return 2
  local D="$F/pg"; mkdir -p "$D"
  # rendszergazdaként a postgres nem indul: ilyenkor egy külön felhasználó futtatja (KAPU_PG_FELHASZNALO)
  PGU=""; if [ "$(id -u)" = "0" ]; then PGU=${KAPU_PG_FELHASZNALO:-nobody}; chown "$PGU" "$D"; fi
  pgfut() { if [ -n "$PGU" ]; then runuser -u "$PGU" -- "$@"; else "$@"; fi; }
  printf '%s' "$TJ" > "$D/.pw"; [ -n "$PGU" ] && chown "$PGU" "$D/.pw"; chmod 600 "$D/.pw"
  pgfut "$PG_BIN/initdb" -D "$D/adat" -U km_tulaj --pwfile="$D/.pw" --auth=scram-sha-256 \
    --locale-provider=icu --icu-locale=hu-HU --encoding=UTF8 >"$F/initdb.log" 2>&1 || { echo "MEGÁLL: initdb"; return 2; }
  mv "$D/.pw" "$F/.pw-felhasznalt"   # nem törlünk; a futásmappa a végén a _torolni/ alá kerül
  printf "port = %s\nlisten_addresses = '127.0.0.1'\nunix_socket_directories = '%s'\n" "$DBP" "$D" >> "$D/adat/postgresql.conf"
  # a kimenetet le kell zárni: a háttérben maradó postgres különben a hívó csövét tartja nyitva (a kapu `| tee`-je örökre várna — mérve 10-07)
  pgfut "$PG_BIN/pg_ctl" -D "$D/adat" -l "$D/pg.log" -w start >/dev/null 2>&1 < /dev/null || { echo "MEGÁLL: a postgres nem indult"; return 2; }
  echo "pg_ctl -D $D/adat" > "$F/helyi-pg"; echo "${PGU}" >> "$F/helyi-pg"
  export PGHOST=127.0.0.1 PGPORT=$DBP PGPASSWORD=$TJ
  local P="psql -v ON_ERROR_STOP=1 -q -U km_tulaj"
  $P -d postgres -c "CREATE DATABASE km" || return 2
  POSTGRES_USER=km_tulaj POSTGRES_DB=km KM_APP_JELSZO=$AJ bash "$W/nas/adatbazis/init/01-szerepek.sh" >/dev/null || return 2
  echo "-- migrációk (helyi: a migral.sh 3. lépése, mentés nélkül) --"
  (
    $P -d km -c 'CREATE TABLE IF NOT EXISTS "_migracio" (nev text PRIMARY KEY, futott timestamptz NOT NULL DEFAULT now());'
    for f in $(ls "$W"/apps/web/adatbazis/migraciok/*.sql | sort); do
      n=$(basename "$f" .sql)
      $P -d km -1 -f "$f" || { echo "HIBA: $n"; exit 3; }
      $P -d km -c "INSERT INTO \"_migracio\" (nev) VALUES ('$n');"; echo "lefutott: $n"
    done; echo "migrációk rendben"
  ) > "$F/migral.log" 2>&1 || { echo "PIROS: a migráció elbukott (migral.log)"; tail -5 "$F/migral.log"; return 3; }
  tail -1 "$F/migral.log"
  $P -d km -c "COMMENT ON DATABASE km IS 'kapu-$ID'" || return 2
  mkdir -p "$F/fajlok" "$F/album"
  [ -d "$W/apps/web/.next" ] || { echo "MEGÁLL: nincs lefordított alkalmazás a munkafában (pnpm epit)"; return 2; }
  # A háttérbe tett parancs SAJÁT átirányítással, külön sorban: egy „cd && … &” lista egészében kerülne háttérbe, és a lista
  # alhéja a hívó csövét tartaná nyitva (mérve 10-07: a kapu tee-je ezen akadt el).
  ( cd "$W/apps/web" || exit 2
    env NODE_ENV=production "DATABASE_URL=postgres://km_app:$AJ@127.0.0.1:$DBP/km" \
      AI_SZOLGALTATO=teszt HF_AI_SZOLGALTATO=teszt HF_FUTTATO=0 AI_HAVI_KERET_USD=5 AI_HID_CIM=http://127.0.0.1:9 \
      OLLAMA_URL=http://127.0.0.1:9 MEGBIZHATO_PROXY_DB=1 "FAJL_MAPPA=$F/fajlok" "ALBUM_MAPPA=$F/album" "KEPGYAR_URL=$KEPGYAR" \
      bash -c 'echo $$ > "$1"; exec ./node_modules/.bin/next start -p "$2" -H 127.0.0.1' sh "$F/app.pid" "$APP" > "$F/app.log" 2>&1 < /dev/null & )
  echo "$APP" > "$F/app.port"
  var_egeszseg "http://127.0.0.1:$APP/api/egeszseg" 90 || { echo "PIROS: az alkalmazás nem válaszol"; tail -20 "$F/app.log"; return 3; }
  ki_env "$F" "$APP" "$DBP" "$TJ" "$AJ"
}

ki_env() { # a próbák környezete — a jelszavak csak ebben a (600-as) fájlban vannak, a futás végén a mappával együtt félrekerül
  local F=$1 APP=$2 DBP=$3 TJ=$4 AJ=$5
  umask 077
  cat > "$F/kornyezet.env" <<EOF
PROBA_CIM=http://127.0.0.1:$APP
DATABASE_URL=postgres://km_tulaj:$TJ@127.0.0.1:$DBP/km
PROBA_APP_DATABASE_URL=postgres://km_app:$AJ@127.0.0.1:$DBP/km
FAJL_MAPPA=$F/fajlok
ALBUM_MAPPA=$F/album
KAPU_JELOLO=kapu-$ID
KEPGYAR_URL=$KEPGYAR
EOF
  echo "próbakörnyezet kész: alkalmazás 127.0.0.1:$APP, adatbázis 127.0.0.1:$DBP (jelölő kapu-$ID)"
}

le() {
  local F=${1:-} maradt=0
  if [ "$MOD" = "docker" ]; then
    docker ps -aq --filter "label=$CIMKE" | xargs -r docker rm -f >/dev/null 2>&1 || true
    docker network rm "kapu-$ID" >/dev/null 2>&1 || true
    # az eldobható adatbázis kötete — ez maga a próbaadat, nem a projekt adata; a lebontás része
    docker volume ls -q --filter "label=$CIMKE" | xargs -r docker volume rm >/dev/null 2>&1 || true
    [ -z "$(docker ps -aq --filter "label=$CIMKE")" ] || maradt=1
    [ -z "$(docker volume ls -q --filter "label=$CIMKE")" ] || maradt=1
    [ -z "$(docker network ls -q --filter "label=$CIMKE")" ] || maradt=1
  else
    if [ -n "$F" ] && [ -f "$F/app.pid" ]; then kill "$(cat "$F/app.pid")" 2>/dev/null || true; fi
    if [ -n "$F" ] && [ -f "$F/helyi-pg" ]; then
      local PGU; PGU=$(sed -n 2p "$F/helyi-pg")
      if [ -n "$PGU" ]; then runuser -u "$PGU" -- "$PG_BIN/pg_ctl" -D "$F/pg/adat" -m fast stop >/dev/null 2>&1 || true
      else "$PG_BIN/pg_ctl" -D "$F/pg/adat" -m fast stop >/dev/null 2>&1 || true; fi
      "$PG_BIN/pg_ctl" -D "$F/pg/adat" status >/dev/null 2>&1 && maradt=1
    fi
    sleep 2
    if [ -n "$F" ] && [ -f "$F/app.pid" ] && kill -0 "$(cat "$F/app.pid")" 2>/dev/null; then maradt=1; fi
    if [ -n "$F" ] && [ -f "$F/app.port" ] && curl -s -m 2 -o /dev/null "http://127.0.0.1:$(cat "$F/app.port")/api/egeszseg"; then maradt=1; fi
  fi
  if [ $maradt -eq 0 ]; then echo "próbakörnyezet lebontva ($ID)"; else echo "FIGYELEM: a próbakörnyezetből maradt valami ($ID)"; return 1; fi
}

case "$PARANCS" in
  fel)
    W=${3:?munkafa}; F=${4:?futásmappa}; mkdir -p "$F"
    if [ "$MOD" = "docker" ]; then fel_docker "$W" "$F"; else fel_helyi "$W" "$F"; fi ;;
  le) le "${3:-}" ;;
  *) echo "ismeretlen parancs: $PARANCS" >&2; exit 2 ;;
esac
