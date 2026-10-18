#!/bin/bash
# A Gigabyte robotjának RÉGI útja (c4 előtt, 2026-10-07-ig ez volt a robot.sh): figyeli a fő ágat, és ha változott, kirak — ellenőrzés nélkül.
# Megtartva, hogy a c4 kapu bekapcsolása egyetlen beállítás legyen, és vissza is lehessen állni (robot.sh: ~/.config/gigabyte-robot/beallitas, KAPU=1).
# Ismert hibái (docs/plans/c4-vedett-main.md §2): háromszor húzza a fő ágat egy kirakáson belül; az elbukott kirakást nem próbálja újra.
# Percenként indul (gigabyte-robot.timer). Egyszerre csak egy futhat.
#
#   bash robot.sh            # egy kör
#   bash robot.sh --proba    # egy kör úgy, hogy a NAS-hoz nem nyúl
#   bash robot.sh --most     # kirak akkor is, ha a fő ág nem változott
#
# Naplót ír a docs/robot-naplo.jsonl fájlba. Üzenetet az uzenet.sh-n át küld.

set -uo pipefail

REPO=${REPO:-/home/gigabyte/projektek/saas}
AG=${AG:-main}
ITT="$(cd "$(dirname "$0")" && pwd)"
NAPLO="$REPO/docs/robot-naplo.jsonl"
ALLAPOT="$HOME/.local/state/gigabyte-robot"
ZAR="$ALLAPOT/zar"
UZENET="$ITT/uzenet.sh"
ALLAPOT=${ROBOT_ALLAPOT:-$ALLAPOT}; ZAR="$ALLAPOT/zar"
PROBA=""; MOST=0
for k in "$@"; do
  [ "$k" = "--proba" ] && PROBA="--proba"
  [ "$k" = "--most"  ] && MOST=1
done

mkdir -p "$ALLAPOT"

naplo() { # naplo <esemeny> <eredmeny> <uzenet>
  printf '{"mikor":"%s","esemeny":"%s","eredmeny":"%s","valtozat":"%s","uzenet":"%s"}\n' \
    "$(date -Is)" "$1" "$2" "${VALTOZAT:-}" "$(echo "${3:-}" | tr -d '"' | tr '\n' ' ')" >> "$NAPLO"
}
szolj() { [ -x "$UZENET" ] && "$UZENET" "$1" "$2" "${3:-}" >/dev/null 2>&1 || true; }   # 3.: a Telegram-szöveg kulcsa

# --- egyszerre csak egy kör -------------------------------------------------
exec 9>"$ZAR"
flock -n 9 || { echo "már fut egy kör, kilépek"; exit 0; }

cd "$REPO" || { echo "nincs meg a tároló: $REPO" >&2; exit 1; }

# --- változott-e a fő ág ----------------------------------------------------
git fetch -q origin "$AG" 2>/dev/null || { naplo lekerdezes hiba "a tárolót nem érem el"; exit 1; }
HELYI=$(git rev-parse HEAD)
TAVOLI=$(git rev-parse "origin/$AG")

if [ "$HELYI" = "$TAVOLI" ] && [ $MOST -eq 0 ]; then
  exit 0   # nincs dolog, csendben
fi

# --- van-e elmentetlen munka a gépen ----------------------------------------
if [ -n "$(git status --porcelain)" ]; then
  naplo kirakas kihagyva "a Gigabyte másolatában elmentetlen fájlok vannak"
  szolj "A robot megállt" "A Gigabyte-on elmentetlen fájlok vannak, ezért nem húztam rá a friss kódot. Nézd meg." elakadt
  exit 3
fi

git merge --ff-only "origin/$AG" -q || { naplo frissites hiba "nem tudtam ráállni a fő ágra"; exit 1; }
VALTOZAT=$(git rev-parse --short HEAD)
LEIRAS=$(git log -1 --pretty=%s)

naplo kirakas indul "$LEIRAS"
kezd=$(date +%s)

if KIRAKAS_ZAR_MIENK=1 bash "$REPO/nas/teljes-kirakas.sh" $PROBA > "$ALLAPOT/utolso.log" 2>&1; then
  perc=$(( ($(date +%s) - kezd) / 60 ))
  naplo kirakas zold "$LEIRAS"
  szolj "Kint van a teszten" "$VALTOZAT — $LEIRAS (${perc} perc). A tesztoldal válaszol." kint
  # D-F28: a tárhely tükre a Synology Drive-ba (Vilmos minden gépére) — a kirakás eredményét nem befolyásolja
  bash "$ITT/tukor.sh" >> "$ALLAPOT/tukor.log" 2>&1 || naplo tukor hiba "a tükrözés nem sikerült (tukor.log)"
else
  kod=$?
  naplo kirakas piros "kilépési kód $kod"
  szolj "A kirakás elhasalt" "$VALTOZAT — $LEIRAS. Kilépési kód: $kod. Napló: $ALLAPOT/utolso.log" felresiklott
  exit $kod
fi
