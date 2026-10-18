#!/bin/bash
# shellcheck disable=SC1111  # a magyar „idézőjelek” szándékosak, a szöveg része
# c7 titok-átvitel, 2–3. lépés — a GIGABYTE-on fut, rendszergazdaként (sudo), Csilla felhasználójából indítva.
# Döntés: docs/decisions/2026-10-09-c1-c7-telegram.md · leírás: tools/titok/README.md
#
#   sudo bash telegram-telepit.sh            # PRÓBA (alap): semmit nem ír — megmutatja, mit írna, a token helyén ••••
#   sudo bash telegram-telepit.sh --irj      # ÍR: (a) a robot Telegram-fájlja, (b) a NAS .env két sora, (c) egy próbaüzenet a robottól
#
# Honnan: /home/<aki a sudo-t hívta>/.km-titok/telegram-bot-token (a tools/titok/mac-gigabytera.sh tette oda; TITOK= felülírja).
# Hová:
#   (a) /home/gigabyte/.config/gigabyte-robot/telegram — két sor: TOKEN=…, CHAT=-5557911968; tulaj gigabyte, mappa 700, fájl 600.
#       Ezt olvassa a robot üzenője (tools/gigabyte-robot/uzenet.sh). A régi fájl (ha volt) telegram.elotte-<idő> néven megmarad.
#   (b) a NAS: /volume2/docker/aitmetica-saas/.env — TELEGRAM_BOT_TOKEN=… és TELEGRAM_CHAT_ID=-5557911968.
#       A NAS-hoz a robot bevett útja visz (a robot másolatának nas/nas-parancs.sh-ja, a gigabyte felhasználó nevében, a vault
#       NAS-belépésével) — ugyanaz, amin a kirakás jár. A token a csatorna BEMENETÉN megy (a robot-fájl tartalmaként), parancssorban nem.
#       Előtte mentés: .env.elotte-c7-<idő> (cp -p, ugyanaz a tulaj és jog). A .env helyben íródik át (tulaj és jog marad):
#       a két régi azonos nevű sor ki, a két új a végére. Utána a változás kulcs-szinten, az értékek helyén ••••.
#       Ismételhető: ha a két sor már pontosan így van, nem ír, „változatlan”.
#   A NAS-on dobozt NEM indít újra és nem épít. Az alkalmazás a következő kirakáskor kapja meg a változókat (a kirakás
#   `docker compose up -d --no-build`-ja újra létrehozza a dobozt, ha a környezete változott). Lásd a README „Mikor él” részét.
set -euo pipefail
MOD=proba; [ "${1:-}" = "--irj" ] && MOD=irj
[ "$(id -u)" = "0" ] || { echo "MEGÁLL: sudo-val kell futtatni (a robot fájlja a gigabyte felhasználóé)."; exit 2; }

KI=${SUDO_USER:-csilla}
TITOK=${TITOK:-$(getent passwd "$KI" | cut -d: -f6)/.km-titok/telegram-bot-token}
ROBOT=${ROBOT:-gigabyte}
ROBOT_HOME=$(getent passwd "$ROBOT" | cut -d: -f6)
REPO=${REPO:-$ROBOT_HOME/projektek/saas}
CHAT=${CHAT:--5557911968}
TG_MAPPA=$ROBOT_HOME/.config/gigabyte-robot
TG_FAJL=$TG_MAPPA/telegram
NAS_MAPPA=/volume2/docker/aitmetica-saas

[ -f "$TITOK" ] || { echo "MEGÁLL: nincs meg a token: $TITOK (előbb a Mac-en: bash tools/titok/mac-gigabytera.sh)"; exit 2; }
T=$(tr -d ' \r\n' < "$TITOK")
case "$T" in ""|*[!A-Za-z0-9:_-]*) echo "MEGÁLL: a token-fájl tartalma nem bot-token alakú."; exit 2 ;; esac
case "$CHAT" in -[0-9]*|[0-9]*) ;; *) echo "MEGÁLL: rossz CHAT: $CHAT"; exit 2 ;; esac
[ -f "$REPO/nas/nas-parancs.sh" ] || { echo "MEGÁLL: nincs meg a robot másolata: $REPO"; exit 2; }
UJJ=$(printf '%s' "$T" | sha256sum | cut -c1-8)
echo "token: $TITOK (ujjlenyomat $UJJ) · robot: $ROBOT · csoport: $CHAT · mód: $MOD"

nas() { sudo -u "$ROBOT" -H env NAS_SUDO=1 NAS_TIMEOUT=40 ${NAS_STDIN_FILE:+NAS_STDIN_FILE=$NAS_STDIN_FILE} bash "$REPO/nas/nas-parancs.sh" "$1"; }

