# F-3e · Tesztelő — élő próbák a Tagok laphoz, a beváltó laphoz és a jegy-megtekintéshez (`apps/web/probak/tagok-lap.proba.ts`)

CÉL: egy új próbafájl az élő rendszer ellen bizonyítja a három új darabot: `GET /api/meghivo/{jegy}` (nyilvános megtekintés), a `/tagok` lap
(ki látja), a `/meghivo/<jegy>` lap, és a belépőlap `vissza` címe.

FORRÁS: a mellékelt `segedek.ts` (`keres`, `veletlenEmail`, `takaritas`, `lezar`) és a `kezdolap.proba.ts` (minta: fiók + belépés + szervezet; a meghívó
kiadása és beváltása a `beforeAll`-ban). Jelszó "ProbaJelszo123!". Regisztráció `POST /api/fiok/regisztracio` {nev,email,jelszo} → 201; belépés
`POST /api/fiok/belepes` → 200, sütik `belepes.sutik.join("; ")`; szervezet `POST /api/szervezet` {nev} → 201 `{ id }` (aki létrehozza, tulajdonos).
Meghívó: A `POST /api/tagok/meghivo` `{ szerep: "nezo" }` → 201 `{ hozzaferes: { meghivo: { id }, jegy, link } }`.
A lapok HTML-t adnak (`keres<string>`), a `fetch` követi az átirányítást (a belépőlapra irányított kérés 200-at ad a belépőlap szövegével).

A VÉGPONT: `GET /api/meghivo/{jegy}` (süti nélkül is) → 200 `{ meghivo: BevaltoNezet }`, ahol
`BevaltoNezet = { allapot: "kiadott"|"elfogadott"|"visszavont"|"lejart"|"nincs"; meghivo_nev: string|null; szervezet_nev: string|null; szerep: string|null;
lejar: string|null; belepve: boolean; fiok_email: string|null; mar_tag: boolean }` — a nevet/munkatér nevét/szerepet CSAK `kiadott`-nál adja, különben null.

MIT CSINÁLJ: `describe("tagok lap, bevalto lap, jegy-megtekintes (F-3e)")`; `beforeAll`: A fiók + szervezet („Proba Munkater"); B fiók szervezet NÉLKÜL;
A kiad egy nézői meghívót (jegy1) és egy szerkesztőit (jegy2). Esetek külön `it`-ekben:
1. `GET /api/meghivo/{jegy1}` süti nélkül → 200; `allapot` "kiadott"; `szervezet_nev` "Proba Munkater"; `meghivo_nev` az A neve; `szerep` "nezo"; `belepve` false; `mar_tag` false; `lejar` nem null.
2. Ugyanaz B sütijével → `belepve` true, `fiok_email` a B e-mailje, `mar_tag` false.
3. `GET /api/meghivo/nincs-ilyen-jegy` → 200, `allapot` "nincs", minden név null.
4. B beváltja jegy1-et (`POST /api/meghivo/elfogad`) → 200; utána `GET /api/meghivo/{jegy1}` → `allapot` "elfogadott", nevek null; B sütijével `mar_tag` true (B már tag).
5. A visszavonja jegy2-t (`DELETE /api/tagok/meghivo/{id2}`) → 200; `GET /api/meghivo/{jegy2}` → `allapot` "visszavont".
6. `GET /tagok` lap: A (tulajdonos) sütijével → 200, a törzs tartalmazza `km-tg-` és `km-sav` szót; B (néző) sütijével → 200, de NEM tartalmazza `km-tg-` (a kezdőlapra irányított: `km-kp-`); süti nélkül → a belépőlap (nem tartalmaz `km-tg-`).
7. `GET /meghivo/{jegy1}` lap süti nélkül → 200, tartalmazza `km-bv-`, és NEM tartalmazza `km-sav` (nincs felső sáv).
8. `GET /belepes?vissza=/meghivo/abc` → 200 (a lap él a paraméterrel); `GET /belepes?vissza=//gonosz.example` → 200 (nem dől el; a kliens dobja el).
`afterAll`: `takaritas()`, `lezar()`. Szigorú TypeScript (`noUncheckedIndexedAccess`): a törzseket típusozd.
HATÁR: csak ez az egy fájl. Visszaadás: `=== FÁJL: apps/web/probak/tagok-lap.proba.ts ===` blokkban a teljes fájl. Semmi más szöveg.
