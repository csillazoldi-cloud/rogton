#!/bin/bash
# Kirakás a tesztre. Vilmos gépének Linux-munkakörnyezetében fut (Cowork híd), innen éri el
# a GIGABYTE gazdagépet (gigabyte-parancs.sh) és a NAS-t (nas-parancs.sh).
#
# D-22 (2026-09-10): a FORDÍTÁS A GIGABYTE-ON történik, a NAS csak futtat. Korábban a NAS
# fordított (4-5 perc 100%-on), ami a 2026-09-06-i összeomlás óta tilos.
#
# Lépései:
#   1. mérés a Gigabyte-on, majd a fordítás elindítása ott, a háttérben  →  bash kirak.sh --allapot
#   2. --indit: a forrás átvitele a NAS-ra (kicsi: a compose, az nginx.conf és a migrációk kellenek
#      csatolva), a KÉSZ DOBOZOK behúzása a Gigabyte-ról, indítás `--no-build`-del, majd migrációk
#
# A régi, NAS-on fordító út `--nas-epit` néven megmaradt — CSAK vészhelyzetre, a D-22 tiltja.
#
# Egyszeri előfeltétel: a NAS-on $TAVOLI/.env a két adatbázis-jelszóval (KM_TULAJ_JELSZO, KM_APP_JELSZO).
# Ugyanez a vault/adatbazis-belepes.txt fájlban is megvan. Lásd docs/KIRAKAS.md.
set -euo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"
NAS="bash $ITT/nas-parancs.sh"
GIGABYTE="bash $ITT/gigabyte-parancs.sh"
# A vault két helyen állhat: a Gigabyte-on (2026-09-11 óta itt dolgozunk) a SynologyDrive alatt,
# a régi Cowork-híd munkakörnyezetében a ~/mnt/SaaS alatt.
VAULT=""
for h in "$HOME/SynologyDrive/SaaS/vault" "$HOME/mnt/SaaS/vault"; do
  [ -d "$h" ] && { VAULT="$h"; break; }
done
[ -n "$VAULT" ] || { echo "MEGÁLLÍTVA: nincs vault sem a SynologyDrive, sem a mnt alatt."; exit 2; }
# A Gigabyte-on a munkapéldány maga a tárhely; máshonnan egy külön másolat kell.
if [ -d "$HOME/projektek/saas/.git" ]; then REPO=${REPO:-$HOME/projektek/saas}; else REPO=${REPO:-/tmp/repo}; fi
KULCS="$VAULT/github-kulcs"
TAVOLI=/volume2/docker/aitmetica-saas
CSOMAG=${CSOMAG:-/tmp/forras-$(id -u).tgz}  # munkamenetenként külön (a /tmp-ben más munkamenet fájlja nem írható felül)
export GIT_SSH_COMMAND="ssh -i $KULCS -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

meres() {
  # A NAS-szabályok kapuja. 2026-09-11: az ssh új, „post-quantum" figyelmeztetése belekerült a
  # mért számokba, és a kapu csendben átengedett mindent („integer expected"). Ezért NEM szűrünk
  # kulcsszóra: csak a SAJÁT jelöléssel ellátott sorokat vesszük, és számnak kell lenniük.
  local m; m=$($NAS 'free -m | awk "/^Mem:/{print \"MEM=\" \$7}"; uptime | sed "s/.*load average: //" | cut -d, -f1 | sed "s/^ *//;s/\..*//;s/^/TERH=/"')
  local szabad terh
  szabad=$(echo "$m" | sed -n 's/^MEM=\([0-9][0-9]*\)$/\1/p' | head -1)
  terh=$(echo "$m" | sed -n 's/^TERH=\([0-9][0-9]*\)$/\1/p' | head -1)
  if [ -z "$szabad" ] || [ -z "$terh" ]; then
    echo "MEGÁLLÍTVA: a NAS mérése nem adott számot — a kapu nem enged tovább vakon."
    echo "$m" | sed 's/^/    /' | head -5
    exit 2
  fi
  echo "NAS: felszabadítható ${szabad} MB, terhelés ${terh}"
  if [ "$szabad" -lt 3000 ] || [ "$terh" -gt 20 ]; then echo "MEGÁLLÍTVA: a NAS-szabályok szerint most nem indulhat nehéz munka."; exit 2; fi
}

