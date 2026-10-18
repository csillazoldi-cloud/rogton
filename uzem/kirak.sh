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
#   9. G6: the egress check — through the app's network the Cloudflare trace must say warp=on (else exit 10, the site stays up;
#      outbound fetches fail closed because of the kill-switch)
#
# G6/G7 services: gma-egress (WARP) and gma-tunnel (cloudflared) are NOT restarted by a normal deploy — `compose up` re-creates a
# container only when its compose config changed, and the egress script files are compared byte by byte (cmp) before they are
# replaced. Re-creating gma-egress drops the app's network (the app lives in its namespace), so it happens only on a real change,
# and then the app is re-created right after it. Every timer tick (even with nothing new) also checks that gma-app still sits in
# the CURRENT gma-egress namespace, and re-creates gma-app if not (e.g. after the egress container restarted on its own).
#
# G6b — which kirak.sh runs: the timer starts ~/admin/uzem/kirak.sh, and ~/admin is a DETACHED checkout that moves to the live
# commit only after a fully successful deploy (manual steps there: `git fetch origin main && git checkout --detach <sha>`; `git pull`
# fails on a detached HEAD). So right after step 2 this script compares itself with the kirak.sh of the commit being deployed
# and, if they differ, re-executes that one (once — KIRAK_UJ). A failed deploy leaves ~/admin where it was; the next tick hands
# over again.
#
# Exit codes: 0 live (or nothing new) · 2 lock / fetch / environment · 3 build · 5 guard red (image or DB) · 6 crawl guard red
#             4 unhealthy, rolled back · 7 unhealthy after migrations, NOT rolled back · 8 backup or migration failed
#             10 live, but the egress is not on WARP (outbound fetches fail closed until it is)
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
# (after a hand-over — KIRAK_UJ — the lock is still held through the inherited fd 9; re-opening the file would deadlock against it)
if [ -z "${KIRAK_UJ:-}" ]; then
  exec 9>"$GMA/allapot/zar"
  flock -w 10 9 || { echo "$(date -Is) egy másik kirakás fut — kihagyom" >> "$NAPLO"; exit 0; }
fi

[ -f "$ENVF" ] || { echo "MEGÁLL: nincs $ENVF (minta: uzem/.env.pelda)"; exit 2; }
[ "$(stat -c %a "$ENVF")" = "600" ] || { echo "MEGÁLL: a $ENVF jogosultsága nem 600"; exit 2; }
git -C "$REPO" fetch -q origin "$AG" 2>>"$NAPLO" || { echo "$(date -Is) fetch hiba" >> "$NAPLO"; exit 2; }
SHA=$(git -C "$REPO" rev-parse "origin/$AG") || exit 2
ID=${SHA:0:12}
KINT=$(cat "$GMA/allapot/kint" 2>/dev/null || true)

