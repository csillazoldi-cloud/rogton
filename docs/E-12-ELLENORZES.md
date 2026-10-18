# E-12 — Fordított ellenőrzés és végigjátszás (2026-09-07) — az első építési egység zárása

## 1. Fordított ellenőrzés (a képernyők a terv ellen)

A terv: a v6 prototípus (OB-01, OB-02, OB-03, OB-03-A) és a jóváhagyott rajzok (E-3 belépés-képernyők, E-5 1. lépés,
E-10 fiókoldal). Vasszabály: felesleg = hiba, hiány = kérdés.

**Független szem:** Kimi (`docs/E-12-FORDITOTT-ELLENORZES-kimi.md`, nyers), a v6 1–3. lépésének jelölése és a mi
képernyőink alapján. A jelentés egy részét én rontottam el: a mellékletből kimaradt a v6 fejléce, előnézet-oldalsávja és
a 3. lépés második fele, ezért a „felesleg”-ként jelölt fejléc-mentésállapot, előnézet, eredet-/jóváhagyás-megjegyzések
és a „tiltva” szöveg VALÓJÁBAN a v6-ból valók (onnan másoltuk) — ezeket elvetettem. Ami megállt, és **javítva lett**:

| # | Eltérés a v6-tól | Javítás |
|---|---|---|
| 1 | 1. lépés: az arculati források gombjai fix szöveggel („+ Logó”) — a v6-ban bekapcsolva „✓ Logó csatolva” stb., „A weboldal is forrás” kikapcsolva pipa nélkül | be-/ki-állapot szöveg a v6 szerint, 3 nyelven (a v6 „· minta” prototípus-jelölése nélkül) |
| 2 | 1. lépés: csatolt dokumentumnál a v6 külön dobozt mutat (név · csatolva · Eltávolítás) — nálunk a név a gombon volt, eltávolítás nem volt | a v6 doboz, Eltávolítással |
| 3 | 1. lépés: a leírás alatti súgó („Elég pár mondat — a részleteket később is pontosíthatod.”) hiányzott | pótolva 3 nyelven |
| 4 | 1. lépés: „+ Dokumentum csatolása (opcionális — …)” egy szövegben; a v6-ban a zárójeles rész halványabb, külön | szétválasztva |
| 5 | 2. lépés: nálunk folyamatjelző sáv volt a javaslatok érkezéséig — a v6-ban nincs (felesleg) | eltávolítva |
| 6 | 2. lépés: a friss AI-javaslat felvillanása nálunk a tömbökön volt — a v6-ban az előnézet sorain (glowRow) | az előnézet sorain |

**Kérdés hozzád (a v6-ban van, nálunk nincs, nem építettem be kérdés nélkül):**
- 1. lépés, a leírás alatt: **„Minta betöltése”** link — a v6-ban mintaszöveget és mintanevet tölt be. Prototípus-kényelmi
  funkciónak látszik (mint a fejlesztői panel), ezért kihagytam. Ha kell élesben is, egy sor.

Ellenőrizve és egyezik: a v6 minden többi eleme az 1–3. lépésen és a kész lapon (a Kimi-jelentés „Egyezik” része +
a saját átnézésem: fejléc, lépésjelző, előnézet 7 sora, a 3. lépés sorai, arculati blokk, hiányzók, jóváhagyás).
Ismert, elfogadott eltérések: a fejlécben a szervezet neve; E-4 nyelvválasztó; nincs fejlesztői panel és „Prototípus
visszaállítása”; a v6 „resume” képernyője helyett automatikus betöltés; a dokumentum-csatolás a fájl nevét menti.

## 2. Végigjátszás három nyelven és telefonon

A teljes út (regisztráció → szervezet → 1. → 2. → 3. lépés → arculat jóváhagyása → jóváhagyás → kész lap → fiókoldal →
belépés) végigjátszva **magyarul, románul, angolul** (1280 px) és **magyarul telefonon (390 px)**; képernyőkép minden
képernyőről: `Claude outputs/e12-kepernyok/<nyelv>/01…09.png` (36 kép + telefon 9 kép).

**Telefonon két valódi hibát találtunk és javítottunk:**
1. a háttér fényfoltja (`::after`) a tartalom fölé került, és **elfogta a koppintásokat** — 390 px-en a gombok nem
   reagáltak (asztali méretben a folt nem ért a gombokig). Javítva: a tartalom a foltok fölé, a foltok nem fogadnak
   eseményt.
