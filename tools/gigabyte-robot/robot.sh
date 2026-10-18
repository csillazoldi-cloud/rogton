#!/bin/bash
# A Gigabyte robotja (c4, 2026-10-07 — docs/plans/c4-vedett-main.md, docs/decisions/2026-10-07-c4-vedett-main.md).
# Percenként indul (gigabyte-robot.timer). Egyszerre csak egy kör fut (zár).
#
# KÉT ÚT, EGY BEÁLLÍTÁS: ~/.config/gigabyte-robot/beallitas
#   KAPU=1     → az új út: kapu (ellenőrzés + minden próba) ELŐTTE, és pontosan EGY, rögzített változat megy ki
#   (nincs / KAPU=0) → a régi út változatlanul: robot-regi.sh (ellenőrzés nélkül kirak)
#
# Az új út egy köre:
#   1. lekérdezi az origin/main-t → T. Ha T == a kint lévő változat (állapot: kint) → nincs dolog.
#   2. CSEND: T-t először látva csak feljegyzi; csak ha 2 percig (ROBOT_CSEND_MP) nem jött újabb, akkor indul (Q2).
#      Gyors pushok sorozatából így egyetlen kirakás lesz — a legutolsóé; a köztes változatok szándékosan kimaradnak.
#   3. ha T már piros volt → nem próbálja újra (egy üzenet ment róla). Gépezet-hiba után 5, 15, 30 perc múlva újra; a 3. után piros.
#   4. kapu: tools/kapu/kapu.sh T (a robot SAJÁT, utoljára kirakott változatának kapuja ítél — a vizsgált változat nem gyengítheti).
#   5. kirakás: nas/kirak-sha.sh T — git archive T a forrás, a T címkéjű képek, mentés → migráció → alkalmazáscsere, és
#      a végén VISSZAOLVASSA a NAS-ról, hogy tényleg T fut. Csak ezután: kint = T, üzenet „Kint van”.
#   A robot másolatát (REPO) SEMMI nem húzza a kirakás közben; csak sikeres kirakás után áll rá T-re (így frissül a kapu is).
#
#   bash robot.sh                 # egy kör
#   bash robot.sh --sha <sha>     # kézi út: ezt az egy változatot (csend és állapot nélkül, ugyanazzal a kapuval és zárral)
#   bash robot.sh --proba         # a kirakás --proba: a NAS-hoz nem nyúl (a kapu teljesen lefut)
#
# Napló: $REPO/docs/robot-naplo.jsonl (git kihagyja). Állapot: ~/.local/state/gigabyte-robot/ (kint, latott, utolso-proba, szivdobbanas).
set -uo pipefail

ITT="$(cd "$(dirname "$0")" && pwd)"
BEALLITAS=${ROBOT_BEALLITAS:-$HOME/.config/gigabyte-robot/beallitas}
KAPU_BE=$(sed -n 's/^KAPU=\([01]\)\s*$/\1/p' "$BEALLITAS" 2>/dev/null | tail -1)
KERT_SHA=""; PROBA=""
while [ $# -gt 0 ]; do
  case "$1" in
    --sha) KERT_SHA=${2:-}; shift ;;
    --proba) PROBA="--proba" ;;
  esac
  shift
done
if [ "${KAPU_BE:-0}" != "1" ] && [ -z "$KERT_SHA" ]; then
  exec bash "$ITT/robot-regi.sh" $PROBA
fi

REPO=${REPO:-$HOME/projektek/saas}
AG=${AG:-main}
ALLAPOT=${ROBOT_ALLAPOT:-$HOME/.local/state/gigabyte-robot}
NAPLO=${ROBOT_NAPLO:-$REPO/docs/robot-naplo.jsonl}
CSEND_MP=${ROBOT_CSEND_MP:-120}
KAPU=${KAPU_PARANCS:-bash $REPO/tools/kapu/kapu.sh}
KIRAK=${KIRAK_PARANCS:-bash $REPO/nas/kirak-sha.sh}
UZENET=${UZENET_PARANCS:-$ITT/uzenet.sh}
mkdir -p "$ALLAPOT"

most() { date +%s; }
naplo() { # naplo <esemeny> <eredmeny> <uzenet>
  printf '{"mikor":"%s","esemeny":"%s","eredmeny":"%s","valtozat":"%s","uzenet":"%s"}\n' \
    "$(date -Is)" "$1" "$2" "${ID:-}" "$(echo "${3:-}" | tr -d '"\\' | tr '\n' ' ')" >> "$NAPLO"
}
szolj() { bash "$UZENET" "$1" "$2" "${3:-}" >/dev/null 2>&1 || true; }   # 3.: a Telegram-szöveg kulcsa (uzenet-szovegek.txt)
ir() { printf '%s\n' "$2" > "$ALLAPOT/$1.uj" && mv "$ALLAPOT/$1.uj" "$ALLAPOT/$1"; }   # atomi írás

