#!/bin/bash
# Az állapotlap (nas/public/allapot/) kirakása a NAS-ra, a robot és a teljes kirakás NÉLKÜL — ha csak a lap adata változott,
# vagy a Gigabyte robotja nem fut. Az nginx a $TAVOLI/public mappából adja a lapot (kirak.sh 1b lépés). Kis fájlok, másodpercek.
set -euo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"; NAS="bash $ITT/nas-parancs.sh"; TAVOLI=/volume2/docker/aitmetica-saas
for f in allapot.json index.html; do
  NAS_STDIN_FILE="$ITT/public/allapot/$f" NAS_SUDO=1 $NAS "mkdir -p $TAVOLI/public/allapot && cat > $TAVOLI/public/allapot/$f && echo 'allapot/$f: átment'"
done
