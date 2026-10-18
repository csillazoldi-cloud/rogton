#!/bin/bash
# c4 kapu — EGYETLEN változat ellenőrzése a Gigabyte-on, mielőtt bármi a NAS-hoz érne (docs/plans/c4-vedett-main.md §4.2).
#
#   bash tools/kapu/kapu.sh <sha>
#
# Sorrend: tiszta munkafa a megadott változaton → pnpm install --frozen-lockfile → az `ellenoriz` lánc tagjai EGYENKÉNT
# (a határőr sértései soronként) → (docker módban) a képek építése <sha12> címkével → eldobható próbakörnyezet (Postgres 18,
# minden migráció a nulláról, az alkalmazás) → minden csomag próbái → lebontás → összevetés a tools/kapu/ismert-bukasok.json-nal.
#
# Kilépés: 0 = mehet (zöld, vagy nem rosszabb az alapvonalnál) · 1 = PIROS (a kódban van a baj) · 2 = a gépezet akadt el (újrapróbálható)
# Eredmény: $KAPU_GYOKER/futasok/<idő>-<sha12>/ — dontes.json, uzenet.txt (egy magyar mondat), naplók, próba-kimenetek.
#
# A NAS-hoz, a Dellhez, a GitHubon kívül semmihez nem nyúl; AI-modellt nem futtat (az alkalmazás a teszt AI-szolgáltatóval megy).
#
# Beállítások (környezeti változók):
#   REPO           a robot másolata (alap: ~/projektek/saas) — innen jön a változat
#   KAPU_GYOKER    a kapu munkamappája (alap: ~/saas-kapu) — munkafa, futások, _torolni
#   KAPU_MOD       docker (alap, a Gigabyte) | helyi (docker-képek nélkül; PG_BIN kell, lásd proba-kornyezet.sh)
#   KAPU_FUTTATO   docker (node:24-alpine dobozban fut a pnpm — a Gigabyte gazdagépén nincs node) | helyi (a PATH-on lévő node 24 + pnpm)
#   KAPU_PROBA_IDO egy csomag próbáinak időkorlátja másodpercben (alap 1500)
set -uo pipefail

SHA_KERT=${1:-}
[ -n "$SHA_KERT" ] || { echo "használat: kapu.sh <sha>" >&2; exit 2; }
ESZKOZ="$(cd "$(dirname "$0")" && pwd)"            # a kapu SAJÁT eszközei: a robot (utoljára kirakott) változatából — a vizsgált változat nem gyengítheti a saját kapuját
REPO=${REPO:-$HOME/projektek/saas}
KAPU_GYOKER=${KAPU_GYOKER:-$HOME/saas-kapu}
MOD=${KAPU_MOD:-docker}
PROBA_IDO=${KAPU_PROBA_IDO:-1500}
if [ -z "${KAPU_FUTTATO:-}" ]; then
  if command -v pnpm >/dev/null 2>&1 && node -e 'process.exit(+process.versions.node.split(".")[0] >= 24 ? 0 : 1)' 2>/dev/null; then KAPU_FUTTATO=helyi; else KAPU_FUTTATO=docker; fi
fi

SHA=$(git -C "$REPO" rev-parse --verify -q "$SHA_KERT^{commit}") || { git -C "$REPO" fetch -q origin "$SHA_KERT" 2>/dev/null; SHA=$(git -C "$REPO" rev-parse --verify -q "$SHA_KERT^{commit}"); } \
  || { echo "KAPU: infra — nincs ilyen változat: $SHA_KERT"; exit 2; }
ID=${SHA:0:12}
W="$KAPU_GYOKER/munkafa"
FUTAS="$KAPU_GYOKER/futasok/$(date +%Y%m%d-%H%M%S)-$ID"
mkdir -p "$FUTAS/probak" "$KAPU_GYOKER/_torolni"
ELL="$FUTAS/ellenoriz.tsv"; : > "$ELL"
IDOK="$FUTAS/idok.txt"; : > "$IDOK"
KEZD=$(date +%s)

