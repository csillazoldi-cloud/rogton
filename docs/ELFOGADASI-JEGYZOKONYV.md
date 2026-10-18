# Elfogadási jegyzőkönyv — Kommunikációs munkatér, pilotkész állapot

**Kelt: 2026-09-09.** Termék: AI-központú kommunikációs munkakörnyezet (munkanév: Kommunikációs
munkatér). Terméktulajdonos: Portik Vilmos / Aitmetica SRL. Készítette: Claude, a 7. szakasz (E-40) záró lépéseként.

**Mit állít ez a papír, és mit nem.** Ez nem független audit és nem éles üzemi tanúsítvány.
Azt rögzíti, hogy az `docs/ATADO-1.0.md` **tizenhat elfogadási feltételéből** melyik teljesült,
mivel bizonyítható, és mi maradt nyitva. Ahol „mérve" szerepel, ott a mérés helye is oda van írva.
A pilot azt jelenti: **egy** valódi ügyfélnek, kísérettel, az itt felsorolt ismert kockázatokkal
odaadható — nem azt, hogy nyilvános szolgáltatás.

---

## 1. Az elfogadási feltételek állása

| # | Feltétel | Állás | Bizonyíték |
|---|---|---|---|
| **A-01** | Üres profilból URL nélkül is végigvihető az onboarding | **teljesült** | E-12 zárás, végigjátszás 3 nyelven + telefonon (`docs/E-12-ELLENORZES.md`) |
| **A-02** | AI-javaslat és kézi javítás elkülönül; újragenerálás nem veszít adatot | **teljesült** | E-12 zárás; a mezőnkénti „eredet" jelölés a fiókprofilon |
| **A-03** | AI-kiesés és forráshiba külön látszik; kézi folytatás működik | **teljesült** | `docs/E-11-HIBAUTAK.md`; élőben is látszott, amikor a Dell nem válaszolt (2026-09-08) |
| **A-04** | Mentési hiba nem mutat sikert; visszatéréskor visszatöltődik a piszkozat | **teljesült** | E-12 zárás, hibaút-próbák |
| **A-05** | Jóváhagyott profil a host profilfelületén szerkeszthető | **teljesült** | E-10 / E-17b, a fiókprofil mezőnkénti mentéssel |
| **A-06** | HU/RO/EN felület és hibák; nyelvváltás megőrzi a munkát | **teljesült** | E-12 zárás; D-11 óta az angol az alap- és tartaléknyelv |
| **A-07** | Theme-váltás minden felületi elemre hat, brandkreatívra nem | **teljesült** | E-14 (`docs/E-14-ELLENORZES.md`), E-17 (export/import) |
| **A-08** | Brandmódosítás új tervezet; a jóváhagyott pillanatkép változatlan | **teljesült** | E-13/E-14 verziózás, visszaállítással |
| **A-09** | Hibás theme import/betöltés nem rontja el a működő beállítást | **teljesült** | E-17: hibás fájl semmit nem ír; ugyanaz az ellenőrzés, mint a mezőnél |
| **A-10** | Ismételt vagy párhuzamos futás nem készít ellenőrizetlen duplikátumot | **teljesült** | E-22: egyszerre egy munka, párhuzamos indítás 409 `FUT_MAR`; E-23: az azonos esemény összevonása (`hf_esemeny`), második futás 0 új találat |
| **A-11** | Két külön ügyfél adatai és eredményei nem keverednek | **teljesült** | sorszintű védelem az adatbázisban; próba: két fiók két szervezettel, egyik sem látja a másikét; E-39-ben újra mérve (a gazda-nézet közönséges tagnak 403) |
| **A-12** | Azonos csomag két hostban működik, ügyfélspecifikus kód és másolás nélkül | **teljesült** | 6. szakasz: `@km/news-monitor-core` 0.2.0 fut a webalkalmazásban ÉS a `referencia-host`-ban, **0 azonos tartalmú fájl**, a határőr 4 szabállyal védi (`docs/HATODIK-SZAKASZ-ZARAS.md`); a második rendszer él: `/referencia/` |
| **A-13** | Helyi-only adatpolitika esetén nincs automatikus felhős továbbítás | **RÉSZBEN** | `docs/ADATUT.md`: az adatút mérésből leírva (mi hagyja el a rendszert, mikor, kihez). **A terméki kapcsoló nem épült meg** — Vilmos döntése (2026-09-09), mert élesben nincs saját AI-gépünk, és olyan kapcsolót nem építünk, amit a rendszer nem tud betartani. Kódban ma sincs csendes átváltás felhőre. |
| **A-14** | Külső tartalom nem indíthat jogosulatlan műveletet | **teljesült** | a letöltő SSRF-védelme és robots.txt-kezelése (E-20); a hírszöveg jelölt ADAT-blokkban megy az AI-hoz (`promptAdatBlokk`) |
| **A-15** | Mentésből helyreállítás ténylegesen kipróbált | **teljesült** | E-35, a NAS-on mérve 2026-09-09 13:49–13:51: mentés 1 mp, visszaállítási próba **27 tábla / 4064 sor, eltérés 0, 9 mp**, az éles adatbázis érintése nélkül. **Nyitva: a napi automatikus indítás** (Vilmos egyszeri kattintása a NAS feladatütemezőjében). |
| **A-16** | Az állított vizuális/nyelvi ellenőrzések ténylegesen elvégzettek, korlátaik jelöltek | **RÉSZBEN** | gépi ellenőrzések futnak (tokenőr 197 fájl / 0 sértés, határőr 258 modul / 0 sértés, 416 gépi próba); E-38: a román és angol felület átnézve, 48 javítás kint. **Korlát kimondva: a RO/EN szöveget eddig csak gépek nézték át** — anyanyelvi emberi kör hátravan (D-20). |

