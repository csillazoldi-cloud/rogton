// A forrás-sor műveletei: cím módosítása és eltávolítás.
// Külön fájl, mert a folyamat.ts már 782 sor — a forrás-szerkesztés önálló, jól tesztelhető egység.
// A 0.3.0 töréses: a HirfigyeloTar interfész új taggal (forrasTorol) bővült, a befogadók illesztőit frissíteni kell.
import type { Kornyezet, Hiba } from "./folyamat";
import { jogosult } from "./host";
import type { HostKontextus } from "./host";
import { forrasCimOsztalyoz, type Forras } from "./forras";

/** Jogosultság-ellenőrzés; hiba esetén NINCS_JOG. */
function jogEllenoriz(ktx: HostKontextus): Hiba | null {
  if (!jogosult(ktx.szerep, "beallit")) return { ok: false, hiba: "NINCS_JOG" };
  return null;
}

/** Forrás címének módosítása: újraosztályoz, ment; érvénytelen cím esetén a tár nem változik. */
export async function forrasCimModosit(
  k: Kornyezet,
  ktx: HostKontextus,
  forrasId: string,
  ujCim: string,
): Promise<{ ok: true; forras: Forras } | Hiba> {
  const jog = jogEllenoriz(ktx);
  if (jog) return jog;
  const forrasok = await k.tar.forrasok(ktx.szervezet_id);
  const f = forrasok.find((x) => x.id === forrasId);
  if (!f) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_forras" };
  const oszt = forrasCimOsztalyoz(ujCim);
  if (oszt.ok === "ervenytelen") return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "ervenytelen" };
  const uj: Forras = {
    id: f.id,
    cim: oszt.cim,
    tipus: oszt.tipus,
    eredet: f.eredet,
    allapot: oszt.allapot,
    ellenorzott: false,
    utolso_sikeres: null,
    hiba_ok: oszt.ok,
  };
  await k.tar.forrasMent(ktx.szervezet_id, uj);
  return { ok: true, forras: uj };
}

/** Forrás eltávolítása: a tárból kiveszi; a visszaadott forrás a törölt (eseménynaplóhoz). */
export async function forrasTorol(
  k: Kornyezet,
  ktx: HostKontextus,
  forrasId: string,
): Promise<{ ok: true; forras: Forras } | Hiba> {
  const jog = jogEllenoriz(ktx);
  if (jog) return jog;
  const forrasok = await k.tar.forrasok(ktx.szervezet_id);
  const f = forrasok.find((x) => x.id === forrasId);
  if (!f) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_forras" };
  await k.tar.forrasTorol(ktx.szervezet_id, forrasId);
  return { ok: true, forras: f };
}