2. a fejléc nem tört sorba, a név és a Kilépés kilógott. Javítva: a fejléc, a lépésjelző és a rács telefonon sorba tör.

Nyelvváltás menet közben (E-4 óta mérve): a mezők tartalma megmarad, a profil szövegeit nem írja át (A-06).

## 3. Az elfogadási feltételek (ATADO 1.0, A-01…A-16) állása

| Feltétel | Állás | Bizonyíték |
|---|---|---|
| A-01 Üres profilból URL nélkül is végigvihető az onboarding | **teljesült** | végigjátszás leírásból, 3 nyelven (E-12) |
| A-02 AI-javaslat és kézi javítás elkülönül; újragenerálás nem veszít adatot | **teljesült** | jelvények (AI-javaslat · általad módosítva), függő új javaslat (E-7, E-8) |
| A-03 AI-kiesés és forráshiba külön látszik; kézi folytatás működik | **teljesült** | E-11: két külön doboz, külön hibakód, „Ezt használom összefoglalóként” |
| A-04 Mentési hiba nem mutat sikert; visszatéréskor visszatöltődik a piszkozat | **teljesült** | E-11: Újrapróbálás, kilépés tiltva; E-6: visszatöltés |
| A-05 Jóváhagyott profil a host központi profilfelületén szerkeszthető | **teljesült** | E-10 fiókoldal |
| A-06 HU/RO/EN UI és hibák; nyelvváltás megőrzi a munkát | **teljesült** | E-4 mérés, E-12 három nyelvű végigjátszás, hibadobozok 3 nyelven |
| A-07 Theme-váltás minden UI-komponensre hat; brandkreatívra nem | **teljesült** (E-14, E-18 záró bizonyítás: `docs/NEGYEDIK-SZAKASZ-ZARAS.md`) | a Theme-felületen alkalmazott téma minden lapra hat (a lap feje a hatásos tokeneket adja), a mintakártya a brandprofilból épül; tokenőr |
| A-08 Brandmódosítás új tervezet; korábbi jóváhagyott pillanatkép változatlan | **teljesült** | E-9/E-10: verzió+1, pillanatkép, „Tervezet elvetése” |
| A-09 Hibás theme import nem rontja el a működő konfigurációt | **teljesült** (E-14/E-17, E-18 hibaút-végigjátszás: hálózati hiba és 500 a mentésnél/alkalmazásnál is — az előző marad) | mezőből és fájlból: tételes hibalista, semmi nem íródik — kliensen és kiszolgálón is (próbák + végigjátszás) |
| A-10 Hírfigyelő duplikátumok | **nincs még** | hírfigyelő modul a második egység |
| A-11 Két ügyfél adatai nem keverednek | **teljesült (alap)** | sorszintű védelem minden ügyféltáblán (E-2, E-6, E-7, E-9), próbák (szervezet nélküli fiók 409); két párhuzamos szervezettel külön végigjátszás még nem volt |
| A-12 Azonos csomag két hostban | **nincs még** | második host a második egység |
| A-13 Helyi-only adatpolitika → nincs felhős továbbítás | **részben** | `AI_SZOLGALTATO=teszt` alapból, kulcs nélkül nincs hívás; ügyfélszintű kapcsoló még nincs |
| A-14 URL/fájl külső tartalma nem indíthat jogosulatlan műveletet | **teljesült (alap)** | letöltő: csak nyilvános cím, SSRF-védelem, 1 MB, csak szöveg; a prompt a forrást ADATként kezeli (E-7) |
| A-15 Mentésből helyreállítás kipróbált | **nincs még** | a pilotkész kapu feladata (NAS-mentés) |
| A-16 Az állított ellenőrzések ténylegesen elvégzettek, korlátaik jelöltek | **teljesült** | ez a lap + E-11-HIBAUTAK.md + NEGYEDIK-SZAKASZ-ZARAS.md, képernyőképek, próbák (123) |

**Korlátok, őszintén:** az AI-út a teszt-csatlakozóval van bizonyítva (nincs Anthropic-kulcs); a képernyős végigjátszás
a felhőben, a teszttel azonos kódon futott (a felhő böngészője HTTPS-en nem éri el a NAS-t), az élő teszten kívülről
(API, HTML három nyelven) és a gépeden a beépített böngészőből ellenőriztük; a telefonos méret emulált (390 px), nem
valódi készülék.