**Összegzés: 14 teljesült, 2 részben (A-13, A-16).**

---

## 2. A pilotkészséghez tartozó további bizonyítékok

| Terület | Mit tudunk, és honnan |
|---|---|
| **Belépési védelem** | E-34: fiókonként 5 rossz jelszó / 15 perc, címenként 20; regisztráció 20 / óra; a kérő címét két proxy mögül helyesen olvassuk, három hamis fejléccel sem kerülhető meg (kívülről mérve). A zár alatt a HELYES jelszó sem megy át; másik fiók ugyanarról a címről bejut. |
| **Hozzáférésnapló** | a `belepesi_kiserlet` tábla minden belépési, regisztrációs és visszaállítási kísérletet megőriz 30 napig — és a sikeres belépés **nem törli** (nem az takarít, akiről a napló szól). |
| **Jelszó-visszaállítás** | rendszergazda által kiadott, egyszer használatos, 1 óra alatt lejáró jegy; lenyomatként tárolva; az új jelszó a fiók összes munkamenetét érvényteleníti. **Vilmosnak egyszer végig kell kattintania** (T17.9–T17.11) — nekem nincs rendszergazda-fiókom a teszten. |
| **Terhelés** | E-37: **kb. 120 ügyfél** fér el, ha a napi futások egy 6 órás ablakban oszlanak el (egy órába zsúfolva ~20); egy új cikk feldolgozása 5,8 mp; 60 egyidejű látogató 300 kérése hibátlan, 985 ms; egy cikk 3,3 kB → ~4,3 GB/év. **A szűk keresztmetszet az AI ideje**, nem a gép. |
| **Költség** | E-39: ügyfelenkénti havi keret, ami tényleg megállítja az AI-hívást (gépi próbával bizonyítva); a lap hívásszámot, gépidőt és becsült költséget mutat. A költség **becsült**, nem a szolgáltató számlája. |
| **Adatút** | E-36 / `docs/ADATUT.md`: három dolog hagyja el a rendszert — a hírforrás letöltése (ügyféladat nélkül), a cikk szövege + a szervezet profilja az AI-hoz, és a látogató böngészőjéből egy kérés a Google betűkészlet-szolgáltatásához. |

