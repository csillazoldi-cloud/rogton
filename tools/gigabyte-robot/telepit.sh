#!/bin/bash
# Egyetlen parancs, ami beállítja a gépet. A Gigabyte-on futtatandó, egyszer.
#
#   bash tools/gigabyte-robot/telepit.sh
#
# Mit csinál:
#   - megnézi, megvan-e minden, amire szükség van (git, docker, pnpm, systemd)
#   - beteszi a robotot és az éjszakai mentést magától induló szolgáltatásnak
#   - beállítja, hogy bejelentkezés nélkül, a gép indulásakor is elinduljon
#   - a végén megmutatja, mi hol áll
#
# Nem nyúl a NAS-hoz, nem rak ki, nem töröl semmit. Bármikor újra futtatható.

set -uo pipefail

ITT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ITT/../.." && pwd)"
EGYSEGEK="$HOME/.config/systemd/user"
HIBA=0

cim() { echo; echo "--- $* ---"; }
ok()  { echo "  [rendben] $*"; }
baj() { echo "  [HIÁNYZIK] $*"; HIBA=1; }

cim "1. Hol vagyok"
echo "  gép:    $(hostname)"
echo "  tároló: $REPO"
if [ -d "$REPO/.git" ]; then
  ok "git-tároló: $(git -C "$REPO" log --oneline -1 2>/dev/null)"
else
  baj "ez a mappa nem git-tároló — a robotnak innen kell dolgoznia"
fi

cim "2. Eszközök"
for e in git docker systemctl; do
  command -v "$e" >/dev/null 2>&1 && ok "$e" || baj "$e"
done
command -v pnpm >/dev/null 2>&1 && ok "pnpm" || ok "pnpm nem kell"
docker info >/dev/null 2>&1 && ok "a docker fut és elérem" || baj "a dockerhez nincs jogom (usermod -aG docker \$USER, majd új belépés)"

cim "3. A tároló elérése"
if git -C "$REPO" ls-remote origin >/dev/null 2>&1; then
  ok "a GitHub elérhető innen"
else
  baj "a GitHubot nem érem el ebből a mappából (kulcs vagy belépő kell)"
fi

if [ $HIBA -ne 0 ]; then
  echo
  echo "MEGÁLLTAM: előbb a fenti hiányokat kell pótolni. Semmit nem állítottam be."
  exit 1
fi

cim "4. Szolgáltatások beállítása"
mkdir -p "$EGYSEGEK"
for f in gigabyte-robot.service gigabyte-robot.timer ejszakai-mentes.service ejszakai-mentes.timer szivdobbanas.service szivdobbanas.timer; do
  cp "$ITT/$f" "$EGYSEGEK/" && ok "$f a helyén"
done
chmod +x "$ITT"/*.sh "$REPO/nas/teljes-kirakas.sh" "$REPO/nas/kirak-sha.sh" "$REPO/tools/kapu/"*.sh "$REPO/tools/kepernyokep.sh" 2>/dev/null

systemctl --user daemon-reload
systemctl --user enable --now gigabyte-robot.timer >/dev/null 2>&1 && ok "a robot elindult"
systemctl --user enable --now ejszakai-mentes.timer >/dev/null 2>&1 && ok "az éjszakai mentés beidőzítve"
systemctl --user enable --now szivdobbanas.timer >/dev/null 2>&1 && ok "a napi szívdobbanás beidőzítve (c4)"
if grep -q "^KAPU=1" "$HOME/.config/gigabyte-robot/beallitas" 2>/dev/null; then ok "a c4 kapu BE van kapcsolva"; else ok "a c4 kapu ki van kapcsolva (régi út) — bekapcsolás: tools/kapu/README.md"; fi

if loginctl show-user "$USER" 2>/dev/null | grep -q "Linger=yes"; then
  ok "bejelentkezés nélkül is fut"
else
  if loginctl enable-linger "$USER" 2>/dev/null; then
    ok "bejelentkezés nélkül is fut (most kapcsoltam be)"
  else
    echo "  [FIGYELEM] ehhez rendszergazda kell:  sudo loginctl enable-linger $USER"
    echo "             enélkül kijelentkezés után megáll a robot"
  fi
fi

cim "5. Így áll most"
systemctl --user list-timers gigabyte-robot.timer ejszakai-mentes.timer szivdobbanas.timer --no-pager 2>/dev/null | head -5

cat <<'SZOVEG'

KÉSZ. Innentől a gép magától dolgozik:
  - percenként megnézi, változott-e a fő ág, és ha igen, kirak
  - minden éjjel 3:20-kor lement egy fájlba

Amit érdemes egyszer, kézzel kipróbálni, mielőtt rábízod magad:

  bash nas/teljes-kirakas.sh --proba          # fordít, de a NAS-hoz nem nyúl
  bash tools/gigabyte-robot/ejszakai-mentes.sh --proba   # visszaállítható-e a mentés

Ha valami elakad:
  systemctl --user status gigabyte-robot.service
  tail -20 ~/.local/state/gigabyte-robot/utolso.log
SZOVEG
