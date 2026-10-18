// Recept + márka + tartalom + választás → egy önálló HTML-lap.
// Tiszta függvény: se lemez, se hálózat. A betűfájlok címét a befogadó adja (betuCim).
import type { Marka, MezoMegjelenes, SzovegStilus, BlokkMegjelenes } from "./marka.ts";
import type { Recept, ReceptMezo } from "./recept.ts";
import { mezoSorrend } from "./recept.ts";
import {
  Par,
  IdoTartomany,
  Jarat,
  TablaSor,
  SavElem,
  AzonositoSor,
  Forras,
  type Tartalom,
} from "./tartalom.ts";
import { z } from "zod";

/** Az illesztés döntései. Üres választás = mindenki az első lépcsőn, semmi nem költözött. */
export interface Valasztas {
  /** mező → a lépcső hányadik foka (0 = a legnagyobb) */
  lepcso: Record<string, number>;
  /** ezeknél a rövid változat áll */
  rovid: string[];
  /** ezeknél a tájékoztatás keskeny változata */
  keskeny: string[];
  /** a képaláírásba költözött mezők, illetve táblázatsorok ("mezo/sor") */
  kikoltozott: string[];
  /** CSAK próbához: rögzített méret egy lépcsős stílusnak (px), a lépcső helyett */
  rogzitett?: Record<string, { meret: number; sorkoz: number }>;
}

export const uresValasztas = (): Valasztas => ({ lepcso: {}, rovid: [], keskeny: [], kikoltozott: [] });

export interface Osszeallitas {
  html: string;
  /** a képaláírásba került szöveg (a kiköltöztetett mezők), nyelvenként */
  kepalairas: string[];
  /** hiányzó adat, ismeretlen paraméter — nem kivétel, hanem jelentés */
  hibak: { mezo: string; kod: string; uzenet: string }[];
}

export interface OsszeallitasOpciok {
  betuCim: (fajl: string) => string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

class Lap {
  hibak: Osszeallitas["hibak"] = [];
  kepalairas: string[] = [];
  readonly marka: Marka;
  readonly recept: Recept;
  readonly tartalom: Tartalom;
  readonly v: Valasztas;
  constructor(marka: Marka, recept: Recept, tartalom: Tartalom, v: Valasztas) {
    this.marka = marka;
    this.recept = recept;
    this.tartalom = tartalom;
    this.v = v;
  }