# G6 self-heal (every tick): gma-app lives in the network namespace of gma-egress. Three ways it can be left in a dead namespace
# (no network at all — fails closed, but the site answers 502):
#   a) egress was RE-CREATED (new container id)        → the app is re-created (it must join the new namespace);
#   b) egress was RESTARTED (same id, new namespace)   → G6b: egress started later than the app → `docker restart gma-app`;
#   c) anything else: egress is healthy, but the site's health endpoint is not 200 three times in a row → `docker restart gma-app`.
halo_or() {
  local kint_dc="$GMA/forras/${KINT:0:12}/uzem/docker-compose.yml" egress app_mod e_indult a_indult e_egeszseg kod i
  [ -n "$KINT" ] && [ -f "$kint_dc" ] || return 0
  egress=$(docker inspect -f '{{.Id}}' gma-egress 2>/dev/null) || return 0
  app_mod=$(docker inspect -f '{{.HostConfig.NetworkMode}}' gma-app 2>/dev/null) || return 0
  case "$app_mod" in container:*) ;; *) return 0 ;; esac
  if [ "$app_mod" != "container:$egress" ] || [ "$(docker inspect -f '{{.State.Running}}' gma-app 2>/dev/null)" != "true" ]; then
    echo "$(date -Is) gma-app nincs a mostani gma-egress hálózatában — újraalkotom" >> "$NAPLO"
    docker compose -p gma --env-file "$ENVF" -f "$kint_dc" up -d --no-build --force-recreate app >> "$NAPLO" 2>&1 || true
    return 0
  fi
  # b) both timestamps are RFC 3339 in UTC from the same daemon, so a string comparison orders them
  e_indult=$(docker inspect -f '{{.State.StartedAt}}' gma-egress 2>/dev/null || true)
  a_indult=$(docker inspect -f '{{.State.StartedAt}}' gma-app 2>/dev/null || true)
  if [ -n "$e_indult" ] && [ -n "$a_indult" ] && [[ "$e_indult" > "$a_indult" ]]; then
    echo "$(date -Is) gma-egress újraindult a gma-app után ($e_indult > $a_indult) — gma-app újraindítása" >> "$NAPLO"
    docker restart gma-app >> "$NAPLO" 2>&1 || true
    return 0
  fi
  # c) the site itself, only when egress reports healthy (otherwise the app is not the problem)
  e_egeszseg=$(docker inspect -f '{{.State.Health.Status}}' gma-egress 2>/dev/null || true)
  [ "$e_egeszseg" = "healthy" ] || return 0
  for i in 1 2 3; do
    kod=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:8410/api/egeszseg" 2>/dev/null) || true
    [ "$kod" = "200" ] && return 0
    [ "$i" -lt 3 ] && sleep 5
  done
  echo "$(date -Is) a lap nem válaszol (${kod:-000}), az egress egészséges — gma-app újraindítása" >> "$NAPLO"
  docker restart gma-app >> "$NAPLO" 2>&1 || true
}
halo_or

if [ "$SHA" = "$KINT" ] && [ $KENYSZER -eq 0 ] && [ $PROBA -eq 0 ]; then exit 0; fi

# from here on everything goes to the log as well (unless an older kirak.sh already does that and handed over to us)
[ -n "${KIRAK_NAPLOZVA:-}" ] || exec > >(tee -a "$NAPLO") 2>&1
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
# G6b: the timer runs the kirak.sh of the LIVE checkout (~/admin). If this commit brings a different kirak.sh, hand over to it now,
# so a deploy always runs with the deploy script of the commit it deploys. KIRAK_UJ guards against a loop; KIRAK_NAPLOZVA tells the
# new script that the output is already being logged (no second tee).
if [ -z "${KIRAK_UJ:-}" ] && ! cmp -s "${BASH_SOURCE[0]}" "$SRC/uzem/kirak.sh"; then
  echo "a kirak.sh ebben a változatban más — átadom neki: $SRC/uzem/kirak.sh"
  exec env KIRAK_UJ=1 KIRAK_NAPLOZVA=1 REPO="$REPO" GMA_GYOKER="$GMA" bash "$SRC/uzem/kirak.sh" "$@"
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
mkdir -p "$GMA/uzem-aktiv/adatbazis/init" "$GMA/uzem-aktiv/migraciok" "$GMA/uzem-aktiv/egress" "$GMA/adatok/postgres" "$GMA/adatok/fajlok" "$GMA/adatok/album" "$GMA/adatok/warp" "$GMA/mentes" || exit 2
# cp into the SAME folders/files (never replace the folder): the running containers' bind mounts keep seeing them
cp "$SRC/uzem/adatbazis/init/"*.sh "$GMA/uzem-aktiv/adatbazis/init/" && cp "$SRC/uzem/adatbazis/migral.sh" "$GMA/uzem-aktiv/adatbazis/migral.sh" \
  && cp "$SRC/apps/web/adatbazis/migraciok/"*.sql "$GMA/uzem-aktiv/migraciok/" || { echo "MEGÁLL: a beállítások másolása"; exit 2; }
