import { eredmenyValasz, hiba, kapu, rendszergazda } from "../../_kozos";
import { kozosAlkalmaz } from "../../../../../tema";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    return eredmenyValasz(await kozosAlkalmaz());
  } catch (h) {
    console.error("Tema kozos alkalmaz POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
