import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// VZ-1 (Csilla 2026-10-06 18:15: a „Közlemények” név túl hivatalos → „Szöveges képek”): a lap új címe /kepek/szoveges-kepek. A rövid ideig
// létezett /kepek/kozlemenyek cím (könyvjelzők, régi linkek) ide visz tovább, a posztból nyitás azonosítójával együtt.
export default async function KozlemenyekRegiOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = (await searchParams)["poszt"];
  redirect(typeof p === "string" && p ? `/kepek/szoveges-kepek?poszt=${encodeURIComponent(p)}` : "/kepek/szoveges-kepek");
}
