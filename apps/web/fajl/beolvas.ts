import "server-only";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";

// A feltöltött törzs beolvasása KORLÁTTAL (Csilla 2026-10-10: 100 MB-os arculati fájlok, a NAS-on nincs tartalék memória).
//  · `torzsFajlba`: a kérés törzsét darabonként egy ideiglenes fájlba írja, futó bájtszámlálással; a korlát fölött AZONNAL megszakít
//    (a fájlt törli), és az első 512 bájtot (a fejet) megtartja a tartalom szerinti típus-felismeréshez. A teljes fájl sosem kerül
//    a memóriába. Az ideiglenes mappa a fájltár alatt van (ugyanaz a lemez), így a végleges helyére egy átnevezés viszi (tar.ts).
//  · `korlatosBeolvas`: kis fájlokhoz (posztkép, betű ≤ 10 MB), memóriába — de a korlát fölött ugyanúgy megszakít (a `content-length`
//    hiányában is, pl. darabolt küldésnél).

const FEJ = 512;
/** Elutasításkor ennyit olvasunk még el és dobunk el (lásd `eldob`); fölötte a kapcsolatot bontjuk. Az nginx úgyis 105 MB-nál vág. */
const ELDOB_MAX = 128 * 1024 * 1024;

/**
 * A maradék törzs elolvasása és eldobása (memória nélkül), mielőtt a 413-at kiküldjük. Mérve 10-10: ha a végpont a törzs közepén válaszol
 * és a folyamot bontja, a kliens (és az nginx felé az upstream) „ECONNRESET”-et lát a barátságos TUL_NAGY helyett. Így a válasz mindig
 * megérkezik. Felső határ: `ELDOB_MAX` (ezen túl bontunk — közvetlenül az appra küldött, végtelen törzs se tartson örökké).
 */
export async function eldob(keres: Request | ReadableStreamDefaultReader<Uint8Array>, mar = 0): Promise<void> {
  const r = keres instanceof Request ? keres.body?.getReader() : keres;
  if (!r) return;
  let n = mar;
  try {
    for (;;) {
      const { done, value } = await r.read();
      if (done) return;
      n += value.byteLength;
      if (n > ELDOB_MAX) { await r.cancel().catch(() => {}); return; }
    }
  } catch {
    // a kliens bontott: nincs mit tenni
  }
}

export function ideiglenesMappa(): string {
  return join(process.env.FAJL_MAPPA ?? "./adatok/fajlok", "_feltoltes");
}

export type TorzsFajl = { ok: true; ut: string; meret: number; fej: Uint8Array } | { ok: false; hiba: "TUL_NAGY" | "URES" };

export async function torzsFajlba(keres: Request, max: number): Promise<TorzsFajl> {
  if (!keres.body) return { ok: false, hiba: "URES" };
  await mkdir(ideiglenesMappa(), { recursive: true });
  const ut = join(ideiglenesMappa(), `${randomUUID()}.part`);
  const ki = createWriteStream(ut, { flags: "wx", mode: 0o600 });
  const olvaso = keres.body.getReader();
  const fej = new Uint8Array(FEJ);
  let fejHossz = 0;
  let meret = 0;
  const ir = (darab: Uint8Array) =>
    new Promise<void>((kesz, hiba) => {
      if (ki.write(darab)) kesz();
      else ki.once("drain", kesz).once("error", hiba);
    });
  const lezar = () => new Promise<void>((kesz, hiba) => ki.end((h?: Error | null) => (h ? hiba(h) : kesz())));
  try {
    for (;;) {
      const { done, value } = await olvaso.read();
      if (done) break;
      meret += value.byteLength;
      if (meret > max) {
        ki.destroy();
        await unlink(ut).catch(() => {});
        await eldob(olvaso, meret);
        return { ok: false, hiba: "TUL_NAGY" };
      }
      if (fejHossz < FEJ) {
        const n = Math.min(FEJ - fejHossz, value.byteLength);
        fej.set(value.subarray(0, n), fejHossz);
        fejHossz += n;
      }
      await ir(value);
    }
    await lezar();
  } catch (h) {
    ki.destroy();
    await unlink(ut).catch(() => {});
    throw h;
  }
  if (meret === 0) {
    await unlink(ut).catch(() => {});
    return { ok: false, hiba: "URES" };
  }
  return { ok: true, ut, meret, fej: fej.subarray(0, fejHossz) };
}

/** Kis törzs memóriába, korláttal: a korlát fölött `null` (a hívó TUL_NAGY-ot ad). */
export async function korlatosBeolvas(keres: Request, max: number): Promise<Uint8Array | null> {
  if (!keres.body) return new Uint8Array(0);
  const olvaso = keres.body.getReader();
  const darabok: Uint8Array[] = [];
  let meret = 0;
  for (;;) {
    const { done, value } = await olvaso.read();
    if (done) break;
    meret += value.byteLength;
    if (meret > max) {
      darabok.length = 0;
      await eldob(olvaso, meret);
      return null;
    }
    darabok.push(value);
  }
  const ki = new Uint8Array(meret);
  let i = 0;
  for (const d of darabok) { ki.set(d, i); i += d.byteLength; }
  return ki;
}

/** Az ideiglenes fájl eltakarítása hibaúton (a sikeres út átnevezi). */
export async function ideiglenesTorol(ut: string): Promise<void> {
  await unlink(ut).catch(() => {});
}
