import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { ARCULAT_ALAP } from "@rogton/profile-core";
import { sotetitve } from "@rogton/arculat-core";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { profilTar } from "../../../../profil/tar";
import { arculatAllapot } from "../../../../arculat/allapot";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { FelsoSav } from "../../../_kozos/FelsoSav";
import { LogokFeltoltes } from "./LogokFeltoltes";
import "../../../_kozos/felsosav.css";
import "../../../_kozos/arculat-anyagok.css";
import "../arculat.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r16.arculat.logok.kerdes");

// R-16 K1 · 12f „Töltsd fel a logóidat” (design/R16-arculat/R16-arculat.dc.html 12f; TERV 2-K1). SÖTÉT lap: nincs rá link a
// fiókoldalon és a menüben, csak a címmel érhető el (TERV 4. döntés 2.), amíg a K7 át nem kapcsolja a 12. lapot.
// A profilt a `profil/tar`-ból olvassuk, NEM a `profil` bejáratából (TERV 3.: az a vizual-körbe húzna).
// R-16 utókérés 2 (UTOKERES-2.md, gepezet-3 4): telefonon, ha még egy logó sincs és nem a 12a „Van saját logóm” linkjéről jön (`?van=1`),
// előbb a „Van már logód?” kérdés (12f0) — a négy hely a válasz után. A logók megléte a kiszolgálón dől el (nincs villanás); asztal változatlan.
/** R-17 A2: a profilkép-minta alcíme — az összefoglaló első mondatának eleje, legfeljebb 48 karakter, szóhatáron vágva. */
function rovidAlcim(osszefoglalo: string): string {
  const elso = osszefoglalo.trim().split(/(?<=[.!?])\s/)[0] ?? "";
  if (elso.length <= 48) return elso.replace(/[.!?]$/, "");
  const vag = elso.slice(0, 48);
  return `${vag.slice(0, Math.max(vag.lastIndexOf(" "), 20)).replace(/[,;:]$/, "")}…`;
}

export default async function ArculatLogokOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const van = (await searchParams)["van"] === "1";
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // A feltöltés szerkesztői művelet (a POST kapuja „szerkeszto”) — a néző a szakaszt látja (csak olvasható sorok), nem egy gomb nélküli lapot.
  // R-16 K7: a szakaszra (12c), mint a 12d/12d2/12e/12g — a /fiok-on már csak a belépő sor van.
  if (szerep === "nezo") redirect("/fiok/arculat");
  const [profil, sav, szakasz] = await Promise.all([profilTar.betolt(szervezet.id).catch(() => null), felsoSav(fiok, szervezet, szerep), arculatAllapot(szervezet.id, szerep).catch(() => null)]);
  // A helyek próbahátterei a munkatér színeiből (a képek ugyanígy: jóváhagyott pillanatkép, különben a tervezet, különben a semleges alap):
  // világos = a háttérszín, sötét = a sötétített fő szín, négyzetes = a háttérszín; az egyszínű fehéren áll (arculat.css).
  const a = profil?.arculat;
  const jov = a?.jovahagyott_verzio ? a.verziok[String(a.jovahagyott_verzio)] : undefined;
  const forras = jov ?? (a?.tervezet?.elsodleges ? a.tervezet : undefined);
  const hatter = forras?.hatter ?? ARCULAT_ALAP.hatter;
  const fo = forras?.elsodleges ?? ARCULAT_ALAP.elsodleges;
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <LogokFeltoltes hatterek={{ vilagos: hatter, sotet: sotetitve(fo) ?? fo, negyzetes: hatter }} jovahagyott={a?.allapot === "jovahagyott"} kerdes={!van && szakasz !== null && !szakasz.vanLogo} valasztoNyit={van} kezdobetu={Array.from(szervezet.nev.trim())[0]?.toLocaleUpperCase("hu") ?? ""} cegNev={profil?.nev ?? szervezet.nev} cegAlcim={rovidAlcim(profil?.osszefoglalo ?? "")} />
    </>
  );
}
