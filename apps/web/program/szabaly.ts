import { PROGRAM_FAJTAK, PROGRAM_MAX_TETEL, TARTALOMNYELVEK, type ProgramFajta, type ProgramNyelvi, type ProgramTetel } from "@rogton/contracts";

// c30 F5 (terv §1.4, §3 program_kiolvasas): a program tiszta szabályai — a gép válaszának takarítása, az újraolvasás terve, a kulcs.
// Semmit nem talál ki: ami a válaszban nincs, az üres marad; ami bizonytalan („10:00???????”), az `bizonytalan` jelet kap; a belső
// feljegyzés („A ZÁSZLÓ NAPJÁT IS MEG KELL CSINÁLNI”) sor marad (a munkatárs látja), de soha nem `aktiv` — róla nem lesz poszt.

/** Egy kitakarított tétel: minden, ami a táblába kerül, az azonosító és a gép-mezők (forras, modositva) nélkül. */
export type TisztaTetel = Omit<ProgramTetel, "id" | "forras" | "modositva" | "kep_fajl_id">;

const NYELVEK = new Set<string>(TARTALOMNYELVEK);
const HONAPOK: Record<string, number> = {
  január: 1, február: 2, március: 3, április: 4, május: 5, június: 6, július: 7, augusztus: 8, szeptember: 9, október: 10, november: 11, december: 12,
  ianuarie: 1, februarie: 2, martie: 3, aprilie: 4, mai: 5, iunie: 6, iulie: 7, septembrie: 9, octombrie: 10, noiembrie: 11, decembrie: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10,
  jan: 1, febr: 2, feb: 2, márc: 3, ápr: 4, máj: 5, jún: 6, júl: 7, aug: 8, szept: 9, sept: 9, okt: 10, oct: 10, nov: 11, dec: 12,
};
/** Hónapnév (HU/RO/EN, teljes vagy rövid, kis- vagy nagybetűs) → 1–12; ismeretlen → null. A c30 F6 dátum-kiolvasása is ezt használja. */
export function honapSzam(szo: string): number | null {
  return HONAPOK[szo.trim().toLowerCase().replace(/\.$/, "")] ?? null;
}

/** A gép szinonimái a zárt fajta-listára (ami nincs itt és nincs a listán: `egyeb` — a fajta csak javaslat). */
const FAJTA_SZINONIMA: Record<string, ProgramFajta> = {
  concert: "koncert", koncert: "koncert", zene: "koncert", muzica: "koncert", music: "koncert",
  teatru: "eloadas", szinhaz: "eloadas", theatre: "eloadas", theater: "eloadas", eloadas: "eloadas", spectacol: "eloadas", film: "eloadas",
  copii: "gyerek", gyerek: "gyerek", children: "gyerek", kids: "gyerek",
  joc: "jatek", jatek: "jatek", game: "jatek", atelier: "workshop", workshop: "workshop", muhely: "workshop",
  expozitie: "kiallitas", kiallitas: "kiallitas", exhibition: "kiallitas",
  gastro: "gasztro", gasztro: "gasztro", food: "gasztro", degustare: "gasztro", kostolo: "gasztro",
  targ: "vasar", vasar: "vasar", fair: "vasar", market: "vasar", ceremonie: "unnepseg", unnepseg: "unnepseg", ceremony: "unnepseg",
};
/** Belső feljegyzés: a szervezőnek szóló teendő, nem a közönségnek szóló programpont. */
const BELSO = /(\bmeg\s+kell\b|\bkell\s+(még|csinálni|megcsinálni|intézni)|ne\s+felejts|ellenőrizni\s+kell|\btrebuie\s+(făcut|facut|să|sa)\b|\bde\s+(făcut|facut|verificat)\b|\bnu\s+uita\b|\btodo\b|\btbd\b)/i;
const KERDOJELEK = /\?{2,}/;

const ekezetNelkul = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** &amp; és társai (a gép néha a forrás XML-alakját másolja), dupla szóköz, elejéről a díszítő emoji. */
export function szovegTisztit(s: unknown, max = 400): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" })[e] ?? _)
    .replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** c30 F6b (élő 10-17, 80/88): a gép néha más kulccsal adja a nyelvet — „HU”, „hu-HU”, „magyar”, „română” — ez ugyanaz a nyelv. */
