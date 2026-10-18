#!/bin/bash
# Rögtön — off-box copy of the nightly backups. Runs on Csilla's MAC (macOS bash 3.2 + BSD tools — keep it that simple).
# Pulls ~/gma/mentes/napi/*.age from the Gigabyte (ssh alias `gma`) to ~/saas/mentes/rogton/, keeps the newest 30 there
# (older → ~/saas/mentes/rogton/_torolni/, never deleted), then test-decrypts the newest one with the private key from the vault:
# that proves the Gigabyte encrypts to the RIGHT key — a backup nobody can open is not a backup.
# Why pull and not push: docs/decisions/2026-10-18-g8-mentes.md (the office NAS is inside the fence's blocked range, and
# gyorsadmin holds no credentials for anything off the box).
#
#   bash ~/saas/rogton-uzem/mentes-lehuz.sh        (a copy of this file; or straight from a clone of the repo)
#
# Environment (all optional): MENTES_CEL (target folder), MENTES_TITKOS_KULCS (default ~/saas/vault/rogton-mentes-kulcs),
#                             MENTES_GAZDA (ssh alias, default gma), MENTES_MEGORZES (default 30)
# Exit codes: 0 done · 2 no connection / no list · 3 a copy came over with the wrong size · 4 the newest does not decrypt
set -u
umask 077

CEL=${MENTES_CEL:-$HOME/saas/mentes/rogton}
KULCS=${MENTES_TITKOS_KULCS:-$HOME/saas/vault/rogton-mentes-kulcs}
GAZDA=${MENTES_GAZDA:-gma}
MEGORZES=${MENTES_MEGORZES:-30}
mkdir -p "$CEL/_torolni" || exit 2
chmod 700 "$CEL"

meret() { wc -c < "$1" | tr -d ' '; }

LISTA=$(ssh -n -o BatchMode=yes "$GAZDA" 'cd ~/gma/mentes/napi 2>/dev/null && for f in *.age; do [ -f "$f" ] && echo "$f $(stat -c %s "$f")"; done') \
  || { echo "MEGÁLL: nincs kapcsolat a(z) $GAZDA géppel, vagy nincs mentés-mappa"; exit 2; }
[ -n "$LISTA" ] || { echo "MEGÁLL: a(z) $GAZDA gépen még nincs mentés"; exit 2; }

UJ=0
while read -r f m; do
  [ -n "$f" ] || continue
  if [ -f "$CEL/$f" ] && [ "$(meret "$CEL/$f")" = "$m" ]; then continue; fi
  scp -q -o BatchMode=yes "$GAZDA:gma/mentes/napi/$f" "$CEL/$f.resz" < /dev/null || { echo "MEGÁLL: nem jött át: $f"; exit 3; }
  [ "$(meret "$CEL/$f.resz")" = "$m" ] || { mv "$CEL/$f.resz" "$CEL/_torolni/$f.rossz-meret"; echo "MEGÁLL: rossz méret: $f"; exit 3; }
  mv "$CEL/$f.resz" "$CEL/$f"; UJ=$((UJ + 1)); echo "lehúzva: $f ($m bájt)"
done <<EOF
$LISTA
EOF

# retention: the newest $MEGORZES stay (names are <YYYYMMDD-HHMM>.age, so the name order is the time order)
OSSZES=$(ls -1 "$CEL"/*.age 2>/dev/null | wc -l | tr -d ' ')
if [ "$OSSZES" -gt "$MEGORZES" ]; then
  ls -1 "$CEL"/*.age | sort | head -n $((OSSZES - MEGORZES)) | while read -r regi; do
    mv "$regi" "$CEL/_torolni/" && echo "régi mentés → _torolni/: $(basename "$regi")"
  done
fi

LEGUJABB=$(ls -1 "$CEL"/*.age | sort | tail -n 1)
if [ -f "$KULCS" ] && command -v age >/dev/null; then
  TARTALOM=$(age -d -i "$KULCS" "$LEGUJABB" | tar -tf - 2>/dev/null | tr '\n' ' ')
  case "$TARTALOM" in
    *MANIFEST*km.dump*fajlok-album.tar*) echo "próba-visszafejtés: rendben ($(basename "$LEGUJABB"): $TARTALOM)" ;;
    *) echo "MEGÁLL: a legújabb mentés NEM fejthető vissza ezzel a kulccsal: $KULCS"; exit 4 ;;
  esac
else
  echo "próba-visszafejtés kihagyva (nincs $KULCS vagy nincs age — brew install age)"
fi
echo "mentések a Macen: $(ls -1 "$CEL"/*.age | wc -l | tr -d ' ') db, ebből új: $UJ · legújabb: $(basename "$LEGUJABB")"