# --- egyszerre egy: ugyanaz a zár, mint a robotté és a teljes-kirakas.sh-é --------------------------------------------
if [ -z "${KAPU_ZAR_MIENK:-}" ]; then
  ZAR="${ROBOT_ALLAPOT:-$HOME/.local/state/gigabyte-robot}/zar"; mkdir -p "$(dirname "$ZAR")"
  exec 9>"$ZAR"; flock -w 60 9 || { echo "KAPU: infra — most épp fut egy másik kör"; exit 2; }
fi

szakasz() { echo; echo "=== $* ==="; echo "$(( $(date +%s) - KEZD ))s $*" >> "$IDOK"; }
vege() { # vege <kód> <döntés> <mondat>
  echo "$3" > "$FUTAS/uzenet.txt"
  echo "$(( $(date +%s) - KEZD ))s vége: $2" >> "$IDOK"
  echo "KAPU: $2 — $3"; echo "futás: $FUTAS"
  exit "$1"
}

# futtat <mappa> <parancs> [env-fájl] — node/pnpm parancs a munkafában
futtat() {
  local dir=$1 cmd=$2 envf=${3:-}
  if [ "$KAPU_FUTTATO" = "helyi" ]; then
    # shellcheck disable=SC1090 # a próbakörnyezet fájlja futásonként más
    ( cd "$dir" || exit 2; if [ -n "$envf" ]; then set -a; . "$envf"; set +a; fi; bash -c "$cmd" )
  else
    local ef=(); [ -n "$envf" ] && ef=(--env-file "$envf")
    mkdir -p "$HOME/.saas-pnpm-tar"
    docker run --rm -i --network host -v "$W:$W" -v "$FUTAS:$FUTAS" -v "$ESZKOZ:$ESZKOZ:ro" -v "$HOME/.saas-pnpm-tar:/pnpm-tar" \
      -w "$dir" -e PNPM_HOME=/pnpm -e npm_config_store_dir=/pnpm-tar -e CI=1 -e HOME=/tmp --user "$(id -u):$(id -g)" "${ef[@]}" \
      "${KAPU_NODE_KEP:-node:24-alpine}" sh -c 'export COREPACK_HOME=/tmp/corepack PATH=/tmp/corepack-bin:$PATH; mkdir -p /tmp/corepack-bin; corepack enable --install-directory /tmp/corepack-bin >/dev/null 2>&1; sh -c "$1"' sh "$cmd"
  fi
}

# --- 1. tiszta munkafa a változaton ------------------------------------------------------------------------------------
szakasz "1. munkafa: $ID"
if [ ! -e "$W/.git" ]; then
  git -C "$REPO" worktree add -q --detach "$W" "$SHA" || vege 2 infra "A munkafát nem tudtam létrehozni."
else
  git -C "$W" checkout -q --force --detach "$SHA" || vege 2 infra "A munkafát nem tudtam a változatra állítani."
  # nem törlünk: ami a munkafában gazdátlanul (nem a git-é, nem kihagyott) maradt, félrekerül
  mapfile -t ARVAK < <(git -C "$W" ls-files --others --exclude-standard)
  if [ "${#ARVAK[@]}" -gt 0 ]; then
    T="$KAPU_GYOKER/_torolni/munkafa-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$T"
    ( cd "$W" && printf '%s\0' "${ARVAK[@]}" | xargs -0 -I{} sh -c 'mkdir -p "$1/$(dirname "$2")" && mv "$2" "$1/$2"' sh "$T" {} )
    echo "gazdátlan fájlok félretéve: ${#ARVAK[@]} → $T"
  fi
fi
[ "$(git -C "$W" rev-parse HEAD)" = "$SHA" ] || vege 2 infra "A munkafa nem a kért változaton áll."
echo "$SHA" > "$FUTAS/valtozat"
git -C "$W" log -1 --pretty='%h %s' | tee "$FUTAS/leiras"

# --- 2. függőségek --------------------------------------------------------------------------------------------------------
szakasz "2. pnpm install --frozen-lockfile"
if ! futtat "$W" "pnpm install --frozen-lockfile --prefer-offline" > "$FUTAS/install.log" 2>&1; then
  tail -5 "$FUTAS/install.log"
  if grep -qE "ERR_PNPM_(OUTDATED_LOCKFILE|LOCKFILE_|BROKEN_LOCKFILE)|frozen-lockfile" "$FUTAS/install.log"; then
    vege 1 piros "A pnpm-lock.yaml nem illik a package.json-okhoz (pnpm install --frozen-lockfile)."
  fi
  vege 2 infra "A függőségek telepítése nem sikerült (install.log)."
