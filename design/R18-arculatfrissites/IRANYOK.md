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

---

# R-18 — Round 6: Kati's requests A–G (approved by Csilla)

2026-10-11 · design only · canvas version 10 (70 artboards). New rows „Round 6 · A sötét" and „Round 6 · B világos", 11 artboards each, live look:
Poszt · minden átírás látható, cselekvésre hívás, méret-tipp · asztali — Poszt · emoji választó · asztali — Poszt · szerkesztő · telefon — Poszt · előnézet + képméret · telefon — Poszt · emoji (alsó lap) · telefon — Hivatalos nevek · Szervezet adatai · asztali — Hivatalos nevek · telefon — Kép a poszthoz · 1. minta · asztali / telefon — Kétnyelvű kép · román nézet, letöltés · asztali — Kétnyelvű kép · telefon.
One primary button per screen everywhere: „Kész, másolom" (post), „Mentem" (names), „Ezzel folytatom" (template), „Letöltöm" (image).

## Spec
**A. Rewrite options in the open.** The „Továbbiak ▾" menu is gone from the post editor. Under the text field, one row of quiet buttons: Rövidebben · Bővebben · Közvetlenebbül · Tárgyilagosabban · + Hashtagek · Új változat (phone: one horizontally scrolling row). Under it a row of quiet links: ↶ Visszavonás (only when there is something to undo) · Eredeti hír (only for news-based posts) · Más nyelven ▾ · Hivatalos nevek · N · Csak másolás (desktop; on phone it stays in the ☰-less link row only if room, otherwise dropped — copying is the primary button anyway). Same actions and API calls as today; only the placement changes.

**B. Image size hint.** Under the preview (desktop) / above it (phone, so it is visible without scrolling): one quiet line with an image icon, changing with the selected platform tab:
Facebook 1080 × 1350 px, álló (4:5) · Instagram 1080 × 1350 px, álló (4:5) · LinkedIn 1200 × 1200 px, négyzet (1:1) · Blog 1200 × 630 px, fekvő (1,91:1).
The „+ Követés" decoration is removed from the LinkedIn preview (R15Elonezet.tsx line ~103); the preview keeps only „···".

**C. Call to action.** Optional field under the rewrite row: label „Mire hívod az olvasót? · nem kötelező", one input, quiet „Beleírom" button, quiet note „javaslat a cég adataiból · a poszt utolsó sora lesz". Pre-filled when the company has a phone/website/booking link (e.g. „Kérj ingyenes felmérést: 0745 123 456"); empty with placeholder „pl. Szerezd be a jegyed most!" otherwise. „Beleírom" puts it in as the LAST paragraph of the text (replaces the previous CTA paragraph if one was inserted; no AI call, no credit). „Új változat" and the rewrite buttons keep the CTA as the last line. The CTA is stored per post and per language (translated with the text).

**D. Official names (glossary).** Per-company list of rows Magyar / Román / Angol (any one cell may be empty — we never invent the missing one). Reachable: post editor link „Hivatalos nevek · N" (opens a sheet on phone, the page on desktop) and Profil → Szervezet adatai → „Hivatalos nevek". Desktop: 3-column table with ✕ per row and an empty last row for a new name; phone: one card per name (HU/RO/EN inputs), „+ Új név". Primary „Mentem". From then on every translation (text and image) must use these exact names (passed to the model as a fixed glossary; post-check replaces any leftover variant). Tenant data → RLS (A-11), Vilmos's sign-off.

