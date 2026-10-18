// Jogosultság: feltöltés szerkesztő/tulajdonos; olvasás/lista bármely tag. Tiszta.
import { type FajlHibaKod, type HostKontextus } from "./host";

export function dont(
  ktx: HostKontextus,
  muvelet: "feltolt" | "olvas",
): { szabad: true } | { szabad: false; indok: FajlHibaKod } {
  if (muvelet === "olvas") {
    return { szabad: true };
  }
  if (ktx.szerep === "tulajdonos" || ktx.szerep === "szerkeszto") {
    return { szabad: true };
  }
  return { szabad: false, indok: "NINCS_JOG" };
}
