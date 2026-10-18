import { ProgramTetelMezok } from "@rogton/contracts";
import { kapu } from "../../_kapu";
import { programTetelModosit, programTetelTorol, programTetelUj } from "../../../../program";
import { hibaValasz, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

// c30 F5 — egy programtétel (szerkesztő):
//   POST {nev, …}      új saját tétel (forras = sajat; az újraolvasás nem nyúl hozzá)
//   PUT  {id, …mezők}  átírás (a pipa levétele is: {id, aktiv: false}) → a sor `modositva` lesz
//   DELETE {id}        puha törlés (a sor megmarad; a km_app-nak DELETE joga sincs)
const ID = /^[0-9a-f-]{36}$/i;

export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const m = ProgramTetelMezok.safeParse(await keres.json().catch(() => null));
    if (!m.success || !m.data.nev) return valasz({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const d = m.data;
    const t = await programTetelUj(e.szervezet.id, {
      nap: d.nap ?? null, kezdes: d.kezdes ?? null, vege: d.kezdes ? d.vege ?? null : null, nev: d.nev!, leiras: d.leiras ?? {}, helyszin: d.helyszin ?? {},
      fellepo: d.fellepo ?? "", fajta: d.fajta ?? "egyeb", jegy: d.jegy ?? "", bizonytalan: d.bizonytalan ?? false, aktiv: d.aktiv ?? true,
    });
    return valasz({ tetel: t }, 201);
  } catch (h) {
    return hibaValasz(h, "új tétel");
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = (await keres.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof be?.["id"] === "string" && ID.test(be["id"]) ? be["id"] : "";
    const { id: _, ...mezok } = be ?? {};
    const m = ProgramTetelMezok.safeParse(mezok);
    if (!id || !m.success || Object.keys(m.data).length === 0) return valasz({ hiba: "ERVENYTELEN_ADAT" }, 400);
    return valasz({ tetel: await programTetelModosit(e.szervezet.id, id, m.data) });
  } catch (h) {
    return hibaValasz(h, "átírás");
  }
}

export async function DELETE(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = (await keres.json().catch(() => null)) as { id?: unknown } | null;
    const id = typeof be?.id === "string" && ID.test(be.id) ? be.id : "";
    if (!id) return valasz({ hiba: "ERVENYTELEN_ADAT" }, 400);
    await programTetelTorol(e.szervezet.id, id);
    return valasz({ ok: true });
  } catch (h) {
    return hibaValasz(h, "törlés");
  }
}
