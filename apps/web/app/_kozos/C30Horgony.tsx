"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "./kliens";
import { idoszakCimke } from "./c30-program-szabaly";
import type { R15HorgonyOtlet } from "../../r15/tipusok";

// c30 F8 (rajz D7a · D7b): a horgonyzott ötlet szövegei és a „Megírjuk” — a Kezdőlap kártyája / sora és a Naptár szellem-sora közös része.
// A „Megírjuk” a poszt_munkát hozza létre (forrás: „terv”, azonosító = a horgony kulcsa → a második koppintás ugyanazt nyitja, A-8),
// a horgony napjával javasolt napként; utána a Posztszöveg lap nyílik. Addig semmi nem íródik.

type F = (k: string, p?: Record<string, string | number>) => string;

/** A kártya halk sora („Holnapi program · jún. 26.”), a címe („Holnap: Blahalouisiana és Alina Eremia”) és a szellem-sor szövege. */
export function otletSzovegek(o: R15HorgonyOtlet, t: F, ui: string): { info: string; cim: string; szellem: string } {
  const fajta = t(`c30.horgony.fajta.${o.fajta}`);
  const datum = idoszakCimke(o.cel_nap ?? o.nap, o.cel_nap ?? o.nap, ui);
  const nevek = o.nevek.length >= 2 ? t("c30.horgony.es", { a: o.nevek[0]!, b: o.nevek[1]! }) : (o.nevek[0] ?? "");
  let cim: string;
  if (o.fajta === "visszaszamlalo") cim = t("c30.horgony.cim.visszaszamlalo", { n: o.hatra ?? 0 });
  else if (o.fajta === "holnapi_program" || o.fajta === "mai_program") cim = nevek ? t(`c30.horgony.cim.${o.fajta}`, { nevek }) : t("c30.horgony.cim.nev_nelkul", { fajta, datum });
  else if (o.fajta === "fellepo") cim = t("c30.horgony.cim.fellepo", { nev: nevek, datum });
  else if (o.fajta === "album") cim = t("c30.horgony.cim.album", { datum });
  else cim = t(`c30.horgony.cim.${o.fajta}`);
  return { info: t("c30.horgony.info", { fajta, datum }), cim, szellem: t(`c30.horgony.szellem.${o.fajta}`) };
}

/** A „Megírjuk”: POST /api/poszt (a kulccsal és a javasolt nappal), majd a Posztszöveg lap. Hibánál egy mondat (nincs piros keret). */
export function useOtletMegir() {
  const { t, nyelv: ui } = useFeliratok();
  const router = useRouter();
  const [fut, setFut] = useState<string | null>(null);
  const [hiba, setHiba] = useState("");
  async function megir(o: R15HorgonyOtlet) {
    if (fut) return;
    setFut(o.kulcs); setHiba("");
    const sz = otletSzovegek(o, t, ui);
    const r = await hivas("/api/poszt", "POST", {
      forras: { tipus: "terv", azonosito: o.kulcs, cim: sz.cim.slice(0, 200), url: "", szoveg: `${sz.info}\n${sz.cim}`.slice(0, 4000) },
      cim: sz.cim.slice(0, 200), felulet: "fb", nyelv: o.nyelv, javasolt_nap: o.nap,
    });
    const id = (r.torzs["munka"] as { id?: string } | undefined)?.id;
    if (r.statusz === 200 && id) { router.push(`/poszt?munka=${encodeURIComponent(id)}`); return; }
    setHiba(r.torzs["hiba"] === "AI_KERET_KIMERULT" ? t("r13.kredit.elfogyott") : t("hf.poszt_hiba"));
    setFut(null);
  }
  return { megir, fut, hiba };
}
