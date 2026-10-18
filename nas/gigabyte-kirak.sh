#!/bin/bash
# Kirakás A GIGABYTE-RÓL — a gépeden futó Linux-munkakörnyezet MEGKERÜLÉSÉVEL.
#
# Miért van ez: 2026-09-11-én a munkakörnyezet hálózata meghalt, és vele állt a feltöltés
# és a kirakás is. Minden út azon az egy ajtón ment át. Ez a script nem azon megy.
#
# Használat a Gigabyte-on, egyetlen sor:
#   bash ~/projektek/saas/nas/gigabyte-kirak.sh "a commit uzenete"
#
# Amit csinál, sorban, és minden lépésnél KIÍRJA, mit mért:
#   1. megnézi, mi változott a tárhely-másolatban
#   2. elmenti és feltölti (a kulcs a SynologyDrive vaultban van, a te gépeden)
#   3. lefordítja a dobozokat ITT, a Gigabyte-on
#   4. megnézi, eléri-e a NAS-t — és ha igen, átviszi; ha nem, PONTOSAN megmondja, mi hiányzik
set -uo pipefail

REPO="${REPO:-$HOME/projektek/saas}"
VAULT="${VAULT:-$HOME/SynologyDrive/SaaS/vault}"
UZENET="${1:-Kirakas a Gigabyte-rol}"
NAS_CIM="${NAS_CIM:-100.89.241.71}"

szakasz() { echo; echo "=== $* ==="; }

szakasz "0. Hol vagyunk"
echo "gép:      $(hostname)"
echo "tárhely:  $REPO"
cd "$REPO" || { echo "MEGÁLL: nincs ilyen mappa: $REPO"; exit 2; }
echo "utolsó:   $(git log --oneline -1)"
echo "szabad:   $(df -h --output=avail / | tail -1 | tr -d ' ') a lemezen, $(free -g | awk '/^Mem:/{print $7}') GB memória"

szakasz "1. Mi változott"
VALTOZOTT=$(git status --short | grep -v '^??' | wc -l)
UJ=$(git status --short | grep -c '^??' || true)
echo "módosított fájl: $VALTOZOTT, új fájl: $UJ"
if [ "$VALTOZOTT" = "0" ] && [ "$UJ" = "0" ]; then
  echo "Nincs mit kirakni. (Ha mégis fordítanál, add meg: CSAK_EPIT=1)"
  [ "${CSAK_EPIT:-0}" = "1" ] || exit 0
fi
git status --short | head -20

szakasz "2. Mentés és feltöltés"
KULCS="$VAULT/github-kulcs"
if [ ! -f "$KULCS" ]; then
  echo "NINCS KULCS itt: $KULCS"
  echo "→ a feltöltés kimarad; a kód a gépen marad, elmentve. Folytatom a fordítással."
else
  # a Synology Drive mappájában a jogosultságok nem megbízhatóak — másolat a tárhely alatt
  BKULCS="$REPO/.git/gh-kulcs"
  cp -f "$KULCS" "$BKULCS" && chmod 600 "$BKULCS"
  export GIT_SSH_COMMAND="ssh -i $BKULCS -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
fi

git add -A
if git diff --cached --quiet; then
  echo "nincs mit elmenteni (már el volt mentve)"
else
  git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "$UZENET"
  echo "elmentve: $(git log --oneline -1)"
fi

if [ -f "${BKULCS:-}" ]; then
  if git push -q origin main 2>/tmp/push-hiba.txt; then
    echo "feltöltve a tárhelyre"
  else
    echo "A FELTÖLTÉS NEM MENT:"; sed 's/^/    /' /tmp/push-hiba.txt | head -5
    echo "→ a kód a gépen elmentve; a fordítás mehet tovább."
  fi
fi

szakasz "3. Fordítás itt, a Gigabyte-on"
TERHELES=$(uptime | sed 's/.*load average: //' | cut -d, -f1 | cut -d. -f1)
echo "terhelés most: $TERHELES"
if [ "${TERHELES:-0}" -gt 24 ]; then echo "MEGÁLL: túl nagy a terhelés."; exit 2; fi
NAPLO=/tmp/saas-epit.log
echo "napló: $NAPLO  (kövesd: tail -f $NAPLO)"
{
  docker build --provenance=false --sbom=false -t aitmetica-saas-app:helyi -f Dockerfile . \
  && docker build --provenance=false --sbom=false -t aitmetica-saas-referencia:helyi \
       --build-arg CEL=referencia -f Dockerfile . 2>/dev/null || true
} > "$NAPLO" 2>&1
if [ $? -ne 0 ]; then
  echo "A FORDÍTÁS ELBUKOTT. Az utolsó 15 sor:"; tail -15 "$NAPLO"; exit 3
fi
echo "kész: $(docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep aitmetica | head -3 | tr '\n' ' ')"

szakasz "4. Eléri-e a Gigabyte a NAS-t"
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$NAS_CIM/22" 2>/dev/null; then
  echo "A NAS ELÉRHETŐ innen ($NAS_CIM:22)."
  if ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "$NAS_CIM" "echo ok" >/dev/null 2>&1; then
    echo "SSH-belépés is megy jelszó nélkül → a teljes kirakás automatizálható innen."
  else
    echo "SSH-belépés jelszó nélkül NEM megy."
    echo "→ EZ hiányzik a teljes automatizáláshoz: egy kulcs a Gigabyte-ról a NAS-ra."
    echo "→ Addig a dobozokat a szokásos úton kell átvinni."
  fi
else
  echo "A NAS NEM ÉRHETŐ EL innen ($NAS_CIM:22)."
  echo "→ Valószínűleg a Tailscale nincs fent ezen a gépen. Ellenőrzés: tailscale status"
fi

szakasz "Kész"
echo "A dobozok itt vannak, lefordítva. Ami még hátravan, azt a 4. szakasz mondja meg."