case "${1:-}" in
  --allapot)
    # A fordítás a GIGABYTE-on fut, a naplója is ott van.
    $GIGABYTE "naplo saas"
    ;;
  --nas-allapot)
    $NAS "tail -n 8 $TAVOLI/build.log 2>/dev/null; grep -c . $TAVOLI/build.log 2>/dev/null | sed 's/^/sorok: /'; grep KESZ $TAVOLI/build.log 2>/dev/null || echo 'MÉG FUT'"
    ;;
  --titkok)
    # D-10: az előfizetéses belépők a vaultból a NAS-ra ($TAVOLI/titkok, csak a tulajdonos olvassa). Tartalom sehol nem íródik ki.
    V="$VAULT"; CB="$V/claude-belepo.txt"; [ -f "$CB" ] || CB="$V/calude-belepo.txt"
    NAS_SUDO=1 $NAS "mkdir -p $TAVOLI/titkok && chmod 700 $TAVOLI/titkok && chown 1000:1000 $TAVOLI/titkok"
    if [ -f "$CB" ]; then NAS_STDIN_FILE="$CB" NAS_SUDO=1 $NAS "cat > $TAVOLI/titkok/claude-belepo.txt && chmod 600 $TAVOLI/titkok/claude-belepo.txt && chown 1000:1000 $TAVOLI/titkok/claude-belepo.txt && echo 'claude-belepo: átment'"; else echo "claude-belepo: NINCS a vaultban"; fi
    if [ -f "$V/codex-auth.json" ]; then NAS_STDIN_FILE="$V/codex-auth.json" NAS_SUDO=1 $NAS "cat > $TAVOLI/titkok/codex-auth.json && chmod 600 $TAVOLI/titkok/codex-auth.json && chown 1000:1000 $TAVOLI/titkok/codex-auth.json && echo 'codex-auth: átment'"; else echo "codex-auth: NINCS a vaultban"; NAS_SUDO=1 $NAS "[ -f $TAVOLI/titkok/codex-auth.json ] || echo '{}' > $TAVOLI/titkok/codex-auth.json"; fi
    # T-25 (D-F37): az OpenAI API-kulcs a NAS .env-jébe (OPENAI_API_KEY sor csere/pótlás) — a tartalom sehol nem íródik ki
    if [ -f "$V/openai-key.txt" ]; then NAS_STDIN_FILE="$V/openai-key.txt" NAS_SUDO=1 $NAS "k=\$(cat | tr -d '\\r\\n '); grep -v '^OPENAI_API_KEY=' $TAVOLI/.env > $TAVOLI/.env.uj; printf 'OPENAI_API_KEY=%s\\n' \"\$k\" >> $TAVOLI/.env.uj; mv $TAVOLI/.env.uj $TAVOLI/.env; chmod 600 $TAVOLI/.env; echo 'openai-key: átment (.env)'"; else echo "openai-key: nincs a vaultban (vault/openai-key.txt) — kihagyva"; fi
    ;;
  --hid)
    # D-10: csak a híd-doboz újraépítése és cseréje (az app és a db nem áll le). A forrást előtte átvisszük.
    meres
    if [ -d $REPO/.git ]; then git -C $REPO pull -q --ff-only; fi
    tar -C $REPO/nas/ai-hid -czf $CSOMAG .
    NAS_STDIN_FILE=$CSOMAG NAS_SUDO=1 $NAS "mkdir -p $TAVOLI/forras/nas/ai-hid && cat > $TAVOLI/hid.tgz && tar -xzf $TAVOLI/hid.tgz -C $TAVOLI/forras/nas/ai-hid && cp $REPO/nas/docker-compose.yml /dev/null 2>/dev/null; echo 'híd forrása a helyén'"
    NAS_STDIN_FILE=$REPO/nas/docker-compose.yml NAS_SUDO=1 $NAS "cat > $TAVOLI/docker-compose.yml"
    KAPU='K=/volume1/homes/Portik/kozos; if [ -x $K/szabad-e.sh ]; then $K/szabad-e.sh aitmetica-saas || exit 5; trap "$K/elenged.sh aitmetica-saas" EXIT; fi;'
    NAS_TIMEOUT=170 NAS_SUDO=1 $NAS "cd $TAVOLI && bash -c '$KAPU docker compose -f $TAVOLI/docker-compose.yml build ai-hid 2>&1 | tail -3 && docker compose -f $TAVOLI/docker-compose.yml up -d --no-build ai-hid 2>&1 | tail -2'"
    ;;
  --kepek)
    # A forrás ÉS a kész dobozok átvitele a NAS-ra. Fordítás itt már nem történik.
    meres
    # 1. A forrás — NEM fordításhoz, hanem mert a compose, az nginx.conf, az ai-híd és az
    #    adatbázis-migrációk CSATOLT mappából jönnek. Ez pár MB.
    if [ -d $REPO/.git ]; then git -C $REPO pull -q --ff-only; else git clone -q git@github.com:Tolgyes/aitmetica-saas.git $REPO; fi
    echo "tárhely: $(git -C $REPO log --oneline -1)"
    tar -C $REPO --exclude=.git --exclude=node_modules --exclude=vault --exclude='Claude outputs' -czf $CSOMAG .
    echo "forráscsomag: $(du -h $CSOMAG | cut -f1)"
    NAS_STDIN_FILE=$CSOMAG $NAS "cat > $TAVOLI/forras.tgz && ls -la $TAVOLI/forras.tgz | awk '{print \"átment:\", \$5, \"bájt\"}'"
    NAS_SUDO=1 $NAS "cd $TAVOLI && mkdir -p _torolni && ([ -d forras ] && mv forras _torolni/forras-$(date +%Y%m%d-%H%M%S) || true) && mkdir forras && tar -xzf forras.tgz -C forras && cp forras/nas/docker-compose.yml . && cp forras/nas/nginx.conf ./nginx.conf.uj && echo 'forrás a helyén'"
    # 1b. Az állapotlap és a robots: az nginx a $TAVOLI/public mappából adja, ami NEM a forrás alól jön.
    #     Enélkül a kirakás után is a régi állapotlap látszana (2026-09-10-én kézzel kellett pótolni).
    NAS_SUDO=1 $NAS "cd $TAVOLI && mkdir -p public && cp -r forras/nas/public/. public/ && echo 'állapotlap és robots frissítve'"
    # 2. A KÉSZ DOBOZOK a Gigabyte-ról (a hídon át, lemezre nem a NAS-on készültek)
    KEPEK=${KEPEK:-$HOME/tmp/saas-kepek.tgz}
    mkdir -p "$(dirname "$KEPEK")"
    $GIGABYTE "kuld saas" > "$KEPEK"
    echo "képcsomag: $(du -h $KEPEK | cut -f1)"
    NAS_STDIN_FILE=$KEPEK NAS_SUDO=1 NAS_TIMEOUT=170 $NAS "cat > $TAVOLI/kepek.tgz && ls -la $TAVOLI/kepek.tgz | awk '{print \"átment:\", \$5, \"bájt\"}'"
    echo "Következő: bash $ITT/kirak.sh --betolt"
    ;;

  --betolt)
    # A kész dobozok betöltése a NAS-on. Ez másodpercek, nem fordítás.
    NAS_SUDO=1 NAS_TIMEOUT=170 $NAS "gunzip -c $TAVOLI/kepek.tgz | docker load"
    echo "Következő: bash $ITT/kirak.sh --indit"
    ;;

  --indit)
    meres
    # a NAS dobozkezelője (24.0.2) a bind-mount mappát nem hozza létre magától (c30 F9: az ./adatok/album is — a node felhasználóé,
    # mint a fájloké; mentés nélkül, D7); az adatbázis első
    # indításkor kétszer indul (kezdeti feltöltés, majd a végleges) — ezért a hálózati készenlétet várjuk
    NAS_SUDO=1 $NAS "cd $TAVOLI && mkdir -p adatok/postgres adatok/fajlok adatok/album && chown 1000:1000 adatok/fajlok adatok/album && chmod 770 adatok/fajlok adatok/album && ([ -f nginx.conf.uj ] && cp nginx.conf nginx.conf.elozo && mv nginx.conf.uj nginx.conf || true) && (docker inspect aitmetica-saas-web-regi >/dev/null 2>&1 || docker rename aitmetica-saas-web aitmetica-saas-web-regi 2>/dev/null || true); docker stop aitmetica-saas-web-regi >/dev/null 2>&1 || true; docker compose -f $TAVOLI/docker-compose.yml up -d --no-build 2>&1 | tail -5; docker ps --format '{{.Names}} {{.Status}}' | grep aitmetica"
    # Hálózati kerítés: minden indításnál visszakerül. A memóriában él, tehát újraindulás után
    # a KÖVETKEZŐ kirakás állítja helyre — a NAS újraindulásához külön indítási feladat kell (DSM).
    NAS_STDIN_FILE=$ITT/kerites.sh NAS_SUDO=1 $NAS "cat > /tmp/km-kerites.sh && sh /tmp/km-kerites.sh"
    echo "-- adatbázis-migrációk --"
    # T-21 (2026-09-12): a futó db dobozt NEM alkotjuk újra (az megszakította az alkalmazás kapcsolatait és a futó hírfigyelést).
    # A forrás cseréje után a régi doboz a régi mappát látná — ezért a migráció egy ELDOBHATÓ dobozból megy (docker compose run --rm),
    # ami a compose szerinti FRISS csatolásokkal indul, és a hálózaton át a „db" nevű dobozhoz kapcsolódik. A db csak akkor indul, ha nem fut.
    NAS_SUDO=1 $NAS "cd $TAVOLI && docker compose -f $TAVOLI/docker-compose.yml up -d --no-build db 2>&1 | tail -1"
    NAS_SUDO=1 $NAS "cd $TAVOLI && for i in \$(seq 1 40); do docker compose exec -T db pg_isready -q -h localhost -U km_tulaj -d km && break; sleep 2; done; docker compose -f $TAVOLI/docker-compose.yml run --rm --no-deps -T -e PGHOST=db db bash /migral/migral.sh"
    ;;
  "")
    # D-22: a FORDÍTÁS A GIGABYTE-ON. A NAS-t itt meg sem szólítjuk.
    echo "-- a fordító gép állapota --"
    $GIGABYTE "allapot"
    echo "-- fordítás indítása a Gigabyte-on --"
    $GIGABYTE "epit saas"
    echo "Kövesd: bash $ITT/kirak.sh --allapot  — ha KESZ:0, jöhet: bash $ITT/kirak.sh --indit"
    ;;

  --nas-epit)
    # A RÉGI út: a NAS fordít. A D-22 TILTJA — csak akkor, ha a Gigabyte tartósan elérhetetlen,
    # és Vilmos külön rábólint. A 2026-09-06-i összeomlás ezzel a művelettel függött össze.
    echo "FIGYELEM: ez a NAS-on fordít, amit a D-22 tilt. Folytatás 10 másodperc múlva, Ctrl-C a megszakításhoz."
    sleep 10
    meres
    if [ -d $REPO/.git ]; then git -C $REPO pull -q --ff-only; else git clone -q git@github.com:Tolgyes/aitmetica-saas.git $REPO; fi
    echo "tárhely: $(git -C $REPO log --oneline -1)"
    tar -C $REPO --exclude=.git --exclude=node_modules --exclude=vault --exclude='Claude outputs' -czf $CSOMAG .
    echo "csomag: $(du -h $CSOMAG | cut -f1)"
    NAS_STDIN_FILE=$CSOMAG $NAS "cat > $TAVOLI/forras.tgz && ls -la $TAVOLI/forras.tgz | awk '{print \"átment:\", \$5, \"bájt\"}'"
    NAS_SUDO=1 $NAS "cd $TAVOLI && mkdir -p _torolni && ([ -d forras ] && mv forras _torolni/forras-$(date +%Y%m%d-%H%M%S) || true) && mkdir forras && tar -xzf forras.tgz -C forras && cp forras/nas/docker-compose.yml . && cp forras/nas/nginx.conf ./nginx.conf.uj && echo 'forrás a helyén'"
    KAPU='K=/volume1/homes/Portik/kozos; if [ -x $K/szabad-e.sh ]; then $K/szabad-e.sh aitmetica-saas || exit 5; trap "$K/elenged.sh aitmetica-saas" EXIT; fi;'
    NAS_SUDO=1 $NAS "cd $TAVOLI && echo \"--- $(date) build indul ---\" > build.log && setsid nohup bash -c '$KAPU docker compose -f $TAVOLI/docker-compose.yml build >> $TAVOLI/build.log 2>&1; echo KESZ:\$? >> $TAVOLI/build.log' >/dev/null 2>&1 < /dev/null & echo 'összerakás elindult a háttérben (a közös kapun át)'"
    echo "Kövesd: bash $ITT/kirak.sh --nas-allapot"
    ;;
  *)
    echo "használat: kirak.sh [--allapot|--kepek|--betolt|--indit|--titkok|--hid]"
    echo "  (üres)      a fordítás elindítása A GIGABYTE-on (D-22)"
    echo "  --allapot   a Gigabyte fordítási naplója"
    echo "  --kepek     forrás + kész dobozok a NAS-ra"
    echo "  --betolt    a dobozok betöltése a NAS-on"
    echo "  --indit     indítás --no-build-del + migrációk"
    echo "  --nas-epit  RÉGI út: a NAS fordít — a D-22 TILTJA, csak vészhelyzetre"
    exit 1;;
esac
