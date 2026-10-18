// Az illesztési létra: ha a szöveg nem fér ki, a lap lépésenként enged —
// lépcsőzetes kisebbítés → keskeny változat → rövid változat → kiköltöztetés a képaláírásba → figyelmeztetés.
// Soha: vágás, átfedés, a fiók minimuma alá kisebbítés. Minden döntés mérésen alapul (host.ts: Mero).
import type { Marka } from "./marka.ts";
import type { Recept, ReceptMezo } from "./recept.ts";
import { maxSor, kikoltoztetheto, mezoSorrend } from "./recept.ts";
import type { Tartalom } from "./tartalom.ts";
import type { LapMeres } from "./meres.ts";
import type { Mero } from "./host.ts";
import { osszeallit, uresValasztas, type Valasztas, type Osszeallitas, type OsszeallitasOpciok } from "./html.ts";

export interface IllesztesProblema {
  mezo: string;
  /** "sor": több sor, mint a recept engedi · "kilog": vízszintesen nem fér · "lap": a lap aljából kilóg */
  fajta: "sor" | "kilog" | "lap";
  reszlet: string;
}

export interface IllesztesLepes {
  fajta: "lepcso" | "keskeny" | "rovid" | "kepalairas";
  /** a mező (táblázatsornál „mezo/sor”) */
  mezo: string;
  /** lépcsőnél a fok sorszáma (0 = a legnagyobb) */
  fok?: number;
}

export interface IllesztesEredmeny {
  valasztas: Valasztas;
  osszeallitas: Osszeallitas;
  meres: LapMeres;
  /** a megtett lépések, emberi mondatban, sorrendben (naplóhoz) */
  lepesek: string[];
  /** ugyanezek adatként — a felület ebből ír feliratot */
  lepesAdat: IllesztesLepes[];
  /** ami a létra végén is megmaradt (üres = minden elfér) */
  problemak: IllesztesProblema[];
}

/** A mérés problémái a recept korlátai szerint. */
export function problemak(recept: Recept, m: LapMeres): IllesztesProblema[] {
  const ki: IllesztesProblema[] = [];
  for (const mezo of recept.mezok) {
    const max = maxSor(mezo);
    for (const e of m.elemek.filter((x) => x.mezo === mezo.azonosito)) {
      if (max != null && (e.nyelv === "elsodleges" || e.nyelv === "masodlagos") && e.sorok > max)
        ki.push({ mezo: mezo.azonosito, fajta: "sor", reszlet: `${e.nyelv}: ${e.sorok} sor > ${max}` });
      if (e.kilog) ki.push({ mezo: mezo.azonosito, fajta: "kilog", reszlet: `${e.nyelv}: nem fér ki egy sorban` });
    }
  }
  if (m.tullepes_px > 0) ki.push({ mezo: "-", fajta: "lap", reszlet: `${m.tullepes_px} px-szel kilóg a lap aljából` });
  return ki;
}

/** Azok a mezők, amelyek stílusa lépcsős méretet használ (pl. a főcím), a lépcső hosszával. */
function lepcsosMezok(marka: Marka, recept: Recept): { mezo: string; fokok: number }[] {
  const elr = marka.elrendezesek[recept.recept.azonosito];
  if (!elr) return [];
  const ki: { mezo: string; fokok: number }[] = [];
  for (const m of recept.mezok) {
    const st = elr.mezok[m.azonosito]?.stilus;
    const s = st ? marka.stilusok[st] : undefined;
    if (s && typeof s.meret === "string") ki.push({ mezo: m.azonosito, fokok: marka.lepcsok[s.meret]?.length ?? 1 });
  }
  return ki;
}

const igaz = (k: unknown) =>
  k === true || (typeof k === "object" && k !== null && (k as Record<string, unknown>)["ertek"] === true);