NGINX_VALTOZOTT=0
cmp -s "$SRC/uzem/nginx.conf" "$GMA/uzem-aktiv/nginx.conf" || { cp "$SRC/uzem/nginx.conf" "$GMA/uzem-aktiv/nginx.conf" && NGINX_VALTOZOTT=1; }
# G6: the egress files (kill-switch rules, entrypoint wrapper) — replaced, and the egress re-created, only when they changed
EGRESS_VALTOZOTT=0
for f in indit.sh kerites-belul.nft; do
  cmp -s "$SRC/uzem/egress/$f" "$GMA/uzem-aktiv/egress/$f" || { cp "$SRC/uzem/egress/$f" "$GMA/uzem-aktiv/egress/$f" && EGRESS_VALTOZOTT=1; }
done
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
# G6b: éles adatbázisban nincs AKTÍV .example fiók (a mintafiókokat a 0184 felfüggeszti; egy próbafiók sem maradhat élőben)
PELDA=$(docker exec gma-db psql -U km_tulaj -d km -tAc "SELECT email FROM fiok WHERE email ~* '[.]example\$' AND felfuggesztve IS NULL") \
  || { echo "MEGÁLL: a fiókok ellenőrzése nem futott"; exit 5; }
if [ -n "$PELDA" ]; then echo "PIROS: aktív .example fiók az éles adatbázisban:"; echo "$PELDA" | head -10; exit 5; fi
echo "fiókok: nincs aktív .example fiók"

# --- 7. switch -------------------------------------------------------------------------------------------------------------------
szakasz "7. váltás: :aktiv → :elozo, :$ID → :aktiv"
for k in gma-app gma-kepgyar; do
  docker image inspect "$k:aktiv" >/dev/null 2>&1 && docker tag "$k:aktiv" "$k:elozo"
  docker tag "$k:$ID" "$k:aktiv" || exit 2
done
EGRESS_ELOTTE=$(docker inspect -f '{{.Id}}' gma-egress 2>/dev/null || true)
"${DC[@]}" up -d --no-build 2>&1 | tail -5
if [ $EGRESS_VALTOZOTT -eq 1 ] && [ -n "$EGRESS_ELOTTE" ] && [ "$(docker inspect -f '{{.Id}}' gma-egress 2>/dev/null)" = "$EGRESS_ELOTTE" ]; then
  echo "az egress fájljai változtak — gma-egress és gma-app újraalkotása"
  "${DC[@]}" up -d --no-build --force-recreate egress app 2>&1 | tail -3
fi
# whenever egress got a new container (config or file change), the app must join the new namespace
if [ "$(docker inspect -f '{{.HostConfig.NetworkMode}}' gma-app 2>/dev/null)" != "container:$(docker inspect -f '{{.Id}}' gma-egress 2>/dev/null)" ]; then
  "${DC[@]}" up -d --no-build --force-recreate app 2>&1 | tail -2
fi
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

# --- 9. G6: does the app's traffic leave through WARP? -------------------------------------------------------------------------
szakasz "9. kimenő forgalom: WARP"
WARP=""
for _ in $(seq 1 12); do
  WARP=$(docker exec gma-egress curl -fsS --max-time 10 https://www.cloudflare.com/cdn-cgi/trace 2>/dev/null | sed -n 's/^warp=//p')
  case "$WARP" in on|plus) break ;; esac
  sleep 10
done
case "$WARP" in
  on|plus) echo "kimenő forgalom: WARP ($WARP)" ;;
  *) echo "PIROS: a kimenő forgalom NEM a WARP-on megy (warp=${WARP:-nincs válasz}) — a letöltések addig zárva maradnak (kill-switch)"
     KILEPES=10 ;;
esac

# old sources: keep the last 5, move the rest aside (never delete)
mapfile -t REGI < <(ls -1dt "$GMA/forras"/*/ 2>/dev/null | tail -n +6)
[ "${#REGI[@]}" -gt 0 ] && mv -- "${REGI[@]}" "$GMA/_torolni/" && echo "régi források a _torolni/ alá: ${#REGI[@]} db"
szakasz "kész: $ID"
exit "${KILEPES:-0}"
