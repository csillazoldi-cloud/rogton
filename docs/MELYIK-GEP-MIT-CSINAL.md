# Melyik gép mit csinál — és miért nem a NAS fordít

Műszaki útmutató Portik projektjeihez és a kollégák által vitt projektekhez.
Készült: 2026-09-10. Írta: Claude (Opus 5), a SaaS-projekt tapasztalataiból.

## RÖGZÍTETT DÖNTÉS — a munkamegosztás

Portik döntése, 2026-09-10:

| Gép | Mit csinál | Mit NEM csinál |
|---|---|---|
| **Dell** | **minden AI-munka**: nyelvi modellek (Ollama), beszéd, átírás | nem fordít |
| **Gigabyte** | **minden hagyományos fejlesztői munka**: repók, fordítás, csomagolás, a kirakás indítása | nem futtat nyelvi modellt |
| **NAS** | a kész dobozok **futtatása**, adatbázis, mentés | **nem fordít** |

Ez nem mérlegelendő szempont, hanem követelmény. Előzmény: a 2026-09-06-i NAS-összeomlás után
eldőlt, hogy a NAS nem fordít; a 09-10-i pontosítás pedig szétválasztja az AI-t és a fejlesztést.

**Miért nem a Dell fordít, pedig erős gép?** Mert a nyelvi modell akkor gyors, ha bent van a
memóriában. Mérve 2026-09-08-án: **hidegen 41,5 mp, melegen 3,8 mp/cikk.** Egy fordítás kiszorítja
a modellt, és a következő AI-futás megint kifizeti a hidegindítást. A Dellen a memória a modellé.

**Kivételek, amiket ismerni kell:** a Gigabyte-on ma is fut néhány kisebb AI-szolgáltatás
(`whisper-listener`, `whisper-inbox`, `katinka-tts`, `ai-speech-server`). Ezek a szabály alóli,
tudatos kivételek — egy 27 milliárd paraméteres modell mellett aprók. Ha valamelyik zavarni kezdi
a fordítást, akkor kerül a Dellre, nem előbb.

**Ha a Gigabyte nincs bekapcsolva:** a kirakás **vár**. Nem a Dellre megy át (kiszorítja a
modellt), és semmiképp nem a NAS-ra. Egy elhalasztott kirakás olcsóbb, mint egy hideg modell vagy
négy oldal kiesése.

**Ez a dokumentum minden repó gyökerébe bemásolandó**, és az AGENTS.md / CLAUDE.md hivatkozzon rá.

---

## 0. Miért van ez a dokumentum

A NAS (transzmozaik) **öt projektet és 27 dobozt** futtat 16 GB memóriával. 2026-09-06-án egy
mérés és egy párhuzamos fotófeldolgozás együtt megülte a gépet: a swap megtelt, és **négy projekt
oldala órákra elérhetetlen lett**. A NAS-nak nincs tartaléka.

A „fordítás" (angolul *build*) az a lépés, amikor a forráskódból futtatható csomag lesz: a
függőségek letöltése, a TypeScript átfordítása, a lapok előállítása, a doboz összerakása. **Ez a
legdrágább lépés az egész kirakásban** — percekig 100%-on tartja a processzort és gigabájtokat ír
a lemezre. A futtatás ehhez képest olcsó.

**A szabály egy mondatban:** a NAS **futtat**, nem fordít. A fordítás a Gigabyte-on történik, és a
NAS-ra már csak a kész csomag megy át.

---

## 1. A három gép

| | Gigabyte — **a fordító** | Dell — az AI gépe | NAS (transzmozaik) — csak futtat |
|---|---|---|---|
| Szerep | repók, fordítás, csomagolás, a kirakás indítása | nyelvi modellek, beszéd, átírás | a dobozok futtatása, adatbázis, mentés |
| Gép | Gigabyte Z390 Designare | GPU-s munkaállomás | Synology |
| Processzor | **Intel i9-9900K, 8 mag / 16 szál** | (mérd meg) | 8 mag |
| Memória | **48 GB** | (mérd meg) | 16 GB, most 10,6 GB szabad |
| Lemez | **468 GB, ebből 345 GB szabad** | (mérd meg) | /volume1: 14 TB · /volume2: 20 TB szabad |
| Architektúra | x86-64 | (mérd meg) | **x86-64** |
| Docker | (mérd meg) | — | 24.0.2 |
| Címe | — | `100.89.253.13` (Tailscale) · `192.168.1.188` (helyi háló) | `100.89.241.71` |
| Egyéb terhelés | néhány kisebb AI-szolgáltatás (lásd a kivételeket fent) | **a betöltött modell — ezért nem fordít** | **öt projekt, 27 doboz, éles oldalak** |