  get elr() {
    const e = this.marka.elrendezesek[this.recept.recept.azonosito];
    if (!e) throw new Error(`A márkának nincs elrendezése ehhez a recepthez: ${this.recept.recept.azonosito}`);
    return e;
  }
  szin(kulcs: string): string {
    const s = this.marka.szinek[kulcs];
    if (!s) {
      this.hibak.push({ mezo: "-", kod: "HIANYZO_SZIN", uzenet: `hiányzó szín: ${kulcs}` });
      return "#ff00ff";
    }
    return s;
  }
  stilus(nev: string | undefined, mezo: string): SzovegStilus | null {
    if (!nev) return null;
    const s = this.marka.stilusok[nev];
    if (!s) {
      this.hibak.push({ mezo, kod: "HIANYZO_STILUS", uzenet: `hiányzó stílus: ${nev}` });
      return null;
    }
    return s;
  }
  /** A stílus tényleges mérete: fix px, rögzített próbaérték, vagy a lépcső választott foka. */
  meret(s: SzovegStilus, mezo: string): { meret: number; sorkoz: number | null } {
    if (typeof s.meret === "number") return { meret: s.meret, sorkoz: s.sorkoz };
    const r = this.v.rogzitett?.[s.meret];
    if (r) return r;
    const lepcso = this.marka.lepcsok[s.meret];
    if (!lepcso) {
      this.hibak.push({ mezo, kod: "HIANYZO_LEPCSO", uzenet: `hiányzó méretlépcső: ${s.meret}` });
      return { meret: this.marka.minimum, sorkoz: null };
    }
    const i = Math.min(this.v.lepcso[mezo] ?? 0, lepcso.length - 1);
    const f = lepcso[i]!;
    return { meret: f.meret, sorkoz: f.sorkoz };
  }
  css(s: SzovegStilus, mezo: string, extra = "", keskeny = false): string {
    const m = this.meret(s, mezo);
    const csalad = this.marka.betuk[s.szerep];
    const fb = s.szerep === "technikai" ? "monospace" : "sans-serif";
    let c = `font-family: '${csalad}', ${fb}; font-weight: ${s.suly}; font-size: ${m.meret}px;`;
    if (m.sorkoz != null) c += ` line-height: ${m.sorkoz}px;`;
    if (s.betukoz_em) c += ` letter-spacing: ${s.betukoz_em}em;`;
    if (s.nagybetus) c += ` text-transform: uppercase;`;
    if (s.szerep === "technikai") c += ` font-variant-numeric: tabular-nums;`;
    if (keskeny && s.szerep === "tajekoztatas" && this.marka.betuk.tajekoztatas_keskeny)
      c += ` font-stretch: ${this.marka.betuk.tajekoztatas_keskeny}%;`;
    c += ` color: ${this.szin(s.szin)};`;
    return c + extra;
  }
  mm(mezo: string): MezoMegjelenes {
    return (this.elr.mezok[mezo] ?? { par_koz: 0, elotte: 0, utana: 0 }) as MezoMegjelenes;
  }
  ertek<T>(mezo: string, sema: z.ZodType<T>): T | null {
    const nyers = this.tartalom.mezok[mezo];
    if (nyers === undefined) return null;
    const r = sema.safeParse(nyers);
    if (!r.success) {
      this.hibak.push({ mezo, kod: "ERVENYTELEN_ERTEK", uzenet: r.error.issues.map((i) => i.message).join("; ") });
      return null;
    }
    return r.data;
  }
  par(mezo: string): z.infer<typeof Par> | null {
    if (this.v.rovid.includes(mezo) && this.tartalom.rovid[mezo]) return this.tartalom.rovid[mezo]!;
    return this.ertek(mezo, Par);
  }
  get masodlagosNyelv() {
    return this.marka.lokal.nyelvek[1];
  }
  get tartalomSzelesseg() {
    const m = this.elr.sav_alatti_margo ?? this.elr.margo;
    return this.tartalom.formatum.szelesseg - m[1] - m[3];
  }
}

/** A mező/blokk előtti köz: rugalmas töltelék és/vagy fix margó. */
function kozElotte(rugalmas: boolean, px: number): { tolto: string; margo: number } {
  return { tolto: rugalmas ? `<div style="flex-grow: 1;"></div>` : "", margo: px };
}

function egysorosPar(l: Lap, p: z.infer<typeof Par>, mm: MezoMegjelenes): string {
  const sep = l.marka.lokal.par_elvalaszto;
  if (!p.masodlagos) return esc(p.elsodleges);
  if (mm.masodlagos_szin) {
    return `${esc(p.elsodleges)} <span lang="${l.masodlagosNyelv}" style="color: ${l.szin(mm.masodlagos_szin)};">${esc(sep.trimStart())}${esc(p.masodlagos)}</span>`;
  }
  return `${esc(p.elsodleges)}${esc(sep)}<span lang="${l.masodlagosNyelv}">${esc(p.masodlagos)}</span>`;
}

function datumFormaz(l: Lap, iso: string): string {
  const [e, h, n] = iso.split("-");
  return l.marka.lokal.datumformatum.replace("DD", n!).replace("MM", h!).replace("YYYY", e!);
}

function sablon(s: string, ertekek: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => ertekek[k] ?? `{${k}}`);
}

