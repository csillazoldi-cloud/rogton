// R-15 · 06 Mit figyeljünk — a lap tiszta döntései (gepezet-3 3.2, 3.3, 3.5). Külön fájl, hogy a próba JSX nélkül olvashassa
// (probak/r15-mit-figyeljunk.proba.ts). A Beallitas.tsx és a Forrasok.tsx innen veszi őket.
import type { Beallitas, Forras, Futas } from "@km/news-monitor-core";

/** gepezet-3 3.2 — melyik képernyő: 06a (a reggeli figyelés ki) vagy 06b (be). */
export function mitFigyeljunkNezet(b: Pick<Beallitas, "idozites">): "06a" | "06b" {
  return b.idozites.mod === "napi" ? "06b" : "06a";
}

/** gepezet-3 3.5 — volt-e már lezárt keresés (próba vagy éles): ha igen, a „Jó így, kezdjük” nem futtat újabb próbát.
 *  A lezárt állapotok: kész, részleges, AI függőben (a futás végigment); „hiba”, „indul”, „fut” nem számít. */
export function voltKeszKereses(futasok: Pick<Futas, "allapot">[]): boolean {
  return futasok.some((f) => f.allapot === "kesz" || f.allapot === "reszleges" || f.allapot === "ai_fuggoben");
}

/** gepezet-3 3.3 — a sor második sorának feliratkulcsa: CSAK ha nem rendben van; rendben lévő oldalnál null (T3: nincs állapotsor). */
export function allapotKulcs(f: Pick<Forras, "allapot">): string | null {
  switch (f.allapot) {
    case "hasznalhato": return null;
    case "ellenorzes_alatt": return "r15.mit.ellenorizzuk";
    case "hibas": return "r15.mit.oldal_nem_nyilt";
    case "nem_tamogatott": return "r15.mit.nem_figyelheto";
    case "korlatozott": return "hf.forras_korlatozott";
  }
}

/** gepezet-3 3.3 — egy lista: a kézi oldalak elöl (a felvétel sorrendjében), a gép javasoltak a végén. */
export function forrasSorrend<F extends Pick<Forras, "eredet">>(lista: F[]): F[] {
  return [...lista.filter((f) => f.eredet !== "ai_javaslat"), ...lista.filter((f) => f.eredet === "ai_javaslat")];
}
