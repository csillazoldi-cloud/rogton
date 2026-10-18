#!/bin/bash
# Rögtön — heartbeat, every 10 minutes from the user timer gma-szivdobbanas.timer (as gyorsadmin, no sudo).
#
# Checks, from the host:
#   1. the site: http://127.0.0.1:8410/api/egeszseg must answer 200 (nginx → gma-app)
#   2. the egress: through gma-app's own network the Cloudflare trace must say warp=on (or plus) — the same path the news
#      downloader and the AI calls take
# Skipped while a deploy or the nightly backup runs (both hold ~/gma/allapot/zar; a restart in the middle of a deploy is not an
# outage, and the backup only waits for a deploy).
#
# Result:
#   - every run: one line in ~/gma/naplo/szivdobbanas-<YYYYMM>.log
#   - on failure: ONE line appended to ~/gma/allapot/riasztas (what failed, in one sentence); ~/gma/allapot/szivdobbanas-hiba
#     holds the time the current outage started, and is moved away when it heals (a „helyreállt” line goes to riasztas then)
#   - optional Telegram notice, ONLY when both RIASZTAS_TELEGRAM_TOKEN and RIASZTAS_TELEGRAM_CHAT are set in ~/gma/.env (default: off,
#     no outbound call at all). One message when an outage starts, one when it heals — never every 10 minutes.
#     The call goes from the host, not through WARP; the token never appears on a command line (curl reads it from stdin).
# Log hygiene (every run, cheap): files in ~/gma/naplo older than 90 days move to ~/gma/_torolni/naplo/ (never deleted).
#   bash uzem/szivdobbanas.sh --proba-uzenet   sends one test message (only when both variables are set) and exits
# Exit codes: 0 healthy or skipped · 1 something failed (systemd shows the unit as failed until the next green run)
set -uo pipefail

GMA=${GMA_GYOKER:-$HOME/gma}
ENVF=$GMA/.env
PORT=${SZIV_PORT:-8410}
mkdir -p "$GMA/naplo" "$GMA/allapot" "$GMA/_torolni/naplo" || exit 1
NAPLO="$GMA/naplo/szivdobbanas-$(date +%Y%m).log"
RIASZTAS=$GMA/allapot/riasztas
HIBA=$GMA/allapot/szivdobbanas-hiba
MOST=$(date -Is)

# log hygiene first, so it runs even on a red tick
find "$GMA/naplo" -maxdepth 1 -type f -mtime +90 -exec mv -t "$GMA/_torolni/naplo/" {} + 2>/dev/null

if ! flock -n "$GMA/allapot/zar" true 2>/dev/null; then
  echo "$MOST kihagyva: kirakás vagy mentés fut" >> "$NAPLO"; exit 0
fi

# one variable from the .env, without sourcing the whole file (no secret ends up in this shell's environment by accident)
env_ertek() { [ -r "$ENVF" ] && sed -n "s/^$1=//p" "$ENVF" | tail -n 1 | tr -d '\r'; }

telegram() {
  local token chat
  token=$(env_ertek RIASZTAS_TELEGRAM_TOKEN); chat=$(env_ertek RIASZTAS_TELEGRAM_CHAT)
  [ -n "$token" ] && [ -n "$chat" ] || return 0
  printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$token" \
    | curl -s -o /dev/null -w '%{http_code}' --max-time 10 --config - --data-urlencode "chat_id=$chat" --data-urlencode "text=$1" \
    | grep -q '^200$' && echo "$MOST telegram: elküldve" >> "$NAPLO" || echo "$MOST telegram: NEM ment el" >> "$NAPLO"
}

if [ "${1:-}" = "--proba-uzenet" ]; then
  if [ -n "$(env_ertek RIASZTAS_TELEGRAM_TOKEN)" ] && [ -n "$(env_ertek RIASZTAS_TELEGRAM_CHAT)" ]; then
    telegram "Rögtön: próbaüzenet a szívdobbanástól — ha ezt látod, a riasztás eljut hozzád."; tail -n 1 "$NAPLO"
  else
    echo "a Telegram-riasztás ki van kapcsolva (RIASZTAS_TELEGRAM_TOKEN / RIASZTAS_TELEGRAM_CHAT üres a $ENVF fájlban)"
  fi
  exit 0
fi

# 1. the site
KOD=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$PORT/api/egeszseg" 2>/dev/null) || true
# 2. the egress, through the app's network namespace
WARP=$(docker exec gma-app node -e '
  fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(10000) })
    .then((r) => r.text())
    .then((t) => console.log((t.match(/^warp=(.*)$/m) || [, "nincs"])[1]), () => console.log("zarva"))' 2>/dev/null) || WARP="nem fut"

HIBAK=()
[ "$KOD" = "200" ] || HIBAK+=("a lap nem válaszol (életjel ${KOD:-000})")
case "$WARP" in on|plus) ;; *) HIBAK+=("a kimenő forgalom nem a WARP-on megy (warp=${WARP:-nincs})") ;; esac

if [ "${#HIBAK[@]}" -eq 0 ]; then
  echo "$MOST rendben: életjel 200, warp=$WARP" >> "$NAPLO"
  if [ -f "$HIBA" ]; then
    KEZDET=$(cat "$HIBA")
    echo "$MOST helyreállt (hiba óta: $KEZDET)" >> "$RIASZTAS"
    mv "$HIBA" "$GMA/_torolni/szivdobbanas-hiba-$(date +%Y%m%d-%H%M)"
    telegram "Rögtön: újra rendben (a hiba $KEZDET óta tartott)."
  fi
  exit 0
fi

SOR=$(IFS=';'; echo "${HIBAK[*]}" | sed 's/;/; /g')
echo "$MOST HIBA: $SOR" >> "$RIASZTAS"
echo "$MOST HIBA: $SOR" >> "$NAPLO"
if [ ! -f "$HIBA" ]; then
  echo "$MOST" > "$HIBA"
  telegram "Rögtön hiba: $SOR. Napló: ~/gma/naplo — teendő: uzem/README.md, Runbook."
fi
exit 1