**E. Emoji.** A 44 px smiley icon button in the bottom-right corner of the text field (aria-label „Emoji beszúrása"). Desktop: popover under it; phone: bottom sheet over the lower half with a light scrim (the field stays visible). Tabs: Legutóbbi · Arcok · Munka · Jelek; 8-column grid, 44 px cells. Tap inserts at the cursor and keeps the picker open (desktop: closes on outside click; phone: ✕ or swipe down). „Legutóbbi" = last 16 used, per user, stored locally. Uses the system emoji font (no image set to ship).

**F. Image from a post → template first.** „Képet készítek ehhez a poszthoz" now opens step 1 „Milyen kép legyen ehhez a poszthoz?": the existing Képek template grid, the machine's suggested template first (active box, „· javasolt"), a quiet step line „1. Minta → 2. Szöveg és elhelyezés · A posztból: <title>". The text from the post is already filled into every template preview. Primary „Ezzel folytatom" (desktop on the selected card, phone in the bottom bar) → the existing image editor (step 2: text and positioning). Tapping another card selects it.

**G. Two-language image.** On the image preview a switch „Magyar | Román" (radio group) that swaps the WHOLE image: every text layer of the template is translated (title, line, call-to-action; the company name stays as is; official names from D apply). The switch only changes the preview, never the saved design. Download choice „Mit töltsünk le?" Magyar · Román · Mindkettő (default = the language shown; Mindkettő = two PNGs, `<név>-hu.png` and `<név>-ro.png`, 1080 × 1350); primary „Letöltöm". Phone: switch next to the title, choice under the image, „Letöltöm" in the bottom bar.

**Wording change:** „Illik a cég iránytűjéhez" → „✓ Illik a céged irányához" (`r15.poszt.illik_iranytu`, new migration with the new value; green `--ok`).

## Labels (HU / RO / EN, new migration)
| Key | HU | RO | EN |
|---|---|---|---|
| `r15.poszt.illik_iranytu` (new value) | ✓ Illik a céged irányához | ✓ Se potrivește direcției firmei tale | ✓ Fits your company's direction |
| `poszt.kep_meret` | Ideális kép {platform}: {meret}, {forma} | Imagine ideală pentru {platform}: {meret}, {forma} | Ideal image for {platform}: {meret}, {forma} |
| `poszt.forma_allo` / `_negyzet` / `_fekvo` | álló / négyzet / fekvő | verticală / pătrată / orizontală | portrait / square / landscape |
| `poszt.cta_cimke` | Mire hívod az olvasót? | La ce îl chemi pe cititor? | What should the reader do? |
| `poszt.nem_kotelezo` | nem kötelező | opțional | optional |
| `poszt.cta_pelda` | pl. Szerezd be a jegyed most! | de ex. Ia-ți biletul acum! | e.g. Get your tickets now! |
| `poszt.cta_gomb` | Beleírom | Adaug în text | Add to text |
| `poszt.cta_megj` | javaslat a cég adataiból · a poszt utolsó sora lesz | propunere din datele firmei · va fi ultimul rând | suggested from company details · becomes the last line |
| `poszt.emoji` (aria) | Emoji beszúrása | Inserează emoji | Insert emoji |
| `poszt.emoji_tipp` | Koppints, és a kurzorhoz tesszük | Atinge și îl punem la cursor | Tap to insert at the cursor |
| `emoji.legutobbi` / `arcok` / `munka` / `jelek` | Legutóbbi / Arcok / Munka / Jelek | Recente / Fețe / Muncă / Semne | Recent / Faces / Work / Symbols |
| `nevek.cim` | Hivatalos nevek | Denumiri oficiale | Official names |
| `nevek.link` | Hivatalos nevek · {n} | Denumiri oficiale · {n} | Official names · {n} |
| `nevek.alcim` | Intézmények, események, előadások pontos neve. Ezentúl minden fordításban ezeket használjuk. | Numele exacte ale instituțiilor, evenimentelor, spectacolelor. De acum le folosim în fiecare traducere. | Exact names of institutions, events and shows. We'll use them in every translation from now on. |
| `nevek.uj` | + Új név | + Denumire nouă | + New name |
| `nevek.torles` (aria) | Sor törlése | Șterge rândul | Remove row |
| `nevek.egy_eleg` | Egy nyelv is elég, a többit nem találjuk ki. | Ajunge o limbă, pe celelalte nu le inventăm. | One language is enough; we won't invent the others. |
| `nevek.mentem` | Mentem | Salvez | Save |
| `kep.minta_cim` | Milyen kép legyen ehhez a poszthoz? | Ce imagine să aibă postarea? | What image should this post have? |
| `kep.minta_alcim` | A posztod szövegét már beírtuk. Válassz mintát, utána állítod a szöveget és a helyét. | Am pus deja textul postării. Alege un model, apoi reglezi textul și poziția. | We've already added your post text. Pick a template, then adjust the text and position. |
| `kep.lepes` | 1. Minta → 2. Szöveg és elhelyezés | 1. Model → 2. Text și poziționare | 1. Template → 2. Text and position |
| `kep.javasolt` | javasolt | propus | suggested |
| `kep.tovabb` | Ezzel folytatom | Continui cu acesta | Continue with this |
| `kep.ket_nyelv_cim` | Kész a képed két nyelven | Imaginea ta e gata în două limbi | Your image is ready in two languages |
| `kep.ket_nyelv_alcim` | Váltsd át, és nézd meg mindkettőt. A teljes szöveg fordítva van. | Comută și vezi-le pe amândouă. Tot textul e tradus. | Switch to see both. All the text is translated. |
| `kep.nyelv` (aria) | A kép nyelve | Limba imaginii | Image language |
| `kep.mit_letolt` | Mit töltsünk le? | Ce descărcăm? | What should we download? |
| `kep.magyar` / `roman` / `mindketto` | Magyar / Román / Mindkettő | Maghiară / Română / Amândouă | Hungarian / Romanian / Both |
| `kep.ket_kep` | Két kép: {fajl}-hu.png és -ro.png, {meret}. | Două imagini: {fajl}-hu.png și -ro.png, {meret}. | Two images: {fajl}-hu.png and -ro.png, {meret}. |
| `kep.letoltom` | Letöltöm | Descarc | Download |
Existing keys reused: Rövidebben, Bővebben, Közvetlenebbül, Tárgyilagosabban, Hashtagek (shown as „+ Hashtagek"), Új változat, Visszavonás, Eredeti hír, Más nyelven, Csak másolás, Kész, másolom, „Képet készítek ehhez a poszthoz".

## Build list
1. R15Poszt: remove the Továbbiak menu, render its actions as the quiet button row + link row; add emoji button + picker; CTA field (stored per post+language).
2. R15Elonezet: size hint line per platform; remove „+ Követés".
3. Glossary table (tenant-scoped, RLS) + page under Szervezet adatai + sheet from the post; pass to every translation (text and image). Vilmos sign-off (new table/RLS).
4. Image from post: route to the template step first (suggested template preselected), then the existing editor.
5. Image editor: HU/RO preview switch translating every text layer; download HU / RO / both.
6. New migration with the labels above, including the new value of `r15.poszt.illik_iranytu`.

---

# R-18 — Round 5: Saját ötlet + Naptár (+ Naptár in the nav)

2026-10-11 · design only · canvas version 9 (48 artboards). Round 4 is in `IRANYOK-round4.md`; everything from rounds 3–4 stays. The new artboards use the **live** look (`.elo` in the canvas CSS, copied from `apps/web/app/r18.css`): name ×0.8, name baseline on the bottom of the "a", gap ×1.5, the stronger breathing background.

## Canvas — new rows "Round 5 · A sötét" and "Round 5 · B világos" (same 11 artboards in each mode)
Saját ötlet · üres · asztali — Saját ötlet · kitöltve · asztali — Saját ötlet · üres · telefon (alsó lap) — Saját ötlet · kitöltve · telefon — Saját ötlet · írjuk (narancs) · telefon — Naptár · hét · asztali — Naptár · hét · telefon — Naptár · javasolt nap · telefon — Naptár · Kitetted? · telefon — Naptár · napválasztó · telefon — Naptár · üres · telefon.

## 1. Saját ötlet — spec
- Tapping „Saját ötletből" (Posztszöveg: the existing quiet link, menu item and empty-state main button) no longer starts generation at once. It opens **one field**:
  - phone: a **bottom sheet** over the page (scrim, grab handle, ✕ to close; swipe down or ✕ = cancel, nothing is spent);
  - desktop: an **inline panel** at the top of the Posztszöveg page (active-box edge), with a quiet „Mégse" link next to the button.
- Contents, in this order: title „Miről szóljon a poszt?" · one textarea (aria-label „Miről szóljon?", placeholder „pl. csapatépítő hétvége, fotóalbum a csapatról", 3 rows, grows) · „Fotók hozzá" quiet button + „nem kötelező" (up to 5 photos, thumbnails 64px with ✕ „Fotó törlése" each, „+" to add more) · one info line · **one primary button „Megírjuk"**.
- Empty field is allowed: the button stays active and behaves like today (the machine picks the topic from the company's iránytű). The info line says so: „Ha üresen hagyod, mi választunk témát." When text or photos are present, the line reads: „A fotókból is írunk, és képet is ajánlunk hozzá."
- Submit: the topic text (and photo ids) go to the existing post-generation call as the topic; the sheet/panel closes; the existing orange generating state („Írjuk a posztot…") shows on the post editor with a quiet line „Téma: <first ~60 chars> · N fotó"; then the existing post editor opens with the result. Nothing else on the editor changes.
- Credits: same cost as today's „Saját ötletből". When credits are out, the button is disabled as today.

## 2. Naptár — spec
- New top-level page `/naptar`, nav item „Naptár" between „Képek" and „Profil ▾" (desktop) and in the ☰ sheet after „Képek" (phone).
- **Layout:** title (T1) depends on what is waiting (see states) · progress line (T8) „Ezen a héten: N kitéve, M tervezett" with the orange bar · „↑ Korábbi hetek" quiet link (loads earlier weeks above, scrolls back) · „Ezen a héten" then „Jövő héten" lists, day by day (Monday → Sunday). Desktop shows the two weeks side by side; phone one under the other.
- **Day row:** mono day label („Hétfő / okt. 12."), today marked with an orange dot and „Ma · kedd". A day without posts is one quiet line, no box. A day with posts lists them: small image thumb (44px, only if the post has an image) · title (link → the existing post page) · state.
- **States of a post on a day:**
  - „Tervezett" — planned, not yet posted. A quiet „Másik nap" link opens the day picker.
  - „Kitéve ✓" — posted (green `--ok` text; no box emphasis).
  - „Javasolt nap — elfogadod?" — the machine proposed this day; dashed outline until accepted. Buttons: „Elfogadom" (primary when it is the only thing waiting, otherwise quiet) and „Másik nap" (quiet).
  - On the planned day, if not posted: „Ma van a napja. Kitetted?" — the row becomes the active box, primary „Kitettem", quiet „Még nem" (keeps it planned; asks again next time the page opens that day; the next day it shows „Tegnapra volt tervezve. Kitetted?" with the same two actions).
- **Proposing days:** when a post becomes ready (Kész, másolom / ready state), the machine proposes a day: the nearest free day from tomorrow, spreading posts out (default rhythm Tue + Thu; never two on one day if a free day exists within the next 7; skip weekends unless the company posts on weekends). It is only a proposal until Tibor accepts or picks another day.
- **„Kitettem" one-tap (proposal, not decided):** also offered right after „Kész, másolom" on the post page (existing flow) — the calendar just reflects it. Marking posted is reversible from the post page (no undo button on the calendar).
- **Day picker („Másik nap"):** bottom sheet (phone) / small popover (desktop) titled „Melyik napon tegyük ki?" with the next 14 days from today, one row each (`role="radio"`), the proposed day marked „javasolt", days that already have posts show „1 poszt". Tapping a row chooses it and closes; no extra confirm button.
- **One primary button per screen (T2):** priority 1 „Kitettem" (today's unposted post), 2 „Elfogadom" (oldest open proposal — pinned as a card above the list on phone so it is visible without scrolling), 3 „Posztot írok" (bottom bar, goes to Posztszöveg) when nothing waits. Everything else is quiet.
- **Empty state:** title „Még nincs kész poszt", line „Ha kész egy poszt, mi javaslunk neki napot.", this week's days as quiet lines, primary „Posztot írok".
- **Titles by state:** nothing waiting „A heted rendben van" / „Minden kész posztnak van napja." · proposal „Jó lesz jövő kedden?" (day name from the proposal) / „Az új posztnak ezt a napot javasoljuk." · posted? „Kitetted a mai posztot?" / „Ha kitetted, egy koppintás."

## 3. Top-bar nav
„Naptár" added on all relevant artboards (desktop nav, phone ☰ sheet, RO/EN bar, mode-switch sheet, motion sheet). Measured in a local Chromium render: at **1280** the bar fits (single-company: last element ends at 1256; with Cégeim: 1256, no overlap). At **1024** it fits only with the live medium-width rule already in `felsosav.css` (641–1100 px: name hidden, tighter gaps/padding): ends at 1008 for both single- and multi-company users. Without that rule it would overflow by 68 px (single) / 156 px (multi). Profil/Cégeim dropdowns re-anchored under their buttons.

## Labels (new `felirat` keys, HU / RO / EN — new migration)
| Key | HU | RO | EN |
|---|---|---|---|
| `nav.naptar` | Naptár | Calendar | Calendar |
| `sajat.cim` | Miről szóljon a poszt? | Despre ce să fie postarea? | What should the post be about? |
| `sajat.mezo` (aria) | Miről szóljon? | Despre ce să fie? | What should it be about? |
| `sajat.pelda` (placeholder) | pl. csapatépítő hétvége, fotóalbum a csapatról | de ex. weekend de team building, album foto cu echipa | e.g. team-building weekend, a photo album of the team |
| `sajat.fotok` | Fotók hozzá | Adaugă fotografii | Add photos |
| `sajat.nem_kotelezo` | nem kötelező | opțional | optional |
| `sajat.foto_torles` (aria) | Fotó törlése | Șterge fotografia | Remove photo |
| `sajat.ures_info` | Ha üresen hagyod, mi választunk témát. | Dacă lași gol, alegem noi tema. | Leave it empty and we'll pick the topic. |
| `sajat.foto_info` | A fotókból is írunk, és képet is ajánlunk hozzá. | Scriem și din fotografii și îți propunem o imagine. | We'll write from the photos too and suggest an image. |
| `sajat.gomb` | Megírjuk | Scriem noi | Write it for me |
| `sajat.megse` | Mégse | Renunță | Cancel |
| `sajat.tema` | Téma: {tema} · {n} fotó | Tema: {tema} · {n} fotografii | Topic: {tema} · {n} photos |
| `naptar.cim_rendben` | A heted rendben van | Săptămâna ta e în regulă | Your week is set |
| `naptar.alcim_rendben` | Minden kész posztnak van napja. | Fiecare postare gata are o zi. | Every ready post has a day. |
| `naptar.cim_javasolt` | Jó lesz {nap}? | E bine {nap}? | Does {nap} work? |
| `naptar.alcim_javasolt` | Az új posztnak ezt a napot javasoljuk. | Pentru postarea nouă propunem această zi. | We suggest this day for the new post. |
| `naptar.cim_kitetted` | Kitetted a mai posztot? | Ai publicat postarea de azi? | Did you post today's post? |
| `naptar.alcim_kitetted` | Ha kitetted, egy koppintás. | Dacă ai publicat-o, o singură atingere. | If you did, one tap. |
| `naptar.cim_ures` | Még nincs kész poszt | Încă nu e nicio postare gata | No post is ready yet |
| `naptar.alcim_ures` | Ha kész egy poszt, mi javaslunk neki napot. | Când o postare e gata, îi propunem o zi. | When a post is ready, we'll suggest a day. |
| `naptar.halad` | Ezen a héten: {k} kitéve, {t} tervezett | Săptămâna aceasta: {k} publicate, {t} planificate | This week: {k} posted, {t} planned |
| `naptar.korabbi` | Korábbi hetek | Săptămânile anterioare | Earlier weeks |
| `naptar.ez_a_het` | Ezen a héten | Săptămâna aceasta | This week |
| `naptar.jovo_het` | Jövő héten | Săptămâna viitoare | Next week |
| `naptar.ma` | Ma | Azi | Today |
| `naptar.tervezett` | Tervezett | Planificată | Planned |
| `naptar.kiteve` | Kitéve ✓ | Publicată ✓ | Posted ✓ |
| `naptar.javasolt` | Javasolt nap — elfogadod? | Zi propusă — accepți? | Suggested day — accept? |
| `naptar.javasolt_nap` | Javasolt nap: {nap} | Zi propusă: {nap} | Suggested day: {nap} |
| `naptar.elfogadom` | Elfogadom | Accept | Accept |
| `naptar.masik_nap` | Másik nap | Altă zi | Another day |
| `naptar.ma_kitetted` | Ma van a napja. Kitetted? | E ziua ei. Ai publicat-o? | It's today. Did you post it? |
| `naptar.tegnap_kitetted` | Tegnapra volt tervezve. Kitetted? | Era planificată ieri. Ai publicat-o? | It was planned for yesterday. Did you post it? |
| `naptar.kitettem` | Kitettem | Am publicat | I posted it |
| `naptar.meg_nem` | Még nem | Încă nu | Not yet |
| `naptar.valaszto_cim` | Melyik napon tegyük ki? | În ce zi o publicăm? | Which day should it go out? |
| `naptar.valaszto_javasolt` | javasolt | propusă | suggested |
| `naptar.valaszto_db` | {n} poszt | {n} postări | {n} posts |
| `naptar.uj_poszt` | Posztot írok | Scriu o postare | Write a post |
Day and month names come from the locale (Intl.DateTimeFormat, hu-RO / ro-RO / en-GB), not from labels.

## Build list (round 5)
1. Saját ötlet: sheet (phone) / inline panel (desktop) component on Posztszöveg; pass topic + photo ids to the existing generation; reuse the existing generating state and editor.
2. Naptár page + data (proposal): a `megjelenes` (planned date, proposed flag, posted_at) per post, tenant-scoped (RLS, A-11); proposal rule above; „Kitettem" also from the post page.
3. Nav: „Naptár" in FelsoSav (desktop + ☰ sheet); keep the 641–1100 px medium-width rule.
4. Labels above, new migration. New top-level page = product-level change → Vilmos's OK (and the new table touches RLS → his sign-off).

---

---

# R-18 — Round 4: aitmetica.ro type, POSZTGYÁR, Cégeim

2026-10-11 · design only · canvas version 8 (26 artboards). Everything from round 3 stays.

## Font usage map (as on aitmetica.ro)
| Element | Font | Size / weight / tracking |
|---|---|---|
| Top menu items (desktop nav, phone page label), dropdown + ☰ sheet rows | JetBrains Mono | 13px · 500 · 0 |
| Buttons: primary | JetBrains Mono | 14px · 500 |
| Buttons: quiet, ghost (Kovács Tibor ▾), Visszajelzés pill | JetBrains Mono | 13px · 500 |
| Links as actions (Kép hozzá, Még 3 javaslat, Keress most új híreket…), quick tiles | JetBrains Mono | 13px · 500 (phone tiles 11.5px) |
| Small labels / eyebrows (menu group titles, spec labels, count badges, "Készül a kép") | JetBrains Mono | 11.5–12.5px · 500 |
| Page question (h1: `kerdes` 28px, phone 24px) | Inter Tight 700 | letter-spacing −0.028em (site h1 88px/−2.46px) |
| Card titles, template titles (h2 level) | Inter Tight 700 | letter-spacing −0.018em (site h2 44px/−0.79px) |
| Body text, info lines, sentences | Inter 400/500 | — |
Token values in tema-A/B.json are unchanged (`--font-display` Inter Tight, `--font-body` Inter, `--font-code` JetBrains Mono already match); the build adds `--fs-ui: 13px`, `--fw-ui: 500`, `--ls-h1: -0.028em`, `--ls-h2: -0.018em` as derived tokens and moves the listed components onto `--font-code`.

## Fonts in the hosted canvas
The canvas now embeds the woff2 files itself (Inter 400/500/600, Inter Tight 600/700, JetBrains Mono 400/500; latin + latin-ext, 14 files uploaded as canvas assets) via `@font-face` in each artboard, under the family names `KM Inter`, `KM Inter Tight`, `KM JetBrains Mono`, first in every stack. Google Fonts stays as a backup only. Rendering no longer depends on fonts.googleapis.com.

## Product name sizing rule
Name shown in capitals with CSS `text-transform: uppercase`; the label key value stays „Posztgyár". Cap height = height of the a/t mark: `font-size = mark height / 0.734` (Inter Tight 700 cap height measured at 0.734 em). Desktop mark 22px → name 30px; phone mark 16px → name 21.8px. Measured: cap top/bottom align with the mark box within 0.1px.
RO „FABRICA DE POSTĂRI" at 390: does not fit next to the page label. Rule: on phone, when name + page label do not fit, the page label is hidden (the current page stays marked in the ☰ sheet); name, bell and ☰ keep their size. HU and EN fit with the page label.

## Company switching: Cégeim
- The „Kő és Kert Kft. ▾" company button is **removed** from the top bar (desktop) and the org line under the page label (phone).
- „Kovács Tibor ▾" (personal account menu) stays unchanged.
- New top-level nav item **„Cégeim ▾"** right after „Profil", **only for users with more than one company**. Its menu lists the user's companies; the current one has a check mark (`role="menuitemradio"`, `aria-checked="true"`); choosing another switches company. Single-company users never see it.
- Phone: a „CÉGEIM" group in the ☰ sheet, after the PROFIL group, same rows and check mark; the mode switch stays last.
- Canvas: all default artboards = single-company user. New: „Több cég: Cégeim menü nyitva · asztali" and „Több cég: Cégeim a ☰ menüben · telefon", in both modes.
- New label key `nav.cegeim`: HU „Cégeim" · RO „Companiile mele" · EN „My companies" (new migration). Product-level nav change → needs Vilmos's OK.

## Build changes added in round 4
1. Mono UI type map above; heading tracking tokens.
2. Name: uppercase, size from mark height.
3. Remove the org switcher from the bar; add the conditional Cégeim menu (desktop dropdown + ☰ group), keyboard + `aria-expanded`.
4. Phone bar: page label hides when it does not fit next to the name.

---

# R-18 Arculatfrissítés — round 3: Posztgyár · one product, two modes

2026-10-11 · design only, nothing deployed · canvas: Claude Design "Aitmetica arculatfrissítés — Posztgyár · sötét/világos" (same artifact, version 6, 22 artboards).

## Decisions (Csilla, round 3)
1. **Both A (dark) and B (light) ship**, as one product with a **dark/light mode switch**. A = sötét mód, B = világos mód. Every A/B artboard pair is the same page (files differ only in the mode class and the switch's aria state — checked by diff).
2. **One purple only: `#4b09d8`.** "Only one purple, ours. No tweaking." See the one-purple rule below.
3. **Name:** HU „Posztgyár", RO „Fabrica de postări", EN „Post factory" — per-language label next to the mark. The name-candidates artboard (Megafon / Vox / Atelier) is removed.
4. **Real logo** replaces the drawn placeholder everywhere (top bar + faded footer).
5. **Buttons solid.** No glass, blur or light sweep on any button; faint top highlight; gentle lift, soft press. Glass only on bars and menus, subtle.
6. **Active-box glow halved** (spread and opacity); the thin purple→orange outline stays.
7. **Background unchanged** (breathing aurora; static under reduced motion) — only its colours moved onto the one purple.
8. **Orange = in progress** (unchanged); no orange cursor.

## One-purple rule (binding)
| Allowed | Not allowed |
|---|---|
| `#4b09d8` as fill (main button, badge, switch "on", active edge, aurora) | any other purple: `#6a35ff`, `#9a7bff`, `#7a4cf0`, `#a98cff`, `#cbb8ff`, lighter/darker tints as separate colours |
| `rgba(75,9,216,a)` — transparency for glows, aurora, hover edges | purple **text** on dark (use `#ececec` / `#ffffff`) |
| purple text on light paper (7.5:1) | `filter: brightness()` on purple buttons (makes a new purple) |
Token consequences: `--primary` = `--primary-2` = `#4b09d8` in both modes (the active-edge gradient is now purple→orange). Dark: `--accent-link` `#9a7bff` → `#ececec`, `--focus` `#9a7bff` → `#ececec`, `--olvasatlan` → `#4b09d8`. Light: `--primary-2` `#7a4cf0` → `#4b09d8`. Aurora: dark blobs `#4b09d8`, `#4b09d8`, orange; light blobs `rgba(75,9,216,.42)`, `rgba(75,9,216,.22)`, `#ffb894` (≈ the old lavender look, same purple). Proof: grep of the canvas, `tema.css`, tema-A/B.json — no purple hue other than `#4b09d8`/its rgba remains.

## Contrast (measured, WCAG formula, on the token values)
| Pair | Ratio |
|---|---|
| White label on `#4b09d8` | **9.01** |
| `#4b09d8` button vs dark page `#0a0a0a` — no edge | **2.20** |
| … vs dark card `#141414` — no edge | 2.04 |
| Light edge `rgba(255,255,255,.18)` (Csilla's example) vs `#0a0a0a` | 1.64 |
| **Chosen edge `rgba(255,255,255,.24)`** vs `#0a0a0a` / `#141414` | **2.06 / 2.15** |
| Edge needed for 3:1 vs `#0a0a0a` | `.36` (3.25) — looks like an outlined button; not used |
| `#4b09d8` button vs light page `#eceae5` (no edge needed) | **7.50** |
| Body text: dark `#ececec`/`#0a0a0a` · light `#111111`/`#eceae5` | 16.8 · 15.7 |
The button is identified by its white label (9:1), so WCAG 1.4.11 is met by the text; the edge is a visual separator. Raise `--btn-edge` to `.36` if Kati finds the dark button hard to see.

## Mode switch — spec
| | |
|---|---|
| Desktop | 44×44 icon button in the top bar, directly left of the bell. Shows the mode you will **get**: sun in dark mode, moon in light mode. Hover = ghost background. |
| Phone | Not in the top bar (kept uncluttered). Last row of the ☰ sheet, under a divider: moon icon · „Sötét mód" · the existing switch control (`--kapcsolo-w/h` 38×22). On = `#4b09d8` track (+ light edge in dark), white knob. `role="switch"` + `aria-checked`. |
| Default | Follow the device (`prefers-color-scheme`) on first visit. |
| Persistence | A click stores the choice (`localStorage` key `km-mod` = `sotet`/`vilagos`); stored choice wins over the device. No "system" third option on screen (Tibor). Optional later: also save to the user profile so it follows across devices. |
| No flash | An inline script in `<head>` sets `data-mod` on `<html>` before first paint. |
| Transition | Root gets `.mod-valt` for 250 ms while tokens swap: background, colour, border, shadow, fill, opacity fade (`ease`, 250 ms). The aurora colours are registered `@property <color>` so the blobs fade too. The two logo files cross-fade (opacity). Icon: sun/moon rotate −60° + scale .6 out, the other in. |
| Reduced motion | No transition: instant swap. |
| Implementation | Tokens: tema-A.json under `[data-mod="sotet"]`, tema-B.json under `[data-mod="vilagos"]` (+ the matching `prefers-color-scheme` fallback when nothing is stored). Live demo on the canvas ("Mód-váltó" artboard, Play). |

## Logo usage per mode
Source files: `~/saas/logo/` (transparent PNGs; grey = `#dddddd`, orange = `#eb5928`, purple bar = `#4b09d8`). Trimmed to their visible box and stored in `design/R18-arculatfrissites/logo/`:
| Use | Dark mode | Light mode |
|---|---|---|
| Top bar mark (24 px high desktop, 20 px phone; 248:155) | `at-jel-szines.png` (as delivered) | `at-jel-tinta.png` — **derived**: the same pixels with grey `#dddddd` recoloured to ink `#111111`, orange untouched (no delivered version reads on paper) |
| Faded footer wordmark (110×16 desktop, 96×14 phone; opacity 13% dark / 14% light) | `aitmetica-szurke.png` | `aitmetica-tinta.png` — derived the same way |
| Not used in the app shell | `aitmetica-szines.png`, `aitmetica-lila.png`, `at-jel-szurke.png` | |
The derived files are exact pixel recolours, not an SVG trace (no vector master was available). **For build, ask for the SVG/AI master** and make one SVG per element with the grey parts on `currentColor`.
Footer position: desktop bottom-left of the content column (feedback pill is bottom-right); phone centred above the feedback row, or in the free left side of that row on Képek. Never under the floating Visszajelzés button (checked at 390).

## Product name in the top bar
Desktop: mark + name, Inter Tight 700 19 px. Phone: mark + name (15 px) + a 1px divider + page label / org switcher. Measured at 390 px (local render, real Inter Tight):
- HU „Posztgyár" and EN „Post factory": one line, fits.
- **RO „Fabrica de postări" does not fit on one line at 390.** Behaviour: the name wraps to two lines („Fabrica de / postări", 15 px, line-height 1.05, max-width 96 px) inside the 60 px bar; the org name truncates with „…". Nothing overlaps; bell and ☰ keep 44 px. Shown on the "Terméknév · felső sáv RO + EN" artboard, both modes.

## New label keys (felirat, HU / RO / EN — via a NEW migration)
| Key | HU | RO | EN |
|---|---|---|---|
| `fejlec.termeknev` | Posztgyár | Fabrica de postări | Post factory |
| `mod.valto.vilagosra` (aria-label, dark mode) | Világos mód bekapcsolása | Activează modul luminos | Switch to light mode |
| `mod.valto.sotetre` (aria-label, light mode) | Sötét mód bekapcsolása | Activează modul întunecat | Switch to dark mode |
| `mod.vilagos` (tooltip) | Világos mód | Mod luminos | Light mode |
| `mod.sotet` (tooltip + ☰ row label) | Sötét mód | Mod întunecat | Dark mode |
Note: `nyitolap.termeknev` already exists („Kommunikációs munkatér" / „Spațiu de lucru de comunicare" / „Communication workspace") — decide whether it changes to the new name too (new migration, never edit the old one). RO/EN nav labels on the RO/EN artboard are the existing `r15.nav.*` values; `nav.profil` EN = „Profile".

## Revised values (round 2 → round 3)
| Thing | Round 2 | Round 3 |
|---|---|---|
| Main button | glass highlight `inset 0 1px 0 rgba(255,255,255,.22)`, purple glow shadow, idle light sweep every 7 s + on hover, hover brightness 1.08 / −2px, press .965 | solid `#4b09d8`; `inset 0 1px 0 rgba(255,255,255,.08)`; edge `0 0 0 1px var(--btn-edge)` (dark `.24` white, light none); shadow `0 3px 10px -6px` neutral; hover −1px + `0 8px 18px -8px`; press scale .98 (90 ms), spring release 320 ms; no sweep, no brightness |
| Quiet button | hover border `--primary-2` 55% | hover border `--hover-edge` (dark white 28%, light purple 40%); press .98 |
| Tiles / image cards hover | border `--primary-2` 45% | `--hover-edge` |
| Cards (`teendo`, tiles, image cards) | liquid glass with blur on desktop | quiet panel: `--glass-bg-solid` at 88%, no blur, both widths |
| Feedback pill | glass + blur | solid panel 94%, no blur (it is a button) |
| Glass (bars, dropdown, ☰ sheet) | dark blur 18 / sat 160; light 16 / 140 | subtle: dark blur 14 / sat 130; light 14 / 125 |
| Active-box glow | `0 14px 40px -18px` primary 70% | `0 7px 20px -9px rgba(75,9,216,.35)` |
| Active-box edge | 1px gradient purple→`#9a7bff`→orange, full strength, border transparent | 1px gradient purple→orange at 60% over the normal panel edge |
| Bell badge | `--primary` | `#4b09d8` (unchanged in light, was `#6a35ff` in dark) |
| Aurora | as round 2 | same motion, size, opacity; colours on the one purple |

## Build changes (replaces the round 2 list)
1. Ship **both** themes: tema-A.json (sötét) and tema-B.json (világos), selected by `data-mod` on `<html>`; head script for no-flash; `prefers-color-scheme` default; `localStorage` `km-mod`.
2. Mode switch: desktop icon button left of the bell; phone row with the existing switch in the ☰ sheet; `.mod-valt` 250 ms transition + `@property` for the aurora colours; reduced motion = instant.
3. One-purple: remove every other purple from tokens and component CSS (see table). `pnpm tokenor` must stay 0 — the rgba glows go through tokens (`--glow`, `--btn-edge`, `--hover-edge`, `--btn-shadow`).
4. Logo: top-bar mark as two images (or one SVG with `currentColor`) per mode; product name via `fejlec.termeknev`; faded footer wordmark per mode. Files in `logo/`.
5. Buttons: strip glass/sweep/brightness from `.fo`; new shadow/edge recipe; quiet buttons and tiles use `--hover-edge`.
6. Cards and feedback pill: no backdrop blur; glass only on top bar, phone bottom bar, Profil dropdown, ☰ sheet.
7. Active box: halved glow, 60% gradient edge over the panel edge.
8. Unchanged from round 2: aurora layer, card enter stagger, orange = in progress (`--halad-telt`, Készül overlay), nav regroup under Profil (needs Vilmos's OK), bell, phone page label, reduced motion.
9. Label keys above, new migration.
10. Reference CSS for all of this: `tema-r3-referencia.css` in this folder (the canvas stylesheet; prototype, take values not code).

## Canvas (round 3)
Row "Round 3": **Mód-váltó** (both states desktop + phone sheet, hover, 5-frame 250 ms cross-fade strip, live demo — press Play and click the icon) · **Terméknév RO + EN** (desktop 1280 + phone 390, both modes). Rows A (sötét) and B (világos): Kezdőlap, Hírek, Képek × desktop 1280 + phone 390 · Profil menu open (desktop dropdown, phone sheet incl. the switch row) · Készül (phone) · Motion & states. Self-check: all 22 artboards rendered locally in headless Chromium with real Inter Tight / Inter / JetBrains Mono at their widths; the live switch was clicked and sampled mid-fade (bg 10→140→219→236 over ~250 ms, logo opacity crossing).

---
## Round 2 (for the record): A Éjszaka + B Papír

2026-10-11 · design only, nothing deployed · canvas: Claude Design "Aitmetica arculatfrissítés — 3 irány" (round 2: 21 artboards).

## Decision (Csilla, round 2)
"Dark and light version, A and B." **C (Vegyes) is dropped**; `tema-C.json` stays in this folder for the record only. Do not build it.
Round 2 goes beyond tokens on purpose (Csilla asked): breathing aurora, liquid glass, motion, orange = in progress, active-page underline, a/ logo + product name, faded logo at the bottom, and the **Profil menu regroup** (the only structural change). Page content, text, block order inside pages and functionality are unchanged. Tibor rules not applied to this round (Csilla's call).

## Canvas
Per direction (A row, B row): Kezdőlap, Hírek, Képek × desktop 1280 + phone 390 · Profil menu open (desktop dropdown + phone sheet) · "Készül" state (phone, Képek card being generated) · Motion & states sheet (rest / hover / pressed side by side + live buttons to hover/tap). Plus one artboard with the 3 name candidates.
Render-checked locally (headless Chromium, real Inter Tight/Inter/JetBrains Mono), all 21 artboards at their widths, including both menu-open states.

## Logo — PLACEHOLDER
The real a/ file was not found (nothing new in the chat uploads; Csilla's Mac was offline this round). The artboards use a drawn stand-in: Inter Tight 700 "a" + a purple slanted bar (`--primary`), as inline SVG. Replace with the real file before build; it should be an SVG whose "a" uses `currentColor` and slash uses the primary colour so it themes for A and B.

## Product name — recommended: **Megafon** (shown as "a/ Megafon")
| Candidate | Why |
|---|---|
| **Megafon** ★ | Same word in Hungarian and Romanian. Says what it does: your message, louder. 7 letters, fits next to a/ even on phone. |
| Vox | Latin "voice", short and premium, but abstract — Tibor may not connect it to his posts. |
| Atelier | Native RO, understood HU: "the workshop". Warmer, but longer and less distinctive. |
Needs a trademark / domain check before it is final (not done).

## Navigation change (the only structural change)
| Before (top level) | After |
|---|---|
| Kezdőlap · Hírek (n) · Posztszöveg (n) · Képek | unchanged, top level |
| Iránytű · Szervezet adatai · Beállítások | **under one "Profil ▾" menu** (desktop dropdown; phone: "PROFIL" group in the ☰ sheet) |
| "Értesítések (n)" text link | **bell icon** with the unread count as a purple badge; `aria-label="Értesítések: n"` |
| Org switcher, user menu (Kovács Tibor ▾), Visszajelzés | unchanged |
Routes under Profil: the existing Iránytű, Szervezet adatai and Beállítások pages, URLs unchanged (only the menu entry moves); nothing removed. The Iránytű quick-tile on Kezdőlap stays. Active page: label in `--text`, 600 weight, 2px orange underline. Phone top bar: a/ symbol · active page label (orange underline) over the org switcher · bell · ☰ (replaces the "K" circle; the app name is not shown on phone).

## Tokens — A Éjszaka (`tema-A.json`)
| Token | Today (tema-alap.json) | New |
|---|---|---|
| `--font-display` | `'Sora',sans-serif` | `'Inter Tight','Inter',sans-serif` |
| `--font-body` | `'Manrope',sans-serif` | `'Inter',sans-serif` |
| `--font-code` | `'IBM Plex Mono',monospace` | `'JetBrains Mono',monospace` |
| `--r-card` | `16px` | `6px` |
| `--r-block` | `12px` | `6px` |
| `--r-btn` | `12px` | `4px` |
| `--r-field` | `10px` | `4px` |
| `--r-badge` | `999px` | `4px` |
| `--text` | `#e8ebf1` | `#ececec` |
| `--text-mut` | `#9aa3b2` | `#b3b3b3` |
| `--text-dim` | `#7a8496` | `#8a8a8a` |
| `--text-faint` | `#6b7484` | `#6f6f6f` |
| `--primary` | `#4b5ee3` | `#6a35ff` |
| `--primary-2` | `#9a6bff` | `#9a7bff` |
| `--accent` | `#ff7a59` | `#eb5928` |
| `--accent-text` | `#ffb39f` | `#ff7a4d` |
| `--accent-link` | `#9fa8ff` | `#9a7bff` |
| `--focus` | `#8a98ff` | `#9a7bff` |
| `--olvasatlan` | `#7f8fff` | `#9a7bff` |
| `--accent-warm` | `#ff7a59` | `#ff7a4d` |
| `--keszul` | `#9fb0d8` | `#eb5928` |
| `--blur-glass` | `28px` | `18px` |
| `--glass-alpha` | `10` | `6` |
| `--sat-glass` | `150` | `160` |
| `--aurora-opacity` | `0` | `55` |
| `--bg` | `#070912` | `#0a0a0a` |
| `--bg-elev` | `#0d1020` | `#121212` |

## Tokens — B Papír (`tema-B.json`)
| Token | Today (tema-alap.json) | New |
|---|---|---|
| `--font-display` | `'Sora',sans-serif` | `'Inter Tight','Inter',sans-serif` |
| `--font-body` | `'Manrope',sans-serif` | `'Inter',sans-serif` |
| `--font-code` | `'IBM Plex Mono',monospace` | `'JetBrains Mono',monospace` |
| `--r-card` | `16px` | `6px` |
| `--r-block` | `12px` | `6px` |
| `--r-btn` | `12px` | `4px` |
| `--r-field` | `10px` | `4px` |
| `--r-badge` | `999px` | `4px` |
| `--bg` | `#070912` | `#eceae5` |
| `--bg-elev` | `#0d1020` | `#f7f6f2` |
| `--text` | `#e8ebf1` | `#111111` |
| `--text-mut` | `#9aa3b2` | `#4a4a4a` |
| `--text-dim` | `#7a8496` | `#5f5b54` |
| `--text-faint` | `#6b7484` | `#6b665e` |
| `--primary` | `#4b5ee3` | `#4b09d8` |
| `--primary-2` | `#9a6bff` | `#7a4cf0` |
| `--accent` | `#ff7a59` | `#eb5928` |
| `--accent-text` | `#ffb39f` | `#b8401a` |
| `--accent-link` | `#9fa8ff` | `#4b09d8` |
| `--ok` | `#7fe0a0` | `#23704a` |
| `--err` | `#ffb3a3` | `#b3261e` |
| `--focus` | `#8a98ff` | `#4b09d8` |
| `--shadow-color` | `#000000` | `#2a2418` |
| `--shadow-strength` | `45` | `14` |
| `--keszul` | `#9fb0d8` | `#eb5928` |
| `--illesztve` | `#e6c065` | `#9a7a1c` |
| `--olvasatlan` | `#7f8fff` | `#4b09d8` |
| `--accent-warm` | `#ff7a59` | `#f08a5d` |
| `--accent-gold` | `#ffb86b` | `#b07a1e` |
| `--blur-glass` | `28px` | `16px` |
| `--glass-alpha` | `10` | `4` |
| `--sat-glass` | `150` | `140` |
| `--aurora-opacity` | `0` | `70` |

Note: `--aurora-opacity` > 0 also switches on the existing derived `--glow-primary*` shadows in `szarmaztat()`; check the screens that use them.

## Orange = in progress
`--keszul` (now orange in both) drives: the weekly progress bar fill (`--halad-telt: var(--keszul)`, with a 1.6 s moving shimmer), the "Készül a kép" overlay on an image being generated (pulsing dot + indeterminate bar + diagonal shimmer), and any "készül" badge (`--keszul-bg`/`--keszul-border` already derive from it). Errors keep `--err`. Caveat: `--warn` still derives from `--accent-text` (orange) — warnings and progress now share a hue; warnings must always carry their sentence + button (T7) so they stay distinguishable.
The round-1 orange cursor is removed.

## Motion spec
| What | Duration | Easing | Detail |
|---|---|---|---|
| Aurora (3 blurred blobs) | 9 s / 13 s / 11 s, alternate, infinite | ease-in-out | translate ≤4%, scale 0.92→1.12, opacity 0.65→1; transform/opacity only (GPU) |
| Cards / tiles enter | 480 ms, stagger 60 ms | `cubic-bezier(.2,.8,.2,1)` | from opacity 0, translateY 10px, scale .985 |
| Main button hover | 180 ms | ease-out | translateY −2px, brightness 1.08, deeper purple shadow, one light sweep (700 ms) |
| Main button idle sweep | every 7 s | `cubic-bezier(.2,.8,.2,1)` | faint diagonal light passes once |
| Press (all buttons) | 90 ms down | ease-out | scale .965 (main) / .96 (quiet) |
| Release | 320 ms | spring `cubic-bezier(.34,1.56,.64,1)` | slight overshoot back to 1 |
| Quiet button / tile hover | 180 ms | ease-out | lift 1–2px, border tints toward `--primary-2` |
| Nav underline | 220 ms | `cubic-bezier(.2,.8,.2,1)` | grows from left; hover shows it at 55% |
| Active box edge | 6 s alternate | ease-in-out | purple→orange gradient slowly shifts along the 1px edge |
| Profil dropdown | 240 ms | `cubic-bezier(.2,.8,.2,1)` | fade + translateY −6px + scale .97 |
| Phone menu sheet | 320 ms (sheet), 240 ms (scrim) | same | slides in from the right |
| Progress shimmer | 1.6 s linear, infinite | — | gradient moves along the bar |
| `prefers-reduced-motion: reduce` | — | — | every animation/transition off; aurora shown static |
Existing `--motion` token (normal/slow/off) should scale these durations (`szarmaztat` already derives `--dur-*`; map the new ones onto it).

## Liquid glass recipe
| | A Éjszaka | B Papír |
|---|---|---|
| Fill | white 5% | white 58% |
| Backdrop | `blur(18px) saturate(160%)` | `blur(16px) saturate(140%)` |
| Edge | 1px white 9% | 1px ink 8% |
| Inner highlight | `inset 0 1px 0` white 10% | `inset 0 1px 0` white 85% |
| Shadow | `0 10px 30px -12px rgba(0,0,0,.6)` | `0 10px 30px -14px rgba(42,36,24,.25)` |
| Bars (top, phone bottom) | bg 62% + same backdrop | paper 66% + same backdrop |
| Menus (dropdown/sheet) | near-solid (`#151515` 78%) + backdrop, so text never fights the page | `#f6f5f1` 80% + backdrop |
**Performance:** blur is the expensive part. Desktop: blur on top bar, cards/tiles, dropdown, feedback pill. **Phone (≤600px): blur only on the top bar, bottom button bar, menu sheet and feedback pill (4 layers); cards are translucent without blur.** The aurora is 3 elements, `filter: blur(60px)` painted once, then only transform/opacity animate (compositor). **Gotcha learned:** an element with `backdrop-filter` inside another `backdrop-filter` element only sees its parent, so it looks transparent — the dropdown must be a sibling of the top bar, not its child.

## Active boxes
The box that holds the page's main action (Kezdőlap first to-do, Hírek first news card, Képek selected template) gets a 1px purple→`--primary-2`→orange gradient edge (mask technique, `::before`) + soft purple glow below. Everything else stays quiet glass.

## Faded aitmetica logo
"a/ aitmetica" at 13% (A) / 16% (B) opacity, decorative (`aria-hidden`, `pointer-events: none`, behind content). Desktop: bottom-left of the content column (feedback pill is bottom-right). Phone: centred just above the feedback row; on Képek (grid fills the page) it sits in the free left side of the feedback row. Never overlaps the Visszajelzés pill.

## Build changes needed (non-token)
1. `tema-alap.json` ← tema-A or tema-B values (fonts: Inter Tight 600/700, Inter 400/500/600, JetBrains Mono 400/500, latin-ext).
2. Aurora layer: one shared `<div class="aurora">` (3 spans) in the app shell + keyframes; reduced-motion fallback.
3. Glass utility (`.uveg`, `.uveg-sav`) applied to top bar, phone bottom bar, `teendo` cards, tiles, image cards, feedback pill, menus; phone media query drops card blur.
4. Button motion: `.fo` (lift, sweep `::after`, spring press), `.halk`, tiles/cards hover.
5. Card enter animation with stagger.
6. Active-box outline (`::before` gradient edge) on the main-action card; selected Képek template.
7. `--halad-telt: var(--keszul)` + shimmer; new "Készül" overlay component for images being generated.
8. Top bar rebuild: a/ logo SVG + product name, Profil dropdown (new menu component, keyboard + `aria-expanded`), bell with count, orange active underline; phone bar with page label; phone ☰ sheet with Profil group.
9. Faded logo element in the shell (desktop + phone positions).
10. New label keys (`felirat`, HU/RO/EN via a new migration): `nav.profil` ("Profil"), product name, `menu.bezaras` ("Bezárás"), `kep.keszul` ("Készül a kép") if not already present.
11. `r15.css`: remove nothing; add the above. `pnpm tokenor`: the glass/aurora colours need tokens or the `/* tokenőr: ok */` marker.
12. Vilmos: no security impact; product-level change = nav regroup (needs his OK per the rulebook).

---
## Round 1 (for the record)
Round 1 drew three token-only directions (A Éjszaka, B Papír, C Vegyes) on the R-15 screens 03bT, 04b and 09; element/text identity was checked by script (18/18). Round 1 contrast still holds for the base colours: A body text 16.8, secondary 9.4, white on main button 5.9, main button vs page 3.4; B body 15.7, secondary 7.4, white on main button 9.0, warning text 4.6. Glass fills keep text contrast within ±0.5 of those (fills are ≤5% white on A, ≥58% white on B).