fi

# --- 3. az ellenoriz lánc tagjai egyenként --------------------------------------------------------------------------------
szakasz "3. ellenőrzések (a package.json ellenoriz lánca, egyenként)"
LANC=$(futtat "$W" "node -e 'process.stdout.write(require(\"./package.json\").scripts.ellenoriz)'") || vege 2 infra "Az ellenőrző lánc nem olvasható."
IFS=$'\n' read -r -d '' -a TAGOK < <(echo "$LANC" | sed 's/ && /\n/g'; printf '\0')
for tag in "${TAGOK[@]}"; do
  tag=$(echo "$tag" | sed 's/^ *//;s/ *$//'); [ -n "$tag" ] || continue
  if [ "$tag" = "pnpm hatar" ]; then
    # a határőr: a sértések soronként, hogy a régiek alapvonalba tehetők legyenek, egy új viszont pirosat adjon
    futtat "$W" "node $ESZKOZ/hatar-hibak.mjs $W" > "$FUTAS/hatar.json" 2> "$FUTAS/hatar.log"
    HIBAK=$(grep -o '"ellenoriz::hatar::[^"]*"' "$FUTAS/hatar.json" | tr -d '"')
    if [ -z "$HIBAK" ]; then printf 'ellenoriz::hatar\tzold\n' >> "$ELL"; echo "  zöld   pnpm hatar"
    else while read -r h; do printf '%s\tbukik\n' "$h" >> "$ELL"; echo "  BUKIK  $h"; done <<< "$HIBAK"; fi
    continue
  fi
  nev=$(echo "$tag" | sed 's#^node tools/hatar/##;s#^pnpm ##')
  if futtat "$W" "$tag" > "$FUTAS/ell-$(echo "$nev" | tr -c 'a-zA-Z0-9.-' '_').log" 2>&1; then
    printf 'ellenoriz::%s\tzold\n' "$nev" >> "$ELL"; echo "  zöld   $nev"
  else
    printf 'ellenoriz::%s\tbukik\n' "$nev" >> "$ELL"; echo "  BUKIK  $nev"
  fi
done

# --- 4. a képek (docker mód) ----------------------------------------------------------------------------------------------
if [ "$MOD" = "docker" ]; then
  szakasz "4. képek építése: aitmetica-saas-app:$ID, aitmetica-saas-referencia:$ID"
  SZABAD_GB=$(df -BG --output=avail "$KAPU_GYOKER" | tail -1 | tr -dc '0-9')
  [ "${SZABAD_GB:-0}" -ge 15 ] || vege 2 infra "Csak ${SZABAD_GB} GB szabad a Gigabyte lemezén."
  # A NAS Dockere 24.0.2: a régebbi képformátumot kérjük (gigabyte-forditas.sh 92-94. sor)
  docker build --provenance=false --sbom=false --label "km.valtozat=$SHA" -t "aitmetica-saas-app:$ID" -f "$W/Dockerfile" "$W" > "$FUTAS/kep-app.log" 2>&1 \
    || { tail -8 "$FUTAS/kep-app.log"; vege 2 infra "Az alkalmazás képe nem épült meg (kep-app.log)."; }
  docker build --provenance=false --sbom=false --label "km.valtozat=$SHA" -t "aitmetica-saas-referencia:$ID" -f "$W/apps/referencia-host/Dockerfile" "$W" > "$FUTAS/kep-ref.log" 2>&1 \
    || { tail -8 "$FUTAS/kep-ref.log"; vege 2 infra "A referencia-host képe nem épült meg (kep-ref.log)."; }
  echo "képek kész"
fi

