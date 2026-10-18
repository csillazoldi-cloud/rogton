#!/bin/bash
# c4 (2026-10-07): kirakás PONTOSAN EGY változatból — docs/plans/c4-vedett-main.md §4.4. A robot hívja, a kapu után.
#
#   bash nas/kirak-sha.sh <sha> [--proba]
#
# Különbség a régi úttól (teljes-kirakas.sh + kirak.sh), és miért:
#   - a forrás `git archive <sha>` — sehol nincs `git pull`, ezért nem keveredhet két push (09-21);
#   - a képek a kapu által épített, <sha12> címkéjű képek (km.valtozat=<sha> felirattal); a NAS-on <sha12> → :helyi,
#     a korábbi :helyi → :elozo (ebből lehet visszaállni);
#   - sorrend: mentés + migráció (migral.sh) ELŐBB, az új alkalmazás UTÁNA (régen fordítva: az új kód a régi sémán indult);
#   - a végén VISSZAOLVASSA: a futó alkalmazás képének km.valtozat felirata és a forras/VALTOZAT is <sha> legyen.
#
# Kilépés: 0 kint és visszaolvasva · 2 a NAS-kapu nem engedett / elérhetetlen / átvitel hiba (újrapróbálható)
#          4 az oldal piros, migráció NEM futott → visszaálltunk az :elozo képre · 7 az oldal piros, de migráció futott → NEM állunk vissza
#          8 a migráció elbukott (az alkalmazás a régi maradt) · 9 a visszaolvasott változat nem egyezik · 3 hiányzó kép / rossz kérés
#
# A NAS-szabályok (NAS-szabalyok.md) változatlanul: mérés előtte (3 GB / terhelés 20), fordítás a NAS-on soha, egy kirakás egyszerre.
# Önpróbához a NAS-hívás cserélhető: KIRAK_NAS="bash <csonk>" (a csonk a NAS parancsait csak naplózza).
set -uo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"
SHA_KERT=${1:-}; PROBA=0; [ "${2:-}" = "--proba" ] && PROBA=1
[ -n "$SHA_KERT" ] || { echo "használat: kirak-sha.sh <sha> [--proba]" >&2; exit 3; }
REPO=${REPO:-$HOME/projektek/saas}
SHA=$(git -C "$REPO" rev-parse --verify -q "$SHA_KERT^{commit}") || { echo "MEGÁLL: nincs ilyen változat: $SHA_KERT"; exit 3; }
ID=${SHA:0:12}
NAS=${KIRAK_NAS:-bash $ITT/nas-parancs.sh}
TAVOLI=/volume2/docker/aitmetica-saas
CIM=${CIM:-saas.mediapartizan.ro}
NAS_IP=${NAS_IP:-192.168.1.144}
MUNKA=${KIRAK_MUNKA:-$HOME/tmp/kirak-$ID}
KAPU_GYOKER=${KAPU_GYOKER:-$HOME/saas-kapu}
szakasz() { echo; echo "=== $* ==="; }
mkdir -p "$MUNKA"

# Egyszerre csak EGY kirakás (ugyanaz a zár, mint a robotté)
if [ -z "${KAPU_ZAR_MIENK:-}" ]; then
  ZAR="${ROBOT_ALLAPOT:-$HOME/.local/state/gigabyte-robot}/zar"; mkdir -p "$(dirname "$ZAR")"; exec 9>"$ZAR"
  flock -w 300 9 || { echo "MEGÁLL: most épp fut egy másik kirakás."; exit 2; }
fi

meres() { # a NAS-szabályok kapuja — ugyanaz, mint a kirak.sh meres() (csak a saját jelölésű, szám sorokat fogadjuk el)
  local m szabad terh
  m=$($NAS 'free -m | awk "/^Mem:/{print \"MEM=\" \$7}"; uptime | sed "s/.*load average: //" | cut -d, -f1 | sed "s/^ *//;s/\..*//;s/^/TERH=/"')
  szabad=$(echo "$m" | sed -n 's/^MEM=\([0-9][0-9]*\)$/\1/p' | head -1)
  terh=$(echo "$m" | sed -n 's/^TERH=\([0-9][0-9]*\)$/\1/p' | head -1)
  if [ -z "$szabad" ] || [ -z "$terh" ]; then echo "MEGÁLL: a NAS mérése nem adott számot."; exit 2; fi
  echo "NAS: felszabadítható ${szabad} MB, terhelés ${terh}"
  if [ "$szabad" -lt 3000 ] || [ "$terh" -gt 20 ]; then echo "MEGÁLL: a NAS-szabályok szerint most nem indulhat nehéz munka."; exit 2; fi
}

# --- 0. a kapu képei megvannak-e ----------------------------------------------------------------------------------------------
szakasz "0. a kapu képei: $ID"
for k in aitmetica-saas-app aitmetica-saas-referencia; do
  V=$(docker image inspect -f '{{index .Config.Labels "km.valtozat"}}' "$k:$ID" 2>/dev/null) || { echo "MEGÁLL: nincs $k:$ID kép (a kapu építi)"; exit 3; }
  [ "$V" = "$SHA" ] || { echo "MEGÁLL: a $k:$ID kép felirata $V, nem $SHA"; exit 3; }
