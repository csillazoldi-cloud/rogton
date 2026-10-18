#!/bin/bash
# c7 titok-átvitel, 1. lépés — a MAC-en fut (docs/decisions/2026-10-09-c1-c7-telegram.md, leírás: tools/titok/README.md).
#
#   bash tools/titok/mac-gigabytera.sh
#
# A Telegram-bot tokenjét a Mac vaultjából (~/saas/vault/telegram-bot-token, mód 600) átviszi a Gigabyte-ra, Csilla saját
# felhasználójához: /home/csilla/.km-titok/telegram-bot-token (mappa 700, fájl 600). Vágólap nincs, a token sehol nem jelenik meg:
# a fájl az ssh BEMENETÉN megy át (nem a parancssorban, nem naplóban). Kiírja: a hosszát és a sha256 első 8 jelét — ebből a két
# oldalon ellenőrizhető, hogy ugyanaz ment át, a tokenből semmit nem árul el.
#
# Az ssh Csilla saját belépése a Gigabyte-ra (NEM a gigabyte-forditas-kulcs: annak kényszerített parancsa van, ezt nem tudja).
# Ha nincs kulcsa, az ssh egyszer jelszót kér — a terminálból olvassa, a token ettől nem kerül a képernyőre.
# Beállítható: TITOK (alap ~/saas/vault/telegram-bot-token), GAZDA (alap csilla@100.113.109.91).
set -euo pipefail
TITOK=${TITOK:-$HOME/saas/vault/telegram-bot-token}
GAZDA=${GAZDA:-csilla@100.113.109.91}

[ -f "$TITOK" ] || { echo "MEGÁLL: nincs meg a token-fájl: $TITOK"; exit 2; }
T=$(tr -d ' \r\n' < "$TITOK")
case "$T" in
  ""|*[!A-Za-z0-9:_-]*) echo "MEGÁLL: a fájl tartalma nem úgy néz ki, mint egy bot-token (számok:betűk). Nem küldöm."; exit 2 ;;
esac
case "$T" in *:*) ;; *) echo "MEGÁLL: a tokenből hiányzik a kettőspont. Nem küldöm."; exit 2 ;; esac
ujj() { if command -v sha256sum >/dev/null 2>&1; then sha256sum; else shasum -a 256; fi | cut -c1-8; }
HELYI=$(printf '%s' "$T" | ujj)

# a token a bemeneten megy; a túloldal 077-es umaskkal írja, és visszaadja a hosszt és az ujjlenyomatot
TAVOLI=$(printf '%s' "$T" | ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$GAZDA" \
  'umask 077; mkdir -p ~/.km-titok && chmod 700 ~/.km-titok && cat > ~/.km-titok/telegram-bot-token && chmod 600 ~/.km-titok/telegram-bot-token &&
   H=$(wc -c < ~/.km-titok/telegram-bot-token | tr -d " "); U=$(sha256sum < ~/.km-titok/telegram-bot-token | cut -c1-8); echo "$H $U"')
unset T

if [ "$TAVOLI" = "$(tr -d ' \r\n' < "$TITOK" | wc -c | tr -d ' ') $HELYI" ]; then
  echo "[rendben] a token átment a Gigabyte-ra (~/.km-titok/telegram-bot-token), ujjlenyomat: $HELYI"
else
  echo "[HIBA] a túloldalon más van (várt: ujjlenyomat $HELYI, kapott: $TAVOLI)"; exit 1
fi
