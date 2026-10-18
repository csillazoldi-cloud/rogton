import { DatabaseSync } from "node:sqlite";
// A HOST tárolója: a mag `HirfigyeloTar` szerződését SQLite-fájllal valósítja meg (a webalkalmazás ugyanezt Postgresszel).
// A magot csak a csomag bejáratán át ismerjük (határőr): `@km/news-monitor-core`.
import {
  cikkKulcs,
  type Beallitas,
  type BeallitasVerzio,
  type Esemeny,
  type Forras,
  type Futas,
  type HirfigyeloTar,
  type Kivonat,
  type Minta,
  type SzabalyJavaslat,
  type Talalat,
  type Visszajelzes,
} from "@km/news-monitor-core";
/** SQLite-tár: a HirfigyeloTar teljes megvalósítása egyetlen fájlban. `utvonal` lehet ":memory:" is (a próbákhoz). */
export function sqliteTar(utvonal: string): HirfigyeloTar & { db: DatabaseSync; zar(): void } {
  const db = new DatabaseSync(utvonal);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS verzio (
      szervezet_id TEXT PRIMARY KEY,
      adat TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tervezet (
      szervezet_id TEXT,
      fiok_id TEXT,
      adat TEXT,
      PRIMARY KEY(szervezet_id, fiok_id)
    );
    CREATE TABLE IF NOT EXISTS forras (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS futas (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS talalat (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS esemeny (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS visszajelzes (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS javaslat (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS minta (
      szervezet_id TEXT,
      id TEXT,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, id)
    );
    CREATE TABLE IF NOT EXISTS kivonat (
      szervezet_id TEXT,
      kulcs TEXT,
      id TEXT NOT NULL,
      lejar TEXT NOT NULL,
      sorszam INTEGER,
      adat TEXT NOT NULL,
      PRIMARY KEY(szervezet_id, kulcs)
    );
    CREATE INDEX IF NOT EXISTS kivonat_id_idx ON kivonat(szervezet_id, id);
  `);

  // Előkészített utasítások
  const verzioSelect = db.prepare("SELECT adat FROM verzio WHERE szervezet_id = ?");
  const verzioUpsert = db.prepare(
    "INSERT INTO verzio (szervezet_id, adat) VALUES (?, ?) ON CONFLICT(szervezet_id) DO UPDATE SET adat = excluded.adat"
  );

  const tervezetSelect = db.prepare("SELECT adat FROM tervezet WHERE szervezet_id = ? AND fiok_id = ?");
  const tervezetUpsert = db.prepare(
    "INSERT INTO tervezet (szervezet_id, fiok_id, adat) VALUES (?, ?, ?) ON CONFLICT(szervezet_id, fiok_id) DO UPDATE SET adat = excluded.adat"
  );

  const forrasSelect = db.prepare("SELECT adat FROM forras WHERE szervezet_id = ? ORDER BY sorszam");
  const forrasUpsert = db.prepare(
    "INSERT INTO forras (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const forrasMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM forras WHERE szervezet_id = ?");
  const forrasLetezik = db.prepare("SELECT sorszam FROM forras WHERE szervezet_id = ? AND id = ?");
  const forrasTorles = db.prepare("DELETE FROM forras WHERE szervezet_id = ? AND id = ?");

  const futasSelect = db.prepare("SELECT adat FROM futas WHERE szervezet_id = ? ORDER BY sorszam");
  const futasUpsert = db.prepare(
    "INSERT INTO futas (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const futasMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM futas WHERE szervezet_id = ?");
  const futasLetezik = db.prepare("SELECT sorszam FROM futas WHERE szervezet_id = ? AND id = ?");

  const talalatSelect = db.prepare("SELECT adat FROM talalat WHERE szervezet_id = ? ORDER BY sorszam");
  const talalatUpsert = db.prepare(
    "INSERT INTO talalat (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const talalatMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM talalat WHERE szervezet_id = ?");
  const talalatLetezik = db.prepare("SELECT sorszam FROM talalat WHERE szervezet_id = ? AND id = ?");

  const esemenySelect = db.prepare("SELECT adat FROM esemeny WHERE szervezet_id = ? ORDER BY sorszam");
  const esemenyUpsert = db.prepare(
    "INSERT INTO esemeny (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const esemenyMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM esemeny WHERE szervezet_id = ?");
  const esemenyLetezik = db.prepare("SELECT sorszam FROM esemeny WHERE szervezet_id = ? AND id = ?");

  const visszajelzesSelect = db.prepare("SELECT adat FROM visszajelzes WHERE szervezet_id = ? ORDER BY sorszam");
  const visszajelzesUpsert = db.prepare(
    "INSERT INTO visszajelzes (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const visszajelzesMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM visszajelzes WHERE szervezet_id = ?");
  const visszajelzesLetezik = db.prepare("SELECT sorszam FROM visszajelzes WHERE szervezet_id = ? AND id = ?");

  const javaslatSelect = db.prepare("SELECT adat FROM javaslat WHERE szervezet_id = ? ORDER BY sorszam");
  const javaslatUpsert = db.prepare(
    "INSERT INTO javaslat (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const javaslatMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM javaslat WHERE szervezet_id = ?");
  const javaslatLetezik = db.prepare("SELECT sorszam FROM javaslat WHERE szervezet_id = ? AND id = ?");

  const mintaSelect = db.prepare("SELECT adat FROM minta WHERE szervezet_id = ? ORDER BY sorszam");
  const mintaUpsert = db.prepare(
    "INSERT INTO minta (szervezet_id, id, sorszam, adat) VALUES (?, ?, ?, ?) ON CONFLICT(szervezet_id, id) DO UPDATE SET adat = excluded.adat"
  );
  const mintaMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM minta WHERE szervezet_id = ?");
  const mintaLetezik = db.prepare("SELECT sorszam FROM minta WHERE szervezet_id = ? AND id = ?");

  const kivonatLetezik = db.prepare("SELECT sorszam FROM kivonat WHERE szervezet_id = ? AND kulcs = ?");
  const kivonatBeszur = db.prepare(
    "INSERT INTO kivonat (szervezet_id, kulcs, id, lejar, sorszam, adat) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const kivonatMaxSorszam = db.prepare("SELECT COALESCE(MAX(sorszam), 0) + 1 AS kovetkezo FROM kivonat WHERE szervezet_id = ?");
  const kivonatByIds = db.prepare("SELECT sorszam, adat FROM kivonat WHERE szervezet_id = ? AND id = ?");
  const kivonatLejarok = db.prepare("SELECT kulcs, lejar FROM kivonat WHERE szervezet_id = ?");
  const kivonatTorol = db.prepare("DELETE FROM kivonat WHERE szervezet_id = ? AND kulcs = ?");

  // Segédfüggvény: beszúrás vagy frissítés sorszam-kezeléssel
  function mentesUpsert(
    letezikStmt: ReturnType<typeof db.prepare>,
    maxSorszamStmt: ReturnType<typeof db.prepare>,
    upsertStmt: ReturnType<typeof db.prepare>,
    szervezetId: string,
    id: string,
    adat: unknown
  ): void {
    // Meglévő sor: CSAK az adatot írjuk felül, a `sorszam` érintetlen marad (a lista sorrendje nem változhat).
    // Új sor: a szervezet eddigi legnagyobb sorszáma + 1, azaz a lista végére kerül — mint a memóriabeli tár `push`-a.
    const letezoSor = letezikStmt.get(szervezetId, id) as { sorszam?: number } | undefined;
    const sorszam = letezoSor
      ? Number(letezoSor.sorszam)
      : Number((maxSorszamStmt.get(szervezetId) as { kovetkezo: number }).kovetkezo);
    upsertStmt.run(szervezetId, id, sorszam, JSON.stringify(adat));
  }

  return {
    db,

    async verziok(szervezetId) {
      const sor = verzioSelect.get(szervezetId) as { adat: string } | undefined;
      if (!sor) return [];
      return JSON.parse(String(sor.adat)) as BeallitasVerzio[];
    },

    async verziokMent(szervezetId, verziok) {
      verzioUpsert.run(szervezetId, JSON.stringify(verziok));
    },

    async tervezet(szervezetId, fiokId) {
      const sor = tervezetSelect.get(szervezetId, fiokId) as { adat: string | null } | undefined;
      if (!sor || sor.adat === null) return null;
      return JSON.parse(String(sor.adat)) as Beallitas;
    },

    async tervezetMent(szervezetId, fiokId, b) {
      tervezetUpsert.run(szervezetId, fiokId, b === null ? null : JSON.stringify(b));
    },

    async forrasok(szervezetId) {
      const sorok = forrasSelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as Forras);
    },

    async forrasMent(szervezetId, f) {
      mentesUpsert(forrasLetezik, forrasMaxSorszam, forrasUpsert, szervezetId, f.id, f);
    },

    // F-8.1 k (0.3.0): a forrás eltávolítása a második befogadóban is — a port ugyanaz, a megvalósítás egy sor.
    async forrasTorol(szervezetId, forrasId) {
      forrasTorles.run(szervezetId, forrasId);
    },

    async futasok(szervezetId) {
      const sorok = futasSelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as Futas);
    },

    async futasMent(szervezetId, f) {
      mentesUpsert(futasLetezik, futasMaxSorszam, futasUpsert, szervezetId, f.id, f);
    },

    async kivonatMent(szervezetId, k) {
      const kulcs = cikkKulcs(szervezetId, k.kanonikus_url);
      const letezik = kivonatLetezik.get(szervezetId, kulcs);
      if (letezik) return "letezik";
      const sor = kivonatMaxSorszam.get(szervezetId) as { kovetkezo: number };
      kivonatBeszur.run(szervezetId, kulcs, k.id, k.lejar, sor.kovetkezo, JSON.stringify(k));
      return "uj";
    },

    async kivonatok(szervezetId, ids) {
      if (ids.length === 0) return [];
      const talalt: { sorszam: number; kivonat: Kivonat }[] = [];
      for (const id of ids) {
        const sorok = kivonatByIds.all(szervezetId, id) as { sorszam: number; adat: string }[];
        for (const sor of sorok) {
          talalt.push({ sorszam: Number(sor.sorszam), kivonat: JSON.parse(String(sor.adat)) as Kivonat });
        }
      }
      // A memóriabeli tár beszúrási sorrendben adja vissza — itt a sorszám adja ugyanezt.
      talalt.sort((a, b) => a.sorszam - b.sorszam);
      return talalt.map((t) => t.kivonat);
    },

    async talalatok(szervezetId) {
      const sorok = talalatSelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as Talalat);
    },

    async talalatMent(szervezetId, t) {
      mentesUpsert(talalatLetezik, talalatMaxSorszam, talalatUpsert, szervezetId, t.id, t);
    },

    async esemenyek(szervezetId) {
      const sorok = esemenySelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as Esemeny);
    },

    async esemenyMent(szervezetId, e) {
      mentesUpsert(esemenyLetezik, esemenyMaxSorszam, esemenyUpsert, szervezetId, e.id, e);
    },

    async visszajelzesek(szervezetId) {
      const sorok = visszajelzesSelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as Visszajelzes);
    },

    async visszajelzesMent(szervezetId, v) {
      mentesUpsert(visszajelzesLetezik, visszajelzesMaxSorszam, visszajelzesUpsert, szervezetId, v.id, v);
    },

    async javaslatok(szervezetId) {
      const sorok = javaslatSelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as SzabalyJavaslat);
    },

    async javaslatMent(szervezetId, j) {
      mentesUpsert(javaslatLetezik, javaslatMaxSorszam, javaslatUpsert, szervezetId, j.id, j);
    },

    async mintak(szervezetId) {
      const sorok = mintaSelect.all(szervezetId) as { adat: string }[];
      return sorok.map((sor) => JSON.parse(String(sor.adat)) as Minta);
    },

    async mintaMent(szervezetId, m) {
      mentesUpsert(mintaLetezik, mintaMaxSorszam, mintaUpsert, szervezetId, m.id, m);
    },

    async lejartKivonatokTorol(szervezetId, most) {
      // Dátumként hasonlítunk (nem szövegként): az ISO-időbélyeg pontossága forrásonként eltérhet.
      const sorok = kivonatLejarok.all(szervezetId) as { kulcs: string; lejar: string }[];
      let torolve = 0;
      for (const sor of sorok) {
        if (new Date(String(sor.lejar)) <= most) {
          kivonatTorol.run(szervezetId, String(sor.kulcs));
          torolve++;
        }
      }
      return torolve;
    },

    zar() {
      db.close();
    },
  };
}