/** Keskenyíthető-e a mező (táblázatnál: van-e keskenyíthető sora). */
function keskenyitheto(m: ReceptMezo): boolean {
  if (igaz(m.illesztes?.keskenyites)) return true;
  const sorok = (m as { sorok?: { illesztes?: { keskenyites?: unknown } }[] }).sorok;
  return m.tipus === "tablazat" && (sorok ?? []).some((s) => igaz(s.illesztes?.keskenyites));
}

/** A kiköltöztethető egységek a képaláírásba, a recept sorrendjében visszafelé (táblázatnál soronként). */
function koltoztethetok(recept: Recept, tartalom: Tartalom): string[] {
  const ki: string[] = [];
  for (const m of mezoSorrend(recept)) {
    const sorok = (m as { sorok?: { azonosito: string; illesztes?: { kikoltoztetheto_kepalairasba?: unknown } }[] }).sorok;
    if (m.tipus === "tablazat" && Array.isArray(tartalom.mezok[m.azonosito])) {
      const kitoltott = (tartalom.mezok[m.azonosito] as { azonosito: string }[]).map((s) => s.azonosito);
      for (const s of sorok ?? []) {
        const k = s.illesztes?.kikoltoztetheto_kepalairasba;
        const mehet = k === true || (typeof k === "object" && k !== null && (k as Record<string, unknown>)["ertek"] === true) || kikoltoztetheto(m);
        if (mehet && kitoltott.includes(s.azonosito)) ki.push(`${m.azonosito}/${s.azonosito}`);
      }
    } else if (kikoltoztetheto(m) && tartalom.mezok[m.azonosito] !== undefined) ki.push(m.azonosito);
  }
  return ki.reverse();
}

/** Összeállít, mér, és a létrán lépked, amíg minden elfér — vagy elfogy a létra. */
export async function illeszt(
  marka: Marka,
  recept: Recept,
  tartalom: Tartalom,
  mero: Mero,
  opciok: OsszeallitasOpciok,
  korlat = 40,
): Promise<IllesztesEredmeny> {
  const v = uresValasztas();
  const lepesek: string[] = [];
  const lepesAdat: IllesztesLepes[] = [];
  const lepcsos = lepcsosMezok(marka, recept);
  const keskenyek = recept.mezok.filter(keskenyitheto).map((m) => m.azonosito);
  const rovidek = Object.keys(tartalom.rovid).filter((k) =>
    recept.mezok.some((m) => m.azonosito === k && m.illesztes?.rovid_valtozat_megadhato === true),
  );
  const koltozok = koltoztethetok(recept, tartalom);

  let o = osszeallit(marka, recept, tartalom, v, opciok);
  let m = await mero.mer(o.html);
  let p = problemak(recept, m);

  for (let kor = 0; kor < korlat && p.length > 0; kor++) {
    lepesek.push(`[mérés: ${p.map((x) => x.mezo + " " + x.reszlet).join("; ")}]`);
    const erintett = new Set(p.map((x) => x.mezo));
    const lapszintu = erintett.has("-");
    let lepett = false;

    // 1. lépcső: a problémás (vagy lap-túllépésnél minden) lépcsős mező egy fokkal kisebb; a pár együtt lép
    for (const l of lepcsos) {
      if (!(lapszintu || erintett.has(l.mezo))) continue;
      const i = v.lepcso[l.mezo] ?? 0;
      if (i < l.fokok - 1) {
        v.lepcso[l.mezo] = i + 1;
        lepesek.push(`${l.mezo}: egy lépcsővel kisebb (${i + 2}. fok)`);
        lepesAdat.push({ fajta: "lepcso", mezo: l.mezo, fok: i + 1 });
        lepett = true;
        break;
      }
    }
    // 2. keskeny változat a tájékoztató szövegeken
    if (!lepett && marka.betuk.tajekoztatas_keskeny) {
      // lap-túllépésnél csak a több soros tájékoztató blokk (táblázat) keskenyedik — egysoros mezőn a magasság nem változna
      const jelolt = keskenyek.find(
        (k) => !v.keskeny.includes(k) && (erintett.has(k) || (lapszintu && recept.mezok.find((x) => x.azonosito === k)?.tipus === "tablazat")),
      );
      if (jelolt) {
        v.keskeny.push(jelolt);
        lepesek.push(`${jelolt}: keskeny betűváltozat`);
        lepesAdat.push({ fajta: "keskeny", mezo: jelolt });
        lepett = true;
      }
    }
    // 3. rövid változat, ha a szerkesztő megadta
    if (!lepett) {
      const jelolt = rovidek.find((k) => !v.rovid.includes(k) && (lapszintu || erintett.has(k)));
      if (jelolt) {
        v.rovid.push(jelolt);
        delete v.lepcso[jelolt]; // a rövid változat az első lépcsőről indul újra
        v.keskeny = []; // és a korábbi keskenyítés is visszaáll — csak akkor jön újra, ha kell
        lepesek.push(`${jelolt}: a rövid változat áll`);
        lepesAdat.push({ fajta: "rovid", mezo: jelolt });
        lepett = true;
      }
    }
    // 4. kiköltöztetés a képaláírásba (csak lap-túllépésnél)
    if (!lepett && lapszintu) {
      const jelolt = koltozok.find((k) => !v.kikoltozott.includes(k));
      if (jelolt) {
        v.kikoltozott.push(jelolt);
        lepesek.push(`${jelolt}: a képaláírásba került`);
        lepesAdat.push({ fajta: "kepalairas", mezo: jelolt });
        lepett = true;
      }
    }
    if (!lepett) break; // 5. elfogyott a létra — a problémák figyelmeztetésként maradnak
    o = osszeallit(marka, recept, tartalom, v, opciok);
    m = await mero.mer(o.html);
    p = problemak(recept, m);
  }
  return { valasztas: v, osszeallitas: o, meres: m, lepesek, lepesAdat, problemak: p };
}

