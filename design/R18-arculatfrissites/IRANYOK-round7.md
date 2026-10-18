# R-18 — Round 7: setup additions (kínálat, étlap, árak, oldal, témák) + post types

2026-10-12 · design only · canvas version 11 (98 artboards). New rows „Round 7 · A sötét" / „Round 7 · B világos", 14 artboards each, live look:
Beállítás · Olvassuk a honlapodat (narancs) · telefon — Beállítás · Ezt kínáljátok? (egy sor szerkesztés) · telefon — Beállítás · Ezt kínáljátok? · asztali — Beállítás · Van étlapod? · telefon — Beállítás · Árak a posztokban? · telefon — Beállítás · Facebook/Instagram oldal · telefon — Beállítás · Ezekről érdemes posztolnod · telefon / asztali — Posztszöveg · Videó forgatókönyv · asztali / telefon — Posztszöveg · Szavazás · telefon — Posztszöveg · Fotóalbum · telefon — Posztszöveg · Picmess → képminta · telefon — Szervezet adatai · Kínálat és árak · asztali.
The example data is a paving company (Kő és Kert / Kovács Térkő); restaurants get the menu step and a „Menü" topic.

## Setup (Első beállítás) — inserted after the existing web research step (kutatas.ts)
Shell: no main nav during setup; top bar = mark + name, „Első beállítás" (desktop), quiet „Mentés és kilépés"; under it „← Vissza" and the existing step counter „{n} / {összes}. lépés". Everything pre-filled; nothing has to be completed.
1. **Ezt kínáljátok?** While the site is read: the orange working state „Olvassuk a honlapodat…" with the indeterminate bar and the domain + „szolgáltatások, árak, elérhetőség"; the list skeleton is faded below. Then a tick list, ALL ticked, one line per service/product (name + optional grey second line with what the site said, e.g. price, area). Tap the text = edit inline (input replaces the line, Enter/blur saves); tap the box = untick (unticked = not used for posts, kept for later). „+ Hiányzik valami?" adds an empty editable line. Primary „Rendben". Source line: „A {domain} oldalról olvastuk ki. Koppints egy sorra, ha javítanád." If nothing was found: the list is empty with one editable line and the same primary.
2. **Van étlapod?** Shown only for hospitality trades (restaurant, café, bakery, catering, pension) or when step 1 found no list. Three quiet option tiles: Link · PDF · Fotó (on phone „Fotó" opens the camera / photo picker, multiple pages allowed) and the quiet link „Nincs étlapom". No primary button: picking an option IS the answer. After upload/link: the orange working state, then the menu as the same tick list as step 1 (dish + price).
3. **Írjuk ki az árakat a posztokban?** Right after a list exists. Two equal choice tiles Igen (example „85 lej/m²-től" taken from the list) / Nem. One tap saves and moves on — no extra button. Line: „Később a Szervezet adatainál átállíthatod." Default for the posting engine until answered: Nem.
4. **Hol posztolsz most?** Field „A Facebook- vagy Instagram-oldalad", pre-filled when the research found it (quiet „a honlapodon találtuk"), else empty with placeholder „facebook.com/…". Optional „Küldj 2–3 képernyőképet a legutóbbi posztjaidról · nem kötelező" (up to 5 images, thumbnails with ✕). Honest line: „Most csak azt olvassuk, ami nyilvános. Teljesen akkor látunk rá, ha később összekötöd a Facebookkal." Primary „Tovább" (works with everything empty). The screenshots are read by the model for tone, length, emoji and hashtag habits; the URL's public page is fetched where allowed.
5. **Ezekről érdemes posztolnod** (summary; last step before the existing approval). 4–8 topics generated from the offer list, the trade and the page, each with ONE recommended type chip. Row = topic text (tap = edit) · type chip (tap = small list of the 5 types) · ✕ (remove). „+ Új téma". Primary „Rendben" saves the topic plan; it feeds the post suggestions on Kezdőlap/Naptár (each suggestion carries its type).
Typical mapping the machine uses: finished work → Fotóalbum; a service or product → Picmess kép; tips/knowledge → Szöveges kártya; offers → Picmess kép; behind the scenes / „egy nap a…" → Videó; audience question → Szavazás; restaurants: daily/weekly menu → Picmess kép, new dish → Fotóalbum.

## Post types in Posztszöveg
A row of 5 chips under the title (radio group, phone: horizontal scroll): Fotóalbum · Picmess kép · Videó · Szavazás · Szöveges kártya. The topic's recommended type is preselected and marked „· javasolt". Changing the chip regenerates the output for that type (same credit as „Új változat"). One primary per type:
- **Videó** — a 45-second talking-head script (video-script-writer, Mode 3): table # · Idő · Elmondod · Felirat a képen · Kép/B-roll (phone: one block per row: number, time, on-screen text right, spoken text, „Kép: …"). Hook in 0–3 s; 95–110 spoken words; last row = call to action (from the CTA field if set). Below: „Más kezdés, ha ez nem tetszik" with 2 alternative hooks (tap = swaps row 1). Primary „Másolás" (copies the whole table as plain text), quiet „Új változat", info „{n} szó · kb. 45 mp".
- **Szavazás** — „Kérdés" input + „Válaszok · 2–4" (numbered inputs, „+ Még egy válasz" up to 4, ✕ down to 2), info „Hová: Facebook- vagy Instagram-történet (story), a „Szavazás" matricával." Primary „Kész, másolom" (copies question + answers).
- **Fotóalbum** — caption in the normal text field + „Tegyél fel 6–8 képet, ebben a sorrendben:" numbered shot list (before → work → result → detail → team → client). Primary „Kész, másolom".
- **Picmess kép / Szöveges kártya** — a card „A képre ez kerül:" (title + one line, generated), „Következik: 1. Minta → 2. Szöveg és elhelyezés", primary „Képet készítek ehhez a poszthoz" → the round-6 template step with the matching template group preselected (Szöveges kártya = text-only templates).
The normal text post stays as today when no type is chosen (the chips start unselected for news-based posts unless a topic type exists).

## Szervezet adatai → Kínálat és árak
Sub-nav: Alapadatok · Kínálat és árak · Hivatalos nevek. The same tick list, each line with an optional price field („ár, ha kiírnád"), „+ Hiányzik valami?", the switch „Árak a posztokban" (the step-3 answer), primary „Mentem". The posting engine only mentions prices that are filled in AND when the switch is on.

## Labels (HU / RO / EN — new migration)
| Key | HU | RO | EN |
|---|---|---|---|
| `onb.kinalat_cim` | Ezt kínáljátok? | Asta oferiți? | Is this what you offer? |
| `onb.kinalat_alcim` | Ami nem kell, vedd ki a pipát. | Debifează ce nu e nevoie. | Untick what doesn't belong. |
| `onb.kinalat_forras` | A {domain} oldalról olvastuk ki. Koppints egy sorra, ha javítanád. | Am citit de pe {domain}. Atinge un rând dacă vrei să-l corectezi. | We read this from {domain}. Tap a line to fix it. |
| `onb.olvassuk` | Olvassuk a honlapodat… | Citim site-ul tău… | Reading your website… |
| `onb.olvassuk_alcim` | Pár másodperc, és mutatjuk. | Câteva secunde și îți arătăm. | A few seconds and we'll show you. |
| `onb.olvassuk_mit` | szolgáltatások, árak, elérhetőség | servicii, prețuri, contact | services, prices, contact |
| `onb.hianyzik` | + Hiányzik valami? | + Lipsește ceva? | + Something missing? |
| `onb.rendben` | Rendben | În regulă | Looks good |
| `onb.etlap_cim` | Van étlapod? | Ai meniu? | Do you have a menu? |
| `onb.etlap_alcim` | Küldd el, és ebből is posztolunk. | Trimite-l și postăm și din el. | Send it and we'll post from it too. |
| `onb.etlap_link` / `_pdf` / `_foto` | Link / PDF / Fotó | Link / PDF / Foto | Link / PDF / Photo |
| `onb.etlap_nincs` | Nincs étlapom | Nu am meniu | I don't have a menu |
| `onb.etlap_info` | A honlapodon nem találtunk étlapot. Elég egy fotó is róla, kiolvassuk. | Nu am găsit meniul pe site. Ajunge și o poză, îl citim noi. | We didn't find a menu on your site. A photo is enough; we'll read it. |
| `onb.arak_cim` | Írjuk ki az árakat a posztokban? | Scriem prețurile în postări? | Should we show prices in posts? |
| `onb.arak_alcim` | Egy koppintás, és megyünk tovább. | O atingere și mergem mai departe. | One tap and we move on. |
| `onb.igen` / `onb.nem` | Igen / Nem | Da / Nu | Yes / No |
| `onb.arak_pelda` | pl. „{ar}” | de ex. „{ar}” | e.g. “{ar}” |
| `onb.arak_nem` | árat nem írunk | nu scriem prețuri | no prices |
| `onb.arak_kesobb` | Később a Szervezet adatainál átállíthatod. | Poți schimba mai târziu la Datele organizației. | You can change this later in Organisation details. |
| `onb.oldal_cim` | Hol posztolsz most? | Unde postezi acum? | Where do you post now? |
| `onb.oldal_alcim` | Ebből tanuljuk meg a hangodat. | Din asta învățăm vocea ta. | This is how we learn your voice. |
| `onb.oldal_mezo` | A Facebook- vagy Instagram-oldalad | Pagina ta de Facebook sau Instagram | Your Facebook or Instagram page |
| `onb.oldal_talaltuk` | a honlapodon találtuk | am găsit-o pe site | found on your website |
| `onb.kepernyokep` | Küldj 2–3 képernyőképet a legutóbbi posztjaidról | Trimite 2–3 capturi de ecran cu ultimele postări | Send 2–3 screenshots of your latest posts |
| `onb.kepernyokep_gomb` | Képernyőkép | Captură de ecran | Screenshot |
| `onb.oldal_oszinte` | Most csak azt olvassuk, ami nyilvános. Teljesen akkor látunk rá, ha később összekötöd a Facebookkal. | Acum citim doar ce e public. Vedem tot când conectezi mai târziu Facebook. | For now we only read what's public. We'll see everything once you connect Facebook later. |
| `onb.tovabb` | Tovább | Mai departe | Continue |
| `onb.temak_cim` | Ezekről érdemes posztolnod | Despre acestea merită să postezi | Worth posting about |
| `onb.temak_alcim` | Mindegyik mellé odaírtuk, milyen poszt illik hozzá. | Lângă fiecare am scris ce fel de postare i se potrivește. | Next to each we noted the post type that fits. |
| `onb.uj_tema` | + Új téma | + Temă nouă | + New topic |
| `onb.tema_torles` (aria) | Téma törlése | Șterge tema | Remove topic |
| `tipus.cim` (aria) | Milyen poszt legyen? | Ce fel de postare? | What kind of post? |
| `tipus.album` / `picmess` / `video` / `szavazas` / `kartya` | Fotóalbum / Picmess kép / Videó / Szavazás / Szöveges kártya | Album foto / Imagine Picmess / Video / Sondaj / Card cu text | Photo album / Picmess image / Video / Poll / Text card |
| `tipus.javasolt` | javasolt | propus | suggested |
| `video.cim` | Kész a videó forgatókönyve | Scenariul video e gata | Your video script is ready |
| `video.alcim` | 45 másodperc, te mondod a kamerába. Kb. 100 szó. | 45 de secunde, vorbești la cameră. Cca 100 de cuvinte. | 45 seconds, you talk to the camera. About 100 words. |
| `video.ido` / `elmondod` / `felirat` / `kep` | Idő / Elmondod / Felirat a képen / Kép / B-roll | Timp / Spui / Text pe ecran / Imagine / B-roll | Time / You say / On-screen text / Shot / B-roll |
| `video.mas_kezdes` | Más kezdés, ha ez nem tetszik | Alt început, dacă nu-ți place | Another opening if you don't like this one |
| `video.masolas` | Másolás | Copiază | Copy |
| `video.szamlalo` | {n} szó · kb. {mp} mp | {n} cuvinte · cca {mp} s | {n} words · about {mp} s |
| `szavazas.cim` | Kész a szavazásod | Sondajul tău e gata | Your poll is ready |
| `szavazas.alcim` | Történetbe tedd ki, 24 óráig fut. | Pune-l în story, rulează 24 de ore. | Post it as a story; it runs for 24 hours. |
| `szavazas.kerdes` | Kérdés | Întrebare | Question |
| `szavazas.valaszok` | Válaszok · 2–4 | Răspunsuri · 2–4 | Answers · 2–4 |
| `szavazas.meg_egy` | + Még egy válasz | + Încă un răspuns | + Another answer |
| `szavazas.hova` | Hová: Facebook- vagy Instagram-történet (story), a „Szavazás” matricával. | Unde: story pe Facebook sau Instagram, cu autocolantul „Sondaj”. | Where: a Facebook or Instagram story, with the “Poll” sticker. |
| `album.cim` | Kész a fotóalbumod | Albumul tău foto e gata | Your photo album is ready |
| `album.alcim` | Ezt írd mellé, és ezeket a képeket tedd fel. | Scrie asta lângă și pune aceste poze. | Use this caption and post these photos. |
| `album.sorrend` | Tegyél fel {min}–{max} képet, ebben a sorrendben: | Pune {min}–{max} poze, în ordinea aceasta: | Post {min}–{max} photos in this order: |
| `kepes.cim` | Ehhez a poszthoz kép kell | Postarea aceasta are nevoie de o imagine | This post needs an image |
| `kepes.alcim` | Rövid szöveg a képen, a posztod alá írva. | Text scurt pe imagine, cu postarea dedesubt. | Short text on the image, your post underneath. |
| `kepes.kerul` | A képre ez kerül: | Pe imagine va fi: | On the image: |
| `kepes.kovetkezik` | Következik: 1. Minta → 2. Szöveg és elhelyezés | Urmează: 1. Model → 2. Text și poziționare | Next: 1. Template → 2. Text and position |
| `szerv.kinalat` | Kínálat és árak | Ofertă și prețuri | Offer and prices |
| `szerv.alapadatok` | Alapadatok | Date de bază | Basic details |
| `szerv.ar_mezo` | ár, ha kiírnád | preț, dacă vrei să-l afișezi | price, if you want it shown |
| `szerv.arak_posztban` | Árak a posztokban | Prețuri în postări | Prices in posts |
Existing keys reused: Mentés és kilépés, Vissza, step counter, Kész, másolom, Új változat, Képet készítek ehhez a poszthoz, Mentem, Hivatalos nevek · N.

## Build list
1. Onboarding: 5 new steps after research (kínálat with read state, étlap — conditional, árak, oldal, témák); store offer list, price flag, page URL, screenshots, topic plan (tenant-scoped, RLS → Vilmos). Extract services/menu from the site in kutatas.ts; menu from link/PDF/photo via the model (vision).
2. Szervezet adatai: „Kínálat és árak" section (same list + price per line + switch).
3. Posztszöveg: type chip row; 4 generators (video script Mode 3, poll, album, image link-through); the text post stays the default.
4. Suggestions (Kezdőlap/Naptár) carry the topic's type.
5. Labels above, new migration. Facebook page connection itself is out of scope here (Vilmos: external access).
