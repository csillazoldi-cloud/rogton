# Rajz-feladat a Claude Designnak — R-1 · Kezdőképernyő és navigáció · **javítókör**

Kommunikációs munkatér · Aitmetica SRL · 2026-09-12
Előzmény: a `design/r1-kezdokepernyo/` átadott rajza (v2) és az `ELLENORZES.md`.
**Ez nem új rajz.** A meglévő hét artboard marad; egy nyolcadik jön hozzá, és öt tétel javul.

A rajz átment az ellenőrzésen: beégetett szín, betű, betűméret és lekerekítés **nulla**,
mind a hét artboard megvan, 86 felirat-kulcs hiánytalanul három nyelven. Ez a kör nem ezeket
bántja.

---

## 1. Amit Vilmos azóta eldöntött

**D4 · A Gépház a tulajdonosnak is látszik — de nála csak két csempével.**
A Theme-beállítások és a Feliratok két szinten működnek: van közös alap, amit a rendszergazda
állít, és van szervezeti felülírás, ami a munkatér tulajdonosáé. Ha a Gépház csak a
rendszergazdának látszik, a tulajdonos a saját felülírását nem éri el — vagyis lenne egy
funkció, amit senki nem tud használni. Ezért a Gépház ajtaja neki is megjelenik, de **mögötte
csak a Theme-beállítások és a Feliratok csempe van. A Költség és a Fiókok nem.**

Ez az ellenőrzés 5. pontjában leírt ellentmondást zárja le: a feladatlap 4. pontja szerint a
Theme és a Feliratok „a tulajdonosé is", a 7. pont szerint a Gépház csak rendszergazdáé volt.
**A 4. pont marad érvényben, a 7. pont ehhez igazodik.**

**D5 · A pénznem négy lehet: euró · dollár · forint · lej.**
Nem árfolyamból számolunk: minden összegnek **négy tárolt értéke** van, és az ügyfél a sajátját
látja. A rajzon ma az AI-keret euróban áll — ez maradhat a példa, de a rajz **mondja ki**, hogy
a pénznem a munkatér beállítása, nem beégetett érték.

**D6 · A hírfigyelő csempéjén nincs indítógomb.** A csempe a hírfigyelőre visz, a futtatás ott
marad, ahol ma is. Ez így van megrajzolva — **ne kerüljön vissza gomb.**

**D7 · A térköz-skála él (R-0).** Tizenöt fok, `--ter-0` … `--ter-14`, a holtversenyt a sűrűbb
fok nyeri. Az R-1 rajza még a skála előtt készült — lásd a 3. pontot.

## 2. A nyolcadik artboard

| # | Mit | Méret |
|---|---|---|
| 8 | **Gépház — tulajdonos nézet**: két csempe (Theme-beállítások, Feliratok), a Költség és a Fiókok **meg sem jelenik** | asztali 1440 |

És ami emiatt a meglévő artboardokon változik:

- az **1. artboard** (tulajdonos) felső sávjába bekerül a **Gépház**
- az **5. artboard** (telefon) lenyílójába ugyanígy
- a **4. artboard** (Gépház, rendszergazda) változatlan — ott mind a négy csempe marad
- a **Mentetlen tervezet** csempe ezzel értelmet nyer a tulajdonosnál is: mostantól tényleg el
  tudja érni azt a lapot, amin a tervezete van

**Amit a rajz mondjon ki a 8. artboardon:** a tulajdonos itt a **saját munkaterére** állít, nem
a rendszer egészére. Egy mondat, hogy amit itt átír, az csak az ő munkaterére hat.

## 3. A rajz átáll a térköz-skálára — ez a kör legnagyobb tétele

Megmértem az átadott rajzot: **380 helyen áll benne pixelben a térköz, 20 különböző értékben.**
Ezek helyére a fokok kerülnek. Az átállási kulcs, a te rajzodra kiszámolva:

| Mai érték | Hányszor | Fok | Elmozdulás |
|---|---|---|---|
| 1px | 8 | **`--ter-1` (2px)** — lásd a kivételt lent | +1 |
| 2px | 24 | `--ter-1` (2px) | 0 |
| 3px | 6 | `--ter-1` (2px) | −1 |
| 4px | 28 | `--ter-2` (4px) | 0 |
| 6px | 19 | `--ter-3` (6px) | 0 |
| 7px | 29 | `--ter-3` (6px) | −1 |
| 8px | 109 | `--ter-4` (8px) | 0 |
| 9px | 16 | `--ter-4` (8px) | −1 |
| 10px | 52 | `--ter-5` (10px) | 0 |
| 12px | 16 | `--ter-6` (12px) | 0 |
| 13px | 1 | `--ter-6` (12px) | −1 |
| 14px | 34 | `--ter-7` (14px) | 0 |
| 16px | 11 | `--ter-8` (16px) | 0 |
| 24px | 18 | `--ter-10` (24px) | 0 |
| 26px | 1 | `--ter-10` (24px) | −2 |
| 40px | 2 | `--ter-12` (40px) | 0 |
| 48px | 1 | `--ter-12` (40px) | −8 |
| 56px | 1 | `--ter-13` (56px) | 0 |
| 70px | 3 | `--ter-14` (80px) | +10 |
| 90px | 1 | `--ter-14` (80px) | −10 |