# --- 5. eldobható próbakörnyezet -------------------------------------------------------------------------------------------
szakasz "5. próbakörnyezet (Postgres 18, minden migráció a nulláról, az alkalmazás)"
lebont() { KAPU_MOD=$MOD bash "$ESZKOZ/proba-kornyezet.sh" le "$ID" "$FUTAS" >> "$FUTAS/kornyezet.log" 2>&1; }
trap lebont EXIT
trap 'lebont; trap - EXIT; exit 2' INT TERM
KAPU_MOD=$MOD bash "$ESZKOZ/proba-kornyezet.sh" fel "$ID" "$W" "$FUTAS" 2>&1 | tee "$FUTAS/kornyezet.log"
KK=${PIPESTATUS[0]}
if [ "$KK" = "3" ]; then vege 1 piros "A próbakörnyezet nem állt fel a változattal: $(grep -m1 PIROS "$FUTAS/kornyezet.log" | sed 's/^PIROS: //')."; fi
[ "$KK" = "0" ] || vege 2 infra "A próbakörnyezet nem állt fel (kornyezet.log)."

# --- 6. minden csomag próbái ------------------------------------------------------------------------------------------------
szakasz "6. próbák"
for d in "$W"/packages/* "$W"/apps/*; do
  [ -f "$d/vitest.config.ts" ] || continue
  rel=${d#"$W"/}; n=$(echo "$rel" | tr / _)
  futtat "$d" "timeout $PROBA_IDO ./node_modules/.bin/vitest run --reporter=json --outputFile=$FUTAS/probak/$n.json" "$FUTAS/kornyezet.env" > "$FUTAS/probak/$n.log" 2>&1
  printf '  %-34s %s\n' "$rel" "$([ -s "$FUTAS/probak/$n.json" ] && echo "lefutott" || echo "NINCS EREDMÉNY")"
done
# a lebontás most (nem csak a végén), és ellenőrizve
trap - EXIT INT TERM
KAPU_MOD=$MOD bash "$ESZKOZ/proba-kornyezet.sh" le "$ID" "$FUTAS" 2>&1 | tee -a "$FUTAS/kornyezet.log"
[ "${PIPESTATUS[0]}" = "0" ] || echo "FIGYELEM: a próbakörnyezet lebontása nem volt teljes (kornyezet.log)"
# a jelszavas környezetfájl a futás után nem marad olvasható helyen
[ -f "$FUTAS/kornyezet.env" ] && mv "$FUTAS/kornyezet.env" "$KAPU_GYOKER/_torolni/kornyezet-$ID-$(date +%s).env"

# --- 7. összevetés az alapvonallal -------------------------------------------------------------------------------------------
szakasz "7. összevetés: $W/tools/kapu/ismert-bukasok.json"
futtat "$W" "node $ESZKOZ/osszesit.mjs $FUTAS/probak $W $ELL > $FUTAS/eredmeny.json" || vege 2 infra "Az eredmények nem összesíthetők."
futtat "$W" "node $ESZKOZ/osszevet.mjs $FUTAS/eredmeny.json $W/tools/kapu/ismert-bukasok.json $ESZKOZ/ismert-bukasok.json > $FUTAS/dontes.json"
OK=$?
DONTES=$(grep -o '"dontes": *"[a-z-]*"' "$FUTAS/dontes.json" | sed 's/.*"\([a-z-]*\)"$/\1/')
PROBAK=$(tr -d '\n ' < "$FUTAS/dontes.json" | grep -o '"probak":{[^}]*}' | sed 's/"probak"://;s/"//g')
BOVULT=$(grep -c '"AZ ALAPVONAL BŐVÜLT' "$FUTAS/dontes.json")
sed -n '/"piros"/,/\]/p;/"jelzes"/,/\]/p' "$FUTAS/dontes.json" | head -30
echo "próbák: $PROBAK"
if [ $OK -eq 0 ] && [ -n "$DONTES" ]; then
  MONDAT="Zöld a kapu ($DONTES; $PROBAK)."
  [ "$BOVULT" != "0" ] && MONDAT="$MONDAT FIGYELEM: ez a változat bővítette az ismert hibák listáját."
  vege 0 "$DONTES" "$MONDAT"
fi
ELSO=$(sed -n '/"piros": \[/,/\]/p' "$FUTAS/dontes.json" | sed -n '2p' | sed 's/^ *"//;s/",\{0,1\}$//')
TOBB=$(sed -n '/"piros": \[/,/\]/p' "$FUTAS/dontes.json" | grep -c '^    "')
[ "$TOBB" -gt 1 ] && ELSO="$ELSO (és még $((TOBB-1)))"
vege 1 piros "${ELSO:-a kapu piros}"
