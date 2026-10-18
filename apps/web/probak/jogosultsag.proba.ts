import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, sutiKinyer } from "./segedek";

// B-01 (biztonsági felülvizsgálat, 3. lépés): EGYSÉGES jogellenőrzés minden módosító végponton.
//
// Két gépezet van ebben a fájlban, és a kettő együtt ér valamit:
//
//  1. JOGOSULTSÁGI MÁTRIX — minden módosító végpontot végigpróbál MINDEN szereppel, élő HTTP-hívással.
//     Nem azt nézi, hogy a kód mit ígér, hanem azt, hogy a kiszolgáló mit enged.
//
//  2. ŐR — végigolvassa az útvonalfájlokat, és elbukik, ha van olyan módosító kezelő (POST/PUT/
//     PATCH/DELETE), ami NEM szerepel a mátrixban, vagy amiben nincs `kapu(` hívás. Ez az, ami miatt
//     a következő új végpont nem felejtődik el: aki ír egyet, annak itt is ki kell mondania a szintjét.
//
// A szintek jelentése:
//   nyilvanos     — belépés nélkül is hívható (belépés, regisztráció, kilépés, jelszó-visszaállítás)
//   belepett      — belépett fiók, szervezet nem kell (nyelvváltás, szervezet létrehozása)
//   tag           — a szervezet bármely tagja, nézőt is beleértve
//   szerkeszto    — szerkesztő vagy tulajdonos
//   tulajdonos    — csak a szervezet tulajdonosa
//   rendszergazda — a rendszergazda-jelölés kell hozzá

const jelszo = "ProbaJelszo123!";

export type Szint = "nyilvanos" | "belepett" | "tag" | "szerkeszto" | "tulajdonos" | "rendszergazda";

type Vegpont = {
  /** az útvonalfájl helye az `app/api` alatt */
  fajl: string;
  /** a HTTP-módszer */
  modszer: "POST" | "PUT" | "PATCH" | "DELETE";
  /** a hívható út (a [id] helyére valódi azonosító kerül a próbában) */
  ut: string;
  szint: Szint;
  /** a kérés törzse — olyan, ami a JOGOT nem kerüli meg, de a séma-ellenőrzésen átmegy */
  torzs?: unknown;
  /** igaz: a mátrix körében NEM hívjuk (mellékhatása elrontaná a többi mérést), saját próbája van */
  kulon?: true;
};

