#!/bin/bash
# A FORDÍTÓ a Gigabyte gazdagépén. Ezt a fájlt a Claude-hoz tartozó kulcs indítja, és CSAK ezt:
# az authorized_keys `command=` megkötése miatt semmilyen más parancs nem futtatható vele.
#
# D-22 (2026-09-10): minden AI a Dellen, minden fejlesztői munka — köztük a fordítás — a
# Gigabyte-on, a NAS pedig csak futtat.
#
# Műveletek (SSH_ORIGINAL_COMMAND):
#   allapot            — a gép terhelése, szabad helye, Docker-verzió
#   epit <projekt> [hid]  — git pull + fordítás A HÁTTÉRBEN, naplóval (azonnal visszatér)
#   naplo <projekt>    — a fordítás naplójának vége + KESZ:<kod>, ha végzett
#   kuld <projekt>     — a kész doboz(ok) kiküldése; CSAK bináris megy a kimenetre
set -euo pipefail

# Csak ezek a projektek fordíthatók. Új projekt ide kerül, nem parancssorból.
declare -A PROJEKT_UT=( [saas]="$HOME/projektek/saas" )
# A projekthez tartozó képek: "nev|dockerfile|kontextus"
declare -A PROJEKT_KEPEK=(
  [saas]="aitmetica-saas-app:helyi|Dockerfile|.
aitmetica-saas-referencia:helyi|apps/referencia-host/Dockerfile|.
aitmetica-saas-ai-hid:helyi|nas/ai-hid/Dockerfile|nas/ai-hid"
)
# Ezek a képek épülnek alapból (a többi csak külön kérésre — pl. a híd ritkán változik).
declare -A PROJEKT_ALAP=( [saas]="aitmetica-saas-app:helyi aitmetica-saas-referencia:helyi" )

PARANCS=${SSH_ORIGINAL_COMMAND:-}
MUVELET=$(echo "$PARANCS" | awk '{print $1}')
PROJEKT=$(echo "$PARANCS" | awk '{print $2}')
EXTRA=$(echo "$PARANCS" | awk '{print $3}')

if [ "$MUVELET" = "allapot" ] && [ -z "$PROJEKT" ]; then
  echo "gep: $(hostname)"
  uptime
  free -h | sed -n 2p
  df -h / | tail -1
  docker --version
  exit 0
fi

case "$MUVELET" in
  epit|naplo|kuld) : ;;
  *) echo "MEGALLITVA: csak 'allapot', 'epit <projekt> [hid]', 'naplo <projekt>' vagy 'kuld <projekt>'." >&2; exit 2 ;;
esac

UT=${PROJEKT_UT[$PROJEKT]:-}
[ -n "$UT" ] || { echo "MEGALLITVA: ismeretlen projekt: '$PROJEKT'. Engedett: ${!PROJEKT_UT[*]}" >&2; exit 2; }

NAPLO="/tmp/$PROJEKT-epit.log"
CSOMAG="/tmp/$PROJEKT-kepek.tgz"

if [ "$MUVELET" = "naplo" ]; then
  [ -f "$NAPLO" ] || { echo "nincs meg naplo"; exit 0; }
  tail -n 12 "$NAPLO"
  grep -c . "$NAPLO" | sed 's/^/sorok: /'
  grep "KESZ:" "$NAPLO" || echo "MEG FUT"
  exit 0
fi

if [ "$MUVELET" = "kuld" ]; then
  [ -f "$CSOMAG" ] || { echo "MEGALLITVA: nincs kesz csomag ($CSOMAG). Elobb 'epit'." >&2; exit 4; }
  cat "$CSOMAG"          # CSAK a binaris megy ki
  exit 0
fi

# --- epit ---
[ -d "$UT/.git" ] || { echo "MEGALLITVA: nincs repo itt: $UT — egyszer klonozd ide." >&2; exit 3; }

# Mérés: ne induljon fordítás, ha nincs hely vagy a gép már meg van fogva.
SZABAD_GB=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')
TERHELES=$(uptime | sed 's/.*load average: //' | cut -d, -f1 | cut -d. -f1)
if [ "${SZABAD_GB:-0}" -lt 15 ]; then echo "MEGALLITVA: csak ${SZABAD_GB} GB szabad a lemezen." >&2; exit 5; fi
if [ "${TERHELES:-99}" -gt 24 ]; then echo "MEGALLITVA: a gep terhelese ${TERHELES}." >&2; exit 5; fi

EPITENDO="${PROJEKT_ALAP[$PROJEKT]}"
if [ "$EXTRA" = "hid" ]; then EPITENDO="$(echo "${PROJEKT_KEPEK[$PROJEKT]}" | cut -d'|' -f1 | tr '\n' ' ')"; fi

# A hosszú munka a HÁTTÉRBEN fut, naplóval — a hívó azonnal visszakapja a vezérlést.
# 2026-09-11: a blokk `set +e`-vel fut, és a VÉGÉN MINDIG kiír egy KESZ: sort a tényleges kóddal.
# Korábban a `set -e` elbukáskor kilőtte a blokkot, KESZ sor nélkül — kívülről ez örök „MEG FUT"
# volt, és a hívó nem tudta megkülönböztetni a hibát a lassúságtól.
{
  set +e
  HIBA=0
  echo "--- $(date) forditas indul: $EPITENDO ---"
  cd "$UT" || HIBA=1
  if [ $HIBA -eq 0 ]; then git pull --ff-only || HIBA=$?; fi
  if [ $HIBA -eq 0 ]; then
    while IFS='|' read -r kep dfile ktx; do
      [ -n "$kep" ] || continue
      case " $EPITENDO " in *" $kep "*) : ;; *) continue ;; esac
      echo "== $(date +%H:%M:%S) $kep =="
      # A NAS Dockere 24.0.2, ezé a gépé 29.6.1 — a régebbi formátumot kérjük, különben a NAS
      # `docker load`-ja elutasíthatja a csomagot ("unsupported manifest format").
      docker build --provenance=false --sbom=false -t "$kep" -f "$dfile" "$ktx" || { HIBA=$?; break; }
    done <<< "${PROJEKT_KEPEK[$PROJEKT]}"
  fi
  if [ $HIBA -eq 0 ]; then
    echo "== $(date +%H:%M:%S) csomagolas =="
    rm -f "$CSOMAG"
    docker save $EPITENDO | gzip -1 > "$CSOMAG" || HIBA=$?
    [ $HIBA -eq 0 ] && ls -lh "$CSOMAG" | awk '{print "csomag:", $5}'
  fi
  echo "KESZ:$HIBA"
} > "$NAPLO" 2>&1 &
disown

echo "forditas elindult a hatterben. Kovesd: naplo $PROJEKT"
