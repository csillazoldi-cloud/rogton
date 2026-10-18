#!/bin/bash
# Rögtön — deploy on the single host. Runs as the gyorsadmin user (docker group, no sudo), from a 2-minute systemd user timer:
#
#   bash uzem/kirak.sh                # fetch origin/main; deploy only if its commit is new
#   bash uzem/kirak.sh --kenyszer     # deploy origin/main even if it is already live
#   bash uzem/kirak.sh --proba        # build + guard only; touches no container, no database
#
# Steps (each one stops the run on failure; nothing is ever deleted — old sources go to $GMA_GYOKER/_torolni):
#   1. lock (one deploy at a time) · fetch · is there a new commit?
#   2. source = `git archive <sha>` into $GMA_GYOKER/forras/<sha12> (never a pull into a working tree: two pushes cannot mix)
#   3. build gma-app:<sha12> and gma-kepgyar:<sha12> (label rogton.valtozat=<sha>)
#   4. banned-string guard on the built app image (tools/tiltott) — red = stop, nothing changed
#   5. config to $GMA_GYOKER/uzem-aktiv (nginx.conf, DB init, migral.sh, migrations), data folders
#   6. db up → backup + migrations (uzem/adatbazis/migral.sh: a failed backup stops the migration)  → DB label guard
#   7. retag :aktiv → :elozo, :<sha12> → :aktiv · compose up -d --no-build
#   8. health on http://127.0.0.1:8410/api/egeszseg + the running image's label = <sha> · crawl guard
#   on failure in 8: no migration ran → retag :elozo → :aktiv and bring the previous version back (exit 4);
#                    migrations ran → do NOT roll back (the old code may not fit the new schema), stop loudly (exit 7)
#
# Exit codes: 0 live (or nothing new) · 2 lock / fetch / environment · 3 build · 5 guard red (image or DB) · 6 crawl guard red
#             4 unhealthy, rolled back · 7 unhealthy after migrations, NOT rolled back · 8 backup or migration failed
set -uo pipefail

KENYSZER=0; PROBA=0
for a in "$@"; do
  case "$a" in
    --kenyszer) KENYSZER=1 ;;
    --proba) PROBA=1 ;;
    *) echo "használat: kirak.sh [--kenyszer] [--proba]" >&2; exit 2 ;;
  esac
done

REPO=${REPO:-$HOME/admin}
GMA=${GMA_GYOKER:-$HOME/gma}
ENVF=$GMA/.env
PORT=8410
AG=${KIRAK_AG:-main}
mkdir -p "$GMA/naplo" "$GMA/allapot" "$GMA/forras" "$GMA/_torolni" || exit 2
NAPLO="$GMA/naplo/kirak-$(date +%Y%m).log"

# one deploy at a time; a second timer tick waits up to 10 s, then gives up quietly
exec 9>"$GMA/allapot/zar"
flock -w 10 9 || { echo "$(date -Is) egy másik kirakás fut — kihagyom" >> "$NAPLO"; exit 0; }

[ -f "$ENVF" ] || { echo "MEGÁLL: nincs $ENVF (minta: uzem/.env.pelda)"; exit 2; }
[ "$(stat -c %a "$ENVF")" = "600" ] || { echo "MEGÁLL: a $ENVF jogosultsága nem 600"; exit 2; }
git -C "$REPO" fetch -q origin "$AG" 2>>"$NAPLO" || { echo "$(date -Is) fetch hiba" >> "$NAPLO"; exit 2; }
SHA=$(git -C "$REPO" rev-parse "origin/$AG") || exit 2
ID=${SHA:0:12}
KINT=$(cat "$GMA/allapot/kint" 2>/dev/null || true)
if [ "$SHA" = "$KINT" ] && [ $KENYSZER -eq 0 ] && [ $PROBA -eq 0 ]; then exit 0; fi

# from here on everything goes to the log as well
exec > >(tee -a "$NAPLO") 2>&1
szakasz() { echo; echo "=== $(date '+%F %T') $* ==="; }
DC=(docker compose -p gma --env-file "$ENVF" -f "$GMA/forras/$ID/uzem/docker-compose.yml")
szakasz "kirakás: $ID (kint eddig: ${KINT:0:12})"

# --- 2. source -----------------------------------------------------------------------------------------------------------------
szakasz "2. forrás: git archive $ID"
SRC="$GMA/forras/$ID"
if [ ! -f "$SRC/VALTOZAT" ]; then
  mkdir -p "$SRC" && git -C "$REPO" archive --format=tar "$SHA" | tar -x -C "$SRC" || { echo "MEGÁLL: git archive"; exit 2; }
  echo "$SHA" > "$SRC/VALTOZAT"
fi