# --- egyszerre csak egy kör ------------------------------------------------------------------------------------------------
exec 9>"$ALLAPOT/zar"
flock -n 9 || { echo "már fut egy kör, kilépek"; exit 0; }
ir szivdobbanas "$(most)"

cd "$REPO" || { echo "nincs meg a tároló: $REPO" >&2; exit 1; }
git fetch -q origin "$AG" 2>/dev/null || { naplo lekerdezes hiba "a tárolót nem érem el"; exit 1; }

if [ -n "$KERT_SHA" ]; then
  T=$(git rev-parse --verify -q "$KERT_SHA^{commit}") || { git fetch -q origin "$KERT_SHA" 2>/dev/null; T=$(git rev-parse --verify -q "$KERT_SHA^{commit}"); } \
    || { echo "nincs ilyen változat: $KERT_SHA" >&2; exit 2; }
  git merge-base --is-ancestor "$T" "origin/$AG" || echo "FIGYELEM: $T nincs rajta az origin/$AG-on — kézi kérésre mégis megyek."
else
  T=$(git rev-parse "origin/$AG")
fi
ID=${T:0:12}

# a kint lévő változat: első bekapcsoláskor az, amit a régi út utoljára kirakott (a robot másolatának HEAD-je)
[ -s "$ALLAPOT/kint" ] || ir kint "$(git rev-parse HEAD)"
KINT=$(cat "$ALLAPOT/kint")

if [ -z "$KERT_SHA" ]; then
  [ "$T" = "$KINT" ] && exit 0                                   # nincs dolog, csendben

  # --- csend: a legutolsó push után 2 percig nem jött újabb ------------------------------------------------------------
  read -r LS LIDO < "$ALLAPOT/latott" 2>/dev/null || { LS=""; LIDO=0; }
  if [ "$LS" != "$T" ]; then
    ir latott "$T $(most)"; naplo varakozas csend "új változat a fő ágon; ${CSEND_MP} mp csend után indulok"
    exit 0
  fi
  [ $(( $(most) - LIDO )) -ge "$CSEND_MP" ] || exit 0

  # --- volt-e már ez a változat ---------------------------------------------------------------------------------------
  read -r PS PD PN PIDO < "$ALLAPOT/utolso-proba" 2>/dev/null || { PS=""; PD=""; PN=0; PIDO=0; }
  if [ "$PS" = "$T" ]; then
    [ "$PD" = "piros" ] && exit 0                                # egyszer szóltunk; a következő push hozza a javítást
    if [ "$PD" = "infra" ]; then
      case "$PN" in 1) VAR=300 ;; 2) VAR=900 ;; *) VAR=1800 ;; esac
      [ $(( $(most) - PIDO )) -ge "$VAR" ] || exit 0
    fi
  else PN=0; fi
else
  PN=0
fi

LEIRAS=$(git log -1 --pretty=%s "$T")
naplo kapu indul "$LEIRAS"
kezd=$(most)

# --- kapu ----------------------------------------------------------------------------------------------------------------
KAPU_ZAR_MIENK=1 REPO="$REPO" $KAPU "$T" > "$ALLAPOT/utolso-kapu.log" 2>&1
KK=$?
KMONDAT=$(sed -n 's/^KAPU: [a-z-]* — //p' "$ALLAPOT/utolso-kapu.log" | tail -1)
FUTAS=$(sed -n 's/^futás: //p' "$ALLAPOT/utolso-kapu.log" | tail -1)

infra() { # infra <mondat>
  PN=$((PN + 1))
  if [ "$PN" -ge 3 ]; then
    ir utolso-proba "$T piros $PN $(most)"; naplo "$1" piros "harmadszor sem sikerült: $2"
    szolj "Elakadt a kirakás" "$ID — $LEIRAS. Harmadszor sem sikerült: $2 Nem próbálom újra; a következő push vagy egy kézi robot.sh --sha indítja." elakadt
  else
    ir utolso-proba "$T infra $PN $(most)"; naplo "$1" infra "$2"
    [ "$PN" -ge 2 ] && szolj "Elakadt a kirakás" "$ID — $2 Később újra próbálom." elakadt
  fi
}

if [ $KK -eq 1 ]; then
  ir utolso-proba "$T piros 1 $(most)"; naplo kapu piros "$KMONDAT"
  szolj "Nem raktam ki" "$ID — $LEIRAS. $KMONDAT A teszten a régi változat marad. Részletek: $FUTAS" nem_kerult_ki
  exit 1
elif [ $KK -ne 0 ]; then
  infra kapu "${KMONDAT:-a kapu nem futott végig (kód $KK)}"
  exit 2