---

## 3. Megmaradt kockázatok — néven nevezve

| # | Kockázat | Mit jelent a gyakorlatban | Mit lehet tenni |
|---|---|---|---|
| **K-1** | **Egyetlen AI-gép.** A nehéz munkát a Dell munkaállomás végzi. | Ha áll, a hírfigyelő értékelő része áll — 2026-09-08-án ez élesben megtörtént. | Második AI-gép, vagy tudatosan vállalt kiesés a pilotnál. |
| **K-2** | **Az AI-gép nem megy hostingra.** A Dell Vilmos gépe. | Élesben ma nincs saját AI-nk, ezért az A-13 kapcsolója nem építhető meg. | Döntés: saját AI-gép vagy céges API-kulcs. |
| **K-3** | **Előfizetéses AI-út.** A `claude-elofizetes` és `codex-elofizetes` egy magánszemély előfizetésén megy. | Valódi ügyféladathoz nem való. | Céges kulcs vagy saját gép a pilot előtt. |
| **K-4** | **Google-betűkészlet.** A felület a Google-től tölti a betűtípusokat. | Minden látogató böngészője kapcsolatba lép a Google-lel; közintézménynél kifogás. | Saját kiszolgálóról kiszolgálni — kis munka, a kinézet nem változik. |
| **K-5** | **Nyílt regisztráció** (D-17). | Aki rátalál a címre, fiókot nyithat; a pilot-ügyfél adata ugyanazon az oldalon van. | A sebességkorlát a fő védelem; meghívós út bármikor ráépíthető. |
| **K-6** | **A mentés ugyanazon a gépen van**, csak másik köteten (D-18). | Tűz, lopás vagy a NAS elvesztése ellen nem véd. | Házon kívüli mentés — külön döntés. |
| **K-7** | **A napi mentés még nem indul magától.** | Ma kézzel kell futtatni. | Vilmos egyszeri kattintása a NAS feladatütemezőjében (`docs/MENTES.md` 3. fejezet). |
| **K-8** | **A RO/EN szöveget csak gépek nézték át.** | Maradhatnak benne természetellenes fordulatok. | Anyanyelvi olvasó egy körben (D-20). |
| **K-9** | **A teszt jelszó nélkül nyilvános** (D-05). | Valódi ügyféladat előtt a jelszós kaput elő kell venni. | D-05 újratárgyalása a pilot előtt. |
| **K-10** | **Nincs független biztonsági vizsgálat.** | Amit tudunk, azt magunk mértük. | Külső szakértő; az átadható anyag (adatút, fenyegetési pontok, ez a jegyzőkönyv) készen van. |
| **K-11** | **A NAS öt projektet futtat** (`NAS-szabalyok.md`). | Egy másik projekt hibája ezt is elviheti. | A közös kapu (`szabad-e.sh`) él; a pilotnál saját gép megfontolandó. |

---

## 4. Amit a pilot előtt el kell dönteni — nem műszaki kérdések

1. **Ki az üzemeltetési felelős, és hogyan szóljon a rendszer, ha baj van?** (D-21 — lásd `docs/UZEMELTETES.md`.)
2. **Ki az első pilot-ügyfél?**
3. **Ár és csomag.** Az egyszeri bevezetési díj + ismétlődő használati díj eddig javaslat.
4. **Hol fut élesben az AI?** (K-2 — ettől függ az A-13 lezárása.)
5. **Adatfeldolgozói szerződés**, ha felhős AI-t használunk ügyféladathoz.

---

## 5. Aláírás helye

| Szerep | Név | Dátum |
|---|---|---|
| Terméktulajdonos | Portik Vilmos | |
| Készítette | Claude (Aitmetica SaaS munkamenet) | 2026-09-09 |

**Ez a jegyzőkönyv addig érvényes, amíg a fenti kockázatok és nyitott döntések változatlanok.**
Minden további szakasz elején felül kell vizsgálni.