/** Egy mező HTML-je. `stilusAttr` a mező külső elemére kerülő kiegészítés (margó). */
function mezoHtml(l: Lap, m: ReceptMezo, kulso: string): string {
  const id = m.azonosito;
  const mm = l.mm(id);
  const st = l.stilus(mm.stilus, id);
  const kesk = l.v.keskeny.includes(id);
  const attr = (ny: string) => `data-mezo="${id}" data-nyelv="${ny}"`;

  switch (m.tipus) {
    case "arculati_hely": {
      if (id === "emblema") {
        const alap = l.elr.hatter;
        const svg = l.marka.emblema.valtozatok[alap] ?? Object.values(l.marka.emblema.valtozatok)[0];
        if (!svg) {
          l.hibak.push({ mezo: id, kod: "HIANYZO_EMBLEMA", uzenet: "a fióknak nincs emblémája" });
          return "";
        }
        const meret = l.marka.emblema.meret;
        return svg.replace(
          /<svg\b/,
          `<svg data-mezo="emblema" width="${meret}" height="${meret}" role="img" aria-label="${esc(l.marka.emblema.felirat)}" style="flex: none;${kulso}"`,
        );
      }
      if (id === "jelzes") {
        if (!l.marka.jelzes.van) return "";
        const j = l.marka.jelzes;
        return `<div data-mezo="jelzes" style="width: ${j.szelesseg}px; height: ${j.magassag}px; background: ${l.szin(j.szin)}; flex: none;${kulso}${mm.utana ? ` margin-bottom: ${mm.utana}px;` : ""}"></div>`;
      }
      if (id === "allapot_ikon") {
        const kulcs = l.ertek(id, z.string());
        if (!kulcs) return "";
        const svg = l.marka.ikonok[kulcs];
        if (!svg) {
          l.hibak.push({ mezo: id, kod: "HIANYZO_IKON", uzenet: `a fiók ikonkészletében nincs: ${kulcs}` });
          return "";
        }
        const n = mm.ikon_meret ?? 48;
        return `<svg data-mezo="allapot_ikon" viewBox="0 0 48 48" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="${mm.ikon_vonal ?? 3.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none;">${svg}</svg>`;
      }
      return "";
    }
    case "allapotjelzo":
      return ""; // a sáv színét adja, lásd blokkHtml
    case "rovid_szoveg": {
      if (id === "azonosito_sor") return azonositoSor(l, m, kulso);
      if (id === "forras") {
        if (l.elr.mezok["forras"]?.beolvad) return "";
        const t = forrasSzoveg(l);
        if (t == null || !st) return "";
        return `<div ${attr("par")} style="${l.css(st, id, kulso)}">${t}</div>`;
      }
      const p = l.par(id);
      if (!p || !st) return "";
      return `<div ${attr("par")} style="${l.css(st, id, kulso, kesk)}">${egysorosPar(l, p, mm)}</div>`;
    }
    case "hosszu_szoveg": {
      const p = l.par(id);
      if (!p || !st) return "";
      const st2 = l.stilus(mm.stilus_masodlagos, id) ?? st;
      const cimke = id === "focim";
      const t1 = cimke ? "h1" : "div";
      const t2 = cimke ? "p" : "div";
      const a = `<${t1} ${attr("elsodleges")} style="margin: 0; flex: none; ${l.css(st, id, kulso, kesk)}">${esc(p.elsodleges)}</${t1}>`;
      if (!p.masodlagos) return a;
      return (
        a +
        `<${t2} ${attr("masodlagos")} lang="${l.masodlagosNyelv}" style="margin: ${mm.par_koz}px 0 0 0; flex: none; ${l.css(st2, id, "", kesk)}">${esc(p.masodlagos)}</${t2}>`
      );
    }
    case "jarat_azonosito": {
      const j = l.ertek(id, Jarat);
      if (!j || !st || !mm.jelveny) return "";
      const js = l.stilus(mm.jelveny.stilus, id);
      if (!js) return "";
      const nev = j.nev ?? {
        elsodleges: sablon(l.marka.lokal.jarat_nev_sablon.elsodleges, { kod: j.kod }),
        masodlagos: sablon(l.marka.lokal.jarat_nev_sablon.masodlagos, { kod: j.kod }),
      };
      return (
        `<div data-mezo="jarat" data-nyelv="kod" style="${l.css(js, id)} padding: 0 ${mm.jelveny.vizszintes_kitoltes}px; border-radius: ${mm.jelveny.sarok}px; background: ${l.szin(mm.jelveny.hatter)}; flex: none;">${esc(j.kod)}</div>` +
        `<div ${attr("nev")} style="${l.css(st, id, "", kesk)}">${egysorosPar(l, nev, mm)}</div>`
      );
    }
    case "ido": {
      const t = l.ertek(id, IdoTartomany);
      if (!t || !st) return "";
      const lk = l.marka.lokal;
      const s = `${t.kezdet}${lk.tartomany_jel}${t.veg_kozelito ? lk.kozelito_szo + " " : ""}${t.veg}`;
      return `<div data-mezo="${id}" data-nyelv="-" style="${l.css(st, id, kulso)}">${esc(s)}</div>`;
    }
    case "tablazat":
      return tablazat(l, m, kulso);
    case "lista":
      return savok(l, m, kulso);
    default:
      l.hibak.push({ mezo: id, kod: "NEM_TAMOGATOTT", uzenet: `ez a mezőtípus még nem épült meg: ${m.tipus}` });
      return "";
  }
}

function forrasSzoveg(l: Lap): string | null {
  const f = l.ertek("forras", Forras);
  if (!f) return null;
  if ("nyilatkozat" in f) return esc(l.marka.szovegek.forras_nyilatkozat);
  return egysorosPar(l, f.valos, l.mm("forras"));
}

