#!/bin/bash
# Egyetlen belepesi pont a NAS-hoz. A korlatok itt vannak beepitve,
# hogy ne Claude figyelmen muljanak.
#
#  - kemeny idokorlat: 60 masodperc, utana a parancs meghal
#  - legalacsonyabb elsobbseg processzorra (nice 19) es lemezre (ionice 3)
#  - tiltolista: ami az egesz lemezt vagy az osszes kontenert vegigmeri
#
# Kapcsolok (kornyezeti valtozok):
#  NAS_TIMEOUT=90        mas idokorlat masodpercben (csak indokolt esetben)
#  NAS_SUDO=1            a parancs rendszergazdakent fut (docker-hez kell a NAS-on);
#                        a jelszo a vaultbol megy, a csatornan at, sehol nem irodik ki
#  NAS_STDIN_FILE=/x.tgz ez a fajl megy a parancs bemenetere (fajlatvitelhez)
#
LIMIT=${NAS_TIMEOUT:-60}
CMD="$1"
ITT="$(cd "$(dirname "$0")" && pwd)"
KERDES="$ITT/jelszo-kerdes.py"
PY=python3; for c in python3 python; do "$c" -c 1 >/dev/null 2>&1 && { PY=$c; break; }; done   # Windowson a python3 nev csak egy aruhazi csonk
# Windowson az ssh nem tud .py-t inditani askpass-kent: egy .cmd burok kell (a tarhelyben: jelszo-kerdes.cmd)
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) ASKPASS="$(cygpath -w "$ITT/jelszo-kerdes.cmd")"; ITT_PY="$(cygpath -m "$ITT")";; *) ASKPASS="$KERDES"; ITT_PY="$ITT";; esac

TILTOTT='docker system df|docker system prune|du -sh /volume|du -s /volume|find /volume[12] |find / |updatedb|btrfs filesystem du|docker image prune|docker builder prune'
if echo "$CMD" | grep -Eq "$TILTOTT"; then
  echo "MEGALLITVA: ez a parancs az egesz lemezt vagy az osszes dobozt vegigmerne."
  echo "A 2026-09-06-i eset utan ez tiltott. Kerdezd meg Portikot, vagy hagyd ki az adatot."
  exit 3
fi

U=$($PY -c "
import io,os,sys
p=''
for h in ('$ITT_PY/../vault','~/SynologyDrive/SaaS/vault','~/mnt/SaaS/vault'):
    q=os.path.expanduser(h+'/nas-belepes.txt')
    if os.path.isfile(q): p=q; break
if not p: sys.stderr.write('Nincs vault (nas-belepes.txt)\n'); sys.exit(1)
[print(l.split(':',1)[1].strip()) for l in io.open(p,encoding='utf-8-sig') if l.lower().startswith('felhasznalo')]")
[ -n "$U" ] || { echo "MEGALLITVA: nincs NAS-belepes a vaultban."; exit 2; }

TAVOLI="export PATH=/usr/local/bin:\$PATH; IO=; command -v ionice >/dev/null 2>&1 && IO='ionice -c 3'; timeout ${LIMIT}s nice -n 19 \$IO bash -c $(printf '%q' "$CMD")"
if [ -n "$NAS_SUDO" ]; then
  # a jelszo az elso sor a bemeneten, utana (ha van) a NAS_STDIN_FILE tartalma
  TAVOLI="sudo -S -p '' -- bash -c $(printf '%q' "$TAVOLI")"
  BEMENET() { $PY "$KERDES"; [ -n "$NAS_STDIN_FILE" ] && cat "$NAS_STDIN_FILE"; }
else
  BEMENET() { if [ -n "$NAS_STDIN_FILE" ]; then cat "$NAS_STDIN_FILE"; else :; fi; }
fi

SETSID=""; command -v setsid >/dev/null 2>&1 && SETSID="setsid -w"   # Windowson nincs setsid; ott az OpenSSH az ASKPASS_REQUIRE=force miatt kerdez
BEMENET | SSH_ASKPASS="$ASKPASS" SSH_ASKPASS_REQUIRE=force $SETSID \
  ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$U@100.89.241.71" \
  "$TAVOLI" 2>&1 | sed "s/$U/<felhasznalo>/g"
