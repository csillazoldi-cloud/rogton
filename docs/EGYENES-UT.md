# Az egyenes út — hogyan dolgozunk ezután

**Vilmos döntése, 2026-09-11: „mehet". Ez a lap váltja a fejlesztés és a kirakás eddigi rendjét.**
Előzmény: `GEPHAZ-ELMELET.md` (az elmélet) és `GIGABYTE-ES-MUNKAKORNYEZET.md` (a mai mérések).

---

## 1. Mi volt a baj — egy mondatban

Minden út átment valamin, ami nem a miénk, és ami alattunk megváltozott: a Claude kis gépének
hálózatán, a fájlhídján, a távvezérlésén. A gépezet egy szerszám belsejére épült. 2026-09-11-én a
szerszám megváltozott, és megállt a feltöltés, a fordítás, a kirakás — egyszerre.

**A tanulság:** a gépezet nem függhet semmilyen Claude-felülettől.

---

## 2. A próba, amivel minden tervet megmérünk

> **Ha holnap minden Claude eltűnik, mi áll meg?**
>
> **Jó válasz:** csak az új kód írása. A fordítás, a kirakás, a mentés magától megy tovább.
> **Ha bármi más megáll, a terv rossz.**

A 2026-09-11 előtti rend ezen megbukott: minden megállt. Az alábbi rend átmegy rajta.

---

## 3. Mi az, ami ma is áll — ehhez nem nyúlunk

A kód otthona a **GitHub**: `Tolgyes/aitmetica-saas`, privát. Kezdettől ott tároljuk, és ott is marad.
Nem építünk mellé semmit, és nem költöztetünk sehova.

Ez azért jó otthon, mert **a világ bármely pontjáról elérhető**, Tailscale nélkül is. Mérve
2026-09-11-én egy felhős munkamenetből: `api.github.com` → 200, `git ls-remote` HTTPS-en → működik.

*(A saját git-szerver — Forgejo — terve ezzel elévült mint munkapont. Ha később kell házon belüli
másolat, az a GitHub tükre lesz, nem a helyettesítője. Lásd a 11. pontot.)*

---

## 4. A szerepek

| Ki | Mi a dolga | Mi nem a dolga |
|---|---|---|
| **GitHub** — *otthon* | a kód és a teljes előzménye; innen dolgozik mindenki és a robot is | nem fordít, nem futtat |
| **Gigabyte** — *műhely* | magától megnézi a GitHubot; fordít; próbál; a **kész dobozt** viszi a NAS-ra; éjjel ment | nem munkahely: senkinek nem kell rajta ülnie, se belépnie |
| **NAS** — *üzem* | a kész dobozokat elindítja és futtatja | **soha nem fordít, nem szkennel** |
| **Ti hárman** (+ a Claude-jaitok) | kódot írtok, és feltöltitek a GitHubra | semmi más |
| **Mac, telefon, laptop** | ablak, amin át beszéltek | semmi nem függ tőlük |

---

## 5. Amit elveszünk — három dolog

### 5.1 A NAS ne fordítson

**Ma:** a `nas/kirak.sh` a NAS-on futtat `docker compose build`-et (a fő ág és a `--hid` ág is).
Ettől fullad meg a NAS.

**Ezután:** a Gigabyte rakja össze a dobozokat, és a **kész képeket** viszi át
(`docker save` → átvitel → `docker load`). A NAS-on nincs fordítás, csak betöltés és indítás —
másodpercek. Szkript: `nas/kirakas-gigabyte.sh`.

*Az első futás után írjuk be ide, mekkora a képcsomag és mennyi az átvitel.* Ha ez lassúnak bizonyul,
a következő lépés egy csomagtár a Gigabyte-on, hogy csak a változott rétegek menjenek át — de csak
mérés után, nem elővigyázatosságból.