const NYELV_KULCS: Record<string, string> = { magyar: "hu", maghiara: "hu", hungarian: "hu", roman: "ro", romana: "ro", romanian: "ro", angol: "en", english: "en", engleza: "en", nemet: "de", german: "de", deutsch: "de" };
function nyelvKulcs(k: string): string | null {
  const e = ekezetNelkul(k).trim();
  if (NYELVEK.has(e)) return e;
  if (/^[a-z]{2}[-_][a-z]{2}$/.test(e) && NYELVEK.has(e.slice(0, 2))) return e.slice(0, 2);
  return NYELV_KULCS[e] ?? null;
}

/** {"hu": "…", "ro": "…"} — csak tartalomnyelv-kulcs és nem üres szöveg marad. c30 F6b: a kulcs kis/nagybetűje és alakja („HU”,
 *  „hu-HU”, „magyar”) nem számít; ha a gép egyetlen SZÖVEGET ad (a név mindkét nyelven ugyanaz, pl. egy zenekar), az a program első
 *  nyelvén áll (`szovegNyelv`): a nevet a forrás így írta, csak a nyelvét nem mondta meg a gép (a „Mircea Rusu Band” mindkét soron ugyanaz). */
export function nyelviTisztit(be: unknown, szovegNyelv?: string): ProgramNyelvi {
  const ki: Record<string, string> = {};
  if (be && typeof be === "object" && !Array.isArray(be)) {
    for (const [k, v] of Object.entries(be as Record<string, unknown>)) {
      const t = szovegTisztit(v);
      const ny = nyelvKulcs(k);
      if (ny && t && !ki[ny]) ki[ny] = t;
    }
  } else if (typeof be === "string" && szovegNyelv && NYELVEK.has(szovegNyelv)) {
    const t = szovegTisztit(be);
    if (t) ki[szovegNyelv] = t;
  }
  return ki as ProgramNyelvi;
}

/** Idő a gép válaszából: „20:00”, „9.30”, „18:00–20:30”, „11:00 -14:00”, „10:00???????” → {kezdes, vege, bizonytalan}. */
export function idoOlvas(kezdesBe: unknown, vegeBe?: unknown): { kezdes: string | null; vege: string | null; bizonytalan: boolean } {
  const ora = (h: string, m: string) => (Number(h) <= 23 && Number(m) <= 59 ? `${h.padStart(2, "0")}:${m}` : null);
  const s = typeof kezdesBe === "string" ? kezdesBe : "";
  const bizonytalan = KERDOJELEK.test(s) || (typeof vegeBe === "string" && KERDOJELEK.test(vegeBe));
  const m = s.match(/(\d{1,2})[:.](\d{2})(?:\s*[-–—]\s*(\d{1,2})[:.](\d{2}))?/);
  const kezdes = m ? ora(m[1]!, m[2]!) : null;
  let vege = m?.[3] ? ora(m[3], m[4]!) : null;
  if (!vege && typeof vegeBe === "string") {
    const v = vegeBe.match(/(\d{1,2})[:.](\d{2})/);
    vege = v ? ora(v[1]!, v[2]!) : null;
  }
  return { kezdes, vege: kezdes ? vege : null, bizonytalan };
}

