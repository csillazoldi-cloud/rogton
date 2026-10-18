#!/bin/bash
# G6 — the host fence for the gma docker networks (the ONE root script of G6). Installed as /usr/local/sbin/gma-kerites.sh and run
# by the root unit uzem/systemd/gma-kerites.service at boot and whenever docker.service restarts.
#
#   gma-kerites.sh            apply (idempotent: rebuilds its own chain, keeps exactly one jump from DOCKER-USER)
#   gma-kerites.sh --torol    remove everything it added
#   gma-kerites.sh --mutat    print the chain with packet counters
#
# What it does: packets FORWARDED from the gma networks (gma-belso, gma-kimeno) may not reach the office LAN, Tailscale or any
# other docker network on this host — only their own subnets and the internet. And the gma containers may not open connections
# to the HOST itself (its LAN / Tailscale addresses and the other projects' ports — that is INPUT, which DOCKER-USER never sees). Everything else on the host is untouched:
# the rules live in our own chain GMA-KERITES, entered from DOCKER-USER (Docker never flushes DOCKER-USER), and match only
# source addresses inside the gma subnets.
set -euo pipefail
LANC=GMA-KERITES
BE=GMA-KERITES-BE
HALOZATOK=(gma-belso gma-kimeno)
# forbidden destinations (rule comments say why)
TILTOTT=(
  "192.168.1.0/24"   # the office LAN (NAS, Dell, printers, the router's admin page)
  "100.64.0.0/10"    # Tailscale (the tailnet: NAS, Dell, Macs)
  "172.16.0.0/12"    # every other docker network on this host (other projects); the gma subnets are allowed above this rule
)

[ "$(id -u)" = "0" ] || { echo "root kell (sudo)"; exit 2; }
command -v iptables >/dev/null || { echo "nincs iptables"; exit 2; }

torol() {
  while iptables -C DOCKER-USER -j "$LANC" 2>/dev/null; do iptables -D DOCKER-USER -j "$LANC"; done
  iptables -F "$LANC" 2>/dev/null || true
  iptables -X "$LANC" 2>/dev/null || true
  while iptables -C INPUT -j "$BE" 2>/dev/null; do iptables -D INPUT -j "$BE"; done
  iptables -F "$BE" 2>/dev/null || true
  iptables -X "$BE" 2>/dev/null || true
  echo "gma-kerites: eltávolítva"
}

case "${1:-}" in
  --torol) torol; exit 0 ;;
  --mutat) iptables -L "$LANC" -n -v --line-numbers; iptables -L "$BE" -n -v --line-numbers; exit 0 ;;
  "") ;;
  *) echo "használat: gma-kerites.sh [--torol|--mutat]"; exit 2 ;;
esac

# the gma subnets as Docker assigned them (read live, so a re-created network needs no edit here)
ALHALOK=()
for h in "${HALOZATOK[@]}"; do
  s=$(docker network inspect "$h" -f '{{range .IPAM.Config}}{{.Subnet}} {{end}}' 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9.]+/[0-9]+$' || true)
  [ -n "$s" ] || { echo "MEGÁLL: nincs $h hálózat (előbb a gma stacknek futnia kell)"; exit 3; }
  while read -r x; do ALHALOK+=("$x"); done <<< "$s"
done

iptables -N "$LANC" 2>/dev/null || true
iptables -F "$LANC"
# 1. replies to connections that are already allowed — never break them
iptables -A "$LANC" -m conntrack --ctstate ESTABLISHED,RELATED -m comment --comment "gma: valaszok" -j RETURN
for src in "${ALHALOK[@]}"; do
  # 2. gma → gma: the stack's own networks talk freely (db, kepgyar, web, egress, tunnel)
  for dst in "${ALHALOK[@]}"; do
    iptables -A "$LANC" -s "$src" -d "$dst" -m comment --comment "gma: sajat halozat" -j RETURN
  done
  # 3. gma → LAN / Tailscale / other docker networks: dropped
  for dst in "${TILTOTT[@]}"; do
    dst=${dst%%#*}; dst=${dst// /}
    iptables -A "$LANC" -s "$src" -d "$dst" -m comment --comment "gma: tiltott $dst" -j DROP
  done
done
# 4. everything else goes back to Docker's own rules (internet allowed for gma-kimeno; gma-belso has no gateway anyway)
iptables -A "$LANC" -j RETURN
# exactly one jump, at the top of DOCKER-USER
iptables -C DOCKER-USER -j "$LANC" 2>/dev/null || iptables -I DOCKER-USER 1 -j "$LANC"

# 5. gma containers → the host itself (INPUT): nothing. Replies (e.g. to the published 127.0.0.1:8410) stay allowed. Docker's DNS
#    for the containers runs inside their own namespace (127.0.0.11), so it does not need the host.
iptables -N "$BE" 2>/dev/null || true
iptables -F "$BE"
iptables -A "$BE" -m conntrack --ctstate ESTABLISHED,RELATED -m comment --comment "gma: valaszok" -j RETURN
for src in "${ALHALOK[@]}"; do
  iptables -A "$BE" -s "$src" -m comment --comment "gma: a gep maga tiltott" -j DROP
done
iptables -C INPUT -j "$BE" 2>/dev/null || iptables -I INPUT 1 -j "$BE"
echo "gma-kerites: kész — alhálók: ${ALHALOK[*]}"