**A képgyártó (R-16 K6, 2026-09-30):** a képgyártó nem a NAS-on fut, hanem a Gigabyte-on (`km-kepgyar` doboz, 8601-es kapu, V-6).
A robot a teljes kirakás **2b.** lépésében építi újra (`bash apps/kepgyar/indit.sh --ha-valtozott`), a web-dobozok NAS-ra vitele
ELŐTT — de csak ha az **ujjlenyomata** változott: a `apps/kepgyar/Dockerfile` COPY-forrásai (a Dockerfile-ból olvasva) és maga a
Dockerfile, a HEAD-ben rögzített tartalommal (`git ls-tree -r HEAD … | sha256sum`), a doboz `km.kepgyar.ujjlenyomat` LABEL-jében.
Változatlanul: „képgyártó: változatlan (<8 jel>)”, építés nincs. Ha az építés vagy az életjel elbukik, a kirakás megáll (2-es kód),
a NAS-hoz nem nyúl. Kézzel (mindig épít): `bash apps/kepgyar/indit.sh`; csak az ujjlenyomat: `bash apps/kepgyar/indit.sh --ujjlenyomat`.

### 5.2 A kirakás ne menjen Claude-munkameneten át

**Ma:** valaki elindít egy szkriptet egy munkamenetből. Ha a munkamenet nem érhető el, nincs kirakás.

**Ezután:** a Gigabyte-on egy magától induló szolgáltatás percenként megnézi, változott-e a fő ág.
Ha igen, rááll és kirak. Nincs bejövő kapcsolat, nincs híd, nincs munkamenet. Ha a gép ki volt
kapcsolva, bekapcsolásnál behozza a lemaradást. Szkript: `tools/gigabyte-robot/`.

**Húz, nem tolnak bele.** Ez a lényeg: kívülről senkinek nem kell elérnie a Gigabyte-ot.

### 5.3 A kód ne hídon át jusson a GitHubra

**Ma:** a kód egy Claude kis gépén át, kerülővel jut fel.

**Ezután:** mindenki közvetlenül tölti fel — a saját gépéről vagy a saját Claude-jából, HTTPS-en,
a saját belépőjével. Nincs közös csatorna, amit el lehet rontani.

---

## 6. Amit hozzáteszünk — egyetlen dolog

**Éjszakai mentés.** Minden éjjel a teljes kód, teljes előzménnyel, **egyetlen fájlba**
(`git bundle`) a `SynologyDrive/SaaS/mentes-kod/` mappába. A Synology Drive magától átviszi a NAS-ra.
Az utolsó 7 marad, a régebbiek a `_torolni/`-be.

Miért kell, ha a GitHubon ott a kód: mert így **nem a GitHub az egyetlen példány**. Ha a fiók, a cég
vagy a hozzáférés bármi miatt elesik, a kód a te lemezeden is megvan, visszaállítható állapotban.

**Negyedévente egyszer** vissza kell állítani belőle egy próbamásolatot. A nem kipróbált mentés
remény, nem mentés.

---

## 7. A napi munka

1. Mindenki **saját ágon** dolgozik (`nev/mit-csinal`), kis lépésekben.
2. Kész → feltölti → beolvasztja a fő ágba.
3. A fő ág változása **magától** indítja a kirakást. Egyszerre egy fut.
4. A robot a végén szól: zöld vagy piros. Minden körről egy sor a `docs/robot-naplo.jsonl`-be.
5. A „kész" változatlan: **kint a teszten + élőben ellenőrizve + Vilmos megkapta a képernyőképet.**
   Képernyőkép: `bash tools/kepernyokep.sh` (a Gigabyte a NAS-ra irányítva éri el a tesztoldalt).

Amíg a robot dolgozik, ti dolgoztok tovább. A kód a GitHubon van, nem egy gépen.

---

## 8. Mi történik, ha valami kiesik

