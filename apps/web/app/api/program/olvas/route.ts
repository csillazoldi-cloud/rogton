import { eldob, korlatosBeolvas } from "../../../../fajl/beolvas";
import { kapu } from "../../_kapu";
import { programOlvasasIndit, programOlvasasLekerdez } from "../../../../program";
import { DOCX_KORLAT } from "../../../../program/docx";
import { hibaValasz, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

// c30 F5 (terv §3, §10 F5) — POST: a program beolvasása (és újraolvasása). c30 F6b (élő 10-17): a beolvasás a HÁTTÉRBEN fut — a POST
//   202 {olvasas} választ ad (a .docx hibái és az üres forrás azonnal 4xx), a GET a lekérdezés: {olvasas, tetelek?} (tetelek, ha kész).
//   Egy nagy program 60–120 s; az nginx és a DSM proxy 60 s-nál elvágta a kérést, ezért nem várunk rá a kérésben.
//   · JSON {link} — weboldal, vagy egy PDF / kép / .docx a neten;  · JSON {fajlok: [id…]} — feltöltött PDF / fotó (a fájltárból);
//   · a törzs maga a .docx (content-type: application/vnd.openxmlformats-officedocument.wordprocessingml.document) — ≤ 5 MB, nem kerül
//     a fájltárba, csak a szövege (program/docx.ts). Az újraolvasás a személy szerkesztését és saját tételét soha nem írja felül.
const DOCX_MIME = /^application\/(vnd\.openxmlformats-officedocument\.wordprocessingml\.document|octet-stream)\b/i;

export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const h = { szervezetId: e.szervezet.id, fiokId: e.fiok.id };
    if (DOCX_MIME.test(keres.headers.get("content-type") ?? "")) {
      const cl = keres.headers.get("content-length");
      if (cl && Number(cl) > DOCX_KORLAT.maxBajt) {
        await eldob(keres);
        return valasz({ hiba: "TUL_NAGY" }, 413);
      }
      const bajtok = await korlatosBeolvas(keres, DOCX_KORLAT.maxBajt);
      if (!bajtok) return valasz({ hiba: "TUL_NAGY" }, 413);
      return valasz({ olvasas: await programOlvasasIndit(h, { docx: bajtok }) }, 202);
    }
    const be = (await keres.json().catch(() => null)) as { link?: unknown; fajlok?: unknown; foto?: unknown } | null;
    const link = typeof be?.link === "string" ? be.link.trim().slice(0, 500) : "";
    const fajlok = Array.isArray(be?.fajlok) ? (be!.fajlok as unknown[]).filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 6) : [];
    if (!link && fajlok.length === 0) return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: { forras: "ures" } }, 400);
    // c30 F6: {foto: true} — a feltöltött fájlok fotók (a „Fotó” csempéről); különben PDF — csak a forrás-sor szövegéhez
    return valasz({ olvasas: await programOlvasasIndit(h, fajlok.length ? { fajlok, forrasFajta: be?.foto === true ? "foto" : "pdf" } : { link, forrasFajta: "link" }) }, 202);
  } catch (h) {
    return hibaValasz(h, "olvasás");
  }
}

// GET — a háttér-olvasás állapota (bárki a szervezetből, aki a programot látja): {olvasas: {id, allapot: fut|kesz|hiba, …} | null, tetelek?}
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    return valasz(await programOlvasasLekerdez(e.szervezet.id));
  } catch (h) {
    return hibaValasz(h, "olvasás állapota");
  }
}