/** Egy mező állapota a szerkesztő kiférés-sávjához. */
export interface MezoOsszegzes {
  mezo: string;
  /** nyelvenként a mért sorok (kétsoros párnál külön; egysoros párnál a pár együtt) */
  sorok: { nyelv: string; sorok: number; sorkoz_px: number }[];
  max_sor: number | null;
  /** a lépcső választott foka (0 = a legnagyobb) és a fokok száma; null, ha a mező nem lépcsős */
  fok: number | null;
  fokok: number | null;
  /** zöld: semmit nem kellett tenni · sárga: a gép lépett · piros: nem fér ki */
  allapot: "zold" | "sarga" | "piros";
  lepesek: IllesztesLepes[];
  problemak: IllesztesProblema[];
}

/** Mezőnkénti összegzés. A lap aljáról kilógó tartalmat az első lépcsős mezőhöz (a főcímhez) kötjük. */
export function mezoOsszegzes(marka: Marka, recept: Recept, e: IllesztesEredmeny): MezoOsszegzes[] {
  const lepcsos = lepcsosMezok(marka, recept);
  const fomezo = lepcsos[0]?.mezo;
  return mezoSorrend(recept)
    .filter((m) => m.tipus !== "arculati_hely" && m.tipus !== "allapotjelzo")
    .map((m) => {
      const id = m.azonosito;
      const elemek = e.meres.elemek.filter((x) => x.mezo === id && x.szoveg);
      const l = lepcsos.find((x) => x.mezo === id);
      const lepesek = e.lepesAdat.filter((x) => x.mezo === id || x.mezo.startsWith(id + "/"));
      const problemak = e.problemak.filter((p) => p.mezo === id || (p.mezo === "-" && id === fomezo));
      return {
        mezo: id,
        sorok: elemek.map((x) => ({ nyelv: x.nyelv, sorok: x.sorok, sorkoz_px: x.sorkoz_px })),
        max_sor: maxSor(m),
        fok: l ? (e.valasztas.lepcso[id] ?? 0) : null,
        fokok: l ? l.fokok : null,
        allapot: problemak.length ? "piros" : lepesek.length ? "sarga" : "zold",
        lepesek,
        problemak,
      };
    });
}
