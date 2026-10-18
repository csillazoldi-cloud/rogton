#!/bin/bash
# Képernyőkép a tesztoldalról, a Gigabyte-ról.
# A Gigabyte a saját nyilvános címét nem éri el, ezért a böngészőt a NAS-ra irányítjuk.
#
#   bash tools/kepernyokep.sh                      # a nyitólap, 1440x900
#   bash tools/kepernyokep.sh /fiokok              # más oldal
#   bash tools/kepernyokep.sh /fiokok 390 844      # telefonméret
#
# Az eredmény: docs/kepek/<oldal>-<idopont>.png — az útvonalat a végén kiírja.

set -uo pipefail
CIM=saas.mediapartizan.ro
NAS_IP=192.168.1.144
OLDAL="${1:-/}"
SZEL="${2:-1440}"
MAG="${3:-900}"

ITT="$(cd "$(dirname "$0")" && pwd)"
GYOKER="$(cd "$ITT/.." && pwd)"
KEPEK="$GYOKER/docs/kepek"
mkdir -p "$KEPEK"

NEV=$(echo "$OLDAL" | sed 's#^/##; s#/#-#g; s/^$/nyitolap/')
CEL="$KEPEK/${NEV}-$(date +%Y%m%d-%H%M%S).png"

# 1. előbb megnézzük, válaszol-e egyáltalán
KOD=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
      --resolve "$CIM:443:$NAS_IP" "https://$CIM$OLDAL" || echo 000)
echo "$CIM$OLDAL → $KOD"
[ "$KOD" = "200" ] || echo "FIGYELEM: nem 200 a válasz, a kép is ezt fogja mutatni."

# 2. böngésző
BONGESZO=""
for b in chromium chromium-browser google-chrome google-chrome-stable; do
  command -v "$b" >/dev/null 2>&1 && { BONGESZO="$b"; break; }
done
[ -n "$BONGESZO" ] || { echo "Nincs böngésző a gépen (chromium vagy google-chrome kell)." >&2; exit 1; }

"$BONGESZO" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --host-resolver-rules="MAP $CIM $NAS_IP" \
  --window-size="${SZEL},${MAG}" \
  --screenshot="$CEL" \
  "https://$CIM$OLDAL" >/dev/null 2>&1

if [ -s "$CEL" ]; then
  echo "kép: $CEL ($(du -h "$CEL" | cut -f1))"
else
  echo "A kép nem készült el." >&2; exit 2
fi
