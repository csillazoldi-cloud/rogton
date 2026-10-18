#!/bin/bash
# shellcheck disable=SC2034,SC1111,SC2016 # a feltételek az allit() eval-jában használják a változókat; a „” magyar idézőjel szándékos
# c4 önpróba: nas/kirak-sha.sh — a NAS-lépések SORRENDJE és a kilépési kódok, csonk NAS-szal (a NAS-hoz nem nyúl).
# Kell: git, docker (csak `docker import`/`docker save` egy üres, feliratozott képpel — letöltés nincs).
#
#   bash tools/kapu/onproba/kirak-onproba.sh [naplómappa]
set -uo pipefail
GYOKER="$(cd "$(dirname "$0")/../../.." && pwd)"
KI=${1:-$(mktemp -d)}; mkdir -p "$KI"
T=$(mktemp -d)
BUKOTT=0; ESET=0
jo()  { ESET=$((ESET+1)); echo "  ZÖLD  $*"; }
rossz() { ESET=$((ESET+1)); BUKOTT=$((BUKOTT+1)); echo "  PIROS $*"; }
allit() { if eval "$1"; then jo "$2"; else rossz "$2  [feltétel: $1]"; fi; }

SHA=$(git -C "$GYOKER" rev-parse HEAD); ID=${SHA:0:12}
# a kapu munkafája ezen a változaton (a kirak-sha.sh ellenőrzi, és innen hívná a képgyártót — nem Gigabyte-on az kihagyja magát)
git clone -q --shared "$GYOKER" "$T/kapu/munkafa" && git -C "$T/kapu/munkafa" checkout -q --detach "$SHA"
# üres, feliratozott „képek” — a kirak-sha.sh csak a feliratot nézi és docker save-eli őket
for k in aitmetica-saas-app aitmetica-saas-referencia; do
  tar -cf - --files-from /dev/null | docker import --change "LABEL km.valtozat=$SHA" - "$k:$ID" >/dev/null
done

cat > "$T/nas.sh" <<'EOF'
#!/bin/bash
printf '%s\n' "$1" | head -c 300 | tr '\n' ' ' >> "$STUB_NAS_NAPLO"; echo >> "$STUB_NAS_NAPLO"
case "$1" in
  *"free -m"*) printf 'MEM=9000\nTERH=1\n' ;;
  *migral.sh*)
    case "$STUB_MIGRAL" in
      ok0) printf 'nincs új migráció, mentés nem kell\nmigrációk rendben\nMIGRAL_KOD:0\n' ;;
      ok1) printf 'új migráció: 1 db (0154_proba) — előbb mentés\nmentés kész: /var/lib/postgresql/mentes/20261007-1600-elotte-0154_proba.sql.gz (4321 bájt)\nlefutott: 0154_proba\nmigrációk rendben\nMIGRAL_KOD:0\n' ;;
      hiba) printf 'psql: ERROR: syntax error\nMIGRAL_KOD:3\n' ;;
    esac ;;
  *km.valtozat*) printf 'FUT:%s\nFORRAS:%s\n' "$STUB_FUT" "$STUB_FORRAS" ;;
  *) echo "rendben" ;;
