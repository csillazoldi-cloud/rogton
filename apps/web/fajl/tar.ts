import "server-only";
import { createReadStream } from "node:fs";
import { access, copyFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { dirname, join } from "node:path";
import { and, eq } from "drizzle-orm";
import type { FajlCel, FajlEredet, FajlMeta, FajlTar, FajlTipus, LogoValtozat } from "@km/fajl-core";
import { KITERJESZTES } from "@km/fajl-core";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";

// A `@km/fajl-core` `FajlTar` portjának megvalósítása (F-6).
// A meta a Postgresben (`arculat_fajl`, `szervezetKent` alatt), a bájtok a lemezen:
//   <FAJL_MAPPA>/<szervezet_id>/<id>.<KITERJESZTES[tipus]>
//   c30 F9 (D7): az albumfotók (`cel = "album"`) KÜLÖN mappában: <ALBUM_MAPPA>/<szervezet_id>/<id>.<kit> — 30 nap, mentés nélkül
//   (a `nas/mentes.sh` csak a FAJL_MAPPA-t tarolja; az album mappa a NAS-on `./adatok/album`, mellette, nem alatta).
// Az `id` és a `szervezet_id` uuid — a nevet NEM használjuk útvonalként.

function mappaAlap(): string {
  return process.env.FAJL_MAPPA ?? "./adatok/fajlok";
}

/** c30 F9: az albumfotók mappája (a dobozban `/adatok/album`, a compose adja). A 30 napos elköltöztetés (album/koltoztet.ts) is ezt
 *  használja. Ha nincs megadva (fejlesztői gép, ill. a kapu próbakörnyezete, amíg a robot saját kapuja a régi): a FAJL_MAPPA `_album`
 *  almappája — az írható (a fájlok csatolt mappája), és a próba ugyanígy számolja ki. A `nas/mentes.sh` ezt is kihagyja (`--exclude`). */
export function albumMappa(): string {
  return process.env.ALBUM_MAPPA || join(mappaAlap(), "_album");
}

function ut(szervezet_id: string, id: string, tipus: FajlTipus, cel?: FajlCel): string {
  return join(cel === "album" ? albumMappa() : mappaAlap(), szervezet_id, `${id}.${KITERJESZTES[tipus]}`);
}

function sorbol(sor: {
  id: string;
  szervezetId: string;
  nev: string;
  tipus: string;
  meret: number;
  cel: string;
  feltoltotte: string | null;
  feltoltve: Date;
  logoValtozat: string | null;
  eredet: string;
  elemzes: unknown;
}): FajlMeta {
  return {
    id: sor.id,
    szervezet_id: sor.szervezetId,
    nev: sor.nev,
    tipus: sor.tipus as FajlTipus,
    meret: sor.meret,
    cel: sor.cel as FajlCel,
    feltoltotte: sor.feltoltotte ?? "",
    feltoltve: sor.feltoltve.toISOString(),
    // R-16 K1 (0135): a hely (logónál NULL = vilagos — a fajl-core `logoHelye` így olvassa), az eredet és az elemzés
    logo_valtozat: (sor.logoValtozat as LogoValtozat | null) ?? null,
    eredet: sor.eredet as FajlEredet,
    elemzes: sor.elemzes ?? null,
  };
}

async function metaSor(meta: FajlMeta): Promise<void> {
  await szervezetKent(meta.szervezet_id, async (tx) => {
      await tx.insert(sema.arculatFajl).values({
        id: meta.id,
        szervezetId: meta.szervezet_id,
        nev: meta.nev,
        tipus: meta.tipus,
        meret: meta.meret,
        cel: meta.cel,
        feltoltotte: meta.feltoltotte || null,
        feltoltve: new Date(meta.feltoltve),
        // R-16 K1 (0135): a hely csak logónál (a fajl-core `feltolt` már így adja), az eredet alapból feltöltés
        logoValtozat: meta.cel === "logo" ? (meta.logo_valtozat ?? "vilagos") : null,
        eredet: meta.eredet ?? "feltoltes",
        // R-16 K5: a betűnél is — a kiszolgáló ékezet-vizsgálata (arculat-core BetuElemzes), TERV 1.5
        // c30 F9: az albumnál a pár, a készítés ideje és az album kulcsa (TERV 1.5)
        elemzes: meta.cel === "logo" || meta.cel === "betu" || meta.cel === "album" ? (meta.elemzes ?? null) : null,
      });
  });
}

export const fajlTar: FajlTar = {
  async ment(meta, bajtok) {
    const cel = ut(meta.szervezet_id, meta.id, meta.tipus, meta.cel);
    await mkdir(dirname(cel), { recursive: true });
    // Atomi írás: ideiglenes név, majd rename.
    const ideiglenes = `${cel}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(ideiglenes, bajtok);
    await rename(ideiglenes, cel);
    await metaSor(meta);
  },

  // 0.3.0 (fajl-core): a már lemezen lévő ideiglenes fájl a helyére — átnevezés (ugyanaz a lemez: az ideiglenes mappa a FAJL_MAPPA alatt),
  // ha az nem megy (más eszköz), másolás + törlés. A bájtok nem jönnek a memóriába. A meta-sor ugyanúgy, mint a `ment`-nél.
  async mentFajlbol(meta, ideiglenesUt) {
    const cel = ut(meta.szervezet_id, meta.id, meta.tipus, meta.cel);
    await mkdir(dirname(cel), { recursive: true });
    try {
      await rename(ideiglenesUt, cel);
    } catch {
      await copyFile(ideiglenesUt, cel);
      await unlink(ideiglenesUt).catch(() => {});
    }
    await metaSor(meta);
  },

  async meta(szervezet_id, id) {
    return szervezetKent(szervezet_id, async (tx) => {
      const sor = (
        await tx
          .select()
          .from(sema.arculatFajl)
          .where(and(eq(sema.arculatFajl.szervezetId, szervezet_id), eq(sema.arculatFajl.id, id)))
          .limit(1)
      )[0];
      return sor ? sorbol(sor) : null;
    });
  },

  async olvas(szervezet_id, id) {
    const m = await this.meta(szervezet_id, id);
    if (!m) return null;
    try {
      const bajtok = await readFile(ut(szervezet_id, id, m.tipus, m.cel));
      return new Uint8Array(bajtok);
    } catch {
      // Ha a fájl hiányzik a lemezről, null.
      return null;
    }
  },

  // 0.3.0: a letöltés folyamként (100 MB-os fájl sem kerül egészben a memóriába — Csilla 2026-10-10)
  async olvasFolyam(szervezet_id, id) {
    const m = await this.meta(szervezet_id, id);
    if (!m) return null;
    const hely = ut(szervezet_id, id, m.tipus, m.cel);
    try {
      await access(hely);
    } catch {
      return null;
    }
    return Readable.toWeb(createReadStream(hely)) as ReadableStream<Uint8Array>;
  },

  async lista(szervezet_id, cel) {
    return szervezetKent(szervezet_id, async (tx) => {
      const feltetel = cel
        ? and(eq(sema.arculatFajl.szervezetId, szervezet_id), eq(sema.arculatFajl.cel, cel))
        : eq(sema.arculatFajl.szervezetId, szervezet_id);
      const sorok = await tx.select().from(sema.arculatFajl).where(feltetel);
      return sorok.map(sorbol);
    });
  },
};