function azonositoSor(l: Lap, m: ReceptMezo, kulso: string): string {
  const mm = l.mm(m.azonosito);
  const st = l.stilus(mm.stilus, m.azonosito);
  const a = l.ertek(m.azonosito, AzonositoSor);
  if (!a || !st) return "";
  const sep = l.marka.lokal.meta_elvalaszto;
  const kod = l.marka.szovegek.sorozatkod[l.recept.recept.azonosito] ?? "";
  const reszek = [`${kod} ${String(a.sorszam).padStart(3, "0")}`.trim(), datumFormaz(l, a.datum)];
  const j = l.recept.mezok.some((x) => x.azonosito === "jarat") ? l.ertek("jarat", Jarat) : null;
  if (j) reszek.push(sablon(l.marka.lokal.jarat_hivatkozas_sablon, { kod: j.kod }));
  let html = esc(reszek.filter(Boolean).join(sep));
  const fm = l.elr.mezok["forras"];
  if (fm?.beolvad === m.azonosito) {
    const f = forrasSzoveg(l);
    if (f != null) html += esc(sep) + esc(l.marka.szovegek.forras_cimke) + "<br>" + f;
  }
  return `<div data-mezo="${m.azonosito}" data-nyelv="-" style="flex-grow: 1; ${l.css(st, m.azonosito, kulso)}">${html}</div>`;
}

function tablazat(l: Lap, m: ReceptMezo, kulso: string): string {
  const id = m.azonosito;
  const mm = l.mm(id);
  const cs = l.stilus(mm.cimke_stilus, id);
  const es = l.stilus(mm.ertek_stilus, id);
  const ts = l.stilus("technikai_beagyazott", id);
  const sorok = l.ertek(id, z.array(TablaSor));
  if (!sorok || !cs || !es) return "";
  const kesk = l.v.keskeny.includes(id);
  const lk = l.marka.lokal;
  const hsz = `border-top: ${mm.hajszal_vastag ?? 2}px solid ${l.szin(mm.hajszal ?? "hajszal")};`;
  const kp = mm.cella_kitoltes ?? 8;
  const trs: string[] = [];
  for (const s of sorok) {
    const cimke = lk.reszlet_cimke[s.azonosito];
    let e1 = "";
    let e2 = "";
    if (s.elemek) {
      e1 = s.elemek.map((x) => esc(x.elsodleges)).join(esc(lk.lista_elvalaszto));
      e2 = s.elemek.filter((x) => x.masodlagos).map((x) => esc(x.masodlagos!)).join(esc(lk.lista_elvalaszto));
    } else if (s.szoveg) {
      e1 = esc(s.szoveg.elsodleges);
      e2 = esc(s.szoveg.masodlagos ?? "");
    } else if (s.ido) {
      const span = ts
        ? `<span style="font-family: '${l.marka.betuk.technikai}', monospace; font-variant-numeric: tabular-nums; font-weight: ${ts.suly};">${esc(s.ido)}</span>`
        : esc(s.ido);
      e1 = sablon(esc(lk.frissites_sablon.elsodleges), { ido: span });
      e2 = sablon(esc(lk.frissites_sablon.masodlagos), { ido: span });
    }
    const cim = cimke ? `${esc(cimke.elsodleges)}<br><span lang="${l.masodlagosNyelv}">${esc(cimke.masodlagos)}</span>` : esc(s.azonosito);
    const ert = e2 ? `${e1}<br><span lang="${l.masodlagosNyelv}">${e2}</span>` : e1;
    if (l.v.kikoltozott.includes(`${id}/${s.azonosito}`)) {
      const sima = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      const c = cimke ? `${cimke.elsodleges}${lk.par_elvalaszto}${cimke.masodlagos}` : s.azonosito;
      l.kepalairas.push(`${c}: ${sima(e1)}${e2 ? " / " + sima(e2) : ""}`);
      continue;
    }
    trs.push(
      `<tr><td data-mezo="${id}" data-nyelv="cimke:${s.azonosito}" style="padding: ${kp}px 24px ${kp}px 0; vertical-align: top; width: ${mm.cimkeoszlop ?? 280}px; ${hsz} ${l.css(cs, id)}">${cim}</td><td data-mezo="${id}" data-nyelv="ertek:${s.azonosito}" style="padding: ${kp}px 0; vertical-align: top; ${hsz} ${l.css(es, id, "", kesk)}">${ert}</td></tr>`,
    );
  }
  if (trs.length === 0) return "";
  return `<table style="border-collapse: collapse; width: 100%; flex: none;${kulso}">${trs.join("")}</table>`;
}