// A TELJES lista. Ha ide nem kerül be egy módosító végpont, az őr elbuktatja a próbát.
const VEGPONTOK: Vegpont[] = [
  // --- nyilvános ---
  { fajl: "fiok/belepes", modszer: "POST", ut: "/api/fiok/belepes", szint: "nyilvanos", torzs: { email: "nincs-ilyen@proba.example", jelszo } },
  { fajl: "fiok/regisztracio", modszer: "POST", ut: "/api/fiok/regisztracio", szint: "nyilvanos", torzs: { nev: "X", email: "", jelszo } },
  // A kilépés KIMARAD a körből: minden szereppel meghívva mindenkit kiléptetne, és a mátrix
  // további része hamis 401-eket mérne. Saját próbája lentebb van, eldobható munkamenettel.
  { fajl: "fiok/kilepes", modszer: "POST", ut: "/api/fiok/kilepes", szint: "nyilvanos", kulon: true },
  { fajl: "fiok/jelszo-visszaallitas", modszer: "POST", ut: "/api/fiok/jelszo-visszaallitas", szint: "nyilvanos", torzs: { jegy: "nincsilyen", jelszo } },

  // 0148 (Kati 10-02, Csilla 10-06): a Visszajelzés beküldése a belépés előtti lapokon is — munkamenet nélkül NÉVTELEN, szűk úton
  // (cím szerinti sebességkorlát, méretkorlát, csak PNG képernyőkép). A mátrix üres törzzsel hívja: mindenkinek 400 (nem jog-elutasítás,
  // és nem ír sort). A két út (névtelen / belépett) és a korlát saját próbája: visszajelzes-nevtelen.proba.ts.
  { fajl: "visszajelzes", modszer: "POST", ut: "/api/visszajelzes", szint: "nyilvanos", torzs: {} },

  // A nyelvváltás SZÁNDÉKOSAN nyilvános: a nyelv-sütit a belépőlapon is állítani kell tudni.
  // Belépett fióknál ráadásként a fiókra is elmenti — de a jogot nem ez adja.
  { fajl: "nyelv", modszer: "POST", ut: "/api/nyelv", szint: "nyilvanos", torzs: { nyelv: "hu" } },

  // --- belépett fiók, szervezet nélkül is ---
  { fajl: "szervezet", modszer: "POST", ut: "/api/szervezet", szint: "belepett", torzs: { nev: "" } },

  // --- a szervezet bármely tagja ---
  { fajl: "hirfigyelo/talalatok/[id]/megtekint", modszer: "POST", ut: "/api/hirfigyelo/talalatok/00000000-0000-4000-8000-000000000000/megtekint", szint: "tag" },

  // --- szerkesztő vagy tulajdonos ---
  { fajl: "hirfigyelo/beallitas", modszer: "PUT", ut: "/api/hirfigyelo/beallitas", szint: "szerkeszto", torzs: {} },
  { fajl: "hirfigyelo/beallitas/tervezet", modszer: "PUT", ut: "/api/hirfigyelo/beallitas/tervezet", szint: "szerkeszto", torzs: {} },
  // R-15 T8: a heti haladás számláló eseménye (kép letöltve) — szerkesztő, mert a Képek lap is az.
  { fajl: "halad", modszer: "POST", ut: "/api/halad", szint: "szerkeszto", torzs: {} },
  { fajl: "hirfigyelo/beallitas/tervezet", modszer: "DELETE", ut: "/api/hirfigyelo/beallitas/tervezet", szint: "szerkeszto" },
  { fajl: "hirfigyelo/beallitas/visszaallit", modszer: "POST", ut: "/api/hirfigyelo/beallitas/visszaallit", szint: "szerkeszto", torzs: { verzio: 999999 } },
  { fajl: "hirfigyelo/beallitas/javaslat", modszer: "POST", ut: "/api/hirfigyelo/beallitas/javaslat", szint: "szerkeszto", torzs: {} },
  { fajl: "hirfigyelo/forrasok", modszer: "POST", ut: "/api/hirfigyelo/forrasok", szint: "szerkeszto", torzs: { cim: "" } },
  { fajl: "hirfigyelo/forrasok/[id]/ellenoriz", modszer: "POST", ut: "/api/hirfigyelo/forrasok/00000000-0000-4000-8000-000000000000/ellenoriz", szint: "szerkeszto" },
  { fajl: "hirfigyelo/futas", modszer: "POST", ut: "/api/hirfigyelo/futas", szint: "szerkeszto", torzs: {} },
  { fajl: "hirfigyelo/ertekeles-ujra", modszer: "POST", ut: "/api/hirfigyelo/ertekeles-ujra", szint: "szerkeszto", torzs: {} },
  { fajl: "hirfigyelo/javaslat", modszer: "POST", ut: "/api/hirfigyelo/javaslat", szint: "szerkeszto", torzs: {} },
  { fajl: "hirfigyelo/javaslat/[id]/dont", modszer: "POST", ut: "/api/hirfigyelo/javaslat/00000000-0000-4000-8000-000000000000/dont", szint: "szerkeszto", torzs: { dontes: "elvet" } },
  { fajl: "hirfigyelo/javaslat/[id]/kiprobal", modszer: "POST", ut: "/api/hirfigyelo/javaslat/00000000-0000-4000-8000-000000000000/kiprobal", szint: "szerkeszto" },
  { fajl: "hirfigyelo/talalatok/[id]/jelol", modszer: "POST", ut: "/api/hirfigyelo/talalatok/00000000-0000-4000-8000-000000000000/jelol", szint: "szerkeszto", torzs: { jeloles: "fontos" } },
  { fajl: "hirfigyelo/talalatok/[id]/tartalomotlet", modszer: "POST", ut: "/api/hirfigyelo/talalatok/00000000-0000-4000-8000-000000000000/tartalomotlet", szint: "szerkeszto" },
  { fajl: "hirfigyelo/visszajelzes", modszer: "POST", ut: "/api/hirfigyelo/visszajelzes", szint: "szerkeszto", torzs: {} },
  { fajl: "onboarding/piszkozat", modszer: "PUT", ut: "/api/onboarding/piszkozat", szint: "szerkeszto", torzs: {} },
  { fajl: "onboarding/arculat", modszer: "POST", ut: "/api/onboarding/arculat", szint: "szerkeszto", torzs: {} },
  { fajl: "onboarding/kutatas", modszer: "POST", ut: "/api/onboarding/kutatas", szint: "szerkeszto", torzs: {} },
  { fajl: "onboarding/hangnem", modszer: "POST", ut: "/api/onboarding/hangnem", szint: "szerkeszto", torzs: {} },
  { fajl: "onboarding/javaslatok", modszer: "POST", ut: "/api/onboarding/javaslatok", szint: "szerkeszto", torzs: {} },
  { fajl: "onboarding/osszefoglalo", modszer: "POST", ut: "/api/onboarding/osszefoglalo", szint: "szerkeszto", torzs: {} },

  // --- csak a tulajdonos ---
  { fajl: "onboarding/jovahagyas", modszer: "POST", ut: "/api/onboarding/jovahagyas", szint: "tulajdonos" },
  { fajl: "profil", modszer: "PUT", ut: "/api/profil", szint: "tulajdonos", torzs: {} },
  // c30 F3 (2026-10-17): a posztok nyelvi módja (rajz D5/D9b) — szerkesztő menthet; új végpont, új sor (a mátrix bővül, semmi nem változik)
  { fajl: "profil/nyelvmod", modszer: "PUT", ut: "/api/profil/nyelvmod", szint: "szerkeszto", torzs: {} },
  // c30 F5 (2026-10-17): a rendezvény programja — beolvasás és tételenkénti szerkesztés a szerkesztőé (mint a kínálat); új végpontok, új sorok
  // c30 F6 (2026-10-17): „Mikor és hol lesz?” (rajz D2) — a rendezvény adatai a szerkesztőé; új végpont, új sor
  { fajl: "profil/rendezveny", modszer: "PUT", ut: "/api/profil/rendezveny", szint: "szerkeszto", torzs: {} },
  { fajl: "program/olvas", modszer: "POST", ut: "/api/program/olvas", szint: "szerkeszto", torzs: {} },
  { fajl: "program/tetel", modszer: "POST", ut: "/api/program/tetel", szint: "szerkeszto", torzs: {} },
  { fajl: "program/tetel", modszer: "PUT", ut: "/api/program/tetel", szint: "szerkeszto", torzs: {} },
  { fajl: "program/tetel", modszer: "DELETE", ut: "/api/program/tetel", szint: "szerkeszto", torzs: {} },
  { fajl: "tema", modszer: "PUT", ut: "/api/tema", szint: "tulajdonos", torzs: {} },
  { fajl: "tema", modszer: "DELETE", ut: "/api/tema", szint: "tulajdonos" },
  { fajl: "tema/alkalmaz", modszer: "POST", ut: "/api/tema/alkalmaz", szint: "tulajdonos" },
  { fajl: "tema/visszaallit", modszer: "POST", ut: "/api/tema/visszaallit", szint: "tulajdonos", torzs: { verzio: 999999 } },
  { fajl: "feliratok", modszer: "PUT", ut: "/api/feliratok", szint: "tulajdonos", torzs: {} },
  { fajl: "feliratok", modszer: "DELETE", ut: "/api/feliratok", szint: "tulajdonos" },
  { fajl: "feliratok/alkalmaz", modszer: "POST", ut: "/api/feliratok/alkalmaz", szint: "tulajdonos" },
  { fajl: "feliratok/visszaallit", modszer: "POST", ut: "/api/feliratok/visszaallit", szint: "tulajdonos", torzs: { verzio: 999999 } },

  // --- csak rendszergazda ---
  { fajl: "tema/kozos", modszer: "PUT", ut: "/api/tema/kozos", szint: "rendszergazda", torzs: {} },
  { fajl: "tema/kozos", modszer: "DELETE", ut: "/api/tema/kozos", szint: "rendszergazda" },
  { fajl: "tema/kozos/alkalmaz", modszer: "POST", ut: "/api/tema/kozos/alkalmaz", szint: "rendszergazda" },
  { fajl: "tema/kozos/visszaallit", modszer: "POST", ut: "/api/tema/kozos/visszaallit", szint: "rendszergazda", torzs: { verzio: 999999 } },
  { fajl: "feliratok/kozos", modszer: "PUT", ut: "/api/feliratok/kozos", szint: "rendszergazda", torzs: {} },
  { fajl: "feliratok/kozos", modszer: "DELETE", ut: "/api/feliratok/kozos", szint: "rendszergazda" },
  { fajl: "feliratok/kozos/alkalmaz", modszer: "POST", ut: "/api/feliratok/kozos/alkalmaz", szint: "rendszergazda" },
  { fajl: "feliratok/kozos/visszaallit", modszer: "POST", ut: "/api/feliratok/kozos/visszaallit", szint: "rendszergazda", torzs: { verzio: 999999 } },
  { fajl: "koltseg/keret", modszer: "PUT", ut: "/api/koltseg/keret", szint: "rendszergazda", torzs: { keretek: [] } },
  { fajl: "fiokok", modszer: "POST", ut: "/api/fiokok", szint: "rendszergazda", torzs: {} },
  { fajl: "fiok/jelszo-jegy", modszer: "POST", ut: "/api/fiok/jelszo-jegy", szint: "rendszergazda", torzs: { email: "" } },
  // --- F-3: tagság és meghívó (a `@rogton/hozzaferes-core` befogadása) ---
  { fajl: "tagok/meghivo", modszer: "POST", ut: "/api/tagok/meghivo", szint: "szerkeszto", torzs: { szerep: "nezo" } },
  { fajl: "tagok/meghivo/[id]", modszer: "DELETE", ut: "/api/tagok/meghivo/00000000-0000-4000-8000-000000000000", szint: "szerkeszto" },
  { fajl: "meghivo/elfogad", modszer: "POST", ut: "/api/meghivo/elfogad", szint: "belepett", torzs: { jegy: "nincsilyen" } },
  { fajl: "tagok/[fiokId]", modszer: "PUT", ut: "/api/tagok/00000000-0000-4000-8000-000000000000", szint: "tulajdonos", torzs: { szerep: "nezo" } },
  { fajl: "tagok/[fiokId]", modszer: "DELETE", ut: "/api/tagok/00000000-0000-4000-8000-000000000000", szint: "tulajdonos" },
  // a kilépés a mátrix körében NEM hívható (a szereplőt kiléptetné a munkatérből) — saját próbája a hozzaferes.proba.ts-ben
  { fajl: "tagok/kilep", modszer: "POST", ut: "/api/tagok/kilep", szint: "tag", kulon: true },
  // --- F-4: saját fiók (belépett; szervezet nem kell) ---
  { fajl: "fiok/jelszo", modszer: "PUT", ut: "/api/fiok/jelszo", szint: "belepett", torzs: { jelenlegi: "x", uj: "ProbaJelszo123!" } },
  { fajl: "fiok/nev", modszer: "PUT", ut: "/api/fiok/nev", szint: "belepett", torzs: { nev: "X" } },
  // a mátrix körében NEM hívható: a szereplők többi munkamenetét léptetné ki — saját próbája a sajat-fiok.proba.ts-ben
  { fajl: "fiok/kileptetes-mindenhol", modszer: "POST", ut: "/api/fiok/kileptetes-mindenhol", szint: "belepett", kulon: true },
  // --- F-6: fájlfeltöltés (szerkesztő) — a mátrix üres törzzsel hívja: az URES/400 nem jog-elutasítás ---
  { fajl: "arculat/fajl", modszer: "POST", ut: "/api/arculat/fajl", szint: "szerkeszto" },
  // --- F-5: értesítés két szintje és az AI-kapcsoló ---
  { fajl: "ertesites", modszer: "PUT", ut: "/api/ertesites", szint: "tulajdonos", torzs: { futas_hiba: "nincs" } },
  { fajl: "ertesites/kozos", modszer: "PUT", ut: "/api/ertesites/kozos", szint: "rendszergazda", torzs: { futas_hiba: "nincs" } },
  // F-5b (R-4): a fiók-szintű értesítés — bármely tag a sajátját állítja és olvasottnak jelöl
  { fajl: "ertesites/sajat", modszer: "PUT", ut: "/api/ertesites/sajat", szint: "tag", torzs: { esemenyek: { futas_kesz: true, forras_hibas: true, keret_kimerult: true, ai_nem_valaszol: true, futas_beragadt: true, belepesi_kiserletek: true }, feluleten: true } },
  { fajl: "ertesites/olvasott", modszer: "POST", ut: "/api/ertesites/olvasott", szint: "tag", torzs: { mind: true } },
  { fajl: "beallitas/ai", modszer: "PUT", ut: "/api/beallitas/ai", szint: "tulajdonos", torzs: { engedelyezve: true } },
  // --- F-2: pénznem (tulajdonos), árfolyam (rendszergazda), munkatér-váltás (belépett; a tagságot a végpont ellenőrzi) ---
  { fajl: "beallitas/penznem", modszer: "PUT", ut: "/api/beallitas/penznem", szint: "tulajdonos", torzs: { penznem: "EUR" } },
  { fajl: "beallitas/arfolyam", modszer: "PUT", ut: "/api/beallitas/arfolyam", szint: "rendszergazda", torzs: { penznem: "EUR", egy_usd: 0.92 } },
  // a váltás a mátrix körében NEM mérhető: nem tagja senki a helyőrző munkatérnek, így mindenki 403-at kap — a jogát a kezdolap.proba.ts 10. és 11. esete méri (saját 200, idegen 403, süti nélkül 401)
  { fajl: "szervezet/valt", modszer: "POST", ut: "/api/szervezet/valt", szint: "belepett", kulon: true },
  // R-13 (2026-09-22): fiókonkénti hírszűrés és kredit
  { fajl: "hirfigyelo/sajat-szures", modszer: "PUT", ut: "/api/hirfigyelo/sajat-szures", szint: "tag", torzs: { fokozat: "nagyon_szigoru", eloszures: true } },
  { fajl: "kredit/tagok/[fiokId]", modszer: "PUT", ut: "/api/kredit/tagok/00000000-0000-4000-8000-000000000000", szint: "tulajdonos", torzs: { havi: null } },
  { fajl: "kredit/munkater/[szervezetId]", modszer: "PUT", ut: "/api/kredit/munkater/00000000-0000-4000-8000-000000000000", szint: "rendszergazda", torzs: { havi: null } },
  // R-16 K2: az „Így néz ki” előnézet — nem ment semmit, minden tag hívhatja; a körből kimarad, mert minden szereppel a
  // képgyártót hívná (a Gigabyte-on) — a kaput a kezelő hívja (az őr alább ellenőrzi), a törzset az r16-minta-keres.proba.ts
  { fajl: "vizual/helyzet-minta/[helyzet]", modszer: "POST", ut: "/api/vizual/helyzet-minta/kesz", szint: "tag", kulon: true },
  // R-16 K3 (TERV §2-K3): a „Logó, színek, betűk” szakasz — ment ÉS jóváhagy (kerdesek 4); a néző 403. A mátrix munkaterének nincs
  // profilja, ezért a szerkesztő és a tulajdonos 409 NINCS_PISZKOZAT-ot kap (nem jog-elutasítás, és nincs mellékhatás).
  { fajl: "arculat/jovahagy", modszer: "POST", ut: "/api/arculat/jovahagy", szint: "szerkeszto", torzs: {} },
  { fajl: "arculat/reszletek", modszer: "PUT", ut: "/api/arculat/reszletek", szint: "szerkeszto", torzs: {} },
  { fajl: "arculat/visszavon", modszer: "POST", ut: "/api/arculat/visszavon", szint: "szerkeszto", torzs: {} },
  // R-16 K4 (TERV §2-K4): „Ez legyen” a 12d/12d2-n — ment ÉS jóváhagy; a néző 403. Profil nélkül 409 NINCS_PISZKOZAT (mint fent).
  { fajl: "arculat/szinek", modszer: "POST", ut: "/api/arculat/szinek", szint: "szerkeszto", torzs: { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" } },
  // R-16 K5 (TERV §2-K5): „Ez legyen” a 12e-n — ment ÉS jóváhagy; a néző 403. (A K5-ből kimaradt a mátrixból — a K6 pótolja, az őr
  // e nélkül elbukik.) Profil nélkül 409 NINCS_PISZKOZAT.
  { fajl: "arculat/betuk", modszer: "POST", ut: "/api/arculat/betuk", szint: "szerkeszto", torzs: { cim: "archivo" } },
  // R-16 K6 (TERV §2-K6): „Ez legyen” a 12g-n — a névlogó 8 fájlja + a stílus, ment ÉS jóváhagy; a néző 403. Profil nélkül 409
  // NINCS_PISZKOZAT, a képgyártó hívása ELŐTT (a mátrix így a képgyártó nélkül is fut, és nem ír fájlt).
  { fajl: "arculat/nevlogo", modszer: "POST", ut: "/api/arculat/nevlogo", szint: "szerkeszto", torzs: { stilus: "nev" } },
  // R-17 B (0150): a logótervezési kérdőív beküldése (szerkesztő; üres törzzsel 400, sort nem ír), a rendszergazda beállítása (hibás
  // címzettel 400, nem ír) és egy kérés állapota (nem létező azonosítóval a rendszergazda 404-et kap — nem jog-elutasítás).
  { fajl: "logoterv", modszer: "POST", ut: "/api/logoterv", szint: "szerkeszto", torzs: {} },
  { fajl: "admin/logoterv", modszer: "PUT", ut: "/api/admin/logoterv", szint: "rendszergazda", torzs: { cimzett: 12 } },
  { fajl: "admin/logoterv/[id]", modszer: "PUT", ut: "/api/admin/logoterv/00000000-0000-4000-8000-000000000000", szint: "rendszergazda", torzs: { allapot: "uj" } },
  // VZ-1 · Közlemények (0152): a posztból kitöltés és a letöltés feljegyzése — szerkesztő; üres törzzsel 400 (nincs AI-hívás, nem ír)
  { fajl: "vizual/kozlemeny/kitolt", modszer: "POST", ut: "/api/vizual/kozlemeny/kitolt", szint: "szerkeszto", torzs: {} },
  { fajl: "vizual/kozlemeny/letoltve", modszer: "POST", ut: "/api/vizual/kozlemeny/letoltve", szint: "szerkeszto", torzs: {} },
  // R-15 · 06 Mit figyeljünk (gepezet-3 3.9, kerdesek-3 3): a reggeli hírek kikapcsolása — a bekapcsolás (PUT) párja
  { fajl: "r15/napi-figyeles", modszer: "DELETE", ut: "/api/r15/napi-figyeles", szint: "szerkeszto" },
];

/** Amit egy adott szereptől elvárunk egy adott szintű végponton. */
const RANG: Record<Szint, number> = {
  nyilvanos: 0, belepett: 1, tag: 2, szerkeszto: 3, tulajdonos: 4, rendszergazda: 5,
};

type Szereplo = { nev: string; rang: number; sutik: string; rendszergazda: boolean };

type Szemely = { sutik: string; fiokId: string; email: string; szervezetId?: string };

// SAJÁT névtér: a többi próbafájl takarítása a `proba-%@proba.example` mintát törli, és a mátrix
// elég sokáig fut ahhoz, hogy közben elvigye a fiókjait. Ez egyszer már hamis bukást okozott.
// Ezért itt `jog-…` előtag van, és a takarítást magunk végezzük el a végén.
function jogEmail(): string {
  return `jog-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}@proba.example`;
}

async function fiokot_letrehoz(szervezettel: boolean): Promise<Szemely> {
  const email = jogEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba", email, jelszo } });
  expect(r.statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  expect(b.statusz).toBe(200);
  const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  const sz: Szemely = { sutik, fiokId: r.torzs.id, email };
  if (szervezettel) {
    const s = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: `Jogproba ${email.slice(6, 14)}` }, sutik });
    expect(s.statusz).toBe(201);
    sz.szervezetId = s.torzs.id;
  }
  return sz;
}

