#!/bin/bash
# Éjszakai mentés: a teljes kód, teljes előzménnyel, EGYETLEN fájlba.
# A Synology Drive magától átviszi a NAS-ra. Az utolsó 7 marad.
#
#   bash ejszakai-mentes.sh          # mentés most
#   bash ejszakai-mentes.sh --proba  # visszaállítási próba a legutolsó fájlból

set -uo pipefail
REPO=${REPO:-$HOME/projektek/saas}
CEL=${CEL:-$HOME/SynologyDrive/SaaS/mentes-kod}
MEGTART=7

mkdir -p "$CEL"
cd "$REPO" || { echo "nincs meg a tároló: $REPO" >&2; exit 1; }

if [ "${1:-}" = "--proba" ]; then
  UTOLSO=$(ls -1t "$CEL"/saas-*.bundle 2>/dev/null | head -1)
  [ -n "$UTOLSO" ] || { echo "nincs mentés a $CEL mappában" >&2; exit 1; }
  PROBA=$(mktemp -d)
  if git clone -q "$UTOLSO" "$PROBA/saas" 2>/dev/null; then
    echo "VISSZAÁLLÍTÁS RENDBEN: $(basename "$UTOLSO")"
    echo "  ágak:   $(git -C "$PROBA/saas" branch -a | wc -l)"
    echo "  utolsó: $(git -C "$PROBA/saas" log --oneline -1)"
    rm -rf "$PROBA"
    exit 0
  fi
  echo "A MENTÉS NEM ÁLLÍTHATÓ VISSZA: $UTOLSO" >&2
  rm -rf "$PROBA"; exit 2
fi

NEV="saas-$(date +%Y%m%d).bundle"
git bundle create "$CEL/.$NEV.reszleges" --all HEAD >/dev/null 2>&1 || { echo "a mentés elhasalt" >&2; exit 1; }
mv "$CEL/.$NEV.reszleges" "$CEL/$NEV"
echo "mentés: $CEL/$NEV ($(du -h "$CEL/$NEV" | cut -f1))"

# a régiek nem törlődnek, hanem a _torolni/ mappába kerülnek
mkdir -p "$CEL/_torolni"
ls -1t "$CEL"/saas-*.bundle 2>/dev/null | tail -n +$((MEGTART+1)) | while read -r r; do
  mv "$r" "$CEL/_torolni/" && echo "régi mentés félretéve: $(basename "$r")"
done
