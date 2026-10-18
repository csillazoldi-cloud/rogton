#!/bin/bash
# A tárhely TÜKRE a Synology Drive-ba (D-F28, 2026-09-12): a Gigabyte másolatának munkafáját (a .git, a node_modules, a vault és az
# eldobott holmi NÉLKÜL) a ~/SynologyDrive/SaaS/tarhely/ mappába másolja — a Synology Drive innen viszi ki Vilmos minden gépére.
# A tükör CSAK OLVASNI való: amit Vilmos ad, az a ~/SynologyDrive/SaaS/be/ mappába megy (a „bejövő"), onnan Claude teszi a tárhelyre.
# A robot minden zöld kirakás után hívja (robot.sh); kézzel: bash tools/gigabyte-robot/tukor.sh
set -uo pipefail
REPO=${REPO:-/home/gigabyte/projektek/saas}
DRIVE=${DRIVE:-$HOME/SynologyDrive/SaaS}
CEL="$DRIVE/tarhely"; BE="$DRIVE/be"
mkdir -p "$CEL" "$BE"

rsync -a --delete --delete-excluded \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude 'vault' --exclude '_torolni' \
  --exclude '.agens-ki' --exclude 'Claude outputs' --exclude 'forras' --exclude 'kimenet' --exclude 'naplo' --exclude '*.tsbuildinfo' --exclude 'docs/robot-naplo.jsonl' --exclude 'docs/kepek' \
  "$REPO/" "$CEL/" || { echo "tükör: az rsync hibázott ($?)"; exit 1; }

VALTOZAT=$(git -C "$REPO" log -1 --pretty='%h · %cI · %s' 2>/dev/null)
cat > "$CEL/OLVASS-EL-TUKOR.md" <<EOF
# Ez a tárhely tükre — csak olvasni

Ezt a mappát a Gigabyte robotja írja minden sikeres kirakás után a GitHub főágából (a \`.git\`, a \`node_modules\` és a \`vault\` nélkül).
**Amit ide írsz, a következő kirakás felülírja.** Ami tőled jön (rajzcsomag, zip, doksi), azt a mellette lévő \`be/\` mappába tedd —
onnan Claude teszi a tárhelyre.

Utolsó tükrözés: $(date '+%Y-%m-%d %H:%M %Z')
Változat: $VALTOZAT
EOF
[ -f "$BE/OLVASS-EL.md" ] || cat > "$BE/OLVASS-EL.md" <<'EOF'
# Bejövő — ide tedd, amit Claude-nak adsz

Rajzcsomagok, zipek, doksik, képek. Claude a Gigabyte-ról olvassa ezt a mappát, és ő teszi a tárhelyre (GitHub), ahonnan a
`tarhely/` tükörbe visszajön. Amit már feldolgozott, azt átteszi a `be/_feldolgozva/` mappába — így látod, mi ment át.
EOF
echo "tükör: $CEL ← $VALTOZAT"
