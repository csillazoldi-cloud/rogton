#!/bin/bash
# shellcheck disable=SC2034,SC1111,SC2016 # a feltételek az allit() eval-jában használják a változókat; a „” magyar idézőjel szándékos
# c4 önpróba: a robot döntései és a kirak-sha.sh sorrendje — HÁLÓZAT, NAS ÉS GIGABYTE NÉLKÜL.
# Egy helyi „GitHub” (csupasz tároló), csonk kapu, csonk kirakás, csonk NAS. Bárhol futtatható, ahol van git, flock és docker
# (a dockerből csak a `docker import` kell: üres, feliratozott képek a kirak-sha.sh-nak).
#
#   bash tools/kapu/onproba/robot-onproba.sh [naplómappa]
#
# Kilépés: 0 = minden eset zöld; különben a bukott esetek száma.
set -uo pipefail
GYOKER="$(cd "$(dirname "$0")/../../.." && pwd)"
KI=${1:-$(mktemp -d)}; mkdir -p "$KI"
T=$(mktemp -d); trap 'echo "(próbamappa: $T)"' EXIT
BUKOTT=0; ESET=0
jo()  { ESET=$((ESET+1)); echo "  ZÖLD  $*"; }
rossz() { ESET=$((ESET+1)); BUKOTT=$((BUKOTT+1)); echo "  PIROS $*"; }
allit() { if eval "$1"; then jo "$2"; else rossz "$2  [feltétel: $1]"; fi; }

# --- a helyi „GitHub”, a robot másolata és egy fejlesztő --------------------------------------------------------------------
git init -q --bare -b main "$T/origin.git"
git clone -q "$T/origin.git" "$T/fejleszto" 2>/dev/null
( cd "$T/fejleszto" && git config user.email p@p && git config user.name proba && echo 0 > f && git add f && git commit -qm c0 && git push -q origin main )
git clone -q "$T/origin.git" "$T/robot"
push() { ( cd "$T/fejleszto" && echo "$1" > f && git commit -qam "$1" && git push -q origin main && git rev-parse HEAD ); }