| Eset | Mi áll meg | Mi megy tovább |
|---|---|---|
| A Gigabyte alszik, újraindul, elromlik | a kirakás | mindhárman dolgoztok; a kód felmegy; a robot induláskor behozza a lemaradást |
| A NAS terhelt | a kirakás utolsó lépése | a fordítás és a próbák lefutnak a Gigabyte-on |
| A GitHub akad | a közös munka | a Gigabyte az utolsó állapotból tud kirakni; az éjszakai mentésből visszaállítható minden |
| Valakinek nincs nete | ő | a másik kettő |
| **Bármelyik Claude-felület megváltozik** | **semmi** | **minden** — ez volt a cél |

---

## 9. Belépők

| Mi | Hol van | Visszavonható? |
|---|---|---|
| Mindenki saját GitHub-belépője | a saját gépén / a saját Claude-jában | igen, egy kattintás; csak ezt az egy tárolót éri el |
| A Gigabyte GitHub-kulcsa | a gépen, a repó mellett | igen |
| A NAS belépése | `vault/nas-belepes.txt` | — |
| Az adatbázis jelszavai | `vault/adatbazis-belepes.txt` | — |

**A belépő soha nem kerül csevegésbe, kódba, a tárolóba.** Mindenki a sajátját használja: ha valaki
kilép a csapatból, az ő belépőjét vonjuk vissza, a többiek munkája nem áll meg.

Jog, amit adni kell: a tárolóra szűkített `Contents: Read and write` és `Pull requests: Read and write`.
Semmi más. Lejárat 90 nap.

---

## 10. Bevezetés

**Egy parancs a Gigabyte-on**, a tároló mappájában:

```
bash tools/gigabyte-robot/telepit.sh
```

Ez megnézi, megvan-e minden, beállítja a robotot és az éjszakai mentést magától induló
szolgáltatásnak, és gondoskodik róla, hogy bejelentkezés nélkül is fusson. Ha valami hiányzik,
megáll és megmondja, mi — és nem állít be semmit. Bármikor újra futtatható.

Nem neked kell lefuttatnod: bárki megteheti, akinek van hozzáférése a Gigabyte-hoz.

Ami a parancson kívül marad:

| # | Lépés | Ki | Idő |
|---|---|---|---|
| 1 | Megnézni, a meglévő `nas/gigabyte-kirak.sh` hol fordít; ha a NAS-on, leváltani | aki telepít | 15 perc |
| 2 | Egy éles kirakás végignézve + képernyőkép | aki telepít | 20 perc |
| 3 | Telefonos értesítés bekötése az `uzenet.sh`-ba | aki telepít | 15 perc |
| 4 | A másik két ember belépője és első feltöltése | ők | 15 perc/fő |
| 5 | **A próba elvégzése:** minden Claude leállítva a gépen → a kirakás és a mentés attól még lefut | aki telepít | 15 perc |

Az 5. lépés nem formalitás. **Amíg az nincs meg, a terv csak papír.**

---

## 11. Amit ez a terv nem old meg

- **Házon kívüli mentés** két távoli helyre (K-9) — halasztva, a `GEPHAZ-ELMELET.md` 5. fejezete.
- **A vault titkosítatlan** — nem ennek a lapnak a dolga, de nyitott kérdés marad.
- **A NAS kívülről nyitott portjai** (DSM, Drive, WebDAV) — ellenőrizendő, ütközik a K-3-mal.
- **A szerep-rendszerhez nincs beállító felület** — ma minden fiók a saját munkaterének tulajdonosa.
- **A többi projekt** (transportlocal, marosvásárhelyiek) egyelőre marad, ahogy van. Egyenként, később.

---

## 12. Honnan tudjuk, hogy működik

Negyedévente, egy óra:

1. A 2. pont próbája: minden Claude leállítva → a kirakás és a mentés lefut-e.
2. Az éjszakai mentésből egy visszaállítás próbamásolatba.
3. A `docs/robot-naplo.jsonl` átnézése: volt-e piros kör, és megoldódott-e.

Az eredményt ide, a lap aljára írjuk, dátummal.
