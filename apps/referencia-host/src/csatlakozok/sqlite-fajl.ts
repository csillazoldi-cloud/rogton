import { DatabaseSync } from "node:sqlite";
import {
  type FajlTar,
  type FajlMeta,
} from "@km/fajl-core";

/** R-16 K1: a három új oszlop a sorban (a régi fájlban a migráció után is megvannak). */
type UjOszlopok = { logo_valtozat: string | null; eredet: string | null; elemzes: string | null };

function ujMezok(sor: UjOszlopok): Pick<FajlMeta, "logo_valtozat" | "eredet" | "elemzes"> {
  let elemzes: unknown = null;
  try { elemzes = sor.elemzes ? JSON.parse(String(sor.elemzes)) : null; } catch { elemzes = null; }
  return {
    logo_valtozat: sor.logo_valtozat === null ? null : (String(sor.logo_valtozat) as FajlMeta["logo_valtozat"] & string),
    eredet: (sor.eredet === null ? "feltoltes" : String(sor.eredet)) as NonNullable<FajlMeta["eredet"]>,
    elemzes,
  };
}

/** SQLite-alapú tár a fájl-modul számára: meta és bájtok együtt a sorban.
 *  `utvonal` lehet ":memory:" is (a próbákhoz). */
export function sqliteFajl(utvonal: string): {
  tar: FajlTar;
  db: DatabaseSync;
  zar(): void;
} {
  const db = new DatabaseSync(utvonal);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS fajl (
      id TEXT PRIMARY KEY,
      szervezet_id TEXT NOT NULL,
      nev TEXT NOT NULL,
      tipus TEXT NOT NULL,
      meret INTEGER NOT NULL,
      cel TEXT NOT NULL,
      feltoltotte TEXT NOT NULL,
      feltoltve TEXT NOT NULL,
      bajtok BLOB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS fajl_szervezet_idx ON fajl(szervezet_id);
    CREATE INDEX IF NOT EXISTS fajl_szervezet_cel_idx ON fajl(szervezet_id, cel);
  `);

  // R-16 K1 (A-12, TERV 1.1): ugyanaz a három új mező, mint a webalkalmazás `arculat_fajl`-jában — a régi adatbázis-fájlhoz
  // csak hozzáadjuk (a PRAGMA table_info dönti el, kell-e), semmit nem írunk át. A régi logó-sor helye: vilagos.
  const oszlopok = new Set((db.prepare("PRAGMA table_info(fajl)").all() as { name: string }[]).map((o) => String(o.name)));
  if (!oszlopok.has("logo_valtozat")) {
    db.exec("ALTER TABLE fajl ADD COLUMN logo_valtozat TEXT CHECK (logo_valtozat IN ('vilagos', 'sotet', 'egyszinu', 'negyzetes'));");
    db.exec("UPDATE fajl SET logo_valtozat = 'vilagos' WHERE cel = 'logo' AND logo_valtozat IS NULL;");
  }
  if (!oszlopok.has("eredet")) db.exec("ALTER TABLE fajl ADD COLUMN eredet TEXT NOT NULL DEFAULT 'feltoltes' CHECK (eredet IN ('feltoltes', 'honlap', 'gep'));");
  if (!oszlopok.has("elemzes")) db.exec("ALTER TABLE fajl ADD COLUMN elemzes TEXT;"); // JSON szövegként

  const fajlMentStmt = db.prepare(
    "INSERT INTO fajl (id, szervezet_id, nev, tipus, meret, cel, feltoltotte, feltoltve, bajtok, logo_valtozat, eredet, elemzes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const fajlMetaSelect = db.prepare(
    "SELECT id, szervezet_id, nev, tipus, meret, cel, feltoltotte, feltoltve, logo_valtozat, eredet, elemzes FROM fajl WHERE szervezet_id = ? AND id = ?"
  );
  const fajlOlvasSelect = db.prepare(
    "SELECT id, szervezet_id, nev, tipus, meret, cel, feltoltotte, feltoltve, bajtok, logo_valtozat, eredet, elemzes FROM fajl WHERE szervezet_id = ? AND id = ?"
  );
  const fajlListaSelect = db.prepare(
    "SELECT id, szervezet_id, nev, tipus, meret, cel, feltoltotte, feltoltve, logo_valtozat, eredet, elemzes FROM fajl WHERE szervezet_id = ? ORDER BY feltoltve DESC"
  );
  const fajlListaCelSzerintSelect = db.prepare(
    "SELECT id, szervezet_id, nev, tipus, meret, cel, feltoltotte, feltoltve, logo_valtozat, eredet, elemzes FROM fajl WHERE szervezet_id = ? AND cel = ? ORDER BY feltoltve DESC"
  );

  return {
    db,

    tar: {
      async ment(meta: FajlMeta, bajtok: Uint8Array): Promise<void> {
        fajlMentStmt.run(
          meta.id,
          meta.szervezet_id,
          meta.nev,
          meta.tipus,
          meta.meret,
          meta.cel,
          meta.feltoltotte,
          meta.feltoltve,
          bajtok,
          meta.cel === "logo" ? (meta.logo_valtozat ?? "vilagos") : null,
          meta.eredet ?? "feltoltes",
          meta.cel === "logo" && meta.elemzes != null ? JSON.stringify(meta.elemzes) : null
        );
      },

      async meta(szervezet_id: string, id: string): Promise<FajlMeta | null> {
        const sor = fajlMetaSelect.get(szervezet_id, id) as {
          id: string;
          szervezet_id: string;
          nev: string;
          tipus: string;
          meret: number;
          cel: string;
          feltoltotte: string;
          feltoltve: string;
        } & UjOszlopok | undefined;
        if (!sor) return null;
        return {
          id: String(sor.id),
          szervezet_id: String(sor.szervezet_id),
          nev: String(sor.nev),
          tipus: String(sor.tipus) as FajlMeta["tipus"],
          meret: Number(sor.meret),
          cel: String(sor.cel) as FajlMeta["cel"],
          feltoltotte: String(sor.feltoltotte),
          feltoltve: String(sor.feltoltve),
          ...ujMezok(sor),
        };
      },

      async olvas(szervezet_id: string, id: string): Promise<Uint8Array | null> {
        const sor = fajlOlvasSelect.get(szervezet_id, id) as {
          bajtok: Buffer;
        } | undefined;
        if (!sor) return null;
        return new Uint8Array(sor.bajtok);
      },

      async lista(szervezet_id: string, cel?: FajlMeta["cel"]): Promise<FajlMeta[]> {
        const sorok = (cel
          ? fajlListaCelSzerintSelect.all(szervezet_id, cel)
          : fajlListaSelect.all(szervezet_id)) as ({
          id: string;
          szervezet_id: string;
          nev: string;
          tipus: string;
          meret: number;
          cel: string;
          feltoltotte: string;
          feltoltve: string;
        } & UjOszlopok)[];
        return sorok.map((sor) => ({
          id: String(sor.id),
          szervezet_id: String(sor.szervezet_id),
          nev: String(sor.nev),
          tipus: String(sor.tipus) as FajlMeta["tipus"],
          meret: Number(sor.meret),
          cel: String(sor.cel) as FajlMeta["cel"],
          feltoltotte: String(sor.feltoltotte),
          feltoltve: String(sor.feltoltve),
          ...ujMezok(sor),
        }));
      },
    },

    zar() {
      db.close();
    },
  };
}