# --- csonkok ------------------------------------------------------------------------------------------------------------------
mkdir -p "$T/csonk" "$T/allapot" "$T/conf"
cat > "$T/csonk/kapu.sh" <<'EOF'
#!/bin/bash
echo "KAPU $1" >> "$CSONK_NAPLO"
k=$(sed -n "s/^${1:0:12} //p" "$CSONK_KAPU_KODOK" 2>/dev/null | tail -1); k=${k:-0}
case $k in 0) echo "KAPU: zold — Zöld a kapu (próba).";; 1) echo "KAPU: piros — új hiba: apps/web::probak/x.proba.ts::y";; *) echo "KAPU: infra — a gépezet akadt el (próba).";; esac
echo "futás: /csonk/futas"
exit "$k"
EOF
cat > "$T/csonk/kirak.sh" <<'EOF'
#!/bin/bash
echo "KIRAK $1 ${2:-}" >> "$CSONK_NAPLO"
# mint a kirak-sha.sh:85 — minden kirakás a tárhely nas/public mappáját másolja ki (felülírja a robot korábbi sorait)
cp "$CSONK_ALLAPOT_FORRAS" "$CSONK_NAS/public/allapot/allapot.json"
k=$(sed -n "s/^${1:0:12} //p" "$CSONK_KIRAK_KODOK" 2>/dev/null | tail -1); exit "${k:-0}"
EOF
# a NAS csonkja (nas-parancs.sh helyett), HŰEN: a parancs helyben fut, a NAS_STDIN_FILE a bemenetére megy, és — mint a valódi
# ssh-n (mérve a Gigabyte-on, 10-11) — minden kapcsolat a 3 soros post-quantum figyelmeztetéssel kezd a stderr-en, amit a
# nas-parancs.sh `2>&1`-gyel a kimenetbe kever. CSONK_NAS_URES=1: a NAS üres választ ad (a kapcsolat nem hozott semmit).
cat > "$T/csonk/nas.sh" <<'EOF'
#!/bin/bash
{
  printf '%s\n' '** WARNING: connection is not using a post-quantum key exchange algorithm.' \
    '** This session may be vulnerable to "store now, decrypt later" attacks.' \
    '** The server may need to be upgraded. See https://openssh.com/pq.html' >&2
  [ -n "${CSONK_NAS_URES:-}" ] && exit 0
  if [ -n "${NAS_STDIN_FILE:-}" ]; then bash -c "$1" < "$NAS_STDIN_FILE"; else bash -c "$1"; fi
} 2>&1
EOF
cat > "$T/csonk/uzenet.sh" <<'EOF'
#!/bin/bash
echo "UZENET $1 | $2 | kulcs=${3:-}" >> "$CSONK_NAPLO"
EOF
chmod +x "$T"/csonk/*.sh
export CSONK_NAPLO="$T/csonk.log" CSONK_KAPU_KODOK="$T/kapu-kodok" CSONK_KIRAK_KODOK="$T/kirak-kodok"
# az élő állapotlap csonkja: a „NAS” mappa és a tárhely fájlja (a valódi nas/public/allapot/allapot.json másolata)
export CSONK_NAS="$T/nas" CSONK_ALLAPOT_FORRAS="$T/allapot-forras.json" KINT_NAS_PARANCS="bash $T/csonk/nas.sh" KINT_TAVOLI="$T/nas"
mkdir -p "$T/nas/public/allapot"; cp "$GYOKER/nas/public/allapot/allapot.json" "$CSONK_ALLAPOT_FORRAS"; cp "$CSONK_ALLAPOT_FORRAS" "$T/nas/public/allapot/allapot.json"
: > "$CSONK_NAPLO"; : > "$CSONK_KAPU_KODOK"; : > "$CSONK_KIRAK_KODOK"
echo "KAPU=1" > "$T/conf/beallitas"
export REPO="$T/robot" ROBOT_ALLAPOT="$T/allapot" ROBOT_BEALLITAS="$T/conf/beallitas" ROBOT_NAPLO="$T/robot-naplo.jsonl" ROBOT_CSEND_MP=4 \
  KAPU_PARANCS="bash $T/csonk/kapu.sh" KIRAK_PARANCS="bash $T/csonk/kirak.sh" UZENET_PARANCS="$T/csonk/uzenet.sh"
ROBOT="bash $GYOKER/tools/gigabyte-robot/robot.sh"
kor() { $ROBOT "$@" >> "$KI/robot-kimenet.log" 2>&1; echo $?; }
db() { grep -c "^$1 ${2:-}" "$CSONK_NAPLO"; }

echo "== A. két push 1 mp-en belül: csak a második megy ki, a 4 mp-es csend után =="
C1=$(push c1); kor >/dev/null; sleep 1; C2=$(push c2)
kor >/dev/null; kor >/dev/null
allit '[ "$(db KAPU)" = 0 ]' "a csend alatt nincs kapu (2 kör)"
sleep 5; kor >/dev/null
allit '[ "$(db KAPU "$C1")" = 0 ] && [ "$(db KIRAK "$C1")" = 0 ]' "az első push (${C1:0:7}) soha nem kerül kapuba, kirakásra"
allit '[ "$(db KAPU "$C2")" = 1 ] && [ "$(db KIRAK "$C2")" = 1 ]' "a második (${C2:0:7}) pontosan egyszer: kapu, majd kirakás"
allit '[ "$(cat "$T/allapot/kint")" = "$C2" ]' "kint = a második változat"
allit '[ "$(git -C "$T/robot" rev-parse HEAD)" = "$C2" ]' "a robot másolata CSAK a kirakás után állt rá"
kor >/dev/null; allit '[ "$(db KAPU "$C2")" = 1 ]' "a következő kör nem rak ki újra"
allit 'grep -q "UZENET Kint van | ${C2:0:12}" "$CSONK_NAPLO"' "üzenet: Kint van"
allit 'grep "UZENET Kint van | ${C2:0:12}" "$CSONK_NAPLO" | grep -q "kulcs=kint$"' "Kint van → kulcs: kint (a csoportba nem megy semmi)"

echo "== B. piros változat: egyszer próbálja, nem rakja ki, egyszer szól =="
C3=$(push c3); echo "${C3:0:12} 1" >> "$CSONK_KAPU_KODOK"
kor >/dev/null; sleep 5; kor >/dev/null; kor >/dev/null; sleep 1; kor >/dev/null
allit '[ "$(db KAPU "$C3")" = 1 ] && [ "$(db KIRAK "$C3")" = 0 ]' "piros: egy kapu, nulla kirakás, több kör után is"
allit '[ "$(cat "$T/allapot/kint")" = "$C2" ]' "kint marad az előző (${C2:0:7})"
allit '[ "$(grep -c "UZENET Nem raktam ki | ${C3:0:12}" "$CSONK_NAPLO")" = 1 ]' "pontosan egy üzenet: Nem raktam ki"
allit 'grep "UZENET Nem raktam ki | ${C3:0:12}" "$CSONK_NAPLO" | grep -q "kulcs=nem_kerult_ki$"' "piros kapu → kulcs: nem_kerult_ki"

echo "== C. gépezet-hiba: várakozás, újrapróba, a 2. után üzenet, a 3. után piros =="
C4=$(push c4); echo "${C4:0:12} 2" >> "$CSONK_KAPU_KODOK"
kor >/dev/null; sleep 5; kor >/dev/null; kor >/dev/null
allit '[ "$(db KAPU "$C4")" = 1 ]' "infra után nem próbálja újra azonnal (5 perc várakozás)"
read -r s d n t < "$T/allapot/utolso-proba"; echo "$s $d $n $((t-301))" > "$T/allapot/utolso-proba"; kor >/dev/null
allit '[ "$(db KAPU "$C4")" = 2 ] && grep -q "UZENET Elakadt a kirakás | ${C4:0:12}" "$CSONK_NAPLO"' "5 perc után újra; a 2. hiba után üzenet"
allit 'grep "UZENET Elakadt a kirakás | ${C4:0:12}" "$CSONK_NAPLO" | grep -q "kulcs=elakadt$"' "gépezet-hiba → kulcs: elakadt"
read -r s d n t < "$T/allapot/utolso-proba"; echo "$s $d $n $((t-901))" > "$T/allapot/utolso-proba"; kor >/dev/null
allit '[ "$(db KAPU "$C4")" = 3 ] && grep -q "^$C4 piros 3" "$T/allapot/utolso-proba"' "a 3. hiba után piros, nem próbálja tovább"
kor >/dev/null; allit '[ "$(db KAPU "$C4")" = 3 ]' "piros után nincs több kapu"

echo "== D. kézi út: robot.sh --sha (csend és állapot nélkül, ugyanaz a kapu) =="
: > "$CSONK_KAPU_KODOK"
kor --sha "$C2" >/dev/null
allit '[ "$(db KAPU "$C2")" = 2 ] && [ "$(db KIRAK "$C2")" = 2 ]' "--sha ${C2:0:7}: kapu + kirakás azonnal"

echo "== E. zár: ha egy kör fut, a második nem indul =="
before=$(wc -l < "$CSONK_NAPLO"); C5=$(push c5)
( exec 9>"$T/allapot/zar"; flock 9; sleep 3 ) & sleep 0.5
out=$($ROBOT 2>&1); wait
allit 'echo "$out" | grep -q "már fut egy kör"' "a második kör kilép: „már fut egy kör”"

echo "== F. a kirakás eredményei: 7 (migráció futott, oldal piros) és 4 (visszaállt) =="
sleep 5; kor >/dev/null   # C5 csend
echo "${C5:0:12} 7" >> "$CSONK_KIRAK_KODOK"; sleep 5; kor >/dev/null
allit 'grep -q "UZENET PIROS — döntés kell | ${C5:0:12}" "$CSONK_NAPLO" && [ "$(cat "$T/allapot/kint")" != "$C5" ]' "7: hangos üzenet, kint nem változik"
allit 'grep "UZENET PIROS — döntés kell | ${C5:0:12}" "$CSONK_NAPLO" | grep -q "kulcs=nem_mukodik$"' "7 → kulcs: nem_mukodik"
C6=$(push c6); echo "${C6:0:12} 4" >> "$CSONK_KIRAK_KODOK"; kor >/dev/null; sleep 5; kor >/dev/null
allit 'grep -q "UZENET Nem maradt kint | ${C6:0:12}" "$CSONK_NAPLO"' "4: „Nem maradt kint” (visszaállt)"
allit 'grep "UZENET Nem maradt kint | ${C6:0:12}" "$CSONK_NAPLO" | grep -q "kulcs=visszaallt$"' "4 → kulcs: visszaallt"

echo "== I. az élő állapotlap „Kint” sora (Csilla 2026-10-11) =="
LAP="$T/nas/public/allapot/allapot.json"
kintdb() { node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); console.log(d.naplo.filter(n=>n.mi.startsWith("Kint: "+process.argv[2])).length)' "$LAP" "$1" 2>/dev/null; }
lapjs() { node -e "$1" "$LAP" 2>/dev/null; }
allit '[ "$(kintdb "${C2:0:7}")" = 1 ]' "sikeres kirakás (${C2:0:7}): pontosan egy „Kint” sor az élő lapon"
allit '[ "$(kintdb "${C2:0:7}")" = 1 ] && [ "$(db KIRAK "$C2")" = 2 ]' "ugyanannak a változatnak az újrakirakása (D, --sha): nincs második sor"
allit '[ "$(kintdb "${C3:0:7}")" = 0 ] && [ "$(kintdb "${C5:0:7}")" = 0 ] && [ "$(kintdb "${C6:0:7}")" = 0 ]' "piros kapu, 7-es és 4-es kirakás: nincs sor (a 7/4 utáni felülírás után a ${C2:0:7} sora visszaolvasztva — lásd az első esetet)"
allit 'node --input-type=module -e "import {ellenoriz} from \"$GYOKER/tools/allapot/sema.mjs\"; import {readFileSync} from \"node:fs\"; process.exit(ellenoriz(JSON.parse(readFileSync(\"$LAP\",\"utf8\"))).length)"' "a lap érvényes JSON, a séma rendben"
allit 'grep -Eq "\"frissitve\": \"20[0-9-]+T[0-9]{2}:[0-9]{2}\+0[23]:00\"" "$LAP"' "frissitve: bukaresti idő (+02:00/+03:00)"
allit '[ -z "$(git -C "$T/robot" status --porcelain)" ]' "a robot másolatához (tárhely) nem nyúlt"
# hibás JSON a NAS-on: nem ír, a kirakás attól sikeres
: > "$CSONK_KIRAK_KODOK"; printf '{ hibás' > "$CSONK_ALLAPOT_FORRAS"
C7=$(push c7); kor >/dev/null; sleep 5; k7=$(kor)
allit '[ "$k7" = 0 ] && [ "$(cat "$T/allapot/kint")" = "$C7" ]' "hibás JSON a NAS-on: a kirakás sikeres (kilépés 0, kint = ${C7:0:7})"
allit '[ "$(cat "$LAP")" = "{ hibás" ]' "hibás JSON a NAS-on: nem írt rá"
allit 'grep -q "\"esemeny\":\"allapotlap\",\"eredmeny\":\"hiba\",\"valtozat\":\"${C7:0:12}\"" "$T/robot-naplo.jsonl"' "hibás JSON: egy helyi naplósor (allapotlap hiba)"
# üres válasz a NAS-tól (a kapcsolat semmit nem hozott): nem ír, a kirakás attól sikeres, egy helyi naplósor
cp "$GYOKER/nas/public/allapot/allapot.json" "$CSONK_ALLAPOT_FORRAS"; cp "$CSONK_ALLAPOT_FORRAS" "$LAP"; elotte=$(sha256sum "$LAP")
export CSONK_NAS_URES=1
C7B=$(push c7b); kor >/dev/null; sleep 5; k7b=$(kor)
unset CSONK_NAS_URES
allit '[ "$k7b" = 0 ] && [ "$(cat "$T/allapot/kint")" = "$C7B" ]' "üres NAS-válasz: a kirakás sikeres (kilépés 0, kint = ${C7B:0:7})"
allit '[ "$(sha256sum "$LAP")" = "$elotte" ]' "üres NAS-válasz: a laphoz nem nyúlt"
allit 'grep -q "\"esemeny\":\"allapotlap\",\"eredmeny\":\"hiba\",\"valtozat\":\"${C7B:0:12}\",\"uzenet\":\"a NAS-ról nem jött olvasható" "$T/robot-naplo.jsonl"' "üres NAS-válasz: egy helyi naplósor"
# a tárhely fájlja újra jó: a következő kirakás visszaolvasztja a robot összes sorát (időrendben, ismétlés nélkül)
cp "$GYOKER/nas/public/allapot/allapot.json" "$CSONK_ALLAPOT_FORRAS"
C8=$(push c8); kor >/dev/null; sleep 5; kor >/dev/null
allit '[ "$(kintdb "${C2:0:7}")" = 1 ] && [ "$(kintdb "${C7:0:7}")" = 1 ] && [ "$(kintdb "${C7B:0:7}")" = 1 ] && [ "$(kintdb "${C8:0:7}")" = 1 ]' "felülírt tárhely-fájl után: mind a négy robot-sor egyszer (a figyelmeztetés ellenére)"
allit '! grep -q "WARNING\|post-quantum" "$LAP"' "a figyelmeztetés szövege nem került a lapra"
allit 'lapjs "const d=JSON.parse(require(\"fs\").readFileSync(process.argv[1],\"utf8\")); const k=x=>d.naplo.findIndex(n=>n.mi.startsWith(\"Kint: \"+x)); process.exit(k(\"${C8:0:7}\")===0 && k(\"${C7B:0:7}\")===1 && k(\"${C7:0:7}\")===2 && k(\"${C2:0:7}\")>2 ? 0 : 1)"' "a robot sorai a helyükön: ${C8:0:7} legfelül, alatta ${C7B:0:7}, ${C7:0:7}, lejjebb ${C2:0:7}"
allit 'cmp -s <(node -e "const d=JSON.parse(require(\"fs\").readFileSync(process.argv[1],\"utf8\")); console.log(JSON.stringify(d.naplo.filter(n=>!n.mi.startsWith(\"Kint: \"))))" "$LAP") <(node -e "const d=JSON.parse(require(\"fs\").readFileSync(process.argv[1],\"utf8\")); console.log(JSON.stringify(d.naplo))" "$CSONK_ALLAPOT_FORRAS")' "a tárhely sorai érintetlenek (sorrend és tartalom)"

echo "== G. KAPU=0 → a régi út (robot-regi.sh), a csonkokhoz nem nyúl =="
echo "KAPU=0" > "$T/conf/beallitas"; git -C "$T/robot" fetch -q; git -C "$T/robot" merge -q --ff-only origin/main
before=$(wc -l < "$CSONK_NAPLO"); out=$($ROBOT 2>&1); k=$?
allit '[ "$k" = 0 ] && [ "$(wc -l < "$CSONK_NAPLO")" = "$before" ]' "KAPU=0: a régi út fut (naprakész másolat → csendben kilép), kapu/kirakás nincs"

echo "== H. a kirakás útjában nincs git pull =="
allit '! cat "$GYOKER/nas/kirak-sha.sh" "$GYOKER/tools/kapu/kapu.sh" | grep -vE "^[[:space:]]*#" | grep -qE "git( -C [^ ]+)? pull|merge --ff-only \"?origin"' "kirak-sha.sh és kapu.sh: egyetlen git pull sincs (a megjegyzéseken kívül)"

cp "$CSONK_NAPLO" "$KI/csonk.log"; cp "$T/robot-naplo.jsonl" "$KI/robot-naplo.jsonl" 2>/dev/null
echo; echo "ROBOT-ÖNPRÓBA: $((ESET-BUKOTT))/$ESET zöld"
exit $BUKOTT
