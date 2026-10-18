#!/bin/bash
# Napi szívdobbanás (c4): naponta egyszer (09:00) megnézi, él-e a robot és kint van-e a fő ág. CSAK ha baj van, szól.
#   - a robot 30 percnél régebben jelentkezett (a gép fut, de a robot áll: timer, zár, hiba)
#   - a fő ág (origin/main) több mint 2 órája nincs kint
#   - egy piros változat vár javításra (emlékeztető)
# A régi úton (KAPU nincs bekapcsolva) is fut: akkor csak a robot életjelét nézi a timer naplójából.
set -uo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"
REPO=${REPO:-$HOME/projektek/saas}
AG=${AG:-main}
ALLAPOT=${ROBOT_ALLAPOT:-$HOME/.local/state/gigabyte-robot}
UZENET=${UZENET_PARANCS:-$ITT/uzenet.sh}
MOST=${SZIV_MOST:-$(date +%s)}
BAJ=()

if [ -s "$ALLAPOT/szivdobbanas" ]; then
  UTOLSO=$(cat "$ALLAPOT/szivdobbanas")
  [ $(( MOST - UTOLSO )) -gt 1800 ] && BAJ+=("A robot $(( (MOST - UTOLSO) / 60 )) perce nem jelentkezett (systemctl --user status gigabyte-robot.timer).")
fi
if [ -s "$ALLAPOT/kint" ] && git -C "$REPO" fetch -q origin "$AG" 2>/dev/null; then
  T=$(git -C "$REPO" rev-parse "origin/$AG"); KINT=$(cat "$ALLAPOT/kint")
  if [ "$T" != "$KINT" ]; then
    read -r LS LIDO < "$ALLAPOT/latott" 2>/dev/null || { LS=""; LIDO=$MOST; }
    [ "$LS" = "$T" ] && [ $(( MOST - LIDO )) -gt 7200 ] && BAJ+=("A fő ág ${T:0:12} több mint 2 órája nincs kint (kint: ${KINT:0:12}).")
  fi
fi
read -r PS PD _ < "$ALLAPOT/utolso-proba" 2>/dev/null || PD=""
[ "${PD:-}" = "piros" ] && BAJ+=("A ${PS:0:12} változat piros volt, és még nem jött javítás.")

[ ${#BAJ[@]} -eq 0 ] && { echo "szívdobbanás: minden rendben"; exit 0; }
bash "$UZENET" "Robot — napi ellenőrzés" "$(printf '%s ' "${BAJ[@]}")" napi_baj   # a csoportba csak az egyszerű mondat megy (uzenet-szovegek.txt)
printf '%s\n' "${BAJ[@]}"
