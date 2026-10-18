#!/bin/bash
# Sikeres kirakás után egy „Kint: <sha> — <tárgy>” sor az ÉLŐ állapotlapra (Csilla 2026-10-11; docs/ALLAPOT-SZABALY.md 4.4).
#
#   bash kint-sor.sh <sha>               # sikeres kirakás után: új sor (ha még nincs) + összeolvasztás
#   bash kint-sor.sh --csak-olvaszt      # sikertelen kirakás után: NEM ad sort, csak visszaolvasztja a robot meglévő sorait
#                                        # (a kirakás a nas/public másolásánál már felülírta a lapot a tárhely fájljával)
#
# A robot hívja, a „Kint van” után (kapu zöld + dobozok fent + az oldal válaszol + a visszaolvasás egyezik). Sorrend:
#   1. a sor a robot saját történetébe ($ALLAPOT/kint-sorok.jsonl, a legutóbbi 30) — ugyanarra a változatra csak egyszer;
#   2. a NAS-ról beolvassa a public/allapot/allapot.json-t (a kirakás épp most másolta ki a tárhelyből — a robot sorai nincsenek benne);
#   3. kint-sor.py (Python: a Gigabyte gazdagépén nincs node): beleolvasztja a történetet (időrendben, ismétlés nélkül), frissitve = most (Bukarest), sémát ellenőriz;
#   4. vissza a NAS-ra atomian (ideiglenes fájl + mv).
# A tárhely fájljához NEM nyúl (a robot nem véglegesít). Bármi hiba → egy naplósor helyben, és 0-val kilép: a kirakást nem buktatja.
set -uo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"
REPO=${REPO:-$HOME/projektek/saas}
ALLAPOT=${ROBOT_ALLAPOT:-$HOME/.local/state/gigabyte-robot}
NAPLO=${ROBOT_NAPLO:-$REPO/docs/robot-naplo.jsonl}
NAS=${KINT_NAS_PARANCS:-bash $REPO/nas/nas-parancs.sh}
TAVOLI=${KINT_TAVOLI:-/volume2/docker/aitmetica-saas}
TORTENET="$ALLAPOT/kint-sorok.jsonl"
SHA=${1:-}; CSAK_OLVASZT=""
[ "$SHA" = "--csak-olvaszt" ] && { CSAK_OLVASZT=1; SHA=""; }
mkdir -p "$ALLAPOT"; touch "$TORTENET"

naplo() { printf '{"mikor":"%s","esemeny":"allapotlap","eredmeny":"%s","valtozat":"%s","uzenet":"%s"}\n' "$(date -Is)" "$1" "${SHA:0:12}" "$(echo "$2" | tr -d '"\\' | tr '\n' ' ')" >> "$NAPLO"; }
[ -n "$SHA" ] || [ -n "$CSAK_OLVASZT" ] || { naplo hiba "nincs változat megadva"; exit 0; }
IDO=$(TZ=Europe/Bucharest date "+%m-%d %H:%M")
FRISS=$(TZ=Europe/Bucharest date "+%Y-%m-%dT%H:%M%:z")

if [ -z "$CSAK_OLVASZT" ]; then
ROVID=$(git -C "$REPO" rev-parse --short=7 "$SHA" 2>/dev/null || echo "${SHA:0:7}")
TARGY=$(git -C "$REPO" log -1 --pretty=%s "$SHA" 2>/dev/null || echo "")
[ ${#TARGY} -gt 100 ] && TARGY="${TARGY:0:99}…"
# 1. történet: egy változat, egy sor (újrakirakásnál nincs új sor)
if ! grep -q "\"sha\":\"$SHA\"" "$TORTENET"; then
  python3 "$ITT/kint-sor.py" --sor "$SHA" "$IDO" "Kint: $ROVID — $TARGY" >> "$TORTENET"
  tail -n 30 "$TORTENET" > "$TORTENET.uj" && mv "$TORTENET.uj" "$TORTENET"
fi
fi
[ -s "$TORTENET" ] || exit 0   # nincs mit visszaolvasztani

# 2–4. NAS: olvas → összeolvaszt → atomi visszaírás
MUNKA=$(mktemp -d) || { naplo hiba "nincs ideiglenes mappa"; exit 0; }
trap 'rm -rf "$MUNKA"' EXIT
# Olvasás TISZTA elválasztással (javítás 10-11, mérve a Gigabyte-on): a nas-parancs.sh a NAS stderr-jét a kimenetbe keveri (2>&1) —
# minden kapcsolat elé ott a 3 soros „** WARNING: connection is not using a post-quantum key exchange algorithm” —, ezért a fájl
# base64-ben, jelölők közé zárva jön, mellette a sha256-a; helyben csak a jelölők közti sort dekódoljuk, és ellenőrizzük a lenyomatot.
# (A nas-parancs.sh-hoz nem nyúlunk: a többi hívója — kirak-sha.sh „átment” sorai — az összefésült kimenetre épít.)
F="$TAVOLI/public/allapot/allapot.json"
NAS_SUDO=1 $NAS "echo KINT-ELEJE; base64 $F | tr -d '\\n'; echo; sha256sum $F | cut -d' ' -f1; echo KINT-VEGE" > "$MUNKA/nyers" 2> "$MUNKA/hiba"
B64=$(awk '/^KINT-ELEJE$/{f=1;n=0;next} /^KINT-VEGE$/{f=0} f{n++; if(n==1) print}' "$MUNKA/nyers")
LENYOMAT=$(awk '/^KINT-ELEJE$/{f=1;n=0;next} /^KINT-VEGE$/{f=0} f{n++; if(n==2) print}' "$MUNKA/nyers")
if [ -z "$B64" ] || [ -z "$LENYOMAT" ]; then
  naplo hiba "a NAS-ról nem jött olvasható állapotlap (üres vagy jelölő nélküli válasz): $(grep -v '^\*\*' "$MUNKA/nyers" "$MUNKA/hiba" 2>/dev/null | tail -c 300)"; exit 0
fi
if ! printf '%s' "$B64" | base64 -d > "$MUNKA/nas.json" 2>/dev/null || [ "$(sha256sum "$MUNKA/nas.json" | cut -d' ' -f1)" != "$LENYOMAT" ]; then
  naplo hiba "a NAS-ról olvasott állapotlap sérült (a base64 vagy a lenyomat nem stimmel) — nem írtam"; exit 0
fi
if ! python3 "$ITT/kint-sor.py" "$MUNKA/nas.json" "$TORTENET" "$FRISS" > "$MUNKA/uj.json" 2> "$MUNKA/hiba"; then
  naplo hiba "nem írtam az állapotlapra: $(tail -c 300 "$MUNKA/hiba")"; exit 0
fi
if NAS_SUDO=1 NAS_STDIN_FILE="$MUNKA/uj.json" $NAS "cat > $TAVOLI/public/allapot/allapot.json.robot-uj && mv $TAVOLI/public/allapot/allapot.json.robot-uj $TAVOLI/public/allapot/allapot.json && echo 'allapotlap: átment'" > "$MUNKA/ki" 2> "$MUNKA/hiba" \
   && grep -q "átment" "$MUNKA/ki"; then
  naplo zold "${CSAK_OLVASZT:+a robot sorai visszaolvasztva}${CSAK_OLVASZT:-Kint: $ROVID — a sor az élő állapotlapon}"
else
  naplo hiba "a visszaírás nem sikerült: $(tail -c 300 "$MUNKA/hiba")"
fi
exit 0
