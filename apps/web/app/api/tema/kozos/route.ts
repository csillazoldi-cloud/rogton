import { eredmenyValasz, hiba, kapu, rendszergazda, valasz } from "../_kozos";
import { kozosAllapot, kozosTervezetElvet, kozosTervezetMent } from "../../../../tema";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    const tema = await kozosAllapot();
    return valasz({ tema });
  } catch (h) {
    console.error("Tema kozos GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    const be = await keres.json().catch(() => null);
    return eredmenyValasz(await kozosTervezetMent(be));
  } catch (h) {
    console.error("Tema kozos PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function DELETE(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    return eredmenyValasz(await kozosTervezetElvet());
  } catch (h) {
    console.error("Tema kozos DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