/** Nap: „2026-06-27”, „27.06.2026”, „27.06.”, „27 iunie”, „június 27.”, „28 iunie 2026” → ISO; év nélkül a rendezvény éve. Rossz → null. */
export function napOlvas(be: unknown, ev: number): string | null {
  if (typeof be !== "string") return null;
  const s = be.trim().toLowerCase();
  const iso = (e: number, h: number, n: number) => {
    const d = new Date(Date.UTC(e, h - 1, n));
    return d.getUTCFullYear() === e && d.getUTCMonth() === h - 1 && d.getUTCDate() === n ? `${e}-${String(h).padStart(2, "0")}-${String(n).padStart(2, "0")}` : null;
  };
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return iso(+m[1]!, +m[2]!, +m[3]!);
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.?(?:(\d{4}))?\.?$/);
  if (m) return iso(m[3] ? +m[3] : ev, +m[2]!, +m[1]!);
  m = s.match(/^(?:(\d{4})\.?\s*)?([\p{L}]+)\.?\s+(\d{1,2})\.?$/u); // „június 27.”, „2026. június 27.”
  if (m && HONAPOK[m[2]!]) return iso(m[1] ? +m[1] : ev, HONAPOK[m[2]!]!, +m[3]!);
  m = s.match(/^(\d{1,2})\.?\s+([\p{L}]+)\.?(?:\s+(\d{4}))?$/u); // „27 iunie”, „28 iunie 2026”, „27 june”
  if (m && HONAPOK[m[2]!]) return iso(m[3] ? +m[3] : ev, HONAPOK[m[2]!]!, +m[1]!);
  return null;
}

export function fajtaOlvas(be: unknown): ProgramFajta {
  const s = typeof be === "string" ? ekezetNelkul(be.trim()) : "";
  if ((PROGRAM_FAJTAK as readonly string[]).includes(s)) return s as ProgramFajta;
  return FAJTA_SZINONIMA[s] ?? "egyeb";
}

/** A belső feljegyzés felismerése a tétel minden szövegén (név, leírás). */
export function belsoJegyzet(t: Pick<TisztaTetel, "nev" | "leiras">): boolean {
  return [...Object.values(t.nev), ...Object.values(t.leiras)].some((s) => BELSO.test(s ?? ""));
}

const csupaNagy = (s: string) => {
  const b = s.replace(/[^\p{L}]/gu, "");
  return b.length >= 3 && b === b.toLocaleUpperCase("hu") && b !== b.toLocaleLowerCase("hu");
};

/**
 * A gép válasza ({tetelek: […]} vagy egy tömb) → kitakarított tételek. A gép `bizonytalan` jele marad, és a szabály is adhat ilyet
 * (kérdőjelek, belső feljegyzés). A CSUPA NAGYBETŰS helyszín annak az írásmódját kapja, ami ugyanebben a programban máshol (nem
 * csupa nagybetűvel) áll — kitalált írásmód nincs. Név nélküli tétel kimarad; ugyanaz a (nap, kezdés, név) egyszer szerepel.
 */
export function programTisztit(nyers: unknown, o: { ev: number; nyelv?: string }): TisztaTetel[] {
  const lista = Array.isArray(nyers) ? nyers : nyers && typeof nyers === "object" && Array.isArray((nyers as { tetelek?: unknown }).tetelek) ? (nyers as { tetelek: unknown[] }).tetelek : [];
  const ki: TisztaTetel[] = [];
  const latott = new Set<string>();
  for (const x of lista.slice(0, PROGRAM_MAX_TETEL * 2)) {
    if (!x || typeof x !== "object") continue;
    const r = x as Record<string, unknown>;
    let nev = nyelviTisztit(r["nev"] ?? r["cim"] ?? r["name"], o.nyelv);
    // c30 F6b: név nélkül, de fellépővel („fellepo”: „Kökény Attila”) — a forrás a fellépő nevét írta a sorba; az a tétel neve
    if (Object.keys(nev).length === 0 && o.nyelv) nev = nyelviTisztit(szovegTisztit(r["fellepo"], 200), o.nyelv);
    if (Object.keys(nev).length === 0) continue;
    const ido = idoOlvas(r["kezdes"], r["vege"]);
    const t: TisztaTetel = {
      nap: napOlvas(r["nap"], o.ev),
      kezdes: ido.kezdes,
      vege: ido.vege,
      nev,
      leiras: nyelviTisztit(r["leiras"], o.nyelv),
      helyszin: nyelviTisztit(r["helyszin"], o.nyelv),
      fellepo: szovegTisztit(r["fellepo"], 200),
      fajta: fajtaOlvas(r["fajta"]),
      jegy: szovegTisztit(r["jegy"], 200),
      bizonytalan: r["bizonytalan"] === true || ido.bizonytalan || [...Object.values(nev)].some((s) => KERDOJELEK.test(s ?? "")),
      aktiv: r["aktiv"] !== false,
    };
    if (belsoJegyzet(t)) { t.aktiv = false; t.bizonytalan = true; }
    const k = programKulcs(t);
    if (latott.has(k)) continue;
    latott.add(k);
    ki.push(t);
    if (ki.length >= PROGRAM_MAX_TETEL) break;
  }
  // a csupa nagybetűs helyszín írásmódja a program saját, nem csupa nagybetűs alakjából
  const iras = new Map<string, string>();
  for (const t of ki) for (const v of Object.values(t.helyszin)) if (v && !csupaNagy(v)) iras.set(v.toLocaleLowerCase("hu"), v);
  for (const t of ki) {
    for (const [ny, v] of Object.entries(t.helyszin)) {
      const jo = v && csupaNagy(v) ? iras.get(v.toLocaleLowerCase("hu")) : undefined;
      if (jo) (t.helyszin as Record<string, string>)[ny] = jo;
    }
  }
  return ki;
}

