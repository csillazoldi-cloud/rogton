import "server-only";
import { profilTar } from "../profil/tar";
import { tipusOf } from "../profil/tipus-szabaly";
import { posztTar } from "../poszt/tar";
import { programTar } from "./tar";
import { horgonyFajtak, horgonyJavaslatok, type HorgonyOtlet } from "./horgony";

// c30 F8 (terv §4): egy fesztivál horgonyzott ötletei a Kezdőlapnak és a Naptárnak — a profilból (dátumok, tématerv), a programból
// (kiemelt fellépők) és a meglévő posztokból (melyik ötletből lett már poszt). Cégnél és dátum nélkül: null — ott semmi nem változik.
// Olvas, nem ír: az ötlet csak a „Megírjuk” koppintásra lesz poszt (POST /api/poszt, a kulcs a forrás azonosítója).
export async function fesztivalOtletek(szervezetId: string): Promise<{ lista: HorgonyOtlet[]; letezo: Set<string>; nyelv: string } | null> {
  const p = await profilTar.betolt(szervezetId).catch(() => null);
  if (!p || tipusOf(p) !== "fesztival") return null;
  const r = p.rendezveny ?? p.rendezveny_javaslat;
  if (!r?.mettol) return null;
  const [tetelek, posztok] = await Promise.all([programTar.lista(szervezetId).catch(() => []), posztTar.lista(szervezetId, 400).catch(() => [])]);
  const lista = horgonyJavaslatok(r, tetelek, horgonyFajtak(p.tema_terv), p.nyelvek?.[0] ?? "hu");
  const letezo = new Set(posztok.map((m) => m.forras_azonosito).filter((a) => a.startsWith("program:")));
  return { lista, letezo, nyelv: p.nyelvek?.[0] ?? "hu" };
}
