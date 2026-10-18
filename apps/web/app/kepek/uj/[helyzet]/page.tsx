import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { HELYZETEK, KERDESEK, kepArculat, mintaSzoveg, kepValtozat, type Helyzet } from "../../../../vizual/helyzet";
import { Kitolto } from "../../Kitolto";
import { peldakFrissen } from "../../../../vizual/peldak";
import { posztTar } from "../../../../poszt/tar";
import { foSzoveg, rovidNev, sorok } from "../../../../r15/szamol";
import { profilTar } from "../../../../profil/tar";
import { masodikNyelv, nyelvMod } from "@rogton/profile-core";
import { programTar } from "../../../../program/tar";
import { programHorgony, szeletTetelei } from "../../../../program/blokk";
import { idoszakCimke } from "../../../_kozos/c30-program-szabaly";
import "../../../_kozos/felsosav.css";
import "../../kepek.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vz.cim");

// VZ-2b — Kitöltő (design/vz2/rajz/VZ2b-kitolto.dc.html).
export default async function KitoltoOldal({ params, searchParams }: { params: Promise<{ helyzet: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { helyzet } = await params;
  if (!(HELYZETEK as readonly string[]).includes(helyzet)) notFound();
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, a, p, valtozat, profil] = await Promise.all([felsoSav(fiok, szervezet, szerep), kepArculat(szervezet.id, szervezet.nev), peldakFrissen(szervezet.id), kepValtozat(szervezet.id), profilTar.betolt(szervezet.id).catch(() => null)]);
  const h = helyzet as Helyzet;
  // a gép szövege a cég szakmájából (vizual/peldak.ts); amíg nincs, az általános minta
  const alap = p.peldak?.[h] ?? mintaSzoveg(a.nyelv, h, a.arculat.fesztival); // c30 F12: a fesztivál a saját mintaszövegét kapja
  // R-15 08c 4 (gepezet 20): a posztból nyitva a kép a poszt első sorával előre kitöltve, és a lap tudja, melyik poszthoz készül
  const posztId = (await searchParams)["poszt"];
  const munka = typeof posztId === "string" && posztId ? await posztTar.betolt(szervezet.id, posztId).catch(() => null) : null;
  // R-18 8. kör (Kati 10-13): „Kép szerkesztése” (?szerk=1) — a poszthoz tett kép beállításaival (ugyanaz a minta), nem a poszt szövegéből
  const b = (await searchParams)["szerk"] === "1" && munka?.forras.kep_beallitas?.helyzet === h ? munka.forras.kep_beallitas : null;
  const kezdo0: Record<string, string> = b ? { ...alap, ...b.ertek } : munka ? (() => { const { elso, masodik } = sorok(foSzoveg(munka)); return { ...alap, ...(elso ? { cim: elso } : {}), ...(masodik ? { sor: masodik } : {}) }; })() : alap;
  // c30 F8 (terv §4): a fesztivál horgonyzott posztjából nyitott ESEMÉNY-kép a horgony tételéből töltődik (mi · hol · mikor); egy napra
  // horgonyzott posztnál a nap és a rendezvény helye. A program első nyelvén; ami nincs, az marad, ami volt. Mentett kép (?szerk=1) erősebb.
  const kezdo: Record<string, string> = !b && munka && h === "esemeny" && munka.forras.azonosito.startsWith("program:") ? await (async () => {
    const ny = profil?.nyelvek?.[0] ?? a.nyelv;
    const tetelek = await programTar.lista(szervezet.id).catch(() => []);
    const hg = programHorgony(munka.forras.azonosito, "", tetelek);
    const [t] = hg.id ? szeletTetelei(tetelek, hg) : [];
    const ertek = (x: Partial<Record<string, string>>) => x[ny] || Object.values(x).find(Boolean) || "";
    const r = profil?.rendezveny ?? profil?.rendezveny_javaslat;
    if (t) return { ...kezdo0, ...(ertek(t.nev) ? { cim: ertek(t.nev) } : {}), ...(ertek(t.helyszin) ? { hol: ertek(t.helyszin) } : {}), ...(t.nap ? { mikor: `${idoszakCimke(t.nap, t.nap, ny)}${t.kezdes ? `, ${t.kezdes}` : ""}` } : {}) };
    if (hg.nap) return { ...kezdo0, mikor: idoszakCimke(hg.nap, hg.nap, ny), ...(r?.hely && ertek(r.hely) ? { hol: ertek(r.hely) } : {}) };
    return kezdo0;
  })() : kezdo0;
  // c30 F4 (terv §5 „Images”): a kép második nyelve a szervezet második nyelve (nincs = nincs kapcsoló). A mentett beállítás nyelve erősebb:
  // a régi mentés (`ro`) románul nyílik újra, a mostani (`masik`) a saját nyelvén — ugyanúgy, ahogy elmentették.
  const mentett = b?.masik ?? (b?.ro ? { nyelv: "ro" as const, ertek: b.ro } : null);
  const masik = mentett?.nyelv ?? masodikNyelv(profil);
  // (ha egy régi román mentés román első nyelvű szervezetnél nyílik, az első nézet a régi „Magyar” marad — pontosan, ahogy volt)
  const elsoProfil = profil?.nyelvek?.[0] ?? a.nyelv;
  const elso = elsoProfil === masik ? (masik === "hu" ? "ro" : "hu") : elsoProfil;
  return <Kitolto sav={sav} helyzet={h} kerdesek={KERDESEK[h]} kezdo={kezdo} kezdoValtozat={b?.valtozat || valtozat} {...(b?.meret ? { kezdoMeret: b.meret } : {})}
    elsoNyelv={elso} masikNyelv={masik} egyben={nyelvMod(profil) === "egyben" && !b} {...(mentett ? { kezdoMasik: mentett.ertek } : {})}
    {...(munka ? { poszt: { id: munka.id, nev: rovidNev(munka) } } : {})} />;
}