done
echo "a képek megvannak, a feliratuk $SHA"

# --- 1. a képgyártó a Gigabyte-on (V-6, R-16 K6), ha változott — a kapu munkafájából, amely PONTOSAN ezen a változaton áll ----
szakasz "1. képgyártó a Gigabyte-on (ha változott)"
KF="$KAPU_GYOKER/munkafa"
if [ "$(git -C "$KF" rev-parse HEAD 2>/dev/null)" != "$SHA" ]; then echo "MEGÁLL: a kapu munkafája nem a $ID változaton áll"; exit 3; fi
if [ $PROBA -eq 1 ]; then bash "$KF/apps/kepgyar/indit.sh" --proba || true
else bash "$KF/apps/kepgyar/indit.sh" --ha-valtozott || { echo "MEGÁLL: a képgyártó nem épült / nem él"; exit 2; }; fi

# --- 2. a forrás: git archive <sha> + VALTOZAT ---------------------------------------------------------------------------------
szakasz "2. forráscsomag: git archive $ID"
KIBONT=$(mktemp -d "${TMPDIR:-/tmp}/kirak-forras-$ID.XXXXXX") || exit 2   # ideiglenes kibontás a rendszer /tmp-jében
git -C "$REPO" archive --format=tar "$SHA" | tar -x -C "$KIBONT" || { echo "MEGÁLL: a git archive nem sikerült"; exit 3; }
echo "$SHA" > "$KIBONT/VALTOZAT"
tar -C "$KIBONT" -czf "$MUNKA/forras.tgz" . || exit 3
echo "forráscsomag: $(du -h "$MUNKA/forras.tgz" | cut -f1)"
docker save "aitmetica-saas-app:$ID" "aitmetica-saas-referencia:$ID" | gzip -1 > "$MUNKA/kepek.tgz" || { echo "MEGÁLL: docker save"; exit 2; }
echo "képcsomag: $(du -h "$MUNKA/kepek.tgz" | cut -f1)"

if [ $PROBA -eq 1 ]; then
  szakasz "próba vége — a NAS-hoz nem nyúltam (a csomagok: $MUNKA)"
  exit 0
fi

# --- 3. át a NAS-ra ----------------------------------------------------------------------------------------------------------
szakasz "3. mérés, majd forrás és képek a NAS-ra"
meres
NAS_STDIN_FILE=$MUNKA/forras.tgz $NAS "cat > $TAVOLI/forras.tgz && ls -la $TAVOLI/forras.tgz | awk '{print \"átment:\", \$5, \"bájt\"}'" || exit 2
NAS_SUDO=1 $NAS "cd $TAVOLI && mkdir -p _torolni && ([ -d forras ] && mv forras _torolni/forras-$(date +%Y%m%d-%H%M%S) || true) && mkdir forras && tar -xzf forras.tgz -C forras && cp forras/nas/docker-compose.yml . && cp forras/nas/nginx.conf ./nginx.conf.uj && mkdir -p public && cp -r forras/nas/public/. public/ && echo 'forrás a helyén:' \$(cat forras/VALTOZAT)" || exit 2
NAS_STDIN_FILE=$MUNKA/kepek.tgz NAS_SUDO=1 NAS_TIMEOUT=170 $NAS "cat > $TAVOLI/kepek.tgz && ls -la $TAVOLI/kepek.tgz | awk '{print \"átment:\", \$5, \"bájt\"}'" || exit 2

szakasz "4. betöltés, és a címkék: :helyi → :elozo, :$ID → :helyi"
NAS_SUDO=1 NAS_TIMEOUT=170 $NAS "gunzip -c $TAVOLI/kepek.tgz | docker load" || exit 2
NAS_SUDO=1 $NAS "for k in aitmetica-saas-app aitmetica-saas-referencia; do if docker image inspect \$k:helyi >/dev/null 2>&1; then docker tag \$k:helyi \$k:elozo; fi; docker tag \$k:$ID \$k:helyi || exit 1; done; echo 'címkék rendben'" || exit 2

