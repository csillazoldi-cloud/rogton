#!/bin/bash
# shellcheck disable=SC1111,SC2016,SC2034 # a „” magyar idézőjel szándékos; a feltételek az allit() eval-jában bontódnak ki
# Önpróba: tools/gigabyte-robot/uzenet.sh — mi megy a Telegram-csoportba (Csilla, 2026-10-09 07:58).
# Hamis Telegram-API (helyi python http.server), valódi hálózat nélkül. Ellenőrzi:
#   - a helyi fájlba MINDIG bekerül a technikai sor;
#   - kint / piszkos / hiányzó kulcs / ismeretlen kulcs → NINCS Telegram-kérés;
#   - minden más kulcs → pontosan a táblázat szövege megy ki, és abban nincs változat-azonosító, napló-út, technikai szó.
#   bash tools/kapu/onproba/uzenet-onproba.sh [kimeneti mappa]
set -uo pipefail
GYOKER="$(cd "$(dirname "$0")/../../.." && pwd)"
KI=${1:-$(mktemp -d)}; mkdir -p "$KI"
T=$(mktemp -d); JO=0; ROSSZ=0
jo() { echo "  [jó] $1"; JO=$((JO + 1)); }
rossz() { echo "  [ROSSZ] $1"; ROSSZ=$((ROSSZ + 1)); }
allit() { if eval "$1"; then jo "$2"; else rossz "$2  [feltétel: $1]"; fi; }

PORT=$((20000 + RANDOM % 20000))
cat > "$T/api.py" <<'EOF'
import http.server, sys, urllib.parse
naplo = sys.argv[2]
class K(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        h = int(self.headers.get("content-length", 0)); b = urllib.parse.parse_qs(self.rfile.read(h).decode())
        with open(naplo, "a", encoding="utf-8") as f: f.write(self.path + "\t" + b.get("chat_id", [""])[0] + "\t" + b.get("text", [""])[0].replace("\n", "\\n") + "\n")
        self.send_response(200); self.end_headers(); self.wfile.write(b'{"ok":true}')
    def log_message(self, *a): pass
http.server.HTTPServer(("127.0.0.1", int(sys.argv[1])), K).serve_forever()
EOF
: > "$T/keresek.txt"
python3 "$T/api.py" "$PORT" "$T/keresek.txt" & API=$!
trap 'kill $API 2>/dev/null' EXIT
sleep 0.7
printf 'TOKEN=111:proba_token\nCHAT=-5557911968\n' > "$T/telegram"; chmod 600 "$T/telegram"
export ROBOT_ALLAPOT="$T/allapot" UZENET_TELEGRAM="$T/telegram" UZENET_TELEGRAM_API="http://127.0.0.1:$PORT"
U="$GYOKER/tools/gigabyte-robot/uzenet.sh"
TABLA="$GYOKER/tools/gigabyte-robot/uzenet-szovegek.txt"
szoveg() { grep -v '^#' "$TABLA" | sed -n "s/^$1|//p" | tail -1; }
ker() { wc -l < "$T/keresek.txt" | tr -d ' '; }
ID=abcdef123456

echo "== csend: ezek NEM mennek a csoportba =="
for k in kint piszkos "" ismeretlen_kulcs; do
  e=$(ker); bash "$U" "Kint van" "$ID — c1+c7 HANDOFF top entry (4 perc)." "$k"
  allit '[ "$(ker)" = "$e" ]' "kulcs „${k:-nincs}” → nincs Telegram-kérés"
done
allit '[ "$(grep -c "$ID" "$T/allapot/uzenetek.txt")" = 4 ]' "a helyi fájlban mind a 4 technikai sor megvan"

echo "== emberi mondat: pontosan a táblázat szövege megy ki =="
for k in nem_kerult_ki elakadt visszaallt felresiklott nem_mukodik nem_stimmel napi_baj proba; do
  e=$(ker); bash "$U" "Technikai cím" "$ID — migráció, kapu, NAS, /home/gigabyte/.local/state/x.log" "$k"
  utolso=$(tail -1 "$T/keresek.txt")
  allit '[ "$(ker)" = "$((e + 1))" ] && [ "$(printf "%s" "$utolso" | cut -f3)" = "$(szoveg "$k")" ]' "$k → egy kérés, a táblázat szövegével"
  allit '! printf "%s" "$utolso" | cut -f3 | grep -qiE "$ID|migr|kapu|robot|nas|sha|/home|\.log"' "$k → nincs benne azonosító, út vagy technikai szó"
  allit 'printf "%s" "$utolso" | cut -f2 | grep -qx -- "-5557911968" && printf "%s" "$utolso" | cut -f1 | grep -q "^/bot111:proba_token/sendMessage$"' "$k → a csoportnak, a bot címére"
done
allit '! grep -q "nem ment ki" "$T/allapot/uzenetek.txt"' "egyik küldés sem bukott el"

echo "== a táblázat: minden kulcs, amit a hívók használnak, benne van =="
for k in $(grep -ohE '(szolj "[^"]*" "[^"]*" [a-z_]+|napi_baj|" proba)' "$GYOKER/tools/gigabyte-robot/robot.sh" "$GYOKER/tools/gigabyte-robot/robot-regi.sh" "$GYOKER/tools/gigabyte-robot/szivdobbanas.sh" "$GYOKER/tools/titok/telegram-telepit.sh" | awk '{print $NF}' | sort -u); do
  allit 'grep -q "^$k|" "$TABLA"' "kulcs a táblázatban: $k"
done

cp "$T/keresek.txt" "$KI/telegram-keresek.txt"; cp "$T/allapot/uzenetek.txt" "$KI/uzenetek.txt"
echo "uzenet-onproba: $JO jó, $ROSSZ rossz"
[ "$ROSSZ" = 0 ]
