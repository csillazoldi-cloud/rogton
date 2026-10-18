#!/bin/bash
# EGYETLEN PARANCS: fordít a Gigabyte-on, átviszi, betölti, elindítja, és kívülről megnézi.
#
# Nem csinál semmi újat: a meglévő kirak.sh szakaszait hívja, sorban, és megvárja mindegyiket.
# Ezt hívja a robot is (tools/gigabyte-robot/robot.sh).
#
#   bash nas/teljes-kirakas.sh          # teljes kirakás
#   bash nas/teljes-kirakas.sh --proba  # csak fordít; a NAS-hoz NEM nyúl
#
# Kilépési kódok:  0 kész és zöld · 3 a fordítás elbukott · 4 az oldal piros (visszaálltunk)
#                  5 a fordítás nem ért véget időben · 2 a NAS-kapu nem engedett, vagy a képgyártó nem épült / nem él (2b)

set -uo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"
K="bash $ITT/kirak.sh"
G="bash $ITT/gigabyte-parancs.sh"
CIM=${CIM:-saas.mediapartizan.ro}
NAS_IP=${NAS_IP:-192.168.1.144}
VAR_PERC=${VAR_PERC:-25}      # meddig várjuk a fordítást
CSEND_PERC=${CSEND_PERC:-6}   # ennyi ideig nem nőhet a napló
PROBA=0
[ "${1:-}" = "--proba" ] && PROBA=1

szakasz() { echo; echo "=== $* ==="; }

# Egyszerre csak EGY kirakas futhat ebben a mappaban (robot es kezi inditas sem utkozhet).
ZAR="$HOME/.local/state/gigabyte-robot/zar"
if [ -z "${KIRAKAS_ZAR_MIENK:-}" ]; then
  mkdir -p "$(dirname "$ZAR")"; exec 9>"$ZAR"
  flock -w 300 9 || { echo "MEGALL: most epp fut egy masik kirakas."; exit 6; }
fi

# --- 0. a projekt saját ellenőrzései (ha van pnpm) ---------------------------
szakasz "0. határőr, tokenőr, típusellenőrzés"
GYOKER="$(cd "$ITT/.." && pwd)"
if command -v pnpm >/dev/null 2>&1; then
  ( cd "$GYOKER" && pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 && pnpm ellenoriz )
  if [ $? -ne 0 ]; then
    echo "MEGÁLL: az ellenőrzések pirosak — a NAS-hoz nem nyúlok."
    exit 3
  fi
  echo "az ellenőrzések zöldek"
else
  echo "KIMARADT: nincs pnpm ezen a gépen, ezért a határőr és a tokenőr nem futott le."
  echo "          (npm install -g pnpm@10.28.0 — utána magától lefut minden kirakás előtt)"
fi

# --- 1. fordítás -------------------------------------------------------------
szakasz "1. fordítás a Gigabyte-on"
$K || { echo "MEGÁLL: a fordítást nem sikerült elindítani"; exit 3; }

# --- 2. várakozás, csendfigyeléssel -----------------------------------------
szakasz "2. várakozás a fordításra (legfeljebb ${VAR_PERC} perc)"
VEG=$(( $(date +%s) + VAR_PERC*60 ))
UTOLSO_SOR=0; UTOLSO_VALTOZAS=$(date +%s); KOD=""
while [ "$(date +%s)" -lt "$VEG" ]; do
  sleep 20
  N=$($G "naplo saas" 2>&1)
  SOR=$(echo "$N" | sed -n 's/^sorok: \([0-9]*\)$/\1/p' | head -1)
  if [ -n "${SOR:-}" ] && [ "$SOR" != "$UTOLSO_SOR" ]; then
    UTOLSO_SOR=$SOR; UTOLSO_VALTOZAS=$(date +%s)
    echo "  ... $SOR sor a naplóban"
  fi
  if echo "$N" | grep -q "KESZ:"; then
    KOD=$(echo "$N" | sed -n 's/.*KESZ:\([0-9]*\).*/\1/p' | head -1)
    break
  fi
  # a fordító `set -e` miatt elbukáskor NEM ír KESZ-t: a csend maga a hibajel
  if [ $(( $(date +%s) - UTOLSO_VALTOZAS )) -gt $(( CSEND_PERC*60 )) ]; then
    echo "MEGÁLL: a napló ${CSEND_PERC} perce nem nő, és nincs KESZ sor — a fordítás elbukott."
    $G "naplo saas" 2>&1 | sed 's/^/    /' | head -14
    exit 3
  fi
