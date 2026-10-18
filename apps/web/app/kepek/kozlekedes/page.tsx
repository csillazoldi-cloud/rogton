import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// VZ-1 (kerdesek 1, Csilla 2026-10-06; a név 18:15-kor „Szöveges képek” lett): a régi „Közlekedési közlemények” lap (VZ-1a) helye /kepek/szoveges-kepek — a régi cím
// (könyvjelzők, régi linkek) ide visz tovább, a posztból nyitás azonosítójával együtt.
export default async function KozlekedesOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = (await searchParams)["poszt"];
  redirect(typeof p === "string" && p ? `/kepek/szoveges-kepek?poszt=${encodeURIComponent(p)}` : "/kepek/szoveges-kepek");
}