esac
EOF
printf '#!/bin/bash\necho -n "$STUB_HTTP"\n' > "$T/curl.sh"; chmod +x "$T"/*.sh
export REPO="$GYOKER" KAPU_GYOKER="$T/kapu" ROBOT_ALLAPOT="$T/allapot" KIRAK_MUNKA="$T/munka" KIRAK_NAS="bash $T/nas.sh" \
  KIRAK_CURL="$T/curl.sh" KIRAK_VAR_MP=0 STUB_NAS_NAPLO="$T/nas.log"

fut() { # fut <eset> <migral> <http> <fut-sha> [--proba]
  : > "$T/nas.log"
  STUB_MIGRAL=$2 STUB_HTTP=$3 STUB_FUT=$4 STUB_FORRAS=$4 bash "$GYOKER/nas/kirak-sha.sh" "$SHA" ${5:-} > "$KI/kirak-$1.log" 2>&1
  local k=$?; cp "$T/nas.log" "$KI/nas-$1.log"; return $k
}
sor() { grep -n -m1 -F -- "$1" "$T/nas.log" | cut -d: -f1; }

echo "== 1. rendben: mérés → forrás → képek → betöltés → címkék → mentés+migráció → indítás → kerítés → visszaolvasás =="
fut rendben ok0 200 "$SHA"; k=$?
allit '[ $k = 0 ]' "kilépés 0"
a=$(sor "free -m"); b=$(sor "forras.tgz &&"); c=$(sor "docker load"); d=$(sor "docker tag \$k:helyi \$k:elozo"); e=$(sor "migral.sh"); f=$(sor "up -d --no-build 2>&1 | tail -5"); g=$(sor "km-kerites"); h=$(sor "km.valtozat")
allit '[ "$a" -lt "$b" ] && [ "$b" -lt "$c" ] && [ "$c" -lt "$d" ] && [ "$d" -lt "$e" ] && [ "$e" -lt "$f" ] && [ "$f" -lt "$g" ] && [ "$g" -lt "$h" ]' "sorrend: mérés < forrás < betöltés < címkék (:helyi→:elozo) < MIGRÁCIÓ < alkalmazás < kerítés < visszaolvasás"
allit 'grep -q "^$SHA$" <(tar -xzOf "$T/munka/forras.tgz" ./VALTOZAT)' "a forráscsomag VALTOZAT fájlja = a kért SHA"
allit '[ "$(tar -tzf "$T/munka/forras.tgz" | grep -c "^./tools/kapu/kapu.sh$")" = 1 ] && ! tar -tzf "$T/munka/forras.tgz" | grep -q "node_modules\|^./.git/"' "a forrás git archive (nincs benne node_modules, .git)"
allit '! grep -q "docker tag \$k:elozo \$k:helyi" "$T/nas.log"' "nincs visszaállás"

echo "== 2. migráció lefutott, az oldal piros → 7, NEM áll vissza, a mentés neve a naplóban =="
fut mig-piros ok1 502 "$SHA"; k=$?
allit '[ $k = 7 ] && ! grep -q "docker tag \$k:elozo \$k:helyi" "$T/nas.log"' "kilépés 7, visszaállás nincs"
allit 'grep -q "^MENTÉS: /var/lib/postgresql/mentes/20261007-1600-elotte-0154_proba.sql.gz" "$KI/kirak-mig-piros.log"' "a mentés neve kiírva (a robot ezt küldi tovább)"

echo "== 3. migráció nélkül piros → 4, visszaáll az :elozo képre =="
fut piros-vissza ok0 502 "$SHA"; k=$?
allit '[ $k = 4 ] && grep -q "docker tag \$k:elozo \$k:helyi; done; docker compose" "$T/nas.log"' "kilépés 4, :elozo → :helyi és újraindítás"

echo "== 4. a migráció elbukik → 8, az új alkalmazás el sem indul =="
fut mig-hiba hiba 200 "$SHA"; k=$?
allit '[ $k = 8 ] && [ -z "$(sor "up -d --no-build 2>&1 | tail -5")" ]' "kilépés 8, nincs alkalmazás-indítás"

echo "== 5. a visszaolvasott változat más → 9 =="
fut visszaolvas ok0 200 "0000000000000000000000000000000000000000"; k=$?
allit '[ $k = 9 ]' "kilépés 9"

echo "== 6. --proba: a NAS-hoz nem nyúl =="
fut proba ok0 200 "$SHA" --proba; k=$?
allit '[ $k = 0 ] && [ ! -s "$T/nas.log" ]' "kilépés 0, egyetlen NAS-hívás sincs"

echo "== 7. a kapu képe hiányzik → 3 =="
docker tag "aitmetica-saas-app:$ID" "aitmetica-saas-app:$ID-felre" >/dev/null && docker rmi "aitmetica-saas-app:$ID" >/dev/null
fut nincs-kep ok0 200 "$SHA"; k=$?
docker tag "aitmetica-saas-app:$ID-felre" "aitmetica-saas-app:$ID" >/dev/null && docker rmi "aitmetica-saas-app:$ID-felre" >/dev/null
allit '[ $k = 3 ] && [ ! -s "$T/nas.log" ]' "kilépés 3, a NAS-hoz nem nyúl"

echo; echo "KIRAK-ÖNPRÓBA: $((ESET-BUKOTT))/$ESET zöld   (próbamappa: $T)"
exit $BUKOTT
