// Adatbázis-kapcsolat a befogadó alkalmazásban. A km_app szereppel lép be, ami a sorszintű
// védelem alá esik: szervezet nélkül (app.szervezet_id beállítása nélkül) SEMMIT nem lát.
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as sema from "./sema";

let pool: Pool | undefined;

function medence(): Pool {
  if (!pool) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL hiányzik");
    pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000 });
  }
  return pool;
}

export const db = () => drizzle({ client: medence(), schema: sema });
export type Db = ReturnType<typeof db>;
export type SzervezetDb = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Egy szervezet nevében fut le a művelet: tranzakció, benne SET LOCAL app.szervezet_id.
 * A tranzakció végén a beállítás eltűnik — a következő kérés nem örökli.
 * Ez az EGYETLEN ajtó az ügyféladathoz; a modulok ezen át kapják a kapcsolatot.
 */
export async function szervezetKent<T>(szervezetId: string, muvelet: (tx: SzervezetDb) => Promise<T>): Promise<T> {
  return db().transaction(async (tx) => {
    // paraméterezve: az azonosító nem kerül szövegként az SQL-be
    await tx.execute(sql`SELECT set_config('app.szervezet_id', ${szervezetId}, true)`);
    return muvelet(tx);
  });
}

/**
 * Egy fiók nevében fut le a művelet (belépett ember, szervezet-választás előtt):
 * a saját tagságait és azok szervezeteit látja, mást nem.
 */
export async function fiokKent<T>(fiokId: string, muvelet: (tx: SzervezetDb) => Promise<T>): Promise<T> {
  return db().transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.fiok_id', ${fiokId}, true)`);
    return muvelet(tx);
  });
}

export { sema };
