# E-37 — Terhelési mérés: mennyi fér el ezen a gépen

**Mérve: 2026-09-09, a futó tesztrendszeren** (`transzmozaik` NAS + a Dell munkaállomás AI-ja).
A látogatói terhelést kívülről, a felhőből mértem; a memóriát és az adatbázist a gépen, csak olvasva.

**Amit tudatosan NEM csináltam:** nem terheltem a NAS-t addig, amíg el nem törik. Azon a gépen öt
projekt fut, és egy ilyen mérés 2026-09-06-án órákra használhatatlanná tette. Ehelyett **egy ügyfél,
egy forrás és egy cikk fajlagos költségét mértem meg**, és abból számoltam a határt. A számítás
minden bemenete mért adat, és alább ott van mellette.

---

## 1. A rövid válasz

| Kérdés | Válasz |
|---|---|
| Mi a szűk keresztmetszet? | **Az AI ideje. Nem a memória, nem a lemez, nem a webkiszolgáló.** |
| Hány ügyfél fér el? | **kb. 120**, ha a napi futásaik egy 6 órás éjszakai ablakban oszlanak el, ügyfelenként napi ~30 új cikkel |
| És ha mindenki ugyanarra az órára kéri? | **kb. 20 ügyfél** — az AI sorban, egyesével dolgozik |
| Hány látogató? | 60 egyidejű oldalletöltésnél sem romlott semmi (lásd 3. pont) — ez nem korlát |
| Mennyi hely kell? | ügyfelenként napi ~100 kB; 120 ügyfélnél **kb. 4,3 GB/év** |
| Hol törik el először? | az AI-gép: sorban dolgozik, és ha áll, minden áll |

---

## 2. Az idő — ez a valódi korlát

**Mért adat 11 valódi futásból** (`hf_futas` tábla, csak olvasva):

| Amit mértem | Érték |
|---|---|
| futás új cikk nélkül | **1,3 másodperc** (ma, a második rendszeren mérve) |
| futás 9–10 új cikkel | 53–71 másodperc |
| futás 32–33 új cikkel | 128–185 másodperc |
| **egy új cikk teljes feldolgozása** | **5,8 másodperc** (11 futás, átlagosan 20 új cikk/futás) |

**Az egyes AI-hívások ideje a Dellen** (`ai_hivas` tábla, 839 hívás, középső érték):

| Feladat | Hívások | Középső idő |
|---|---|---|
| relevancia (cikkenként egy) | 242 | **5,2 mp** |
| ugyanaz-az-esemény (összevonás) | 498 | 1,7 mp |
| szabály-javaslat | 3 | 11,5 mp |
| beállítás-javaslat | 2 | 4,8 mp |

**Két dolog teszi ezt kemény korláttá:**

1. **A rendszer egyszerre EGY munkát futtat** (a várólista így épült, D-13). Két ügyfél futása nem
   megy párhuzamosan.
2. **Egy AI-gép van**, és az is sorban dolgozik. A cikkek feldolgozása nem osztható szét.

### Amit ebből számolni lehet

| Ha a napi futások ebben az ablakban oszlanak el | Feldolgozható új cikk / nap | Ennyi ügyfél (napi 30 új cikkel) |
|---|---|---|
| 1 óra (mindenki ugyanakkor) | ~620 | **~20** |
| 6 óra (éjszaka) | ~3 700 | **~120** |
| 24 óra (a gép 100%-on, tartalék nélkül) | ~14 900 | ~490 — **nem reális** |

**A használható szám: kb. 120 ügyfél**, ha a napi futásaik szét vannak húzva. Efölött a sor
feltorlódik: a futások egyre később készülnek el, végül egy nap munkája nem fejeződik be a
következő nap kezdetéig.

---

## 3. A látogatói terhelés — ez nem korlát

Kívülről, a felhőből mérve a tesztoldal főoldalán:

| Egyidejű látogató | Kérés | Hibátlan | Középső válaszidő | Átbocsátás |
|---|---|---|---|---|
| 1 | 5 | 5 | 1 174 ms | 0,8 kérés/mp |
| 5 | 25 | 25 | 1 078 ms | 3,9 kérés/mp |
| 10 | 50 | 50 | 961 ms | 8,8 kérés/mp |
| 20 | 100 | 100 | 957 ms | 18,7 kérés/mp |
| 40 | 200 | 200 | 929 ms | 32,3 kérés/mp |
| **60** | **300** | **300** | **985 ms** | **49,3 kérés/mp** |

**Egyetlen hiba sem volt, és a válaszidő 60 egyidejű látogatónál sem romlott.** Az oldal betöltése
kb. egy másodperc — ez nem a terheléstől függ, ennyi a lap előállítása.

A NAS terhelése közben 1,7 és 2,2 között maradt (a NAS-szabályok határa 20).

---

## 4. A memória — bőven van tartalék

| Doboz | Nyugalomban | Terhelés alatt | Korlát | Kihasználtság |
|---|---|---|---|---|
| alkalmazás | 113,6 MB | **143 MB** | 512 MB | 28% |
| adatbázis | 78,4 MB | 88,3 MB | 384 MB | 23% |
| webkiszolgáló | 9,5 MB | 9,5 MB | 64 MB | 15% |
| AI-híd | 22,7 MB | — | 768 MB | 3% |
| **második rendszer (referencia)** | **164 MB** | — | **256 MB** | **64%** |

**Egy dolog kilóg:** a második rendszer (referencia-host) a korlátjának a kétharmadánál ül **munka
nélkül**. Ez ma nem okoz bajt (bemutató célú), de ha valódi munkát kapna, **a korlátját meg kell emelni**.

A NAS-on a mérés alatt 10,5 GB volt felszabadítható a 16-ból.

---

## 5. A lemez — évekig nem korlát

| Amit mértem | Érték |
|---|---|
| a teljes adatbázis ma | **11 MB** (262 cikkel, 66 fiókkal, 16 szervezettel) |
| egy cikk kivonata | 1 969 bájt |
| egy találat | 1 313 bájt |
| **egy feldolgozott cikk összesen** | **kb. 3,3 kB** |
| a feliratok (nem nő az ügyfelekkel) | 440 kB |

**Számolva:** 120 ügyfél × napi 30 cikk × 365 nap × 3,3 kB ≈ **4,3 GB/év**. A NAS-on ez elfér.

---

## 6. Hol törik el — sorrendben

1. **Az AI-gép ideje.** Ez az első fal, és a fentiek szerint kb. 120 ügyfélnél jön el. Ami segít:
   több AI-gép, párhuzamos feldolgozás, vagy kisebb/gyorsabb modell a relevancia-vizsgálathoz.
2. **Az AI-gép kiesése.** Ha a Dell nem elérhető, **minden megáll** — ezt 2026-09-08-án élesben
   láttuk. Egy gépen múlik az egész modul.
3. **A második rendszer memóriakorlátja** (256 MB, ma 64%-on) — ha valódi terhelést kap, emelni kell.
4. **A lemez** — évekig nem korlát.
5. **A webkiszolgáló és a memória** — 60 egyidejű látogatónál sem látszik.

---

## 7. Amit ebből érdemes tudni a pilothoz

- **Egy pilot-ügyfél bőven elfér.** A mai terhelés a gép töredéke.
- **A napi futásokat szét kell húzni**, nem szabad mindenkit ugyanarra az órára tenni. Ma az
  ütemezés ügyfelenként állítható — ez a képesség megvan, csak használni kell.
- **A növekedés első költsége az AI-gép**, nem a tárhely és nem a webkiszolgáló.
- **Ami a mérésből kimaradt:** nem mértem sok ügyfél EGYIDEJŰ futását (nem akartam a NAS-t
  padlóra vinni), és nem mértem a modell hidegindítását sem (a modell a mérés alatt már be volt
  töltve a Dell memóriájába). A hidegindítás korábbi mérés szerint kb. 40 másodperc — ez az első
  napi futást lassítja, a többit nem.