# --- 5. mentés + migráció ELŐBB (a futó alkalmazás közben a régi) ---------------------------------------------------------------
szakasz "5. mentés és migrációk (migral.sh) — az új alkalmazás előtt"
# a NAS dobozkezelője a bind-mount mappát nem hozza létre magától: minden ./adatok/* kötet mappája itt készül, MIELŐTT bármelyik doboz
# indul (c30 F9 utómunka, 10-17: a ./adatok/album hiányzott → az alkalmazás doboza nem indult, 502). A fájlok és az album a node
# felhasználóé (1000), mint a kirak.sh --indit-ben. A probak/nas-kotet-mappak.proba.ts őrzi, hogy a compose minden ./adatok kötete itt legyen.
NAS_SUDO=1 $NAS "cd $TAVOLI && mkdir -p adatok/postgres adatok/fajlok adatok/album && chown 1000:1000 adatok/fajlok adatok/album && chmod 770 adatok/fajlok adatok/album && docker compose -f $TAVOLI/docker-compose.yml up -d --no-build db 2>&1 | tail -1" || exit 2
NAS_SUDO=1 NAS_TIMEOUT=170 $NAS "cd $TAVOLI && for i in \$(seq 1 40); do docker compose exec -T db pg_isready -q -h localhost -U km_tulaj -d km && break; sleep 2; done; docker compose -f $TAVOLI/docker-compose.yml run --rm --no-deps -T -e PGHOST=db db bash /migral/migral.sh; echo MIGRAL_KOD:\$?" > "$MUNKA/migral.log" 2>&1
cat "$MUNKA/migral.log"
MIGRAL_KOD=$(sed -n 's/.*MIGRAL_KOD:\([0-9]*\).*/\1/p' "$MUNKA/migral.log" | tail -1)
LEFUTOTT=$(grep -c '^lefutott: ' "$MUNKA/migral.log")
MENTES=$(sed -n 's/^mentés kész: \(.*\) (.*$/\1/p' "$MUNKA/migral.log" | tail -1)
[ -n "$MENTES" ] && echo "MENTÉS: $MENTES"
if [ "${MIGRAL_KOD:-1}" != "0" ]; then
  echo "PIROS: a migráció elbukott ($LEFUTOTT fájl futott le előtte). Az alkalmazás a régi maradt; a régi :helyi címkét visszaállítom."
  NAS_SUDO=1 $NAS "for k in aitmetica-saas-app aitmetica-saas-referencia; do docker image inspect \$k:elozo >/dev/null 2>&1 && docker tag \$k:elozo \$k:helyi; done; echo 'címkék vissza'"
  exit 8
fi
echo "migrációk rendben ($LEFUTOTT új)"

# --- 6. az új alkalmazás --------------------------------------------------------------------------------------------------------
szakasz "6. indítás (--no-build) és a hálózati kerítés"
NAS_SUDO=1 $NAS "cd $TAVOLI && ([ -f nginx.conf.uj ] && cp nginx.conf nginx.conf.elozo && mv nginx.conf.uj nginx.conf || true) && docker compose -f $TAVOLI/docker-compose.yml up -d --no-build 2>&1 | tail -5; docker ps --format '{{.Names}} {{.Status}}' | grep aitmetica" || exit 2
NAS_STDIN_FILE=$ITT/kerites.sh NAS_SUDO=1 $NAS "cat > /tmp/km-kerites.sh && sh /tmp/km-kerites.sh"

# --- 7. válaszol-e az oldal --------------------------------------------------------------------------------------------------------
szakasz "7. válaszol-e az oldal"
VALASZ=000
for _ in 1 2 3 4 5 6; do
  VALASZ=$(${KIRAK_CURL:-curl} -s -o /dev/null -w '%{http_code}' --max-time 20 --resolve "$CIM:443:$NAS_IP" "https://$CIM/api/egeszseg" || echo 000)
  echo "  $CIM/api/egeszseg → $VALASZ"
  [ "$VALASZ" = "200" ] && break
  sleep "${KIRAK_VAR_MP:-10}"
done
if [ "$VALASZ" != "200" ]; then
  if [ "$LEFUTOTT" -gt 0 ]; then
    echo "PIROS: az oldal nem válaszol, és $LEFUTOTT migráció lefutott — NEM állok vissza magamtól (a régi alkalmazás az új sémán: döntés kell)."
    exit 7
  fi
  echo "PIROS: az oldal nem válaszol; migráció nem futott → visszaállás az :elozo képre"
  NAS_SUDO=1 $NAS "cd $TAVOLI && for k in aitmetica-saas-app aitmetica-saas-referencia; do docker image inspect \$k:elozo >/dev/null 2>&1 && docker tag \$k:elozo \$k:helyi; done; docker compose -f $TAVOLI/docker-compose.yml up -d --no-build app referencia 2>&1 | tail -2"
  exit 4
fi

# --- 8. visszaolvasás: tényleg ez fut? -----------------------------------------------------------------------------------------------
szakasz "8. visszaolvasás a NAS-ról"
VISSZA=$(NAS_SUDO=1 $NAS "echo FUT:\$(docker inspect -f '{{index .Config.Labels \"km.valtozat\"}}' \$(docker inspect -f '{{.Image}}' aitmetica-saas-app)); echo FORRAS:\$(cat $TAVOLI/forras/VALTOZAT)")
FUT=$(echo "$VISSZA" | sed -n 's/^FUT:\([0-9a-f]*\)$/\1/p' | tail -1)
FORRAS=$(echo "$VISSZA" | sed -n 's/^FORRAS:\([0-9a-f]*\)$/\1/p' | tail -1)
echo "fut: ${FUT:-?} · forrás: ${FORRAS:-?} · kért: $SHA"
if [ "$FUT" != "$SHA" ] || [ "$FORRAS" != "$SHA" ]; then echo "PIROS: a visszaolvasott változat nem egyezik"; exit 9; fi
szakasz "KÉSZ — kint van a teszten: $ID"