**Mindkét végpont x86-64** (a Gigabyte és a NAS), tehát a Gigabyte-on épített doboz a NAS-on
változtatás nélkül fut. Nincs szükség kereszt-fordításra.

**Mérve 2026-09-10-én:** a Gigabyte gépneve `gigabyte-z390-designare`, processzora i9-9900K
(8 mag / 16 szál), memóriája 48 GB, a `/home/gigabyte` alatti lemez 468 GB, ebből 345 GB szabad.
A Dell mindkét címén elérhető (ssh 22 és Ollama 11434 válaszol). A NAS: x86_64, 8 mag, 16 GB,
Docker 24.0.2, /volume2-n 20 TB szabad.

**A Gigabyte erőforrása bőven elég a fordításhoz.** 8 mag, 48 GB memória, 345 GB szabad hely —
egy projekt teljes fordítási készlete néhány gigabájt.

### Ami még hátravan a Gigabyte-on

```bash
docker --version          # ha hibát ad, ez az első teendő
df -h /var/lib/docker     # ide pakol a Docker — ugyanaz a 468 GB, vagy külön (kisebb) partíció?
```

Ha a Docker külön, kisebb partíción tárol, arra figyelni kell: a fordítási gyorsítótár hónapok
alatt észrevétlenül megeszik 50–100 GB-ot.

### A lemez tisztán tartása

Hetente-havonta, **a Gigabyte-on** (a NAS-on ezt SOHA — ott a lemezt végigmérő parancs tilos):

```bash
docker system df                       # mennyit foglal: képek, konténerek, gyorsítótár
docker builder prune --filter until=168h   # a HÉTNÉL régebbi fordítási gyorsítótár törlése
docker image prune                     # a névtelen, senkinek nem kellő képek
```

**Amit ne futtass gondolkodás nélkül:** `docker system prune -a` — ez a használaton kívüli
KÉPEKET is törli, és a következő fordítás mindent újra letölt.

---

## 2. A repó átvitele a Gigabyte-ra

### 2.1 Kulcs a tárhelyhez — személyenként külön

Minden kolléga **saját** kulcsot használjon, ne a projektét. Egyszer kell beállítani:

```bash
ssh-keygen -t ed25519 -C "kereszt.nev@aitmetica" -f ~/.ssh/id_github
cat ~/.ssh/id_github.pub          # ezt kell a GitHub-fiókjába felvenni (Settings → SSH keys)
```

Majd a `~/.ssh/config` fájlba:

```
Host github.com
  IdentityFile ~/.ssh/id_github
  IdentitiesOnly yes
```

**Miért külön kulcs:** ha valaki kilép vagy elveszti a gépét, egyetlen kulcsot kell visszavonni,
nem az egész projektét. A projektkulcs (deploy key) csak gépi folyamathoz való, emberhez nem.

### 2.2 Hova kerüljön a repó

```bash
mkdir -p ~/projektek
cd ~/projektek
git clone git@github.com:<szervezet>/<repo>.git
```

**Fontos: NE a Synology Drive-val szinkronizált mappába.** A szinkronizált mappa (`~/SynologyDrive/...`)
arra való, hogy fájlokat adjatok át egymásnak és a NAS-nak. Egy repó **nem** ilyen: a `.git` mappa
és a `node_modules` több tízezer apró fájl, amit a szinkron folyamatosan másolgatna — lassítja a
gépet, terheli a NAS-t, és a két oldal el is romolhat egymástól.

| Mi | Hova |
|---|---|
| Repó, `node_modules`, fordítás kimenete | `~/projektek/<repo>` — **nem szinkronizált** |
| Átadott fájlok, csomagok, jelszótár (vault) | `~/SynologyDrive/<projekt>` — szinkronizált |

### 2.3 Amit soha ne tegyetek a repóba

