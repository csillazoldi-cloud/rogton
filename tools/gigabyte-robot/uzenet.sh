#!/bin/bash
# Üzenet a csapatnak (c4, 2026-10-07; c7 2026-10-09). MINDIG fájlba ír (a technikai részletekkel); a Telegram-csoportba CSAK
# egyszerű, emberi mondat megy, a kulcs szerint az uzenet-szovegek.txt táblából (Csilla, 2026-10-09 07:58: a csoportot nem
# fejlesztők olvassák). Üres szöveg a táblában, ismeretlen vagy hiányzó kulcs = nincs Telegram-üzenet.
#   uzenet.sh "<cím>" "<technikai szöveg>" [<kulcs>]
#
# Telegram (a c7 bot — Csilla 10-07-én jóváhagyta, Vilmos nevében; Vilmos a hubon látja):
#   ~/.config/gigabyte-robot/telegram  (mód 600), két sor:
#     TOKEN=<a bot tokenje>
#     CHAT=<a csapat csoportjának azonosítója, pl. -5557911968>
# A tokent a parancssorba sem tesszük (a curl a beállítását a bemenetről olvassa), és soha nem írjuk naplóba.
ITT="$(cd "$(dirname "$0")" && pwd)"
CIM="${1:-}"; SZOVEG="${2:-}"; KULCS="${3:-}"
ALLAPOT="${ROBOT_ALLAPOT:-$HOME/.local/state/gigabyte-robot}"; mkdir -p "$ALLAPOT"
printf '%s  %s — %s%s\n' "$(date -Is)" "$CIM" "$SZOVEG" "${KULCS:+ [$KULCS]}" >> "$ALLAPOT/uzenetek.txt"

TABLA="${UZENET_SZOVEGEK:-$ITT/uzenet-szovegek.txt}"
EMBERI=""
[ -n "$KULCS" ] && [ -f "$TABLA" ] && EMBERI=$(grep -v '^#' "$TABLA" | sed -n "s/^${KULCS}|//p" | tail -1)
[ -n "$EMBERI" ] || exit 0

TG="${UZENET_TELEGRAM:-$HOME/.config/gigabyte-robot/telegram}"
[ -f "$TG" ] || exit 0
TOKEN=$(sed -n 's/^TOKEN=\([A-Za-z0-9:_-]*\)\s*$/\1/p' "$TG" | tail -1)
CHAT=$(sed -n 's/^CHAT=\(-\{0,1\}[0-9]*\)\s*$/\1/p' "$TG" | tail -1)
if [ -z "$TOKEN" ] || [ -z "$CHAT" ]; then
  printf '%s  (a Telegram-beállítás hiányos: TOKEN= és CHAT= sor kell)\n' "$(date -Is)" >> "$ALLAPOT/uzenetek.txt"; exit 0
fi
if ! printf 'url = "%s/bot%s/sendMessage"\n' "${UZENET_TELEGRAM_API:-https://api.telegram.org}" "$TOKEN" \
  | curl -sS -m 15 -o /dev/null -w '%{http_code}' -K - --data-urlencode "chat_id=$CHAT" --data-urlencode "text=$EMBERI" 2>/dev/null \
  | grep -q '^200$'; then
  printf '%s  (a Telegram-üzenet nem ment ki; csak itt van meg)\n' "$(date -Is)" >> "$ALLAPOT/uzenetek.txt"
fi
exit 0
