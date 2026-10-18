import { DatabaseSync } from "node:sqlite";
import {
  type EsemenyTar,
  type ErtesitesTar,
  type Esemeny,
  type ErtesitesBeallitas,
  type EsemenyFajta,
} from "@km/esemeny-core";

/** SQLite-alapú tár az eseménynapló- és értesítés-modul számára.
 *  `utvonal` lehet ":memory:" is (a próbákhoz). */
export function sqliteEsemeny(utvonal: string): {
  tar: EsemenyTar;
  ertesites: ErtesitesTar;
  db: DatabaseSync;
  zar(): void;
} {
  const db = new DatabaseSync(utvonal);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS esemeny (
      id TEXT PRIMARY KEY,
      szervezet_id TEXT,
      fajta TEXT NOT NULL,
      sulyossag TEXT NOT NULL,
      fiok_id TEXT,
      ido TEXT NOT NULL,
      adat TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS esemeny_szervezet_ido_idx ON esemeny(szervezet_id, ido DESC);
    CREATE INDEX IF NOT EXISTS esemeny_ido_idx ON esemeny(ido DESC) WHERE szervezet_id IS NULL;

    CREATE TABLE IF NOT EXISTS ertesites (
      szint TEXT NOT NULL,
      szervezet_id TEXT NOT NULL,
      adat TEXT NOT NULL,
      PRIMARY KEY (szint, szervezet_id)
    );
  `);

  const esemenyIrStmt = db.prepare(
    "INSERT INTO esemeny (id, szervezet_id, fajta, sulyossag, fiok_id, ido, adat) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const esemenyListaStmt = db.prepare(
    "SELECT id, szervezet_id, fajta, sulyossag, fiok_id, ido, adat FROM esemeny WHERE szervezet_id = ? ORDER BY ido DESC LIMIT ?"
  );
  const esemenyRendszerListaStmt = db.prepare(
    "SELECT id, szervezet_id, fajta, sulyossag, fiok_id, ido, adat FROM esemeny WHERE szervezet_id IS NULL ORDER BY ido DESC LIMIT ?"
  );

  const ertesitesKozosSelect = db.prepare(
    "SELECT adat FROM ertesites WHERE szint = 'kozos' AND szervezet_id = ''"
  );
  const ertesitesKozosMentStmt = db.prepare(
    "INSERT INTO ertesites (szint, szervezet_id, adat) VALUES ('kozos', '', ?) ON CONFLICT(szint, szervezet_id) DO UPDATE SET adat = excluded.adat"
  );
  const ertesitesSzervezetiSelect = db.prepare(
    "SELECT adat FROM ertesites WHERE szint = 'szervezeti' AND szervezet_id = ?"
  );
  const ertesitesSzervezetiMentStmt = db.prepare(
    "INSERT INTO ertesites (szint, szervezet_id, adat) VALUES ('szervezeti', ?, ?) ON CONFLICT(szint, szervezet_id) DO UPDATE SET adat = excluded.adat"
  );

  return {
    db,

    tar: {
      async ir(e: Esemeny): Promise<void> {
        esemenyIrStmt.run(
          e.id,
          e.szervezet_id,
          e.fajta,
          e.sulyossag,
          e.fiok_id,
          e.ido,
          JSON.stringify(e.adat)
        );
      },

      async lista(
        szervezet_id: string,
        szuro?: { fajta?: EsemenyFajta; limit?: number }
      ): Promise<Esemeny[]> {
        const limit = szuro?.limit ?? 100;
        const sorok = esemenyListaStmt.all(szervezet_id, limit) as {
          id: string;
          szervezet_id: string | null;
          fajta: string;
          sulyossag: string;
          fiok_id: string | null;
          ido: string;
          adat: string;
        }[];
        return sorok
          .map((sor) => ({
            id: String(sor.id),
            szervezet_id: sor.szervezet_id ? String(sor.szervezet_id) : null,
            fajta: String(sor.fajta) as EsemenyFajta,
            sulyossag: String(sor.sulyossag) as Esemeny["sulyossag"],
            fiok_id: sor.fiok_id ? String(sor.fiok_id) : null,
            ido: String(sor.ido),
            adat: JSON.parse(String(sor.adat)) as Esemeny["adat"],
          }))
          .filter((e) => !szuro?.fajta || e.fajta === szuro.fajta);
      },

      async rendszerLista(szuro?: { limit?: number }): Promise<Esemeny[]> {
        const limit = szuro?.limit ?? 100;
        const sorok = esemenyRendszerListaStmt.all(limit) as {
          id: string;
          szervezet_id: string | null;
          fajta: string;
          sulyossag: string;
          fiok_id: string | null;
          ido: string;
          adat: string;
        }[];
        return sorok.map((sor) => ({
          id: String(sor.id),
          szervezet_id: sor.szervezet_id ? String(sor.szervezet_id) : null,
          fajta: String(sor.fajta) as EsemenyFajta,
          sulyossag: String(sor.sulyossag) as Esemeny["sulyossag"],
          fiok_id: sor.fiok_id ? String(sor.fiok_id) : null,
          ido: String(sor.ido),
          adat: JSON.parse(String(sor.adat)) as Esemeny["adat"],
        }));
      },
    },

    ertesites: {
      async kozos(): Promise<ErtesitesBeallitas> {
        const sor = ertesitesKozosSelect.get() as { adat: string } | undefined;
        if (!sor) return {};
        return JSON.parse(String(sor.adat)) as ErtesitesBeallitas;
      },

      async kozosMent(b: ErtesitesBeallitas): Promise<void> {
        ertesitesKozosMentStmt.run(JSON.stringify(b));
      },

      async szervezeti(szervezet_id: string): Promise<ErtesitesBeallitas> {
        const sor = ertesitesSzervezetiSelect.get(szervezet_id) as { adat: string } | undefined;
        if (!sor) return {};
        return JSON.parse(String(sor.adat)) as ErtesitesBeallitas;
      },

      async szervezetiMent(
        szervezet_id: string,
        b: ErtesitesBeallitas
      ): Promise<void> {
        ertesitesSzervezetiMentStmt.run(szervezet_id, JSON.stringify(b));
      },
    },

    zar() {
      db.close();
    },
  };
}
