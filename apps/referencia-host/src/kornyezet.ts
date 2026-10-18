// A NÉGY CSATLAKOZÓ összefűzése egyetlen `Kornyezet`-té — ez az egész bekötés lényege.
// A mag (`@km/news-monitor-core`) ugyanaz a csomag, mint a webalkalmazásban: se ágazás, se másolat.
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { HirfigyeloTar, HostKontextus, Kornyezet } from "@km/news-monitor-core";
import { beallitasokOlvas, utFeloldas, type HostBeallitasok } from "./beallitasok.js";
import { ollamaAi, tesztAi } from "./csatlakozok/ai.js";
import { letoltoValaszt } from "./csatlakozok/letolto.js";
import { sqliteTar } from "./csatlakozok/sqlite-tar.js";

export type HostAllas = {
  k: Kornyezet;
  ktx: HostKontextus;
  tar: HirfigyeloTar & { db: DatabaseSync; zar(): void };
  beallitasok: HostBeallitasok;
  zar(): void;
};

/** A host felállítása a `profil.json`-ból. `utvonal` felülírja a fájlban megadott adatbázist (a próbák ezt használják). */
export function kornyezetKeszit(opciok?: { utvonal?: string; profilUt?: string; naplo?: (uzenet: string) => void }): HostAllas {
  const beallitasok = beallitasokOlvas(opciok?.profilUt);
  const tar = sqliteTar(opciok?.utvonal ?? utFeloldas(beallitasok.adatbazis));

  const ktx: HostKontextus = {
    fiok_id: beallitasok.fiok_id,
    szervezet_id: beallitasok.szervezet_id,
    szerep: "tulajdonos",
  };

  // A valódi AI a KÖZÖS promptcsomagot használja (E-31) — nem kell prompt-könyvtárat megadni.
  const ai = beallitasok.ai === "ollama" ? ollamaAi(beallitasok.nyelv) : tesztAi;

  const k: Kornyezet = {
    tar,
    letolto: letoltoValaszt(beallitasok.letolto),
    ai,
    profil: beallitasok.profil, // a host ADJA a profilt (10.3) — a mag csak olvassa
    idAdo: () => randomUUID(),
    most: () => new Date(),
    ...(opciok?.naplo ? { esemeny: (e: { fajta: string; szervezet_id: string }) => opciok.naplo?.(`[${e.fajta}] ${e.szervezet_id}`) } : {}),
  };

  return { k, ktx, tar, beallitasok, zar: () => tar.zar() };
}
