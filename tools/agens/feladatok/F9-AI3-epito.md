# Feladat — ÉPÍTŐ (F9-AI3 + a relevancia-válasz szelídítése): a tartalomötlet a profil közönségéből; az ötlet gombja csak érdekes/fontos hírnél; a mező-keveredés javítása

TypeScript 7 strict, zod 4.5, vitest, React 19. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`. Magyar azonosítók és megjegyzések. TELJES fájl, ahol ezt írom; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE` blokkok, a RÉGI szó szerint és egyedi) a nagy fájlokhoz.

## MÉRT tények (2026-09-15, gpt-5-mini, 12 mintacikk, 3 menet)

- A relevancia-válaszban a modell 3 menetből 3-szor ugyanannál a cikknél a `fontossag` mezőbe a témacímke értékét írta (`"fontossag": "sajat_megjelenes"`), a `temacimke` is `"sajat_megjelenes"` — az ellenőrzés eldobja, a hír „függőben” marad. Determinisztikus megfeleltetés: a prompt saját meghatározása szerint a szervezetről szóló hír ("sajat_megjelenes") = "fontos"; a "szakmai" és a "tartalomotlet" = "erdekes".
- A tartalomötlet (`hf_tartalomotlet`) ma csak a találatot és a profil hangnemét (`hangnem_leiras`) kapja; a profilban van `celkozonseg` (szöveg) és `nev`, `osszefoglalo` is. Az ötlet gombja a részletpanelen minden nem-néző szerepnek megjelenik, a hír fontosságától függetlenül (`!vanOtlet && szerep !== "nezo"`).

## Mit kell megírni

### 1. TELJES: `packages/news-monitor-core/src/szelidit.ts` (mellékelve)
Új exportált függvény `relevanciaSzelidit(nyers: unknown): unknown`: ha objektum, és `fontossag` NEM "fontos" | "erdekes" | "hatter", de a `fontossag` értéke "sajat_megjelenes" → "fontos", "szakmai" vagy "tartalomotlet" → "erdekes" (más esetben érintetlen); a `temacimke`, ha nem "sajat_megjelenes" | "szakmai" | "tartalomotlet" és az értéke "fontos" → "sajat_megjelenes", "erdekes" → "szakmai", "hatter" → "tartalomotlet" (a fordított keveredés); a szöveges mezők (`osszefoglalo`, `miert`, `indoklas`) trim + `szovegRovidit` a séma szerint (400, 200 — a `miert` sémája max 300, ezt használd —, 800). Az `aiValaszSzelidit` a `"hf_relevancia"` ágon ezt hívja. Megjegyzés a függvény fölé: `// F9-AI1 (MÉRVE 2026-09-15): a modell 3/3 menetben a fontosság mezőbe a témacímkét írta egy cikknél — determinisztikus megfeleltetés, a prompt saját meghatározása szerint`.

### 2. TELJES: `packages/news-monitor-core/probak/szelidit.proba.ts` (mellékelve)
Új esetek: `relevanciaSzelidit({ fontossag: "sajat_megjelenes", temacimke: "sajat_megjelenes", miert: "x", osszefoglalo: "y" })` → `fontossag: "fontos"`; `{ fontossag: "szakmai", … }` → "erdekes"; jó válasz változatlan (`toEqual`); `aiValaszEllenoriz("hf_relevancia", { fontossag: "sajat_megjelenes", temacimke: "sajat_megjelenes", miert: "Mert", indoklas: "", osszefoglalo: "" }, { talalat_ids: [] })` → `ok: true`, `fontossag: "fontos"`.

### 3. RÉSZLET: `_RESZLET-core.md`
- `packages/news-monitor-core/src/ai.ts` (mellékelve): a `HfBemenet` `hf_tartalomotlet` sora → `hf_tartalomotlet: { talalat: unknown; hangnem: string; profil: unknown };` (a RÉGI blokk: a mai sor).
- `packages/news-monitor-core/src/folyamat.ts` (mellékelt részlet): a `k.ai("hf_tartalomotlet", { … hangnem, })` hívás kap egy `profil: k.profil,` sort (a RÉGI blokk: a `const valasz = await k.ai("hf_tartalomotlet", {` sortól a `});`-ig).

### 4. TELJES: `apps/web/hirfigyelo/ai.ts` (mellékelve)
A `hf_tartalomotlet` ág: a bemenet típusa `{ talalat: …; hangnem: string; profil: unknown }`; a `szoveg` elejére `<<ADAT profil>>\n${JSON.stringify(b.profil)}\n<<ADAT VÉGE>>\n\n` (a találat-blokk elé); `maxKiToken = 600` marad. Más nem változik.

### 5. TELJES: `packages/news-monitor-promptok/promptok/hf_tartalomotlet.hu.md` (mellékelve)
Fejléc: `v5 · 2026-09-15 · F9-AI3: az ötlet a profil közönségének szól`. A bemenet leírása: „A bemenetben megkapod a szervezet profilját (név, tevékenység, célközönség, hangnem), a találatot (cikk) és a profil hangnemét.” Új szabályok a Szabályok közé:
- `- Az ötlet a SZERVEZET KÖZÖNSÉGÉNEK szól (a profil "celkozonseg" mezője): mondd ki, kinek és mit mondanátok — nem általános marketingtanács.`
- `- Ha a hírnek nincs kapcsolata a szervezet tevékenységével vagy közönségével, az ötlet ezt mondja ki egy mondatban („Ehhez a hírhez nem érdemes tartalmat készíteni, mert…”), és nem erőltet ötletet.`
A `<<ADAT …>>` védelmi bekezdés és a `{{nyelv}}` helyek szó szerint maradnak.

### 6. RÉSZLET: `_RESZLET-attekintes.md` (a mellékelt Attekintes-részlethez)
Az ötlet gombja csak érdekes vagy fontos hírnél: `{!vanOtlet && szerep !== "nezo" && (` → `{!vanOtlet && szerep !== "nezo" && (kartya.fontossag === "fontos" || kartya.fontossag === "erdekes") && (` — megjegyzés: `{/* F9-AI3: ötletet csak érdekes vagy fontos hírhez ajánlunk */}` a sor elé.

## Elfogadás (a beépítő méri)
A mag próbái zöldek; `pnpm tipus` zöld; a promptok próbája zöld. Add vissza: szelidit.ts, szelidit.proba.ts, _RESZLET-core.md, apps/web/hirfigyelo/ai.ts, hf_tartalomotlet.hu.md, _RESZLET-attekintes.md.