Jelszó, kulcs, API-token, `.env` valódi értékekkel. Ezek a szinkronizált mappa `vault` könyvtárába
valók, és a `.gitignore`-ban is szerepeljenek. A SaaS-projektben ez a minta:
`~/SynologyDrive/SaaS/vault/` — a kirakó szkript onnan olvassa, a repóban nyoma sincs.

---

## 3. A fordítás átvitele a NAS-ról a Gigabyte-ra

Három minta, romló sorrendben. **Az A a javasolt.**

### 3.1 „A" minta — a Gigabyte épít, a NAS csak betölti és futtatja

Ez a legkevesebb változtatás, és nem kell hozzá semmilyen külső szolgáltatás.

**Mit csinál:** a Gigabyte-on elkészül a kész doboz, egyetlen fájlba mentődik, átmegy a NAS-ra,
ott betöltődik, és a NAS csak elindítja. A NAS processzora percek helyett másodpercekig dolgozik.

A szkript ott fut, ahol a repó van: a Gigabyte-on. Nincs benne távoli gép.

```bash
#!/bin/bash
# kirak.sh — a forditas a GIGABYTE-on, a NAS csak futtat. Ezen a gepen kell futtatni.
set -euo pipefail

REPO=~/projektek/<repo>
KEP=<projekt>-app:helyi                 # ugyanaz a nev, amit a docker-compose.yml var
NAS=<felhasznalo>@100.89.241.71
TAVOLI=/volume2/docker/<projekt>

cd "$REPO"
git pull --ff-only

# 1. FORDITAS — ITT, a Gigabyte-on
echo "== forditas =="
docker build -t "$KEP" .

# 2. A kesz doboz egyetlen fajlba
echo "== csomagolas =="
docker save "$KEP" | gzip -1 > /tmp/$KEP.tgz
ls -lh /tmp/$KEP.tgz

# 3. Atvitel es betoltes a NAS-on (ez mar olcso)
echo "== atvitel es betoltes a NAS-on =="
gunzip -c /tmp/$KEP.tgz | ssh "$NAS" "sudo docker load"

# 4. Inditas — EPITES NELKUL
ssh "$NAS" "cd $TAVOLI && sudo docker compose up -d --no-build"
echo "== kesz =="
```

**A `--no-build` kapcsoló a lényeg.** Enélkül a NAS újra nekiáll fordítani, és pont azt nem
nyertük meg, amiért az egészet csináljuk.

**A lényeg a `--no-build` kapcsoló.** Enélkül a NAS újra nekiáll fordítani, és pont azt nem
nyertük meg, amiért az egészet csináljuk.

**Amire figyelj:**

- A `docker save` kimenete nagy lehet (több száz MB). A `gzip -1` gyors és eleget tömörít.
- Ha a doboz nem változott, ne is vidd át. `docker images --format '{{.ID}}' <kép>` — ha ugyanaz
  az azonosító, mint a NAS-on, kihagyható a lépés.
- **Csak a megváltozott dobozt vidd át**, ne az egész készletet.

### 3.2 „B" minta — közös képtár (több kolléga, több gép)

Ha többen raktok ki ugyanabba a projektbe, a fájlok kézi tologatása előbb-utóbb elromlik.
Ilyenkor a GitHub saját képtára (`ghcr.io`) a legegyszerűbb: privát, ingyenes a repóhoz, és nem
kell hozzá új szolgáltatást üzemeltetni.

```bash
# a Gigabyte-on, egyszer: bejelentkezés a képtárba (a token a vaultból, nem a repóból)
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-felhasznalo> --password-stdin

# minden kirakáskor
docker build -t ghcr.io/<szervezet>/<projekt>:$(git rev-parse --short HEAD) -t ghcr.io/<szervezet>/<projekt>:latest .
docker push ghcr.io/<szervezet>/<projekt> --all-tags

# a NAS-on (egyszer bejelentkezve): csak letölt és indít, nem fordít
ssh "$NAS" "cd $TAVOLI && sudo docker compose pull && sudo docker compose up -d --no-build"
```

**Előny:** nincs kézi fájlmásolás, minden kirakás verziószámot kap, vissza lehet állni egy
korábbi képre egyetlen paranccsal.
**Ár:** a NAS-nak is be kell jelentkeznie a képtárba (egy token, a NAS-on tárolva, 600-as joggal).

### 3.3 Ha a Gigabyte nincs bekapcsolva