describe("B-01 — jogosultsagi matrix minden modosito vegponton", () => {
  let szereplok: Szereplo[] = [];
  let tulaj: Szemely;

  beforeAll(async () => {
    // Egy szervezet, három szereppel: tulajdonos (a létrehozó), szerkesztő, néző.
    tulaj = await fiokot_letrehoz(true);
    const szerkeszto = await fiokot_letrehoz(false);
    const nezo = await fiokot_letrehoz(false);
    const gazda = await fiokot_letrehoz(true);
    // Tagság felvétele közvetlenül: tagságkezelő végpont MÉG NINCS a rendszerben (E-50 átadó).
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'szerkeszto')", [tulaj.szervezetId, szerkeszto.fiokId]);
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [tulaj.szervezetId, nezo.fiokId]);
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);

    // A munkamenetek a tagság felvétele UTÁN kellenek, mert a fiók nézetét belépéskor olvassuk.
    const ujra = async (sz: Szemely) => {
      const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: sz.email, jelszo } });
      return `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    };

    szereplok = [
      { nev: "kivulallo", rang: RANG.nyilvanos, sutik: "", rendszergazda: false },
      { nev: "belepett (szervezet nelkul)", rang: RANG.belepett, sutik: await ujra(await fiokot_letrehoz(false)), rendszergazda: false },
      { nev: "nezo", rang: RANG.tag, sutik: await ujra(nezo), rendszergazda: false },
      { nev: "szerkeszto", rang: RANG.szerkeszto, sutik: await ujra(szerkeszto), rendszergazda: false },
      { nev: "tulajdonos", rang: RANG.tulajdonos, sutik: await ujra(tulaj), rendszergazda: false },
      { nev: "rendszergazda", rang: RANG.rendszergazda, sutik: await ujra(gazda), rendszergazda: true },
    ];
  });

  afterAll(async () => {
    // csak a SAJÁT fiókjaink és a hozzájuk tartozó, tag nélkül maradt munkaterek
    await sql("DELETE FROM fiok WHERE email LIKE 'jog-%@proba.example'");
    await sql(
      "DELETE FROM szervezet WHERE id NOT IN (SELECT szervezet_id FROM tagsag) AND id NOT IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')",
    );
    await lezar();
  });

  it("minden vegpontot minden szerep a sajat joga szerint er el", async () => {
    const bajok: string[] = [];
    for (const v of VEGPONTOK) {
      if (v.kulon) continue;
      for (const sz of szereplok) {
        // A rendszergazda-szint KÜLÖN jog, nem a rangsor teteje: a tulajdonos NEM rendszergazda.
        const szabad = v.szint === "rendszergazda" ? sz.rendszergazda : sz.rang >= RANG[v.szint];
        const opciok: Parameters<typeof keres>[1] = { modszer: v.modszer };
        if (v.torzs !== undefined) opciok.torzs = v.torzs;
        if (sz.sutik) opciok.sutik = sz.sutik;
        const r = await keres<{ hiba?: string }>(v.ut, opciok);
        // A 409 NINCS_SZERVEZET is elutasítás, csak más okból: nem a szerep kevés, hanem a fiók
        // még egyetlen szervezetnek sem tagja. A felület ebből tudja, hogy szervezetet kell nyitni.
        // A belépés 401 ROSSZ_BELEPES-e NEM jog-elutasítás: rossz jelszóra mondja, hogy nem — ez a végpont dolga, nem a kapué.
        // (2026-09-12: eddig a sebességkorlát 429-e takarta ezt a sort a mátrixban; amikor lejárt, hamis „túl szigorú"-t mért.)
        const elutasitva = (r.statusz === 401 && r.torzs?.hiba !== "ROSSZ_BELEPES") || r.statusz === 403
          || (r.statusz === 409 && r.torzs?.hiba === "NINCS_SZERVEZET");
        if (szabad && elutasitva) {
          bajok.push(`TUL SZIGORU: ${v.modszer} ${v.ut} (${v.szint}) — ${sz.nev} ${r.statusz} ${r.torzs?.hiba ?? ""}`);
        }
        if (!szabad && !elutasitva) {
          bajok.push(`LYUK: ${v.modszer} ${v.ut} (${v.szint}) — ${sz.nev} atjutott, statusz ${r.statusz}`);
        }
      }
    }
    if (bajok.length) console.error(`\n${bajok.length} eltérés:\n` + bajok.join("\n"));
    expect(bajok).toEqual([]);
  }, 180_000);

  it("a kilepes belepes nelkul is hivhato, es tenyleg megszunteti a munkamenetet", async () => {
    // Külön próba, mert a mátrix körében minden szereplőt kiléptetne — ez a hiba egyszer már
    // hamis 401-eket mért az egész mátrixon, ezért áll itt ez a megjegyzés.
    const eldobhato = await fiokot_letrehoz(false);
    const kivul = await keres("/api/fiok/kilepes", { modszer: "POST" });
    expect(kivul.statusz, "belépés nélkül sem hibázik").toBeLessThan(400);
    const ki = await keres("/api/fiok/kilepes", { modszer: "POST", sutik: eldobhato.sutik });
    expect(ki.statusz).toBeLessThan(400);
    // a süti ezután nem ér semmit
    const utana = await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Nem szabad" }, sutik: eldobhato.sutik });
    expect(utana.statusz).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Az ŐR — ez a rész adatbázist és futó kiszolgálót NEM igényel.
// ---------------------------------------------------------------------------

const API_GYOKER = join(import.meta.dirname, "..", "app", "api");

function utvonalfajlok(mappa: string, ki: string[] = []): string[] {
  for (const n of readdirSync(mappa)) {
    const p = join(mappa, n);
    if (statSync(p).isDirectory()) utvonalfajlok(p, ki);
    else if (n === "route.ts") ki.push(p);
  }
  return ki;
}

describe("B-01 — or: uj modosito vegpont nem kerulhet be kimondott szint nelkul", () => {
  it("minden modosito kezelo szerepel a matrixban es hiv kaput", () => {
    const hianyzo: string[] = [];
    const kapuNelkul: string[] = [];
    for (const f of utvonalfajlok(API_GYOKER)) {
      // Windowson a fájlnév `\`-sel jön — a mátrix `/`-t vár (2026-09-12, a Dellen mérve)
      const nev = f.slice(API_GYOKER.length + 1).split(sep).join("/").replace(/\/route\.ts$/, "");
      const forras = readFileSync(f, "utf8");
      for (const t of forras.matchAll(/export async function (POST|PUT|PATCH|DELETE)\b/g)) {
        const modszer = t[1]!;
        if (!VEGPONTOK.some((v) => v.fajl === nev && v.modszer === modszer)) hianyzo.push(`${modszer} ${nev}`);
      }
      // a kapu-hívás a kezelőben van; ha van módosító kezelő, kell lennie legalább egy kapu-hívásnak
      if (/export async function (POST|PUT|PATCH|DELETE)\b/.test(forras) && !/\bkapu\s*\(/.test(forras)) {
        kapuNelkul.push(nev);
      }
    }
    expect(hianyzo, "nincs a jogosultsági mátrixban").toEqual([]);
    expect(kapuNelkul, "nem hívja a közös kaput").toEqual([]);
  });
});
