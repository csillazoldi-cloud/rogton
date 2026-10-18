// G9 — az oldal kapuja (Next 16 „proxy”, a régi middleware utódja; Node futásidő — az adatbázist eléri). MINDEN kérés előtt fut,
// a /_next/static kivételével (az a szabad listán is rajta van). A szabályt az oldalkapu/szabaly.ts mondja ki (tiszta, próbált),
// a jegyeket az oldalkapu/jegy.ts kezeli, a próbálkozások a meglévő belepesi_kiserlet naplóba mennek („kapu” fajta, 5 / 15 perc
// címenként — hitelesites/korlat.ts). A jelszót SEHOL nem naplózzuk. Döntés: docs/decisions/2026-10-18-g9-kapu.md.
import { NextResponse, type NextRequest } from "next/server";
import { keresCime, kiserletNaplo, korlatEllenoriz } from "./hitelesites/korlat";
import { jegyErvenyes, jegyKiad, jelszoEgyezik } from "./oldalkapu/jegy";
import { KAPU_KIVUL_FEJLEC, KAPU_LAP, KAPU_SUTI, JEGY_NAP, dontes, helyiKeres, kapuJelszo, szabadUt, visszaUt } from "./oldalkapu/szabaly";

const JSON_FEJ = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } as const;

/** A kérés továbbmegy; a kapun-kívül jelölést csak a proxy teheti rá (a böngészőtől jövőt eldobjuk). */
function tovabb(keres: NextRequest, kivul: boolean): NextResponse {
  const fej = new Headers(keres.headers);
  fej.delete(KAPU_KIVUL_FEJLEC);
  if (kivul) fej.set(KAPU_KIVUL_FEJLEC, "1");
  return NextResponse.next({ request: { headers: fej } });
}

/** 303 egy SAJÁT útra. A NextResponse csak teljes címet fogad a Location-ben (mérve: „Invalid URL” egy relatív útra); a nextUrl
 *  eredetével képezzük, és a Next a saját eredetű címet a kiküldéskor relatívvá alakítja. */
function ide(keres: NextRequest, ut: string): NextResponse {
  const v = NextResponse.redirect(new URL(ut, keres.nextUrl.origin), 303);
  v.headers.set("cache-control", "no-store");
  return v;
}

/** A kapu lapja a kért úton (a böngésző címsora nem változik — belépés után ugyanoda tér vissza). */
function kapuLap(keres: NextRequest, h: string | null): NextResponse {
  const fej = new Headers(keres.headers);
  fej.set(KAPU_KIVUL_FEJLEC, "1");
  // a nextUrl másolata: a Next ezt tekinti saját eredetnek. Egy `new URL(…, keres.url)` más gépnevet adhat (pl. localhost a 127.0.0.1
  // helyett), és akkor a Next KÜLSŐ átírásnak veszi és HTTP-n továbbküldi — mérve: a kérés 10 s-ig lógott.
  const cel = keres.nextUrl.clone();
  cel.pathname = KAPU_LAP;
  cel.search = "";
  if (h) cel.searchParams.set("h", h);
  else cel.searchParams.set("vissza", visszaUt(keres.nextUrl.pathname + keres.nextUrl.search));
  const v = NextResponse.rewrite(cel, { request: { headers: fej } });
  v.headers.set("cache-control", "no-store");
  return v;
}

/**
 * A kapu lapja egy MEGADOTT állapotkóddal (401 rossz jelszó, 429 túl sok próba). A Next a proxy átírásánál a lap saját kódját adja
 * (mérve: resolve-routes.js nem veszi át az átírás státuszát), ezért a lapot a proxy helyben kéri le a saját folyamattól, és a kért
 * kóddal adja vissza. Ha ez nem sikerül, 303-mal a lapra küld (a böngésző ugyanazt látja, csak a kód 200).
 */
