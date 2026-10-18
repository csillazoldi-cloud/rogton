import type { DatabaseSync } from "node:sqlite";

export type SorFajta = "futas" | "ertekeles_ujra" | "napi";
export type SorAllapot = "var" | "fut" | "kesz" | "hiba";
export type SorTetel = {
  id: string;
  szervezet_id: string;
  fajta: SorFajta;
  adat: Record<string, unknown>;
  allapot: SorAllapot;
  kiserlet: number;
  letrehozva: string;
  kezdve: string | null;
  vege: string | null;
  hiba_ok: string | null;
  eredmeny: Record<string, unknown> | null;
};

export function sorKeszit(db: DatabaseSync, idAdo: () => string, most: () => Date): Sor {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sor (
      id TEXT PRIMARY KEY,
      szervezet_id TEXT NOT NULL,
      fajta TEXT NOT NULL,
      adat TEXT NOT NULL,
      allapot TEXT NOT NULL,
      kiserlet INTEGER NOT NULL DEFAULT 0,
      letrehozva TEXT NOT NULL,
      kezdve TEXT,
      vege TEXT,
      hiba_ok TEXT,
      eredmeny TEXT
    );
  `);
  // Ha a folyamat futás közben állt le, a „fut” tételek beragadnának: indításkor visszatesszük őket sorba.
  db.exec("UPDATE sor SET allapot = 'var', kezdve = NULL WHERE allapot = 'fut'");

  const sorTetelLeker = (sor: Record<string, unknown>): SorTetel => ({
    id: String(sor.id),
    szervezet_id: String(sor.szervezet_id),
    fajta: sor.fajta as SorFajta,
    adat: JSON.parse(String(sor.adat)) as Record<string, unknown>,
    allapot: sor.allapot as SorAllapot,
    kiserlet: Number(sor.kiserlet),
    letrehozva: String(sor.letrehozva),
    kezdve: sor.kezdve === null ? null : String(sor.kezdve),
    vege: sor.vege === null ? null : String(sor.vege),
    hiba_ok: sor.hiba_ok === null ? null : String(sor.hiba_ok),
    eredmeny: sor.eredmeny === null ? null : JSON.parse(String(sor.eredmeny)) as Record<string, unknown>,
  });

  return {
    sorbaTesz(szervezetId: string, fajta: SorFajta, adat: Record<string, unknown>) {
      const letezo = db.prepare(
        "SELECT id FROM sor WHERE szervezet_id = ? AND allapot IN ('var', 'fut') LIMIT 1"
      ).get(szervezetId);
      if (letezo) {
        return { ok: false as const, hiba: "FUT_MAR" as const };
      }
      const id = idAdo();
      const mostIso = most().toISOString();
      db.prepare(
        `INSERT INTO sor (id, szervezet_id, fajta, adat, allapot, kiserlet, letrehozva)
         VALUES (?, ?, ?, ?, 'var', 0, ?)`
      ).run(id, szervezetId, fajta, JSON.stringify(adat), mostIso);
      const sor = db.prepare("SELECT * FROM sor WHERE id = ?").get(id);
      return { ok: true as const, sor: sorTetelLeker(sor as Record<string, unknown>) };
    },

    tetel(id: string): SorTetel | null {
      const sor = db.prepare("SELECT * FROM sor WHERE id = ?").get(id);
      return sor ? sorTetelLeker(sor as Record<string, unknown>) : null;
    },

    tetelek(szervezetId: string): SorTetel[] {
      const sorok = db.prepare(
        "SELECT * FROM sor WHERE szervezet_id = ? ORDER BY letrehozva DESC"
      ).all(szervezetId) as Record<string, unknown>[];
      return sorok.map(sorTetelLeker);
    },

    kovetkezoKivesz(): SorTetel | null {
      const sor = db.prepare(
        "SELECT * FROM sor WHERE allapot = 'var' ORDER BY letrehozva ASC LIMIT 1"
      ).get() as Record<string, unknown> | undefined;
      if (!sor) return null;
      const mostIso = most().toISOString();
      db.prepare("UPDATE sor SET allapot = 'fut', kezdve = ? WHERE id = ?").run(mostIso, String(sor.id));
      const frissitett = db.prepare("SELECT * FROM sor WHERE id = ?").get(String(sor.id));
      return sorTetelLeker(frissitett as Record<string, unknown>);
    },

    kesz(id: string, eredmeny: Record<string, unknown>): void {
      const mostIso = most().toISOString();
      db.prepare(
        "UPDATE sor SET allapot = 'kesz', vege = ?, eredmeny = ? WHERE id = ?"
      ).run(mostIso, JSON.stringify(eredmeny), id);
    },

    hiba(id: string, ok: string): void {
      const mostIso = most().toISOString();
      db.prepare(
        "UPDATE sor SET allapot = 'hiba', vege = ?, hiba_ok = ?, kiserlet = kiserlet + 1 WHERE id = ?"
      ).run(mostIso, ok, id);
    },
  };
}

export interface Sor {
  sorbaTesz(szervezetId: string, fajta: SorFajta, adat: Record<string, unknown>): { ok: true; sor: SorTetel } | { ok: false; hiba: "FUT_MAR" };
  tetel(id: string): SorTetel | null;
  tetelek(szervezetId: string): SorTetel[];
  kovetkezoKivesz(): SorTetel | null;
  kesz(id: string, eredmeny: Record<string, unknown>): void;
  hiba(id: string, ok: string): void;
}

export interface UtemezoOpciok {
  intervallumMs?: number;
}

export function utemezo(
  fuggosegek: {
    sor: Sor;
    futtat: (t: SorTetel) => Promise<Record<string, unknown>>;
    napiEsedekes: () => Promise<string[]>;
    most: () => Date;
    naplo?: (uzenet: string) => void;
  },
  opciok?: UtemezoOpciok
): { indit(): void; leallit(): void; egyKor(): Promise<void> } {
  const intervallumMs = opciok?.intervallumMs ?? 5000;
  let idozito: ReturnType<typeof setInterval> | null = null;
  let futEppen = false;

  const naploz = (uzenet: string) => {
    if (fuggosegek.naplo) {
      fuggosegek.naplo(uzenet);
    }
  };

  const egyKor = async (): Promise<void> => {
    if (futEppen) return;
    futEppen = true;
    try {
      // 1. Napi esedékesek besorolása
      try {
        const esedekesSzervezetek = await fuggosegek.napiEsedekes();
        for (const szervezetId of esedekesSzervezetek) {
          const eredmeny = fuggosegek.sor.sorbaTesz(szervezetId, "napi", {});
          if (!eredmeny.ok) {
            // FUT_MAR nem hiba, csak kihagyás
            naploz(`Napi besorolás kihagyva (${szervezetId}): ${eredmeny.hiba}`);
          }
        }
      } catch (hiba) {
        naploz(`Napi esedékesek lekérdezése hibás: ${hiba instanceof Error ? hiba.message : String(hiba)}`);
      }

      // 2. Egy tétel futtatása
      const tetel = fuggosegek.sor.kovetkezoKivesz();
      if (tetel) {
        try {
          const eredmeny = await fuggosegek.futtat(tetel);
          fuggosegek.sor.kesz(tetel.id, eredmeny);
        } catch (hiba) {
          const uzenet = hiba instanceof Error ? hiba.message : String(hiba);
          fuggosegek.sor.hiba(tetel.id, uzenet);
          naploz(`Tétel hiba (${tetel.id}): ${uzenet}`);
        }
      }
    } catch (hiba) {
      naploz(`Váratlan hiba az egyKor-ban: ${hiba instanceof Error ? hiba.message : String(hiba)}`);
    } finally {
      futEppen = false;
    }
  };

  return {
    indit(): void {
      if (idozito) return;
      idozito = setInterval(() => {
        void egyKor();
      }, intervallumMs);
      idozito.unref();
    },
    leallit(): void {
      if (idozito) {
        clearInterval(idozito);
        idozito = null;
      }
    },
    egyKor,
  };
}