fi
naplo kapu zold "$KMONDAT"
BOVULT=""; echo "$KMONDAT" | grep -q "bővítette" && BOVULT=" FIGYELEM: ez a változat bővítette az ismert hibák listáját."

# --- kirakás: pontosan T ----------------------------------------------------------------------------------------------------
naplo kirakas indul "$LEIRAS"
KAPU_ZAR_MIENK=1 REPO="$REPO" $KIRAK "$T" $PROBA > "$ALLAPOT/utolso.log" 2>&1
KI=$?
perc=$(( ($(most) - kezd) / 60 ))
# sikertelen kirakás: a nas/public másolása már felülírhatta az élő lapot — a robot meglévő „Kint” sorai vissza (új sor NEM)
[ -z "$PROBA" ] && [ $KI -ne 0 ] && { REPO="$REPO" ROBOT_ALLAPOT="$ALLAPOT" ROBOT_NAPLO="$NAPLO" bash "$ITT/kint-sor.sh" --csak-olvaszt >/dev/null 2>&1 || true; }
case $KI in
  0)
    if [ -n "$PROBA" ]; then naplo kirakas proba "a NAS-hoz nem nyúltam"; echo "próba: kapu zöld, a kirakás csak próba volt"; exit 0; fi
    ir kint "$T"; ir utolso-proba "$T kint 0 $(most)"
    naplo kirakas zold "$LEIRAS"
    szolj "Kint van" "$ID — $LEIRAS (${perc} perc).$BOVULT" kint
    # Csilla 2026-10-11: az élő állapotlapra egy „Kint: <sha> — <tárgy>” sor (kint-sor.sh; hiba esetén csak helyi naplósor, a kirakás kész)
    REPO="$REPO" ROBOT_ALLAPOT="$ALLAPOT" ROBOT_NAPLO="$NAPLO" bash "$ITT/kint-sor.sh" "$T" >/dev/null 2>&1 || true
    # a robot másolata csak MOST áll rá a kirakott változatra (így frissül a kapu és a robot is) — tiszta másolatnál
    if [ -z "$(git status --porcelain)" ]; then
      git merge -q --ff-only "$T" 2>/dev/null || git checkout -q --detach "$T" 2>/dev/null || naplo frissites hiba "a robot másolata nem állt rá $ID-ra"
    else
      naplo frissites kihagyva "a Gigabyte másolatában elmentetlen fájlok vannak"; szolj "A robot másolata piszkos" "Elmentetlen fájlok a Gigabyte másolatában — a kapu a régi eszközeivel dolgozik tovább." piszkos
    fi
    [ -x "$ITT/tukor.sh" ] && { bash "$ITT/tukor.sh" >> "$ALLAPOT/tukor.log" 2>&1 || naplo tukor hiba "a tükrözés nem sikerült (tukor.log)"; }
    exit 0 ;;
  4)
    ir utolso-proba "$T piros 1 $(most)"; naplo kirakas piros "az oldal nem válaszolt; visszaálltam az előző alkalmazásra"
    szolj "Nem maradt kint" "$ID — $LEIRAS. Az oldal nem válaszolt, ezért visszaálltam az előző változatra (migráció nem futott). Napló: $ALLAPOT/utolso.log" visszaallt
    exit 4 ;;
  7)
    ir utolso-proba "$T piros 1 $(most)"
    M=$(sed -n 's/^MENTÉS: //p' "$ALLAPOT/utolso.log" | tail -1)
    naplo kirakas piros "migráció lefutott, az oldal nem válaszol"
    szolj "PIROS — döntés kell" "$ID — $LEIRAS. A migráció lefutott, de az oldal nem válaszol. Nem állok vissza magamtól. Mentés: ${M:-lásd a naplót}. Napló: $ALLAPOT/utolso.log" nem_mukodik
    exit 7 ;;
  8)
    ir utolso-proba "$T piros 1 $(most)"; naplo kirakas piros "a migráció elbukott a NAS-on"
    szolj "PIROS — döntés kell" "$ID — $LEIRAS. A migráció elbukott a NAS-on; az alkalmazás a régi maradt. Napló: $ALLAPOT/utolso.log" felresiklott
    exit 8 ;;
  9)
    ir utolso-proba "$T piros 1 $(most)"; naplo kirakas piros "a visszaolvasás nem egyezik"
    szolj "PIROS — nem az fut, amit kiraktam" "$ID — a NAS-ról visszaolvasott változat nem egyezik. Napló: $ALLAPOT/utolso.log" nem_stimmel
    exit 9 ;;
  *)
    infra kirakas "a kirakás nem ment végig (kód $KI; a NAS foglalt vagy nem elérhető)."
    exit 2 ;;
esac
