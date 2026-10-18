86:export async function hangnemetFinomit(szervezetId: string, be: HangnemFinomitasKeres, felulet: string): Promise<HangnemFinomitasValasz> {
87-  await keretVagyJavaslatHiba(szervezetId);
88-  const sz = szolgaltato();
89-  const t0 = Date.now();
90-  const iranySzoveg = be.irany === "egyedi" ? (be.megjegyzes?.trim() || "egyedi") : be.irany;
91-  const szoveg = `A hangnem-leírás: ${be.hangnem_leiras}\nA mintaszöveg:\n${be.hangnem_minta}\nA kérés: ${iranySzoveg}`;
92-  try {
93-    const v = await sz.hiv({
94-      feladat: "hangnem_finomitas",
95-      rendszer: await prompt("hangnem_finomitas", felulet, be.tartalomnyelv),
96-      szoveg,
97-      nyelv: felulet,
98-      maxKiToken: 400,
99-      idokorlatMs: 30_000,
100-    });
101-    await meresRogzit(szervezetId, v.meres);
102-    const nyers = jsonRobusztusan(v.szoveg);
103-    const elemzett = JSON.parse(nyers) as unknown;
104-    const ellenorzott = HangnemFinomitasValasz.omit({ forras: true }).safeParse(elemzett);
105-    if (!ellenorzott.success) throw new AiHiba("AI_ROSSZ_VALASZ");
106-    return { ...ellenorzott.data, forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai" };
107-  } catch (hiba) {
108-    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
109-    const meres: HivasMeres = {
110-      szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "hangnem_finomitas",
111-      tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod,
112-    };
113-    await meresRogzit(szervezetId, meres);
114-    if (kod === "AI_KERET_KIMERULT") throw new JavaslatHiba("AI_KERET_KIMERULT");
115-    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
116-    throw new JavaslatHiba("AI_NEM_ELERHETO", { ok: kod });
117-  }
118-}
import { kapu } from "../../_kapu";
import { cookies, headers } from "next/headers";
import { HangnemFinomitasKeres, type HibaValasz } from "@km/contracts";
import { NYELV_SUTI } from "@km/design-system";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";
import { JavaslatHiba, hangnemetFinomit } from "../../../../onboarding/javaslatok";
import { nyelvKeresbol } from "../../../../nyelv";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// POST — a hangnem finomítása (közvetlenebb / tárgyilagosabb / saját megjegyzés). Az eredmény függő javaslat a felületen.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    let torzs: unknown;
    try { torzs = await keres.json(); } catch { return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400); }
    const ertek = HangnemFinomitasKeres.safeParse(torzs);
    if (!ertek.success) {
      const mezok: Record<string, string> = {};
      for (const p of ertek.error.issues) { const ut = p.path.join("."); if (ut && !mezok[ut]) mezok[ut] = p.code; }
      return hiba({ hiba: "ERVENYTELEN_ADAT", mezok }, 400);
    }
    const [sutik, fejlecek] = await Promise.all([cookies(), headers()]);
    const felulet = nyelvKeresbol(sutik.get(NYELV_SUTI)?.value, fejlecek.get("accept-language"));
    const valasz = await hangnemetFinomit(szervezet.id, ertek.data, felulet);
    return Response.json(valasz, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    if (h instanceof JavaslatHiba) {
      const status = h.kod === "ERVENYTELEN_ADAT" ? 400 : h.kod === "AI_KERET_KIMERULT" ? 429 : h.kod === "AI_KIKAPCSOLVA" ? 409 : 503;
      return hiba(h.mezok ? { hiba: h.kod, mezok: h.mezok } : { hiba: h.kod }, status);
    }
    console.error("Hangnem POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
