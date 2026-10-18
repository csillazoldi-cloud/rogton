import { Client } from "pg";

export const PROBA_CIM = process.env.PROBA_CIM ?? "http://127.0.0.1:3000";
export const DATABASE_URL = process.env.DATABASE_URL ?? "";

let pgKliens = new Client({ connectionString: DATABASE_URL });
let pgKapcsolva = false;

async function pgKapcsolat(): Promise<Client> {
  if (!pgKapcsolva) {
    await pgKliens.connect();
    pgKapcsolva = true;
  }
  return pgKliens;
}

export async function sql<T = unknown>(query: string, parameterek?: unknown[]): Promise<T[]> {
  const kliens = await pgKapcsolat();
  const eredmeny = await kliens.query(query, parameterek);
  return eredmeny.rows as T[];
}

export async function lezar(): Promise<void> {
  if (pgKapcsolva) {
    await pgKliens.end();
    pgKapcsolva = false;
    // a pg kliens nem nyitható újra — ha egy fájlban két `describe` is lezár, a következőnek friss kliens kell (2026-09-12)
    pgKliens = new Client({ connectionString: DATABASE_URL });
  }
}

export async function takaritas(): Promise<void> {
  await sql("DELETE FROM fiok WHERE email LIKE 'proba-%@proba.example'");
  // a próbák által létrehozott, tag nélkül maradt szervezetek (a két teszt-szervezet marad)
  await sql(
    "DELETE FROM szervezet WHERE id NOT IN (SELECT szervezet_id FROM tagsag) AND id NOT IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')",
  );
}

export function veletlenEmail(): string {
  const veletlen = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `proba-${veletlen}@proba.example`;
}

export async function keres<T = unknown>(utvonal: string, opciok?: {
  modszer?: string;
  torzs?: unknown;
  sutik?: string;
  /** További kérés-fejlécek. E-34 óta a sebességkorlát-próbák ezzel adnak külön `x-forwarded-for` címet. */
  fejlecek?: Record<string, string>;
}): Promise<{
  statusz: number;
  fejlecek: Headers;
  sutik: string[];
  torzs: T;
}> {
  const url = `${PROBA_CIM}${utvonal}`;
  const init: RequestInit = {
    method: opciok?.modszer ?? "GET",
    headers: {},
  };

  if (opciok?.torzs !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(opciok.torzs);
  }

  // A próbák magyar felülettel mennek (a szövegellenőrzések magyarok); D-11 óta a rendszer alapnyelve az angol,
  // ezért a nyelv-sütit itt adjuk, ha a próba nem adott mást.
  const sutik = opciok?.sutik && /(^|;\s*)km_nyelv=/.test(opciok.sutik) ? opciok.sutik : [opciok?.sutik, "km_nyelv=hu"].filter(Boolean).join("; ");
  (init.headers as Record<string, string>)["Cookie"] = sutik;
  // E-34: a próbák alapból KÜLÖN álcímről mennek (TEST-NET-2), így nem fogyasztják egymás
  // sebességkorlát-keretét. Aki a korlátot MÉRI, az saját `x-forwarded-for`-t ad — az felülírja ezt.
  (init.headers as Record<string, string>)["x-forwarded-for"] = `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
  for (const [nev, ertek] of Object.entries(opciok?.fejlecek ?? {})) {
    (init.headers as Record<string, string>)[nev] = ertek;
  }

  const valasz = await fetch(url, init);

  const valaszSutik = valasz.headers.getSetCookie();
  const osszesSuti = valaszSutik;

  let valaszTorzs: unknown;
  const contentType = valasz.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    valaszTorzs = await valasz.json();
  } else {
    valaszTorzs = await valasz.text();
  }

  return {
    statusz: valasz.status,
    fejlecek: valasz.headers,
    sutik: osszesSuti,
    torzs: valaszTorzs as T,
  };
}

export function sutiKinyer(sutiFejlec: string[], sutiNev: string): string | undefined {
  for (const fejlec of sutiFejlec) {
    const reszek = fejlec.split(";");
    const elsoResz = reszek[0]?.trim() ?? "";
    if (elsoResz.startsWith(`${sutiNev}=`)) {
      return elsoResz.slice(sutiNev.length + 1);
    }
  }
  return undefined;
}

export function sutiTulajdonsagEllenoriz(sutiFejlec: string[], sutiNev: string, tulajdonsag: string): boolean {
  for (const fejlec of sutiFejlec) {
    const reszek = fejlec.split(";");
    const elsoResz = reszek[0]?.trim() ?? "";
    if (elsoResz.startsWith(`${sutiNev}=`)) {
      for (let i = 1; i < reszek.length; i++) {
        const resz = reszek[i]?.trim().toLowerCase() ?? "";
        if (resz === tulajdonsag.toLowerCase()) {
          return true;
        }
      }
      return false;
    }
  }
  return false;
}

export function sutiErtek(sutiFejlec: string[], sutiNev: string): string | undefined {
  return sutiKinyer(sutiFejlec, sutiNev);
}
