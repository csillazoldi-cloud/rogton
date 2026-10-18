Te egy React/TypeScript fejlesztő vagy egy meglévő Next.js alkalmazásban. A mellékelt fájl az első beállítás lapja
(`apps/web/app/onboarding/ElsoBeallitas.tsx`). Négy hibát kell javítanod benne. Új elemet a képernyőre NE tegyél,
kivéve a lent kifejezetten kért két szövegsort. Magyar szöveget NE írj a kódba: minden szöveg `t("kulcs")`.

KIMENET: CSERE-blokkok, pontosan ebben a formában (a RÉGI blokknak betűre egyeznie kell a fájl egy részével, és
pontosan egyszer szabad előfordulnia; legyen elég hosszú, hogy egyedi legyen):

### CSERE 1
--- RÉGI
<a fájl pontos szövege>
--- ÚJ
<az új szöveg>
--- VÉGE

A HIBÁK

1. Ha a felhasználó az átnézés lapon (lap === "atnezes") újratölti az oldalt, a `hfTervezet` üres marad (csak a
   `dolgozik()` tölti), ezért a témák eltűnnek, és a jóváhagyás NEM menti el a hírbeállítást.
   JAVÍTÁS: egy új useEffect: ha `lap === "atnezes"` és `hfTervezet === null`, kérd le
   `hivas("/api/hirfigyelo/beallitas", "GET")` — a válasz `torzs.hirfigyelo.tervezet` (lehet null) egy HfTervezet
   típusú objektum; ha van, `setHfTervezet(...)`. 401 → `router.push("/belepes")`. Egyszer fusson (useRef jelzővel).
   A `hivas` aláírása: `hivas(ut: string, modszer: string, torzs?: unknown) => Promise<{ statusz: number; torzs: Record<string, unknown> }>`.

2. Az oldal-ajánlat (`/api/hirfigyelo/forrasok/ajanlat`) lassan jön; amíg tölt, a „Mely oldalakat figyeljük” sorban
   semmi nem látszik, és a jóváhagyás gomb már megnyomható — ilyenkor 0 oldal kerül el.
   JAVÍTÁS: (a) amíg `oldalAjanlatFut` igaz, az oldal-kockák helyén jelenjen meg EGY sor:
   `<div className="km-sugo">{t("onboarding.eb_oldalak_keres")}</div>`.
   (b) A jóváhagyás gomb legyen `disabled`, amíg `oldalAjanlatFut` igaz (a `jovahagyFut` mellett).

3. Ha a jóváhagyáskor 0 oldal van kijelölve (`jeloltOldalak.size === 0`) és az ajánlat már nem tölt, a gombsor fölött
   jelenjen meg: `<div className="km-sugo" role="status">{t("onboarding.eb_nincs_oldal")}</div>`.
   A gomb ilyenkor is megnyomható (a profil jóváhagyása ettől még kell), a felirata ne változzon.

4. A jóváhagyás (`jovahagy()`) a hírbeállítás sikeres mentése után (`r2.statusz === 200`) törölje a félbehagyott
   tervezetet: `await hivas("/api/hirfigyelo/beallitas/tervezet", "DELETE")` (a válasz státuszát nem kell nézni).
   Ha a jóváhagyáskor `hfTervezet` még mindig null, ELŐBB kérd le ugyanúgy, mint az 1. pontban (külön segédfüggvény,
   amit az 1. pont useEffectje is használ), és a jelölt témák, ha a `temakJelolve` üres, legyenek a tervezet első 4 témája.

A két új kulcsot (`onboarding.eb_oldalak_keres`, `onboarding.eb_nincs_oldal`) a feliratokat Claude írja — te csak használd.
Ne változtass semmi mást. Ne add vissza az egész fájlt, csak a CSERE-blokkokat.
