# Feladat — ÉPÍTŐ (E-3): a fiók/belépés gépezete

Írd meg az alábbi fájlokat a mellékelt közös szerződés szerint, pontosan a megadott felülettel:

1. `apps/web/hitelesites/index.ts` — a modul (regisztral, belep, kilep, aktualisFiok, szervezetLetrehoz)
2. `apps/web/hitelesites/suti.ts` — a süti-segédek
3. `apps/web/app/api/fiok/regisztracio/route.ts`
4. `apps/web/app/api/fiok/belepes/route.ts`
5. `apps/web/app/api/fiok/kilepes/route.ts`
6. `apps/web/app/api/fiok/en/route.ts`
7. `apps/web/app/api/szervezet/route.ts`

Szabályok:
- Csak ezeket a fájlokat add vissza. A sémát, a kapcsolat-réteget és a contracts csomagot NE módosítsd.
- Importok: `@km/contracts` a nevén; a sémát és a kapcsolatot relatív úttal (`../adatbazis/sema`,
  `../adatbazis/kapcsolat`; a route-fájlokból `../../../../hitelesites` ill. a szervezet route-ból `../../../hitelesites`).
- Drizzle lekérdezések: `tx.select().from(sema.fiok).where(eq(sema.fiok.email, email))` stílusban; a
  `kapcsolat.ts` `db()`, `szervezetKent`, `fiokKent` függvényeit használd. A `fiok` és `munkamenet` táblát
  `db()`-n át közvetlenül; a `szervezet`/`tagsag` táblát csak `szervezetKent`/`fiokKent` alatt.
- Az `aktualisFiok` a fiók szervezeteit `fiokKent(fiokId, tx => tagsag ⋈ szervezet)` alatt olvassa.
- A `regisztral` az EMAIL_FOGLALT-ot az egyedi index megsértéséből (pg hiba `23505`) ISMERJE FEL, ne csak
  előzetes lekérdezésből (versenyhelyzet).
- Szigorú TypeScript: minden `unknown` bemenet zod-dal ellenőrizve (`safeParse`), a `mezok` a zod hibák
  mezőnkénti kódja (pl. `{ email: "invalid_format" }`), nem szöveg.
- Nincs `any`, nincs `console.log` a siker-ágon; váratlan hibát `console.error`-ral naplózz.
- A `Response` objektumon a `Set-Cookie` fejlécet `valasz.headers.append("set-cookie", …)`-vel add hozzá.