**A kirakás vár.** Nem megy át a Dellre (az kiszorítja a nyelvi modellt a memóriából, és utána
minden AI-futás fizeti a hidegindítást), és semmiképp nem a NAS-ra.

Ha egy kirakás tényleg nem halasztható, az beszélgetés Portikkal — nem a szkript átírása menet
közben.

---

## 4. Ami nem doboz: klasszikus oldalak (PHP, statikus, WordPress)

A marosvasarhelyiek.ro, a transportlocal és hasonló oldalak nem dobozban futnak, hanem tárhelyen.
Ott a „fordítás" azt jelenti: `npm run build`, `vite build`, `webpack`, képek átméretezése,
CSS/JS összecsomagolása. **Ez is a Gigabyte-on történik.**

```bash
cd ~/projektek/<repo>
npm ci                 # vagy pnpm install --frozen-lockfile
npm run build          # a Gigabyte-on — a NAS-on SOHA
```

Utána **csak a kész kimenetet** kell feltölteni:

```bash
rsync -avz --delete dist/ <felhasznalo>@<tarhely>:/public_html/
```

**Amit soha ne tegyél a tárhelyre:** `node_modules`, forráskód, `.git`. A tárhely a kész oldalt
szolgálja ki, nem fejlesztőkörnyezet.

**Az éles kirakást Portik végzi** (cPanel, File Manager, phpMyAdmin) — a kolléga a kész csomagot
készíti elő és leírja a lépéseket, de nem lép be helyette és nem gépel jelszót.

---

## 5. Ami a NAS-on marad — és a közös kapu

Nem minden vihető el. A NAS-on marad:

- a dobozok **futtatása**
- az adatbázis
- az adatbázis-migrációk lefuttatása (rövid)
- a mentés

**Minden nehéz munka, ami mégis a NAS-on történik, a közös kapun át megy.** Ez nem javaslat,
hanem gépezet — a 2026-09-06-i összeomlás után készült:

```bash
K=/volume1/homes/Portik/kozos
$K/szabad-e.sh <projekt> || exit 5
trap "$K/elenged.sh <projekt>" EXIT
# ... itt jön a nehéz munka ...
```

A kapu megméri a szabad memóriát és a terhelést, és **egyszerre csak EGY projektet** enged nehéz
munkához. A napló: `/volume1/homes/Portik/kozos/naplo.txt`.

A mester példány a `marosvasarhelyiek` repóban van: `infra/synology/kozos/` (leírás:
`CSATLAKOZAS.md`). **A gépen lévő példányt soha ne szerkeszd** — azt az a projekt kirakása frissíti.

### A NAS-szabályok, amik továbbra is élnek

- Fordítás előtt/nehéz munka előtt: `free -m` és `uptime`. **3 GB szabad alatt vagy 20 fölötti
  terhelésnél ne indíts semmit.**
- Ne rakj ki kétszer közvetlenül egymás után.
- Soha ne futtass olyan parancsot, ami az egész lemezt vagy az összes dobozt végigméri
  (`docker system df`, teljes lemezes `find`, indexelés). Egy ilyen 2026-09-06-án percekre
  használhatatlanná tette a gépet.
- Naplózd, mit indítasz és meddig tart.
- Lassú gépet **soha ne kapcsolj ki** — az írás az, ami tönkremegy.

---

## 6. Ellenőrző lista: új projekt átvitele a Gigabyte-ra

1. [ ] Saját GitHub-kulcs a kollégának, a `~/.ssh/config` beállítva
2. [ ] Repó klónozva `~/projektek/<repo>` alá — **nem** a szinkronizált mappába
3. [ ] Titkok a `~/SynologyDrive/<projekt>/vault/` alá kerültek, a repóban nincsenek
4. [ ] `docker --version` működik a Gigabyte-on (ha nem: telepítés)
5. [ ] A projekt `docker-compose.yml`-je **rögzített képnevet** használ (`image: <projekt>-app:helyi`),
      hogy a betöltött kép illeszkedjen
6. [ ] A kirakó szkript a **Gigabyte-on** fordít, és a NAS-on `--no-build`-del indít
7. [ ] Az első kirakás után **mérve**: a NAS terhelése a kirakás alatt nem ment 20 fölé
8. [ ] A NAS-on futó nehéz lépés (ha maradt) a közös kapun megy át
9. [ ] A projekt naplójába bekerült, mikor mi futott és meddig

