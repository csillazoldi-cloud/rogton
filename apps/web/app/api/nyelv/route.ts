import { Nyelv, NYELV_SUTI } from "@km/design-system";
import { fiokNyelvMent } from "../../../hitelesites";
import { kapu } from "../_kapu";

export const dynamic = "force-dynamic";

// POST { nyelv: "hu" | "ro" | "en" } → a nyelv-süti (1 év, a kliens is olvashatja). Hibás érték: 400.
// E-29c: ha van belépett fiók, a választást a FIÓKRA is elmentjük — a háttérben futó hírfigyelés
// (ahol nincs süti) ebből tudja, milyen nyelven írja az AI az összefoglalót és az indoklást.
export async function POST(keres: Request): Promise<Response> {
  let nyelv: Nyelv;
  try {
    const test: unknown = await keres.json();
    nyelv = Nyelv.parse(typeof test === "object" && test !== null && "nyelv" in test ? test.nyelv : undefined);
  } catch {
    return Response.json({ hiba: "ERVENYTELEN_ADAT" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  try {
    // B-01: a nyelvváltás SZÁNDÉKOSAN nyilvános — a belépőlapon is kell tudni nyelvet váltani.
    // A kapu itt nem tilt; ha van belépett fiók, azt megadja, és a választást a fiókra is mentjük.
    const { fiok } = await kapu(keres, "nyilvanos");
    if (fiok) await fiokNyelvMent(fiok.id, nyelv);
  } catch (h) {
    // A nyelvváltás a sütivel akkor is működjön, ha a mentés nem sikerül — a felület ne akadjon meg.
    console.error("Nyelv mentése a fiókra sikertelen:", h);
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const valasz = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  valasz.headers.append("set-cookie", `${NYELV_SUTI}=${nyelv}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`);
  return valasz;
}
