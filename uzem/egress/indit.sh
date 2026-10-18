#!/bin/bash
# G6: the gma-egress container's entrypoint wrapper (bind-mounted read-only at /gma). Runs as the image's `warp` user, which has
# passwordless sudo in caomingjun/warp.
#   1. load the kill-switch (kerites-belul.nft) BEFORE WARP starts — so there is no moment without it;
#   2. in the background, once the daemon answers, switch WARP to tunnel_only: the tunnel carries the traffic, but WARP does not
#      take over DNS — the app keeps Docker's resolver (127.0.0.11), which is how it finds `db` and `kepgyar`;
#   3. hand over to the image's own entrypoint (registers a free consumer WARP account on first start, connects, starts GOST).
set -euo pipefail
sudo nft -f /gma/kerites-belul.nft
echo "gma-egress: kill-switch betöltve ($(sudo nft list table inet gma_kill | grep -c accept) engedő szabály)"
(
  for _ in $(seq 1 90); do
    if warp-cli --accept-tos mode tunnel_only >/dev/null 2>&1; then echo "gma-egress: WARP mód: tunnel_only"; exit 0; fi
    sleep 2
  done
  echo "gma-egress: FIGYELEM — a tunnel_only mód nem állt be (a DNS-t a G6 próba nézi)"
) &
exec /entrypoint.sh
