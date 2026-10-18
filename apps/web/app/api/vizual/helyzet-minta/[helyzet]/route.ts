import { kapu } from "../../../_kapu";
import { HELYZETEK, helyzetMinta, kepArculat, kepValtozat, mintaSzoveg, sajatBetukAdat, type Helyzet } from "../../../../../vizual/helyzet";
import { peldakFrissen } from "../../../../../vizual/peldak";
import { MintaKeres, mintaArculat } from "../../../../../vizual/minta";
import { KepgyarHiba } from "../../../../../vizual";
import { hibaValasz } from "../../_kozos";
import { profilTar } from "../../../../../profil/tar";
import { posztTar } from "../../../../../poszt/tar";
import { foSzoveg, sorok } from "../../../../../r15/szamol";
import { NevlogoHiba, kepgyarNevlogo, nevlogoBemenet, nevlogoKepLogok } from "../../../../../arculat/nevlogo";

export const dynamic = "force-dynamic";

// GET — egy helyzet mintaképe a munkatér arculatával (VZ-2a kártyái). PNG.
export async function GET(keres: Request, { params }: { params: Promise<{ helyzet: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { helyzet } = await params;
    const [{ arculat, nyelv }, p, valtozat] = await Promise.all([kepArculat(e.szervezet.id, e.szervezet.nev), peldakFrissen(e.szervezet.id), kepValtozat(e.szervezet.id)]);
    // a gép szövege a cég szakmájából, ha már megvan; különben a képgyártó általános mintája
    // c30 F12: fesztiválnál a gép szövege hiányában a fesztivál mintaszövege (a képgyártó általános mintája a cégé)
    const peldaTartalom = p.peldak?.[helyzet as Helyzet] ?? (arculat.fesztival && (HELYZETEK as readonly string[]).includes(helyzet) ? mintaSzoveg(nyelv, helyzet as Helyzet, true) : undefined);
    // R-18 6. kör (Kati F): `?poszt=<id>` — a mintakép a poszt szövegével (első sor = cím, második = sor), mint a szerkesztő előtöltése
    const posztId = new URL(keres.url).searchParams.get("poszt");
    const munka = posztId && /^[0-9a-f-]{36}$/i.test(posztId) ? await posztTar.betolt(e.szervezet.id, posztId).catch(() => null) : null;
    const tartalom = munka ? (() => { const { elso, masodik } = sorok(foSzoveg(munka)); return { ...(peldaTartalom ?? {}), ...(elso ? { cim: elso } : {}), ...(masodik ? { sor: masodik } : {}) }; })() : peldaTartalom;
    // R-16 K1 (12f „Így néz ki egy képed”): `?valtozat=vilagos|szines` kéri a világos és a színes képet; más érték vagy hiánya → a mentett változat
    const kert = new URL(keres.url).searchParams.get("valtozat");
    const v = kert === "vilagos" || kert === "szines" ? kert : valtozat;
    // c15: a szakma (p.kategoria) a „Kész munka” példafotójához; a típus a képgyártóé (fotós minta: JPEG, különben PNG)
    // c30 F11: a fesztivál a rendezvény-fotót kapja (p.fotoKategoria), a cég a szakmájáét — mint eddig
    const m = await helyzetMinta(helyzet, arculat, nyelv, tartalom, v /* VZ-3b: a legutóbb választott változat, ha ezen a képen megmarad */, p.fotoKategoria);
    return new Response(m.kep, { headers: { "content-type": m.tipus, "cache-control": "no-store" } });
  } catch (h) {
    return hibaValasz(h, "helyzet-minta");
  }
}

// POST — R-16 K2 (gepezet 9, TERV §2-K2): ugyanez a mintakép a még NEM jóváhagyott összeállítással („Így néz ki”).
// Törzs: MintaKeres (vizual/minta.ts). A törzs csak erre az egy képre írja felül az arculatot; a logó mindig a munkatér
// saját fájlja, a szöveg a munkatér példaszövege (peldakFrissen), mint a GET-nél. Semmit nem ment.
// R-16 K6: `nevlogo: { stilus }` → a logók helyén a gép most készített névlogója (a kép színeivel és cím-betűjével), nem tárolódik.
// 200 image/png (c15: a fotós „Kész munka” minta image/jpeg) · 400 ERVENYTELEN_ADAT · 404 NINCS_ILYEN · 409 NINCS_PISZKOZAT (névlogó profil nélkül) · 503 KEPGYAR_NEM_VALASZOL.
export async function POST(keres: Request, { params }: { params: Promise<{ helyzet: string }> }): Promise<Response> {
  const nemJo = (hiba: string, status: number, extra: Record<string, unknown> = {}) =>
    Response.json({ hiba, ...extra }, { status, headers: { "cache-control": "no-store" } });
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { helyzet } = await params;
    // üres törzs = {} (a munkatér mentett színei); hibás JSON = 400
    const szoveg = await keres.text().catch(() => "");
    let nyers: unknown = {};
    try {
      if (szoveg.trim()) nyers = JSON.parse(szoveg);
    } catch {
      return nemJo("ERVENYTELEN_ADAT", 400, { reszlet: ["json"] });
    }
    const k = MintaKeres.safeParse(nyers);
    if (!k.success) return nemJo("ERVENYTELEN_ADAT", 400, { reszlet: k.error.issues.map((i) => i.path.join(".") + ": " + i.message) });
    // R-16 K5: a kért saját betűk bájtja a munkatér SAJÁT betű-fájljaiból (a törzsből bájt nem jön — a zod el is dobná)
    const [{ arculat, nyelv }, p, sajat] = await Promise.all([
      kepArculat(e.szervezet.id, e.szervezet.nev),
      peldakFrissen(e.szervezet.id),
      k.data.betuk ? sajatBetukAdat(e.szervezet.id, [k.data.betuk.cim, k.data.betuk.szoveg]) : Promise.resolve([]),
    ]);
    const tartalom = p.peldak?.[helyzet as Helyzet] ?? (arculat.fesztival && (HELYZETEK as readonly string[]).includes(helyzet) ? mintaSzoveg(nyelv, helyzet as Helyzet, true) : undefined);
    const alapKep = mintaArculat(arculat, k.data, sajat);
    // R-16 K6 (TERV §2-K6): `nevlogo: { stilus }` → a jelölt névlogó a kép (és a kérés) színeivel és cím-betűjével, a logók helyén
    let nevlogo: ReturnType<typeof nevlogoKepLogok> | undefined;
    if (k.data.nevlogo) {
      const profil = await profilTar.betolt(e.szervezet.id);
      if (!profil) return nemJo("NINCS_PISZKOZAT", 409);
      const szinek = alapKep.fo && alapKep.hatter ? { fo: alapKep.fo, hatter: alapKep.hatter, masodik: alapKep.masodik ?? alapKep.fo } : undefined;
      const be = await nevlogoBemenet(e.szervezet.id, e.szervezet.nev, k.data.nevlogo.stilus, profil, { ...(szinek ? { szinek } : {}), ...(alapKep.betu_cim ? { betu: alapKep.betu_cim } : {}) });
      nevlogo = nevlogoKepLogok(await kepgyarNevlogo(be));
    }
    const m = await helyzetMinta(helyzet, nevlogo ? mintaArculat(arculat, k.data, sajat, nevlogo) : alapKep, nyelv, tartalom, k.data.valtozat ?? "vilagos", p.fotoKategoria);
    return new Response(m.kep, { headers: { "content-type": m.tipus, "cache-control": "no-store" } });
  } catch (h) {
    // a terv 503-at ír a képgyártó kiesésére (a GET a régi 502-t adja — azt nem változtatjuk)
    if (h instanceof KepgyarHiba && h.kod === "KEPGYAR_NEM_VALASZOL") return nemJo("KEPGYAR_NEM_VALASZOL", 503);
    if (h instanceof NevlogoHiba) return nemJo("KEPGYAR_NEM_VALASZOL", 503);
    return hibaValasz(h, "helyzet-minta POST");
  }
}
