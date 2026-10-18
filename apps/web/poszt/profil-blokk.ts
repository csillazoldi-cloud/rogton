import { szervezetTipus, type ProgramTetel, type Rendezveny, type SzervezetProfil } from "@km/contracts";
import { programNevek, szeletTetelei, programSzelet, programHorgony } from "../program/blokk";
import { nevekSorok } from "./nevek";
import { kinalatSorok, temaTervSorok } from "./tipus";

// 2026-09-21 (Vilmos): a Posztszöveg eddig NEM kapta meg a cég profilját — a hangnem, a minta és a
// célközönség nem jutott el az AI-hoz, pedig a prompt ezekre hivatkozott. Ez a blokk viszi át.
// Tiszta függvény (adatbázis nélkül próbálható): probak/poszt-profil.proba.ts.

type ProfilResz = Pick<
  SzervezetProfil,
  "nev" | "osszefoglalo" | "celkozonseg" | "cel" | "hangnem_leiras" | "hangnem_minta"
> & Partial<Pick<SzervezetProfil, "hivatalos_nevek" | "kinalat" | "arak_posztban" | "tema_terv" | "poszt_szokasok" | "szervezet_tipus">>;

/** A cég profiljából az AI-bemenet sorai. Üres mező nem kerül bele; profil nélkül üres lista. */
export function profilSorok(profil: ProfilResz | null | undefined): string[] {
  if (!profil) return [];
  const sorok: string[] = [];
  const tesz = (cimke: string, ertek: string | undefined) => {
    const t = (ertek ?? "").trim();
    if (t) sorok.push(`${cimke}:\n${t}`);
  };
  // c30 F12: fesztiválnál a blokk „a fesztivál”-ról szól (a cég sorai bájtra ugyanazok)
  const fesz = szervezetTipus(profil.szervezet_tipus) === "fesztival";
  const ki = fesz ? "A fesztivál" : "A cég", ki2 = fesz ? "a fesztivál" : "a cég";
  tesz(`${ki} neve`, profil.nev);
  tesz("Mivel foglalkozik", profil.osszefoglalo);
  tesz("Kiknek szól", profil.celkozonseg);
  tesz("Mit szeretne elérni", profil.cel);
  tesz(`HOGYAN ÍRJUNK — ${ki2} saját írási szabályai (ezeket kövesd)`, profil.hangnem_leiras);
  tesz("Minta mondat — így szóljon egy poszt", profil.hangnem_minta);
  // R-18 7. kör: a cég eddigi posztjainak szokásai (a képernyőképekből kiolvasva)
  tesz(`${ki} eddigi posztjai így szólnak (hossz, emoji, hashtag — ehhez igazodj)`, profil.poszt_szokasok);
  // R-18 6. kör (Kati D): a hivatalos nevek a profil része — így minden írás és fordítás (szöveg és kép) kötelezően megkapja
  const nevek = nevekSorok(profil.hivatalos_nevek);
  // R-18 7. kör: a kínálat (ár csak „Igen”-nél) és a tématerv — minden poszt-prompt kontextusa, mint a profil
  const tobbi = [...nevek, ...kinalatSorok(profil.kinalat, profil.arak_posztban), ...temaTervSorok(profil.tema_terv)];
  if (sorok.length === 0) return tobbi;
  return [fesz ? "=== A FESZTIVÁL PROFILJA ===" : "=== A CÉG PROFILJA ===", ...sorok, "=== A PROFIL VÉGE ===", ...tobbi];
}

/** c30 F7 (terv §3): egy fesztivál posztjához a rendezvény és a program SZELETE — soha nem az egész program. */
export type ProgramResz = { tetelek: readonly ProgramTetel[]; rendezveny?: Rendezveny | undefined; azonosito: string; kivalto: string; nyelv: string };

/** A rendezvény sorai a poszt-prompthoz: időpont, hely, a horgonyzott szelet (≤ 25 sor), és a szelet tételeinek névpárjai.
 *  Szelet nélkül egy tiltó sor: konkrét időpontot vagy fellépőt a gép nem írhat (a tényőr is ezt kéri számon). */
export function programSorok(p: ProgramResz | null | undefined): string[] {
  if (!p) return [];
  const r = p.rendezveny ?? {};
  const hely = r.hely?.[p.nyelv as keyof NonNullable<Rendezveny["hely"]>] || r.hely?.hu || Object.values(r.hely ?? {}).find(Boolean) || "";
  const horgony = programHorgony(p.azonosito, p.kivalto, p.tetelek);
  const szelet = programSzelet(p.tetelek, horgony, p.nyelv);
  const sorok = ["=== A RENDEZVÉNY ==="];
  if (r.mettol || r.meddig) sorok.push(`Időpont: ${[r.mettol, r.meddig].filter(Boolean).join(" – ")}`);
  if (hely) sorok.push(`Helyszín: ${hely}`);
  if (szelet.length) sorok.push("A program ehhez a poszthoz — időpontot, fellépőt és helyszínt CSAK ebből írj, ami itt nincs, azt ne állítsd:", ...szelet.map((x) => `- ${x}`));
  else sorok.push("Ehhez a poszthoz nincs kiválasztott programtétel: konkrét időpontot, fellépőt vagy helyszínt a programból ne írj.");
  sorok.push("=== A RENDEZVÉNY VÉGE ===");
  return [...sorok, ...nevekSorok(programNevek(szeletTetelei(p.tetelek, horgony)))];
}
