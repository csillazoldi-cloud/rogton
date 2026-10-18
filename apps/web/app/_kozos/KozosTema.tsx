import { cssValtozok } from "@km/design-system";
import { hatasosTema } from "../../tema";

// 2026-09-21 (Vilmos, D3): a nyilvános lapok (nyitólap, belépés, regisztráció, jelszó, adatkezelés,
// meghívó) MINDIG a közös alapot mutatják, akárki nézi. A lap feje (layout.tsx) a belépett néző
// munkaterének tokenjeit adja; ez a blokk utána jön, ezért a :root értékeit a közös alapra írja vissza.
export async function KozosTema() {
  return <style id="km-tokenek-kozos">{cssValtozok(await hatasosTema(null))}</style>;
}