# --- 3. build ------------------------------------------------------------------------------------------------------------------
szakasz "3. képek építése"
docker build --provenance=false -q --label "rogton.valtozat=$SHA" -t "gma-app:$ID" -f "$SRC/Dockerfile" "$SRC" > "$GMA/naplo/epites-app-$ID.log" 2>&1 \
  || { echo "MEGÁLL: a gma-app nem épült"; tail -30 "$GMA/naplo/epites-app-$ID.log"; exit 3; }
docker build --provenance=false -q --label "rogton.valtozat=$SHA" -t "gma-kepgyar:$ID" -f "$SRC/apps/kepgyar/Dockerfile" "$SRC" > "$GMA/naplo/epites-kepgyar-$ID.log" 2>&1 \
  || { echo "MEGÁLL: a gma-kepgyar nem épült"; tail -30 "$GMA/naplo/epites-kepgyar-$ID.log"; exit 3; }
echo "kész: gma-app:$ID, gma-kepgyar:$ID"

# --- 4. banned-string guard on the image ---------------------------------------------------------------------------------------
szakasz "4. tiltott-szó őr: a kép"
[ -f "$SRC/tools/tiltott/ellenoriz.mjs" ] || { echo "MEGÁLL: nincs tiltott-szó őr ebben a változatban (tools/tiltott)"; exit 5; }
docker run --rm --network none -v "$SRC/tools/tiltott:/tiltott:ro" --entrypoint node "gma-app:$ID" /tiltott/ellenoriz.mjs --kep /app \
  || { echo "PIROS: a kép tiltott szót tartalmaz — nincs kirakás"; exit 5; }

if [ $PROBA -eq 1 ]; then szakasz "próba vége: épít + őr rendben, konténerhez és adatbázishoz nem nyúltam"; exit 0; fi

# --- 5. config + data folders ----------------------------------------------------------------------------------------------------
szakasz "5. beállítások a helyükre ($GMA/uzem-aktiv)"
mkdir -p "$GMA/uzem-aktiv/adatbazis/init" "$GMA/uzem-aktiv/migraciok" "$GMA/adatok/postgres" "$GMA/adatok/fajlok" "$GMA/adatok/album" "$GMA/mentes" || exit 2
# cp into the SAME folders/files (never replace the folder): the running containers' bind mounts keep seeing them
cp "$SRC/uzem/adatbazis/init/"*.sh "$GMA/uzem-aktiv/adatbazis/init/" && cp "$SRC/uzem/adatbazis/migral.sh" "$GMA/uzem-aktiv/adatbazis/migral.sh" \
  && cp "$SRC/apps/web/adatbazis/migraciok/"*.sql "$GMA/uzem-aktiv/migraciok/" || { echo "MEGÁLL: a beállítások másolása"; exit 2; }
NGINX_VALTOZOTT=0
cmp -s "$SRC/uzem/nginx.conf" "$GMA/uzem-aktiv/nginx.conf" || { cp "$SRC/uzem/nginx.conf" "$GMA/uzem-aktiv/nginx.conf" && NGINX_VALTOZOTT=1; }
# the app runs as node (uid 1000) and writes these two folders; chown through a throwaway container (no sudo on the host)
docker run --rm --user 0 --network none -v "$GMA/adatok:/a" --entrypoint chown "gma-app:$ID" 1000:1000 /a/fajlok /a/album || exit 2
chmod 770 "$GMA/adatok/fajlok" "$GMA/adatok/album" 2>/dev/null || true

# --- 6. db, backup, migrations -----------------------------------------------------------------------------------------------------
szakasz "6. adatbázis: mentés + migrációk"
"${DC[@]}" up -d --no-build db 2>&1 | tail -2
for _ in $(seq 1 60); do docker exec gma-db pg_isready -q -U km_tulaj -d km && break; sleep 2; done
docker exec gma-db pg_isready -q -U km_tulaj -d km || { echo "MEGÁLL: az adatbázis nem indult"; exit 8; }
docker exec -e MENTES_GYOKER=/ gma-db bash /migral/migral.sh > "$GMA/naplo/migral-$ID.log" 2>&1; MKOD=$?
grep -vE '^(NOTICE|psql:.*NOTICE)' "$GMA/naplo/migral-$ID.log" | tail -5
LEFUTOTT=$(grep -c '^lefutott: ' "$GMA/naplo/migral-$ID.log")
[ "$MKOD" = "0" ] || { echo "PIROS: mentés vagy migráció elbukott ($LEFUTOTT fájl futott le előtte) — az alkalmazás a régi maradt"; exit 8; }
echo "migrációk rendben ($LEFUTOTT új)"
MINTA=$(docker run --rm --network none -v "$SRC/tools/tiltott:/tiltott:ro" --entrypoint node "gma-app:$ID" /tiltott/ellenoriz.mjs --sql-minta) || exit 5
TALALAT=$(docker exec -i gma-db psql -U km_tulaj -d km -tA -v minta="$MINTA" <<'SQL'
SELECT 'felirat ' || kulcs || ' [' || nyelv || ']' FROM felirat WHERE szoveg ~* :'minta'
UNION ALL SELECT 'kozos_felirat_verzio v' || verzio FROM kozos_felirat_verzio WHERE felulirasok::text ~* :'minta'
UNION ALL SELECT 'szervezet_felirat_verzio ' || szervezet_id || ' v' || verzio FROM szervezet_felirat_verzio WHERE felulirasok::text ~* :'minta'
ORDER BY 1;
SQL
) || { echo "MEGÁLL: a feliratok ellenőrzése nem futott"; exit 5; }
if [ -n "$TALALAT" ]; then echo "PIROS: tiltott szó az adatbázis feliratai között:"; echo "$TALALAT" | head -20; exit 5; fi
echo "feliratok: 0 találat"

