import { DatabaseSync } from "node:sqlite";
import {
  type TagsagTar,
  type MeghivoTar,
  type Meghivo,
  type Tag,
  type Szerep,
} from "@km/hozzaferes-core";

/** SQLite-alapú tár a hozzáférés-modul számára: tagság és meghívó táblák.
 *  `utvonal` lehet ":memory:" is (a próbákhoz). */
export function sqliteHozzaferes(utvonal: string): {
  tagsag: TagsagTar;
  meghivo: MeghivoTar;
  db: DatabaseSync;
  zar(): void;
} {
  const db = new DatabaseSync(utvonal);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tag (
      szervezet_id TEXT NOT NULL,
      fiok_id TEXT NOT NULL,
      szerep TEXT NOT NULL,
      csatlakozott TEXT NOT NULL,
      PRIMARY KEY (szervezet_id, fiok_id)
    );
    CREATE TABLE IF NOT EXISTS meghivo (
      id TEXT PRIMARY KEY,
      szervezet_id TEXT NOT NULL,
      lenyomat TEXT NOT NULL UNIQUE,
      adat TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS meghivo_szervezet_idx ON meghivo(szervezet_id);
  `);

  const tagokSelect = db.prepare(
    "SELECT fiok_id, szerep, csatlakozott FROM tag WHERE szervezet_id = ? ORDER BY csatlakozott"
  );
  const tagBeszur = db.prepare(
    "INSERT INTO tag (szervezet_id, fiok_id, szerep, csatlakozott) VALUES (?, ?, ?, ?)"
  );
  const tagSzerepFrissit = db.prepare(
    "UPDATE tag SET szerep = ? WHERE szervezet_id = ? AND fiok_id = ?"
  );
  const tagTorol = db.prepare(
    "DELETE FROM tag WHERE szervezet_id = ? AND fiok_id = ?"
  );

  const meghivoMentStmt = db.prepare(
    "INSERT INTO meghivo (id, szervezet_id, lenyomat, adat) VALUES (?, ?, ?, ?)"
  );
  const meghivoFrissitStmt = db.prepare(
    "UPDATE meghivo SET adat = ? WHERE id = ?"
  );
  const meghivoAzonositoSzerintSelect = db.prepare(
    "SELECT adat FROM meghivo WHERE szervezet_id = ? AND id = ?"
  );
  const meghivoLenyomatSzerintSelect = db.prepare(
    "SELECT adat FROM meghivo WHERE lenyomat = ?"
  );
  const meghivoListaSelect = db.prepare(
    "SELECT adat FROM meghivo WHERE szervezet_id = ? ORDER BY json_extract(adat, '$.letrehozva')"
  );

  return {
    db,

    tagsag: {
      async tagok(szervezet_id: string): Promise<Tag[]> {
        const sorok = tagokSelect.all(szervezet_id) as {
          fiok_id: string;
          szerep: string;
          csatlakozott: string;
        }[];
        return sorok.map((sor) => ({
          fiok_id: String(sor.fiok_id),
          szerep: String(sor.szerep) as Szerep,
          csatlakozott: String(sor.csatlakozott),
        }));
      },

      async felvesz(
        szervezet_id: string,
        fiok_id: string,
        szerep: Szerep,
        mikor: string
      ): Promise<void> {
        tagBeszur.run(szervezet_id, fiok_id, szerep, mikor);
      },

      async szerepAllit(
        szervezet_id: string,
        fiok_id: string,
        szerep: Szerep
      ): Promise<void> {
        tagSzerepFrissit.run(szerep, szervezet_id, fiok_id);
      },

      async eltavolit(szervezet_id: string, fiok_id: string): Promise<void> {
        tagTorol.run(szervezet_id, fiok_id);
      },
    },

    meghivo: {
      async ment(m: Meghivo): Promise<void> {
        meghivoMentStmt.run(m.id, m.szervezet_id, m.lenyomat, JSON.stringify(m));
      },

      async frissit(m: Meghivo): Promise<void> {
        meghivoFrissitStmt.run(JSON.stringify(m), m.id);
      },

      async azonositoSzerint(
        szervezet_id: string,
        id: string
      ): Promise<Meghivo | null> {
        const sor = meghivoAzonositoSzerintSelect.get(
          szervezet_id,
          id
        ) as { adat: string } | undefined;
        if (!sor) return null;
        return JSON.parse(String(sor.adat)) as Meghivo;
      },

      async lenyomatSzerint(lenyomat: string): Promise<Meghivo | null> {
        const sor = meghivoLenyomatSzerintSelect.get(lenyomat) as
          | { adat: string }
          | undefined;
        if (!sor) return null;
        return JSON.parse(String(sor.adat)) as Meghivo;
      },

      async lista(szervezet_id: string): Promise<Meghivo[]> {
        const sorok = meghivoListaSelect.all(szervezet_id) as {
          adat: string;
        }[];
        return sorok.map((sor) => JSON.parse(String(sor.adat)) as Meghivo);
      },
    },

    zar() {
      db.close();
    },
  };
}