/** Egy tétel kulcsa az újraolvasáshoz: nap + kezdés + az első nem üres név (ékezet és kis-nagybetű nélkül). */
export function programKulcs(t: Pick<TisztaTetel, "nap" | "kezdes" | "nev">): string {
  const nev = t.nev.hu || t.nev.ro || Object.values(t.nev).find(Boolean) || "";
  return `${t.nap ?? "-"}|${t.kezdes ?? "-"}|${ekezetNelkul(nev).replace(/[^\p{L}\p{N}]+/gu, " ").trim()}`;
}

/** Egy meglévő sor: `gepKulcs` = a kulcs, amellyel a gép beírta (a munkatárs átírhatja a nevet vagy az időt — a gép kulcsa marad). */
export type RegiSor = { id: string; forras: "gep" | "sajat"; modositva: boolean; gepKulcs: string } & Pick<TisztaTetel, "nap" | "kezdes" | "nev">;
export type UjraOlvasTerv = { beszur: TisztaTetel[]; frissit: { id: string; tetel: TisztaTetel }[]; torol: string[]; megtart: string[] };

/**
 * Az újraolvasás terve (a régi, nem törölt sorok + az új olvasás): a személy keze nyomát SOHA nem írja felül.
 *  · `modositva` vagy `forras = sajat` sor: marad, ahogy van (megtart) — akkor is, ha az új olvasásban nincs benne; és a gép
 *    kulcsa (`gepKulcs`) foglalt marad, így az átírt sor eredetije nem kerül be újra másodpéldányként;
 *  · a gép érintetlen sora, ha az új olvasásban is megvan (ugyanaz a kulcs): frissül; ha nincs: puhán törlődik;
 *  · az új olvasás tétele, amelyhez nincs sor: beszúrás — kivéve, ha a kulcsa egy megtartott (szerkesztett) soré.
 */
export function ujraOlvasTerv(regi: readonly RegiSor[], uj: readonly TisztaTetel[]): UjraOlvasTerv {
  const terv: UjraOlvasTerv = { beszur: [], frissit: [], torol: [], megtart: [] };
  const ujKulcs = new Map(uj.map((t) => [programKulcs(t), t] as const));
  const foglalt = new Set<string>();
  for (const r of regi) {
    const k = r.gepKulcs || programKulcs(r);
    if (r.modositva || r.forras === "sajat") {
      terv.megtart.push(r.id);
      foglalt.add(k);
      continue;
    }
    const t = ujKulcs.get(k);
    if (t && !foglalt.has(k)) {
      terv.frissit.push({ id: r.id, tetel: t });
      foglalt.add(k);
    } else terv.torol.push(r.id);
  }
  for (const [k, t] of ujKulcs) if (!foglalt.has(k)) terv.beszur.push(t);
  const hely = Math.max(0, PROGRAM_MAX_TETEL - terv.megtart.length - terv.frissit.length);
  terv.beszur = terv.beszur.slice(0, hely);
  return terv;
}