function savok(l: Lap, m: ReceptMezo, kulso: string): string {
  const id = m.azonosito;
  const mm = l.mm(id);
  const cs = l.stilus(mm.cimke_stilus, id);
  const es = l.stilus(mm.ertek_stilus, id);
  const elemek = l.ertek(id, z.array(SavElem).min(2));
  if (!elemek || !cs || !es) return "";
  const w = l.tartalomSzelesseg;
  const cm = l.meret(cs, id);
  const sor = `display: flex; align-items: baseline; gap: 24px; font-size: ${cm.meret}px;${cm.sorkoz ? ` line-height: ${cm.sorkoz}px;` : ""}`;
  const cimkeCss = l.css(cs, id).replace(/font-size:[^;]+;|line-height:[^;]+;/g, "");
  const ertekCss = l.css(es, id).replace(/font-size:[^;]+;|line-height:[^;]+;/g, "");
  const tetelek = elemek.map(
    (e, i) =>
      `<div><div style="${sor}"><div data-mezo="${id}" data-nyelv="elem${i}" style="flex-grow: 1; ${cimkeCss}">${egysorosPar(l, e.cimke, mm)}</div><div data-mezo="${id}" data-nyelv="ertek${i}" style="flex: none; text-align: right; ${ertekCss}">${e.ertek}${esc(l.marka.lokal.szazalek_jel)}</div></div>` +
      `<div data-mezo="${id}" data-nyelv="sav${i}" style="width: ${Math.round((w * e.ertek) / 100)}px; height: ${mm.sav_magassag ?? 28}px; background: ${l.szin(mm.sav_szin ?? "jelzes")}; margin-top: ${mm.sav_elotte ?? 8}px;"></div></div>`,
  );
  return `<div style="display: flex; flex-direction: column; gap: ${mm.elem_koz ?? 24}px; flex: none;${kulso}">${tetelek.join("")}</div>`;
}

function oszlopba(l: Lap, mezok: ReceptMezo[], elsoFelul?: { rug: boolean; px: number }): string[] {
  const ki: string[] = [];
  let elso = true;
  for (const m of mezok) {
    const mm = l.mm(m.azonosito);
    let rug = mm.rugalmas_elotte;
    let px = mm.elotte;
    if (elso && elsoFelul) {
      rug = rug || elsoFelul.rug;
      px = px || elsoFelul.px;
    }
    const { tolto, margo } = kozElotte(rug, px);
    const h = mezoHtml(l, m, margo ? ` margin-top: ${margo}px;` : "");
    if (!h) continue;
    ki.push(tolto + h);
    elso = false;
  }
  return ki;
}

