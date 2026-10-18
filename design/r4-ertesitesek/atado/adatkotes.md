# Adatkötés — R-4 · Értesítések és adatpolitika

A lap két blokkja két külön adatforrásból él. Ahol a végpont neve nem biztos, ott a rajz azt írja le, **mit** kell elérni, nem az útvonalat.

## Értesítéslista

| A rajzon | Honnan |
|---|---|
| a harang száma és az oldalsáv „3 új" jelölése | az olvasatlan értesítések száma a belépett fiókra |
| a lista sorai (szöveg, mikor, melyik munkatér) | a fiók értesítései, munkatér-hivatkozással |
| olvasott / olvasatlan | soronkénti olvasott-jelölés; a sor megnyitása olvasottnak jelöl |
| „Mind olvasottnak jelölöm" | tömeges olvasottnak jelölés; **üres listánál a gomb nem jelenik meg** |
| a sor célja (találatok, források, költség, futás részletei) | az eseményhez tartozó hivatkozás |

## A hat esemény — ezek ma is megtörténnek

| Kapcsoló | Mikor keletkezik | Kinek |
|---|---|---|
| `ertesites.kapcs_futas_kesz` | minden napi futás után, a találatok számával | a munkatér tagjainak |
| `ertesites.kapcs_forras_hibas` | amikor egy forrás állapota elromlik | a munkatér tagjainak |
| `ertesites.kapcs_keret_elfogyott` | amikor a havi AI-keret betelik | a munkatér tagjainak |
| `ertesites.kapcs_ai_nem_valaszol` | amikor a feladat emiatt áll meg | a munkatér tagjainak |
| `ertesites.kapcs_beragadt` | ha egy futás 15 percen túl nem fejeződik be | a munkatér tagjainak |
| `ertesites.kapcs_belepesi_kiserletek` | sorozatos sikertelen belépés egy fiókra vagy egy címről | **csak a rendszergazdának** |

Az utolsó sor a felületen külön csoportban áll, és **közönséges felhasználónak meg sem jelenik**.

Alapérték új fióknál: **mind be**. A rajz a „Beragadt egy futás" sort kikapcsolva mutatja, hogy a kikapcsolt-de-működő állapot látszódjon.

## Csatornák

| Csatorna | Állapot | Miért |
|---|---|---|
| a felületen (harang + lista) | **működik, kapcsolható** | az események megvannak |
| e-mailben | **kikapcsolva, „még nem működik"** | nincs levélküldés a rendszerben |
| telefonos értesítés | **kikapcsolva, „még nem működik"** | nincs megépítve (D-21) |

## Adatpolitika

| A rajzon | Honnan |
|---|---|
| a három adatút-sor | `docs/ADATUT.md` (2026-09-09-i mérés) — a rajz szövege állandó, nem adatból generált |
| `[AI-SZOLGÁLTATÓ NEVE]` | a beállított szolgáltató emberi neve (nem a belső azonosító) |
| „felhőben fut" / „házon belül fut" | a szolgáltató futtatási módja |
| `[ORSZÁG]` | a feldolgozás országa |
| „a kimutatás mérése: 2026-09-09" | a mérés dátuma — a kód írása előtt újra kell mérni |
| a napló-mondat | az AI-hívásokról csak számok tárolódnak (mikor, mennyi, sikerült-e) |

## A felhő-kapcsoló — amikor él

Ma **nincs mögötte gépezet**, a rajzon kikapcsolt és jelölt. Amit majd tennie kell (07. artboard):

- bekapcsolva az AI-feladat **megáll**, ha a házon belüli AI nem elérhető — **nem vált át** felhőre;
- a hírek letöltése ettől függetlenül fut (D-19), mert abban a lépésben ügyféladat nem hagyja el a rendszert;
- a megállás a felületen (csempe + értesítés) és a naplóban is látszik: `ai_megallt_helyi_szabaly`.

## Jogosultság

| Szerep | Mit tehet |
|---|---|
| tulajdonos | a saját értesítéseit állítja; az adatpolitikát olvassa; a felhő-kapcsoló majd az övé lesz |
| szerkesztő / néző | a saját értesítéseit állítja; az adatpolitikát olvassa |
| rendszergazda | ezen felül a „Rendszergazdai értesítések" csoport |

Az értesítés-beállítás **fiók-szintű** (kit hogyan érjenek el), az adatpolitika **munkatér-szintű** (mi történik a munkatér adatával).
