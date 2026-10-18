# Üzemeltetési kézikönyv — Kommunikációs munkatér (teszt/pilot)

**Kelt: 2026-09-09 (E-40).** Ez a lap arra való, hogy ha baj van, **ne kelljen kitalálni, mit tegyünk**.
Emberi nyelven van írva; a részletes műszaki leírás a `docs/RENDSZERLEIRAS.md`.

> **Az üzemeltetési felelős személye még nincs kijelölve (D-21).** Amíg nincs, a felelős
> **Portik Vilmos**, a technikai lépéseket pedig a Claude-munkamenet végzi. A pilot előtt ezt
> ki kell mondani, és azt is, hogyan szóljon a rendszer, ha baj van (telefonos értesítés, e-mail, semmi).

---

## 1. Mi hol fut

| Mi | Hol | Megjegyzés |
|---|---|---|
| A rendszer (weboldal + adatbázis) | `transzmozaik` NAS, `/volume2/docker/aitmetica-saas` | öt projekt osztozik a gépen |
| A tesztoldal | `https://saas.mediapartizan.ro` | jelszó nélkül nyilvános (D-05), keresőktől kitiltva |
| Az élő állapotlap | `https://saas.mediapartizan.ro/allapot/` | ezt bárki megnézheti |
| A második rendszer | `https://saas.mediapartizan.ro/referencia/` | a hordozhatóság bizonyítéka (A-12) |
| A nehéz AI | Dell munkaállomás, helyi hálózat | ha ez áll, az értékelés áll |
| A mentések | NAS `volume1`, `homes/Portik/mentesek/aitmetica-saas` | másik kötet (D-18) |
| A kód | privát GitHub-tárhely (`Tolgyes/aitmetica-saas`) | |
| A belépések | `vault/` a SaaS mappában | soha nem kerül kódba, felhőbe, chatbe |

---

## 2. Napi és heti teendők

| Mikor | Mi | Hogyan |
|---|---|---|
| naponta (magától) | mentés | a NAS feladatütemezője futtatja a `mentes.sh`-t — **ezt még be kell állítani** (`docs/MENTES.md` 3. fejezet) |
| hetente | a mentés ellenőrzése | `visszaallit-proba.sh` — visszatölti a legfrissebb mentést egy külön adatbázisba és összeveti az élessel |
| hetente | a `_torolni/` mappa ürítése | a lejárt mentéseket a szkript oda teszi, **nem törli** — Vilmos üríti |
| havonta | a költséglap átnézése | `/koltseg` a rendszergazda-fiókkal: melyik ügyfél mennyit használt |
| havonta | a hozzáférésnapló átnézése | `belepesi_kiserlet` tábla: ki mikor próbálkozott |

---

## 3. Ha baj van — mit tegyünk

### A tesztoldal nem felel
1. Nézd meg a NAS-t: fut-e, mennyire terhelt (`free -m`, `uptime`).
2. Ha a gép megy, de az oldal nem: a dobozok újraindítása (`docker compose up -d`).
3. **Lassú gépet ne kapcsolj ki** — az írás közbeni áramtalanítás az, ami tényleg tönkretesz.
4. Ha a NAS lassú: a 2026-09-06-i eset a dobozkezelő vezérlőprogramjának szivárgása volt
   (`NAS-szabalyok.md`) — nem memóriahiány, memóriát bővíteni nem megoldás.

### Az AI nem válaszol
- A felületen `AI_NEM_ELERHETO` jelenik meg, a hírek letöltése és a lista megy tovább.
- Nézd meg, megy-e a Dell, és fut-e rajta a modell.
- Ez **nem adatvesztés**: a feldolgozatlan cikkek megmaradnak, a következő futás felveszi őket.

### Elfogyott egy ügyfél kerete
- A felületen kiírja, hogy miért állt meg. A hírek gyűlnek tovább.
- A rendszergazda a `/koltseg` lapon megemelheti a keretet; új hónapban magától nulláról indul.

### Valakit kizárt a rendszer (rossz jelszó)
- A zár 15 perc után magától felenged.
- Sürgős esetben a rendszergazda ad egy egyszer használatos, egy óra alatt lejáró visszaállító linket.

### Vissza kell állítani egy mentésből
- **A pontos lépések: `docs/MENTES.md` „A valódi visszaállítás" fejezete.** Röviden: a rendszer
  leáll, a mentés visszatöltődik, a rendszer elindul, és utána ellenőrizni kell, hogy megy-e.
- **Előtte mindig fusson a `visszaallit-proba.sh`**, hogy tudjuk, a mentés ép.

### Betelik a lemez
- Egy cikk 3,3 kB; 120 ügyfélnél ez évi ~4,3 GB (E-37). Ez évekig nem kerül elő.
- Ha mégis: a régi mentések a `_torolni/` mappában várnak.

---

## 4. Amit soha nem csinálunk

- **Nem futtatunk egész lemezt vagy minden dobozt végigmérő parancsot a NAS-on.** Egy ilyen mérés
  2026-09-06-án órákra használhatatlanná tette a gépet, három projekt oldalával együtt.
- **Nem rakunk ki egymás után többször** — a változásokat összevárjuk. Hibajavítás a kivétel, mérés után, naplózva.
- **Nem futtatunk két projekt összerakását egyszerre** — erre való a közös kapu (`szabad-e.sh`).
- **Nem kapcsolunk ki lassú gépet.**
- **Az adatbázishoz csak olvasási joggal nyúlunk**, hacsak Vilmos mást nem mond.

---

## 5. Hol látszik, mi történik

| Mit akarok tudni | Hol nézzem |
|---|---|
| Hol tart a munka | `https://saas.mediapartizan.ro/allapot/` |
| Mit csinált a rendszer az AI-val, és mennyiért | `/koltseg` (rendszergazdaként minden ügyfél, tagként a sajátom) |
| Ki próbált belépni | `belepesi_kiserlet` tábla (30 nap) |
| Mi történt a NAS-on | `NAS-NAPLO.md` a tárhelyen; `kozos/naplo.txt` a gépen |
| Mibe kerültek a fejlesztő ágensek | `docs/agens-naplo.jsonl` |
| Mi hagyja el a rendszert | `docs/ADATUT.md` |
| Mi a rendszer teljes leírása | `docs/RENDSZERLEIRAS.md` |
| Mit tud a tesztelő végigpróbálni | `docs/TESZTELESI-UTMUTATO.md` |

---

## 6. Kinek mit kell tudnia

- **Az üzemeltetési felelős** (D-21 után): ezt a lapot és a `NAS-szabalyok.md`-t.
- **A tesztelő**: `docs/TESZTELESI-UTMUTATO.md`.
- **Az ügyfél**: semmit ebből — neki a felület és az `docs/ADATUT.md` tartalma szól.
- **Egy külső biztonsági szakértő**: `docs/ADATUT.md`, `docs/ELFOGADASI-JEGYZOKONYV.md`,
  `docs/RENDSZERLEIRAS.md` 10. fejezet.
