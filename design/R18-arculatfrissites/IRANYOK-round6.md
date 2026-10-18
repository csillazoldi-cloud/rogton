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
