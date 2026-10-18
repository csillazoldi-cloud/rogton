import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// R-8: az első beállítás egy lapon — a régi lépés-útvonal ide irányít.
export default function OnboardingKettoRedirect() {
  redirect("/onboarding");
}
