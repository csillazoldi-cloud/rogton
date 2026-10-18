import { eredmenyValasz, hiba, kapu, rendszergazda } from "../../_kozos";
import { kozosSemaValt } from "../../../../../tema";

export const dynamic = "force-dynamic";

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    const torzs = await keres.json().catch(() => null);
    return eredmenyValasz(await kozosSemaValt(torzs));
  } catch (h) {
    console.error("Tema kozos sema PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
