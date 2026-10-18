import { eredmenyValasz, hiba, kapu, rendszergazda } from "../../_kozos";
import { kozosVisszaallit } from "../../../../../tema";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    const be = await keres.json().catch(() => null);
    return eredmenyValasz(await kozosVisszaallit(be));
  } catch (h) {
    console.error("Tema kozos visszaallit POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