function blokkHtml(l: Lap, bid: string, mezok0: ReceptMezo[], bm: BlokkMegjelenes | undefined): string {
  const mezok = mezok0.filter((m) => !l.mm(m.azonosito).rejtett);
  if (bm?.mezo_sorrend) {
    const rend = bm.mezo_sorrend;
    mezok.sort((a, b) => (rend.indexOf(a.azonosito) + 1 || 99) - (rend.indexOf(b.azonosito) + 1 || 99));
  }
  if (!bm || bm.irany === "oszlop") {
    return oszlopba(l, mezok, bm ? { rug: bm.rugalmas_elotte, px: bm.elotte } : undefined).join("\n");
  }
  // soros blokk; a „kulon” mezők a sor fölött, saját sorban
  const kulonMezok = mezok.filter((m) => bm.kulon.includes(m.azonosito));
  const sorMezok = mezok.filter((m) => !bm.kulon.includes(m.azonosito));
  const eleje = oszlopba(l, kulonMezok);
  const vanKulon = eleje.length > 0;
  const { tolto, margo } = kozElotte(bm.rugalmas_elotte && !vanKulon, bm.elotte);
  let stilus = `display: flex; align-items: ${bm.igazitas}; gap: ${bm.koz}px;${bm.tordelheto ? " flex-wrap: wrap;" : ""} flex: none;`;
  if (margo) stilus += ` margin-top: ${margo}px;`;
  if (bm.hajszal_felette)
    stilus += ` border-top: ${bm.hajszal_felette.vastag}px solid ${l.szin(bm.hajszal_felette.szin)}; padding-top: ${bm.hajszal_felette.koz}px;`;
  if (bm.sav) {
    const allapot = l.ertek("allapot", z.string());
    const a = allapot ? l.marka.allapotok[allapot] : undefined;
    if (!a) l.hibak.push({ mezo: "allapot", kod: "ISMERETLEN_ALLAPOT", uzenet: `ismeretlen állapot: ${allapot}` });
    const k = bm.sav_kitoltes ?? [20, 72, 20, 72];
    stilus += ` padding: ${k[0]}px ${k[1]}px ${k[2]}px ${k[3]}px; background: ${a ? l.szin(a.hatter) : "#ff00ff"}; color: ${a ? l.szin(a.szoveg) : "#000"};`;
  }
  const belso = sorMezok.map((m) => mezoHtml(l, m, "")).filter(Boolean);
  if (belso.length === 0) return eleje.join("\n");
  let html = belso.join("");
  // a sávban a szöveg a sáv színét kapja (az állapot párja)
  if (bm.sav) html = html.replace(/ color: #[0-9a-fA-F]{6};/g, " color: inherit;");
  const elo = vanKulon && bm.rugalmas_elotte ? `<div style="flex-grow: 1;"></div>` : "";
  return `${elo}${eleje.join("\n")}${tolto}<div data-blokk="${bid}"${bm.sav ? " data-sav" : ""} style="${stilus}">${html}</div>`;
}

/** Összeállítja a lapot. */
export function osszeallit(
  marka: Marka,
  recept: Recept,
  tartalom: Tartalom,
  valasztas: Valasztas,
  opciok: OsszeallitasOpciok,
): Osszeallitas {
  const l = new Lap(marka, recept, tartalom, valasztas);
  const elr = l.elr;
  const { szelesseg: W, magassag: H } = tartalom.formatum;
  const sorrend = mezoSorrend(recept).filter((m) => !valasztas.kikoltozott.includes(m.azonosito));
  for (const m of mezoSorrend(recept)) {
    if (valasztas.kikoltozott.includes(m.azonosito)) {
      const p = l.ertek(m.azonosito, Par);
      if (p) l.kepalairas.push(`${m.cimke}: ${p.elsodleges}${p.masodlagos ? " / " + p.masodlagos : ""}`);
    }
  }
  const blokkok = [...recept.blokkok].sort((a, b) => a.sorrend - b.sorrend);
  const reszek: string[] = [];
  let savos = "";
  for (const b of blokkok) {
    const mezok = sorrend.filter((m) => m.blokk === b.azonosito);
    const bm = elr.blokkok[b.azonosito];
    const h = blokkHtml(l, b.azonosito, mezok, bm);
    if (bm?.sav) savos += h;
    else if (h) reszek.push(h);
  }
  const hatter = l.szin(elr.hatter);
  const betuk = marka.betufajlok
    .map(
      (b) =>
        `@font-face{font-family:'${b.csalad}';font-style:${b.stilus};font-weight:${b.suly};${b.stretch ? `font-stretch:${b.stretch};` : ""}src:url(${opciok.betuCim(b.fajl)}) format('woff2');${b.unicode_range ? `unicode-range:${b.unicode_range};` : ""}}`,
    )
    .join("\n");
  const px = (k: readonly number[]) => `${k[0]}px ${k[1]}px ${k[2]}px ${k[3]}px`;
  let torzs: string;
  if (savos) {
    const bm = elr.sav_alatti_margo ?? elr.margo;
    torzs =
      `<div data-lap data-oszlop style="width: ${W}px; height: ${H}px; box-sizing: border-box; padding: 0; background: ${hatter}; display: flex; flex-direction: column; overflow: hidden;">` +
      savos +
      `<div data-oszlop style="flex-grow: 1; display: flex; flex-direction: column; padding: ${px(bm)}; min-height: 0;">${reszek.join("\n")}</div></div>`;
  } else {
    torzs = `<div data-lap data-oszlop style="width: ${W}px; height: ${H}px; box-sizing: border-box; padding: ${px(elr.margo)}; background: ${hatter}; display: flex; flex-direction: column; overflow: hidden;">${reszek.join("\n")}</div>`;
  }
  const html = `<!doctype html><html lang="${marka.lokal.nyelvek[0]}"><head><meta charset="utf-8"><style>${betuk}\nbody{margin:0}</style></head><body>${torzs}</body></html>`;
  return { html, kepalairas: l.kepalairas, hibak: l.hibak };
}