done

if [ -z "$KOD" ]; then
  echo "MEGÁLL: ${VAR_PERC} perc alatt nem lett kész."
  $G "naplo saas" 2>&1 | sed 's/^/    /' | head -14
  exit 5
fi
if [ "$KOD" != "0" ]; then
  echo "MEGÁLL: a fordítás hibával végzett (KESZ:$KOD)."
  $G "naplo saas" 2>&1 | sed 's/^/    /' | head -14
  exit 3
fi
echo "a fordítás kész"

# --- 2b. a képgyártó a Gigabyte-on (V-6), ha változott ------------------------
# R-16 K6 (2026-09-30): a web-dobozok ELŐTT, és a hibája MEGÁLLÍT — az új web nem mehet ki olyan képgyártó mellé, amely a kéréseit
# (pl. POST /nevlogo, a 64 MB-os törzs) még nem ismeri. Csak ha a doboz ujjlenyomata (a Dockerfile COPY-forrásai a HEAD-ben) változott;
# a gépnév-őr miatt máshol semmit nem csinál. Próbán csak kiírja, építene-e.
szakasz "2b. képgyártó a Gigabyte-on (ha változott)"
if [ $PROBA -eq 1 ]; then
  bash "$GYOKER/apps/kepgyar/indit.sh" --proba || true
else
  bash "$GYOKER/apps/kepgyar/indit.sh" --ha-valtozott || { echo "MEGÁLL: a képgyártó nem épült / nem él"; exit 2; }
fi

if [ $PROBA -eq 1 ]; then
  szakasz "próba vége — a NAS-hoz nem nyúltam"
  $G "naplo saas" 2>&1 | grep -i "csomag" || true
  exit 0
fi

# --- 3-5. átvitel, betöltés, indítás ----------------------------------------
szakasz "3. forrás és kész dobozok a NAS-ra"
$K --kepek || { echo "MEGÁLL: az átvitel nem sikerült"; exit 2; }

szakasz "4. betöltés a NAS-on (fordítás nélkül)"
$K --betolt || { echo "MEGÁLL: a betöltés nem sikerült"; exit 2; }

szakasz "5. indítás és migrációk"
$K --indit || { echo "MEGÁLL: az indítás nem sikerült"; exit 2; }

# --- 6. egészség-ellenőrzés kívülről ----------------------------------------
szakasz "6. válaszol-e az oldal"
VALASZ=000
for i in 1 2 3 4 5 6; do
  VALASZ=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
           --resolve "$CIM:443:$NAS_IP" "https://$CIM/" || echo 000)
  echo "  $CIM → $VALASZ"
  [ "$VALASZ" = "200" ] && break
  sleep 10
done

if [ "$VALASZ" != "200" ]; then
  echo "PIROS — visszaállítás az előző web-dobozra"
  NAS_SUDO=1 NAS_TIMEOUT=120 bash "$ITT/nas-parancs.sh" \
    "docker stop aitmetica-saas-web >/dev/null 2>&1 || true; docker start aitmetica-saas-web-regi 2>&1 | tail -1"
  exit 4
fi

# (7. — a képgyártó: R-16 K6 óta a 2b. lépés építi, a NAS előtt; itt már nincs dolga.)

szakasz "KÉSZ — kint van a teszten"
