import "server-only";
// R-13 (design/R13/rajz/R13-lapok.dc.html 13a, gepezet.md 13a): a Saját fiók „Ilyen hírekből írunk neked posztot” szakaszának adata —
// a saját fokozat + előszűrés (GET /api/hirfigyelo/sajat-szures) és a munkatér mai beállításának helye és témái (GET /api/hirfigyelo/beallitas,
// csak olvasás). Külön fájl: a `./index` és a `./tag-szures` is ide jön, a körkörös import nélkül.
import { aktivVerzio, type SzuresFokozat } from "@rogton/news-monitor-core";
import { postgresTar } from "./tar";
import { tagSzures } from "./tag-szures";

export type SajatSzuresNezet = {
  fokozat: SzuresFokozat;
  eloszures: boolean;
  /** a beállítás földrajzi fókusza (üres = nincs megadva) */
  hely: string;
  /** a beállítás témáinak neve, sorrendben (üres = még nincs beállítás) */
  temak: string[];
};

export async function sajatSzuresNezet(szervezetId: string, fiokId: string): Promise<SajatSzuresNezet> {
  const sz = await tagSzures(szervezetId, fiokId);
  const verziok = await postgresTar().verziok(szervezetId).catch(() => []);
  const b = aktivVerzio(verziok)?.beallitas ?? null;
  return {
    fokozat: sz.fokozat,
    eloszures: sz.eloszures,
    hely: b?.foldrajzi_fokusz.trim() ?? "",
    temak: b ? b.temak.map((t) => t.nev.trim()).filter((n) => n.length > 0) : [],
  };
}