**A rajz 380 térközéből 320 nem mozdul, 55 mozdul egy pixelt, és összesen öt hely változik
2 pixelnél többet** — a 48-as, a három 70-es és a 90-es. Mind nagy szakaszköz, tehát a
szerkezet nem borul; ezt az ötöt viszont nézd meg szemmel.

**Egy kivétel, amit nevesítek:** a **0. fok nem kerekítési cél.** Az `--ter-0` a *nincs köz*
esete, és csak oda jár, ahol ma is 0 áll. Az `1px` ezért a `--ter-1`-re megy, nem a nullára —
egy jelvény egy pixeles belső tere nem ugyanaz, mint a semmi.

**Amit ezen felül kérek:** ha az átállás közben olyan hely kerül elő, ahova egyik fok sem illik
jól, **az nem kivétel, hanem a lépcső hibája** — írd a `kerdesek.md`-be, és mondd meg, melyik
fok hiányzik. Ne írj vissza pixelt.

## 4. A három hiányzó felirat-kulcs

A rajzon ott a `data-fkulcs`, a `feliratok.json`-ból kimaradt. Kell mind a három nyelven:

| Kulcs | Ami a rajzon áll |
|---|---|
| `nav.ez_a_munkater` | „Ez a munkatér" |
| `nav.tagok` | „Tagok" |
| `nav.tagok_szam` | „3 tag · 1 függő meghívó" — a szám adat, a szerkezet felirat |

A 8. artboard új szövegei szintén kerüljenek bele.

## 5. A 6. artboard felirata javul — a D3 elévült

A 6. artboard „A · EGY MUNKATÉR" sávjának felirata ma azt mondja: *„a név sima szöveg, váltó
nélkül"*. A megrajzolt elem viszont ott is lenyíló, nyíllal.

**A rajz a helyes, a felirat az elavult.** Az R-2 óta a munkatér neve **mindig lenyíló**, mert
bekerül a *Tagok* sor, és így egy munkaternél sem üres — vagyis nem sérül a „halott vezérlő
tilos" szabály. Az R-1 eredeti D3 döntése ezen a ponton elévült.

A felirat mondja ezt ki, és a két sáv címe ehhez igazodjon: a különbség nem az, hogy van-e váltó,
hanem hogy **mi van benne** (egy munkatérnél csak a Tagok; többnél a munkaterek listája is).

**És egy szabály, ami a kódnak szól, de a rajzon is látszódjon:** a *Tagok* sor mögött az R-2
gépezete áll, ami **ma nincs megépítve**. Amíg nincs, ez a sor nem kerülhet élesbe — vagy a sor
nem látszik, vagy az R-2 előbb elkészül. A rajz jelölje meg ezt a sort, hogy a kódoláskor ne
csússzon át.

## 6. Egy nyitott pont, amit így hagyunk — hacsak nem szólsz

A „mi történt a legutóbbi belépésed óta" mondat a rajzon **az utolsó futás** számából dolgozik,
nem a belépés óta eltelt időből. Ez marad, mert ez az adat ma létezik. Ha tényleg a belépés óta
kell számolni, az szűrés a találatokon — egy sor gépezet, és akkor a mondat is pontosabb lesz.
**Vilmos szava dönt; addig a rajz nem változik.**

## 7. Kötelező szabályok a rajzhoz

- **Csak tokenből** — és most már a térköz is. Pixelérték nem maradhat a rajzon.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven; az alapnyelv az angol.
- **Halott vezérlő tilos** — a *Tagok* sor kivételével, ami megjelölt, és az 5. pont szerint
  nem mehet élesbe gépezet nélkül.
- **Sötét felület** — a világos változat a tokenekből jön.
- **A megerősítő sáv a képernyő aljára rögzüljön**, ne a kártya aljára.

## 8. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **a 8. artboard**, és az 1. és 5. artboard javított sávja
- **az átállás mérlege a te rajzodra**: hány térköz nem mozdult, hány mozdult egy pixelt,
  és az öt hely, ahol többet
- a három pótolt felirat-kulcs, a 8. artboard szövegeivel együtt
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- telefonon mi marad el és mi tör sorba

## 9. A csomag

Az R-0 csomagjában két dolog nem stimmelt; ne ismétlődjön:

1. **A hálózat kérdése.** Az R-0 rajza `unpkg.com`-ról tölti a React-et és a Babelt, tehát
   hálózat nélkül **üres lapot ad** — az átadó viszont azt állította, hogy magától megjelenik.
   Vagy legyen a csomagban egy statikus változat is, **vagy az átadó mondja ki egy mondatban,
   hogy a rajz megnyitásához hálózat kell.** Bármelyik jó; a valótlan állítás nem.
2. **Amit nem mértél, azt ne írd oda.** Az R-0 átadója megnevezte, melyik fájlban vannak a nagy
   elmozdulások, és „fájlszinten pontosnak" mondta — hét értékből ötnél tévedett, egy érték
   (48px) nincs is a kódban. Ha valamit nem tudsz megmérni, hagyd üresen, és írd a
   `kerdesek.md`-be.

A zip szerkezete változatlan: `rajz/` · `ATADO.md` · `feliratok.json` · `tokenek.md` ·
`adatkotes.md` · `kerdesek.md` · `FELADATLAP.md` (ez a lap), a neve
`r1-kezdokepernyo-javitokor-atado.zip`, a helye `SaaS\design\r1-kezdokepernyo\atado-2\`.
