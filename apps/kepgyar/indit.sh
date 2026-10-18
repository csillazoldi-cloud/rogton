#!/bin/bash
# A képgyártó (újra)építése és indítása a Gigabyte-on: építés + csere + életjel. Csak a Gigabyte-on fut (V-6, a gépnév-őr alább).
# A robot a teljes kirakás 2b. lépésében hívja (nas/teljes-kirakas.sh), `--ha-valtozott` módban — a web-dobozok NAS-ra vitele ELŐTT,
# így az új web sosem kér olyat (pl. R-16 K6 POST /nevlogo), amit a futó képgyártó még nem tud.
#
#   bash apps/kepgyar/indit.sh                  # kézzel: mindig épít és cserél
#   bash apps/kepgyar/indit.sh --ha-valtozott   # csak ha az ujjlenyomat változott (a robot így hívja)
#   bash apps/kepgyar/indit.sh --proba          # csak kiírja, építene-e (a kirakás próbája); semmit nem épít
#   bash apps/kepgyar/indit.sh --ujjlenyomat    # csak az ujjlenyomatot írja ki (bárhol fut, docker nélkül)
#
# Ujjlenyomat (R-16 K6, 2026-09-30): minden, amiből a doboz épül — a Dockerfile COPY sorainak forrásai (a Dockerfile-ból olvasva, így vele
# együtt változik) és maga a Dockerfile — a HEAD-ben rögzített tartalommal (`git ls-tree -r HEAD`), sha256. A doboz LABEL-je viszi
# (km.kepgyar.ujjlenyomat); ha a futó dobozé ugyanaz, nincs építés. Kilépés: 0 kész / változatlan / nem a Gigabyte · 1 az építés vagy
# az életjel elbukott (a napló utolsó 30 sorával).
set -euo pipefail
GYOKER="$(cd "$(dirname "$0")/../.." && pwd)"
MOD="${1:-}"
DOBOZ=km-kepgyar
CIMKE=km.kepgyar.ujjlenyomat

ujjlenyomat() {
  local df="$GYOKER/apps/kepgyar/Dockerfile" utak
  # a COPY sorok forrásai (az utolsó szó a cél); a --from / --chown kapcsolók kimaradnak
  utak=$(awk 'toupper($1)=="COPY"{for(i=2;i<NF;i++) if($i !~ /^--/) print $i}' "$df" | sort -u)
  # shellcheck disable=SC2086 # az utak szándékosan szóra bomlanak (egyik sem tartalmaz szóközt)
  { echo "apps/kepgyar/Dockerfile"; git -C "$GYOKER" ls-tree -r HEAD -- apps/kepgyar/Dockerfile $utak; } | sha256sum | cut -c1-64
}

if [ "$MOD" = "--ujjlenyomat" ]; then ujjlenyomat; exit 0; fi

case "$(hostname)" in *igabyte*) ;; *) echo "A képgyártó csak a Gigabyte-on fut (V-6) — itt kihagyom."; exit 0;; esac
cd "$GYOKER"
UJ=$(ujjlenyomat)
if [ "$MOD" = "--ha-valtozott" ] || [ "$MOD" = "--proba" ]; then
  MOST=$(docker inspect "$DOBOZ" --format "{{ index .Config.Labels \"$CIMKE\" }}" 2>/dev/null || true)
  if [ "$MOST" = "$UJ" ] && [ "$(docker inspect -f '{{.State.Running}}' "$DOBOZ" 2>/dev/null || true)" = "true" ]; then
    echo "képgyártó: változatlan (${UJ:0:8})"; exit 0
  fi
  FUTO=${MOST:-nincs}
  if [ "$MOD" = "--proba" ]; then echo "képgyártó: ÉPÍTENÉ (futó: ${FUTO:0:8}, új: ${UJ:0:8}) — próba, nem épít"; exit 0; fi
fi
echo "képgyártó: építés (${UJ:0:8})"
if ! docker build --provenance=false -q --label "$CIMKE=$UJ" -f apps/kepgyar/Dockerfile -t km-kepgyar:latest . > /tmp/km-kepgyar-epites.log 2>&1; then
  echo "HIBA: a képgyártó doboza nem épült"; tail -30 /tmp/km-kepgyar-epites.log; exit 1
fi
docker rm -f "$DOBOZ" >/dev/null 2>&1 || true
# 1 GB felső korlát, egyszerre egy kép; minden hálózati felületen (LAN + Tailscale), a NAS a LAN-címen éri el
docker run -d --name "$DOBOZ" --restart unless-stopped --memory 1g --init -p 8601:8601 km-kepgyar:latest >/dev/null
for i in $(seq 1 30); do
  if curl -fsS localhost:8601/eletjel >/dev/null 2>&1; then echo "képgyártó: él (localhost:8601, ${UJ:0:8})"; exit 0; fi
  sleep 2
done
echo "HIBA: a képgyártó 60 mp alatt nem válaszolt"; docker logs --tail 30 "$DOBOZ"; exit 1