# --- 7. switch -------------------------------------------------------------------------------------------------------------------
szakasz "7. váltás: :aktiv → :elozo, :$ID → :aktiv"
for k in gma-app gma-kepgyar; do
  docker image inspect "$k:aktiv" >/dev/null 2>&1 && docker tag "$k:aktiv" "$k:elozo"
  docker tag "$k:$ID" "$k:aktiv" || exit 2
done
"${DC[@]}" up -d --no-build 2>&1 | tail -5
[ $NGINX_VALTOZOTT -eq 1 ] && docker exec gma-web nginx -s reload 2>/dev/null

# --- 8. health -------------------------------------------------------------------------------------------------------------------
szakasz "8. életjel: http://127.0.0.1:$PORT/api/egeszseg"
VALASZ=000
for _ in $(seq 1 45); do
  VALASZ=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$PORT/api/egeszseg" 2>/dev/null) || true
  VALASZ=${VALASZ:-000}
  [ "$VALASZ" = "200" ] && break; sleep 2
done
FUTO=$(docker inspect -f '{{index .Config.Labels "rogton.valtozat"}}' "$(docker inspect -f '{{.Image}}' gma-app 2>/dev/null)" 2>/dev/null || true)
if [ "$VALASZ" != "200" ] || [ "$FUTO" != "$SHA" ]; then
  echo "PIROS: életjel $VALASZ, futó változat ${FUTO:0:12}"
  docker logs --tail 30 gma-app 2>&1
  if [ "$LEFUTOTT" -gt 0 ]; then
    echo "NEM állok vissza: $LEFUTOTT migráció már lefutott, a régi kód nem biztos, hogy illik az új sémához. Kézi döntés kell."
    exit 7
  fi
  if ! docker image inspect gma-app:elozo >/dev/null 2>&1; then
    echo "nincs előző kép, amire visszaállhatnék (első kirakás) — a hibát a fenti naplósorok mutatják"
    exit 4
  fi
  for k in gma-app gma-kepgyar; do docker image inspect "$k:elozo" >/dev/null 2>&1 && docker tag "$k:elozo" "$k:aktiv"; done
  "${DC[@]}" up -d --no-build 2>&1 | tail -3
  echo "visszaálltam az előző képre (migráció nem futott)"
  exit 4
fi
echo "kint van: $ID (életjel 200, a futó kép felirata egyezik)"
echo "$SHA" > "$GMA/allapot/kint"
# the timer runs uzem/kirak.sh from $REPO: move that checkout to the live commit, so the next run uses the deploy script that just
# went live (a script change takes effect from the deploy AFTER the one that ships it)
git -C "$REPO" checkout -q --detach "$SHA" 2>/dev/null || echo "FIGYELEM: a $REPO munkafa nem állt át ($ID) — a következő futás a régi kirak.sh-val megy"

szakasz "8b. tiltott-szó őr: bejárás"
if ! docker run --rm --network gma-kimeno -v "$SRC/tools/tiltott:/tiltott:ro" --entrypoint node "gma-app:$ID" /tiltott/ellenoriz.mjs --bejar http://gma-web; then
  echo "PIROS: a futó oldalon tiltott szó látszik — javítás kell (a kirakás megtörtént, az oldal még nem nyilvános)"
  exit 6
fi

# old sources: keep the last 5, move the rest aside (never delete)
mapfile -t REGI < <(ls -1dt "$GMA/forras"/*/ 2>/dev/null | tail -n +6)
[ "${#REGI[@]}" -gt 0 ] && mv -- "${REGI[@]}" "$GMA/_torolni/" && echo "régi források a _torolni/ alá: ${#REGI[@]} db"
szakasz "kész: $ID"
exit 0
