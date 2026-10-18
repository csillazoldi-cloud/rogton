import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { elsoNyelvMod, kategoriaOf, tipusOf } from "../../../profil/tipus-szabaly";
import { olvasasAllapot, programLista } from "../../../program";
import { oldalcim } from "../../../nyelv/oldalcim";
import { Beallitas } from "./Beallitas";
import "../../_kozos/fiok.css";
import "../elso-beallitas.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("onb.elso_beallitas");

// R-18 7. kör (Csilla 10-12, rajz: Claude Design „Round 7 · A sötét / B világos”, IRANYOK-round7.md): az első beállítás új lépései a
// profil jóváhagyása után — kínálat (a honlapról), étlap / szolgáltatás-lista, árak a posztokban, az oldal + képernyőképek, tématerv.
// A jóváhagyott profilra épül (oda ment), ezért profil nélkül vissza az első beállításra; a néző nem állít be semmit.
export default async function BeallitasOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  if (fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep === "nezo") redirect("/fiok");
  const p = await profilBetolt(szervezet.id);
  if (!p) redirect("/onboarding");
  const tipus = tipusOf(p);
  const program = tipus === "fesztival" ? await programLista(szervezet.id).catch(() => []) : [];
  return (
    <Beallitas
      kezdo={{
        kinalat: p.kinalat ?? [],
        arak: p.arak_posztban ?? null,
        kozossegi: p.kozossegi_oldal ?? "",
        temak: p.tema_terv ?? [],
        vendeglato: kategoriaOf(p) === "vendeglatas", // c30 F1: the category decides the list title (regex fallback = as before)
        nyelvek: p.nyelvek, // c30 F3: 2+ nyelv → a „Hogyan posztoljunk két nyelven?” lépés (D5)
        nyelvMod: elsoNyelvMod(p),
        // c30 F6: fesztiválnál a rendezvény (a mentett, különben a gép javaslata a jóváhagyáskor) és a már beolvasott program
        tipus,
        rendezveny: p.rendezveny ?? p.rendezveny_javaslat ?? {},
        program,
        programForras: p.program_forras?.fajta ?? null,
        // c30 F6b: egy még futó háttér-olvasás (újratöltés közben) — a lap a munka-állapotot mutatja és megvárja
        programFut: tipus === "fesztival" && olvasasAllapot(p.program_olvasas)?.allapot === "fut" ? p.program_olvasas?.fajta ?? "word" : null,
      }}
    />
  );
}