async function kapuLapKoddal(keres: NextRequest, h: "rossz" | "sok", vissza: string, kod: 401 | 429): Promise<NextResponse> {
  const alap = process.env.KAPU_BELSO_CIM ?? `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
  const cel = `${KAPU_LAP}?h=${h}&vissza=${encodeURIComponent(vissza)}`;
  try {
    const r = await fetch(`${alap}${cel}`, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(5000) });
    if (r.status !== 200) throw new Error(`kapu lap: ${r.status}`);
    return new NextResponse(await r.text(), { status: kod, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (hiba) {
    console.error("A kapu lapja helyben nem kérhető le, átirányítás:", hiba instanceof Error ? hiba.message : hiba);
    return ide(keres, cel);
  }
}

async function belepes(keres: NextRequest, jelszo: string, cim: string): Promise<NextResponse> {
  let probalt = "";
  let vissza = "/";
  try {
    const adat = await keres.formData();
    probalt = String(adat.get("jelszo") ?? "");
    vissza = visszaUt(String(adat.get("vissza") ?? ""));
  } catch {
    // nem űrlap: üres jelszóként kezeljük (rossz próbálkozásnak számít)
  }
  // előbb a korlát (a jelszó-ellenőrzés el se induljon), aztán a próba; a jó jelszó is a korlát után jön — mint a belépésnél
  const korlat = await korlatEllenoriz("kapu", null, cim);
  if (!korlat.szabad) return kapuLapKoddal(keres, "sok", vissza, 429);
  if (!jelszoEgyezik(probalt, jelszo)) {
    await kiserletNaplo("kapu", null, cim, false);
    return kapuLapKoddal(keres, "rossz", vissza, 401);
  }
  await kiserletNaplo("kapu", null, cim, true);
  const { jegy } = await jegyKiad(jelszo, cim);
  const v = ide(keres, vissza);
  v.cookies.set(KAPU_SUTI, jegy, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: JEGY_NAP * 24 * 60 * 60 });
  return v;
}

export async function proxy(keres: NextRequest): Promise<NextResponse> {
  const ut = keres.nextUrl.pathname;
  const jelszo = kapuJelszo();
  const cim = keresCime(keres.headers);
  // a jegyet csak akkor nézzük meg (adatbázis), ha számít: bekapcsolt kapu, van süti, és nem szabad fájlról van szó
  const suti = keres.cookies.get(KAPU_SUTI)?.value;
  const jegyOk = jelszo !== "" && suti !== undefined && (ut === KAPU_LAP || !szabadUt(ut)) ? await jegyErvenyes(suti, jelszo) : false;
  const d = dontes({ modszer: keres.method, ut, jelszoVan: jelszo !== "", helyi: helyiKeres(keres.headers), jegyErvenyes: jegyOk });
  switch (d.tipus) {
    case "tovabb":
      return tovabb(keres, false);
    case "kivul":
      return tovabb(keres, true);
    case "kapu-lap":
      return kapuLap(keres, null);
    case "zarva-lap":
      return kapuLap(keres, "zarva");
    case "api-401":
      return NextResponse.json({ hiba: "kapu" }, { status: 401, headers: JSON_FEJ });
    case "zarva-api":
      return NextResponse.json({ hiba: "kapu_nincs_beallitva" }, { status: 503, headers: JSON_FEJ });
    case "mar-bent":
      return ide(keres, visszaUt(keres.nextUrl.searchParams.get("vissza")));
    case "belepes":
      return belepes(keres, jelszo, cim);
  }
}

export const config = {
  // minden, kivéve a /_next/static (a lap stílusa és kódja — a kapu lapjának is kell; a szabad listán is rajta van) és a nagy
  // arculati feltöltés útja: a Next a proxy előtt a törzset memóriába másolja és 12 MB fölött csonkolja (next.config.ts) — az az út
  // a kaput maga kéri a törzs olvasása előtt (oldalkapu/utvonal.ts), ugyanazzal a döntéssel és válasszal.
  matcher: ["/((?!_next/static/|api/arculat/fajl$).*)"],
};