## 7. Hogyan bizonyítsd, hogy tényleg átkerült a fordítás

Ne a szkript írására hivatkozz, hanem mérj. Kirakás közben, egy másik ablakból:

```bash
ssh <felhasznalo>@100.89.241.71 'for i in $(seq 1 12); do
  echo "$(date +%H:%M:%S) terheles=$(uptime | sed "s/.*load average: //" | cut -d, -f1) szabad=$(free -m | awk "/^Mem:/{print \$7}")MB"
  sleep 10
done'
```

**Előtte** (a NAS fordít) a terhelés jellemzően 4–15 közé megy percekre.
**Utána** (a Gigabyte fordít) a NAS terhelése alig mozdul, és a kirakás a betöltés + indítás
másodperceire szűkül.

Ezt a két mérést tegyétek be a projekt naplójába — ez a bizonyíték, nem a szándék.

---

## 7b. Amit az ELSŐ átállításnál tényleg tapasztaltunk (SaaS, 2026-09-10)

**Az eredmény, mérve:**

| | A NAS fordított | A Gigabyte fordít |
|---|---|---|
| A fordítás ideje | 4–5 perc | **65 másodperc** |
| A NAS terhelése közben | felment | **1,6 → 1,6-1,7, meg sem mozdult** |
| A NAS-ra átmenő adat | 2 MB forrás, aztán ott épült minden | 2 MB forrás + **170 MB kész doboz** |
| A NAS munkája | teljes újraépítés | betöltés: másodpercek |

A 170 MB átvitele bőven megéri: a NAS-nak lemezt írni olcsó, processzoron dolgozni drága.

**Három buktató, amibe belefutottunk — nálatok is elő fog jönni:**

1. **A `git clone` nem megy nem üres mappába.** Ha a projekt mappája már létezik (akár csak egy-két
   üres alkönyvtárral), a klónozás megtagadja, és a hiba könnyen elsiklik. Ilyenkor:
   ```bash
   cd ~/projektek/<repo>
   git init -q .
   git remote add origin git@github.com:<szervezet>/<repo>.git
   git fetch origin main && git checkout -f -B main FETCH_HEAD
   git branch --set-upstream-to=origin/main main
   ```

2. **A kulcs jogai.** Az ssh megtagadja a kulcsot, ha az nem csak a tulajdonosnak olvasható
   („bad permissions"). A Synology Drive-val szinkronizált mappában lévő kulcs jogai nem
   megbízhatók — **másold a helyére szigorú joggal**:
   ```bash
   install -m 600 ~/SynologyDrive/<projekt>/vault/github-kulcs ~/.ssh/id_<projekt>
   cd ~/projektek/<repo> && git config core.sshCommand "ssh -i ~/.ssh/id_<projekt> -o IdentitiesOnly=yes"
   ```

3. **A két Docker verziókülönbsége nem okozott gondot** — de csak azért, mert a fordítás eleve a
   `--provenance=false --sbom=false` kapcsolókkal ment. Enélkül a NAS `docker load`-ja
   elutasíthatta volna a csomagot. **Ne hagyd ki ezt a két kapcsolót.**

## 8. Amit ez az útmutató nem old meg

- **A Gigabyte memóriáját és szabad lemezét nem mértem** — a gazdagépen egy parancs (1. fejezet).
  A processzor átlátszott: i9-9900K, 8 mag / 16 szál, az bőven elég.
- **A Dell adatait sem mértem** — nincs belépésem a gépre. Az AI-oldalt ez most nem akadályozza.
- A Gigabyte nincs mindig bekapcsolva. Ha a kirakás időzített kell legyen, az ütemezés a NAS dolga
  — de akkor is csak a **futtatás**, nem a fordítás.
- A tárhelyes oldalak élesítése Portik kezében marad.
- Ha egy projekt fordítása több memóriát kér, mint amennyi a Gigabyte-on van, az külön beszélgetés
  — a NAS-ra visszatolni akkor sem szabad.
- A Gigabyte-on futó kisebb AI-szolgáltatások (whisper, TTS) a szabály tudatos kivételei; ha
  valamelyik zavarni kezdi a fordítást, akkor kerül a Dellre.