# --- a NAS-on futó rész. A token a bemenetről jön (TOKEN= és CHAT= sor), a kimenetben soha nincs érték. --------------------------
NAS_RESZ=$(cat <<'NASVEGE'
set -e
umask 077
cd __MAPPA__ || { echo "NAS: nincs meg a projektmappa"; exit 3; }
[ -f .env ] || { echo "NAS: nincs .env"; exit 3; }
SZABAD=$(free -m | awk '/^Mem:/{print $7}'); TERH=$(uptime | sed 's/.*load average: //' | cut -d, -f1 | sed 's/^ *//;s/\..*//')
echo "NAS: szabad memória ${SZABAD} MB, terhelés ${TERH}"
for k in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do echo "NAS: .env $k sor most: $(grep -c "^$k=" .env || true) db"; done
if [ "__MOD__" != "irj" ]; then echo "NAS: próba — nem írtam semmit"; exit 0; fi
BE=$(cat); TOK=$(printf '%s\n' "$BE" | sed -n 's/^TOKEN=\([A-Za-z0-9:_-]*\)\s*$/\1/p' | tail -1); CH=$(printf '%s\n' "$BE" | sed -n 's/^CHAT=\(-\{0,1\}[0-9]*\)\s*$/\1/p' | tail -1)
[ -n "$TOK" ] && [ -n "$CH" ] || { echo "NAS: nem jött token a bemeneten — nem írok"; exit 3; }
if [ "$(grep -c -e '^TELEGRAM_BOT_TOKEN=' -e '^TELEGRAM_CHAT_ID=' .env || true)" = 2 ] && grep -qx "TELEGRAM_BOT_TOKEN=$TOK" .env && grep -qx "TELEGRAM_CHAT_ID=$CH" .env; then
  echo "NAS: .env változatlan (a két sor már így volt)"; exit 0
fi
M=.env.elotte-c7-$(date +%Y%m%d-%H%M%S); cp -p .env "$M"; echo "NAS: mentés: __MAPPA__/$M"
REGI=$(grep -e '^TELEGRAM_BOT_TOKEN=' -e '^TELEGRAM_CHAT_ID=' .env | sed -E 's/=.*/=••••/' || true)
UJ=$(grep -v -e '^TELEGRAM_BOT_TOKEN=' -e '^TELEGRAM_CHAT_ID=' .env || true)
printf '%s\nTELEGRAM_BOT_TOKEN=%s\nTELEGRAM_CHAT_ID=%s\n' "$UJ" "$TOK" "$CH" > .env   # a fájl ugyanaz marad: tulaj és jog nem változik
echo "NAS: változás (értékek helyén ••••):"
[ -n "$REGI" ] && printf '%s\n' "$REGI" | sed 's/^/  - /'
echo "  + TELEGRAM_BOT_TOKEN=••••"; echo "  + TELEGRAM_CHAT_ID=$CH"
echo "NAS: .env sorai: előtte $(wc -l < "$M"), utána $(wc -l < .env) · jogai: $(ls -l .env | awk '{print $1, $3, $4}')"
echo "NAS: visszaállítás, ha kell: cp -p __MAPPA__/$M __MAPPA__/.env"
NASVEGE
)
NAS_RESZ=${NAS_RESZ//__MAPPA__/$NAS_MAPPA}; NAS_RESZ=${NAS_RESZ//__MOD__/$MOD}

echo "--- (a) a robot Telegram-fájlja: $TG_FAJL"
if [ -f "$TG_FAJL" ]; then
  echo "most: megvan ($(stat -c '%a %U' "$TG_FAJL")), TOKEN-sor: $(grep -c '^TOKEN=' "$TG_FAJL" || true), CHAT: $(sed -n 's/^CHAT=//p' "$TG_FAJL" | tail -1)"
else
  echo "most: nincs"
fi
if [ "$MOD" = irj ]; then
  install -d -m 700 -o "$ROBOT" -g "$ROBOT" "$TG_MAPPA"
  if [ -f "$TG_FAJL" ] && [ "$(cat "$TG_FAJL")" = "$(printf 'TOKEN=%s\nCHAT=%s' "$T" "$CHAT")" ]; then
    echo "változatlan"
  else
    [ -f "$TG_FAJL" ] && mv "$TG_FAJL" "$TG_FAJL.elotte-$(date +%Y%m%d-%H%M%S)"
    ( umask 077; printf 'TOKEN=%s\nCHAT=%s\n' "$T" "$CHAT" > "$TG_FAJL" )
    chown "$ROBOT:$ROBOT" "$TG_FAJL"; chmod 600 "$TG_FAJL"
    echo "[rendben] megírva ($(stat -c '%a %U' "$TG_FAJL"))"
  fi
else
  echo "próba: ide írnám: TOKEN=•••• és CHAT=$CHAT (600, $ROBOT)"
fi
unset T

echo "--- (b) a NAS .env"
if [ "$MOD" = irj ]; then
  NAS_STDIN_FILE=$TG_FAJL nas "$NAS_RESZ"
else
  nas "$NAS_RESZ"
  echo "próba: ezt a két sort írnám a NAS .env végére (a régi azonos nevű sorok helyett): TELEGRAM_BOT_TOKEN=•••• · TELEGRAM_CHAT_ID=$CHAT"
fi

echo "--- (c) próbaüzenet a robottól"
if [ "$MOD" = irj ]; then
  sudo -u "$ROBOT" -H bash "$REPO/tools/gigabyte-robot/uzenet.sh" "c7 próba" "A robot üzenetei mostantól ebbe a csoportba is jönnek." proba
  if tail -1 "$ROBOT_HOME/.local/state/gigabyte-robot/uzenetek.txt" | grep -q "nem ment ki\|hiányos"; then
    echo "[HIBA] a robot próbaüzenete nem ment ki: $(tail -1 "$ROBOT_HOME/.local/state/gigabyte-robot/uzenetek.txt")"; exit 1
  fi
  echo "[rendben] a robot próbaüzenete kiment (a csoportban látszik: „Ez csak egy próbaüzenet.”)"
else
  echo "próba: --irj után egy próbaüzenet menne a csoportba"
fi
