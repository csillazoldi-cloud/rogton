"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Kapcsolo } from "../_kozos/Kapcsolo";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { R15PoszthozTeszem } from "./R15PoszthozTeszem";
import { DolgozoGomb, HalkGomb, Info } from "../_kozos/R15";
import "../_kozos/r15-lapok.css";

// VZ-2b — Kitöltő (design/vz2/rajz/VZ2b-kitolto.dc.html). A kép MINDIG a gép képe (a képgyártó, a Gigabyte-on):
// ugyanaz a fájl, amit a Letöltés ad. Gépelés után ~600 ms-mal frissül; a régi kép addig 40%-on marad, a korábbi,
// még futó kérés eredményét eldobjuk. Ha minden jó, nincs jelzés; ha nem fér ki, egy mondat a baj helyén, kész javaslattal.
// A román változat (Kati 10-11): a kép minden mezője románul, a kép nyelve is (lásd roKapcsol).
// R-15 c5 2. kör (design/R15/rajz/R15-lapok-5.dc.html 10a · 10w · 10b; gepezet-5 2; kerdesek-5 3–4, Csilla 10-10 18:08):
// a Letöltés a lap EGYETLEN fő gombja (data-r15); amíg a kép készül, a gomb dolgozik (pörgő + „Készítjük a képet…”, letiltva) és mellette
// „Pár másodperc — addig nincs teendőd.”; a kiválasztott méret ✓-et és kiemelő keretet kap; az „Így jó: …” példa csak ÜRES mező alatt;
// a „Megírtuk helyetted…” mondat a cím alá került; a Kész lapon nincs „javaslat” jelvény, telefonon is van cím és „Letöltés újra”.

type Mezo = "cim" | "sor" | "szam" | "mikor" | "hol";
type Kerdes = { mezo: Mezo; cimke: string };
type Meret = "poszt" | "story" | "negyzet";
type Eredmeny = { kep: string; meret: Meret; valtozat?: string; fok: number; kisebbBetu: boolean; nemFer: string | null };
/** VZ-3: a színváltozatok a rajz sorrendjében; a gép dönti el, melyik marad meg az adott képen */
const VALTOZAT_NEV: Record<string, string> = { vilagos: "vz3.vilagos", szines: "vz3.szines", sotet: "vz3.sotet", masodik: "vz3.masik_szin", atmenet: "vz3.atmenet" };
const MERETEK: Meret[] = ["poszt", "story", "negyzet"];
/** a „Két kép: …” sorhoz — ugyanaz, mint a vizual-core `MERETEK` (packages/vizual-core/src/helyzet.ts); a kliens azt nem húzza be */
const MERET_PX: Record<string, string> = { poszt: "1080 × 1350", story: "1080 × 1920", negyzet: "1080 × 1080" };
type Foto = { adat: string; x: number; y: number; nagyitas: number };
/** Melyik helyzetnél van fotó (design/vz2 ATADO): Kész munka és Újdonság — a képe épül rá; Akció, Esemény — nem kötelező. */
const FOTO: Record<string, string> = { kesz: "vz2.foto_kesz_munka", uj: "vz2.foto_uj", akcio: "vz2.foto_nem_kotelezo", esemeny: "vz2.foto_nem_kotelezo" };
/** A fotó a böngészőben kicsinyítve megy a képgyártóhoz (a hosszabbik oldala legfeljebb 1600 px, JPEG). */
async function kicsinyit(f: File): Promise<string> {
  const bm = await createImageBitmap(f);
  const k = Math.min(1, 1600 / Math.max(bm.width, bm.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bm.width * k);
  c.height = Math.round(bm.height * k);
  c.getContext("2d")!.drawImage(bm, 0, 0, c.width, c.height);
  bm.close();
  return c.toDataURL("image/jpeg", 0.86);
}
const hatar = (v: number) => Math.max(0, Math.min(100, v));
/** a „← Másik kép” után a következő sablon ebből tölt (sessionStorage; csak ugyanahhoz a poszthoz, 30 percig) */
const FOLYTAT_KULCS = "km-kep-folytat";

/** Rövidítési javaslat: az első tagmondat, vagy a szavak kétharmada — a gép mondata, a munkatárs dönt róla. */
function rovidebb(s: string): string {
  const t = s.trim();
  const m = t.match(/^(.{8,}?)[,;:.!?–—]\s/);
  if (m && m[1]!.length < t.length * 0.8) return m[1]!.trim();
  const szavak = t.split(/\s+/);
  return szavak.slice(0, Math.max(2, Math.floor(szavak.length * 0.66))).join(" ");
}

/** Kati 10-10 #7 (Csilla 19:56): a román szöveg mezője magától nő — legalább 2, legfeljebb 4 sor, utána görget (eddig egysoros mező volt:
 *  390 px-en a 1513 px-es szövegből 364 px látszott). A magasság a tartalomhoz igazodik (scrollHeight), így asztalon sincs ugrás. */
function NovoMezo({ ertek, tiltva, valt }: { ertek: string; tiltva: boolean; valt: (s: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const sor = parseFloat(cs.lineHeight) || 22;
    const keret = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    el.style.height = `${Math.min(Math.max(el.scrollHeight + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth), 2 * sor + keret), 4 * sor + keret)}px`;
  }, [ertek]);
  return <textarea ref={ref} className="km-vz2-mezo km-vz2-ro-mezo" rows={2} value={ertek} disabled={tiltva} onChange={(e) => valt(e.target.value)} />;
}

export function Kitolto({ sav, helyzet, kerdesek, kezdo, kezdoValtozat = "vilagos", poszt, kezdoMeret, kezdoMasik, elsoNyelv = "hu", masikNyelv = null, egyben = false }: { sav: FelsoSavAdat; helyzet: string; kerdesek: Kerdes[]; kezdo: Record<string, string>; kezdoValtozat?: string; /** R-18 8. kör: „Kép szerkesztése” — a poszthoz tett kép méretével és második nyelvű mezőivel nyílik */ kezdoMeret?: string; kezdoMasik?: Record<string, string>; /** c30 F4: a kép első és második nyelve (nincs második = nincs kapcsoló); `egyben` módban a kapcsoló bekapcsolva indul, a letöltés „Mindkettő” */ elsoNyelv?: string; masikNyelv?: string | null; egyben?: boolean; /** R-15 08c 4: a posztból nyitva — ehhez a poszthoz készül a kép */ poszt?: { id: string; nev: string } }) {
  const [valtozat, setValtozat] = useState(kezdoValtozat);
  const [mintak, setMintak] = useState<{ id: string; kep: string }[]>([]);
  const { t } = useFeliratok();
  const [ertek, setErtek] = useState<Record<string, string>>(() => Object.fromEntries(kerdesek.map((k) => [k.mezo, kezdo[k.mezo] ?? ""])));
  const [meret, setMeret] = useState<Meret>(() => ((MERETEK as readonly string[]).includes(kezdoMeret ?? "") ? (kezdoMeret as Meret) : "poszt"));
  const [valtott, setValtott] = useState(false);
  const [eredmeny, setEredmeny] = useState<Eredmeny | null>(null);
  const [kep, setKep] = useState<"keszul" | "kesz" | "hiba">("keszul");
  const [rejtve, setRejtve] = useState(false);
  const [ujra, setUjra] = useState(0);
  const kerSzam = useRef(0);
  // fotó: a kép része; feltöltés (olvasás + kicsinyítés) közben a letöltés tiltva; igazítás: húzás a képen, nagyítás
  const fotoCimke = FOTO[helyzet];
  // Román változat is: a gép fordítja a kép szövegét egy sorba, javaslatként; amíg a munkatárs nem írja át, jelvény mutatja
  // Kati 10-11: a román változat a kép MINDEN mezőjét fordítja, és az előnézet (meg a letöltés) a román képre vált — a kép kis
  // feliratai is románul (a kép nyelve „ro”). A régi egysoros „második nyelv” sor helyett teljes román kép.
  // c30 F4 (terv §5 „Images”): a „román” változat mostantól a szervezet MÁSODIK nyelve (masikNyelv; Szováta: „de”). A belső nevek (roBe,
  // roMezok…) maradtak, a jelentésük: a második nyelvű kép. A nyelvnevek feliratból jönnek (nyelv.nev.*), magyar+román cégnél betűre a régiek.
  const nyNev = (kod: string) => t(`nyelv.nev.${kod}`);
  const kodja = (sz: "elso" | "masik") => (sz === "masik" ? masikNyelv ?? "ro" : elsoNyelv);
  const masikIs = masikNyelv ? t("c30.kep.masik_is", { nyelv: nyNev(masikNyelv), nyelvul: t(`nyelv.hatarozo.${masikNyelv}`) }) : "";
  const masikNyelvenKis = masikNyelv ? t(`nyelv.hatarozo.${masikNyelv}`) : "";
  const masikNyelven = masikNyelvenKis.charAt(0).toLocaleUpperCase() + masikNyelvenKis.slice(1); // „Románul” · „În română” · „In Romanian”
  const [roBe, setRoBe] = useState(!!kezdoMasik && Object.values(kezdoMasik).some((v) => v.trim()));
  const [roMezok, setRoMezok] = useState<Record<string, string>>(kezdoMasik ?? {});
  const [roGep, setRoGep] = useState<Record<string, string> | null>(null);
  const [roTolt, setRoTolt] = useState(false);
  const [roHiba, setRoHiba] = useState(false);
  const roKesz = roBe && !roTolt && !roHiba;
  // R18 kör 6 (G): a két nyelvű kép — a előnézet nyelve (Magyar | Román) és a letöltés választása („Mit töltsünk le?”).
  // A váltó csak az előnézetet cseréli; a mentett terv (mezők) nem változik.
  const [nezet, setNezet] = useState<"elso" | "masik">("masik");
  // null = a látott nyelv; c30 F4: `egyben` módban „Mindkettő” az alap (T4)
  const [mitLetolt, setMitLetolt] = useState<"elso" | "masik" | "ket" | null>(egyben ? "ket" : null);
  const roNezet = roKesz && nezet === "masik";
  const letoltNyelv = roKesz ? (mitLetolt ?? nezet) : null;
  const [fotok, setFotok] = useState<Foto[]>([]);
  const [eu, setEu] = useState(false);
  const [toltes, setToltes] = useState<number | null>(null);
  const [igazit, setIgazit] = useState(false);
  const fajlMezo = useRef<HTMLInputElement>(null);
  const megszakitva = useRef(false);
  const huzas = useRef<{ x: number; y: number; w: number; h: number; i: number } | null>(null);

  // Kati 10-11 („visszamentem a sablonokhoz, és elveszett az eredeti posztom”): a visszaút viszi a posztot (?poszt=), és a „← Másik kép”
  // megjegyzi a kitöltést (szöveg, román szöveg, fotók) a böngészőfülben; a következő sablon ugyanehhez a poszthoz ezzel nyílik.
  const visszaCim = poszt ? `/kepek?poszt=${encodeURIComponent(poszt.id)}` : "/kepek";
  const folytatastMent = () => {
    const adat = { poszt: poszt?.id ?? null, ido: Date.now(), ertek, roBe, roMezok, eu };
    try { sessionStorage.setItem(FOLYTAT_KULCS, JSON.stringify({ ...adat, fotok })); } catch {
      try { sessionStorage.setItem(FOLYTAT_KULCS, JSON.stringify(adat)); } catch { /* a böngésző tiltja — ilyenkor csak a poszt megy tovább */ }
    }
  };
  useEffect(() => {
    let f: { poszt: string | null; ido: number; ertek?: Record<string, string>; roBe?: boolean; roMezok?: Record<string, string>; eu?: boolean; fotok?: Foto[] } | null = null;
    try { f = JSON.parse(sessionStorage.getItem(FOLYTAT_KULCS) ?? "null"); sessionStorage.removeItem(FOLYTAT_KULCS); } catch { f = null; }
    const ervenyes = !!f && f.poszt === (poszt?.id ?? null) && Date.now() - f.ido <= 30 * 60_000;
    if (f && ervenyes) {
      const mezok = new Set(kerdesek.map((k) => k.mezo as string));
      const kozos = (m?: Record<string, string>) => Object.fromEntries(Object.entries(m ?? {}).filter(([k, v]) => mezok.has(k) && typeof v === "string" && v.trim()));
      setErtek((e) => ({ ...e, ...kozos(f!.ertek) }));
      if (f.roBe && masikNyelv) { setRoMezok(kozos(f.roMezok)); setRoBe(true); }
      if (FOTO[helyzet] && f.fotok?.length) { setFotok(f.fotok.slice(0, 2)); setEu(!!f.eu); }
    }
    // c30 F4: „egyben” módban a második nyelvű kép bekapcsolva indul (a gép lefordítja, mint a kapcsoló bekapcsolásakor)
    if (egyben && masikNyelv && !roBe && !(f && ervenyes && f.roBe)) void roKapcsol(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fotoValaszt = () => fajlMezo.current?.click();
  const fajlok = async (lista: FileList | null) => {
    const f = [...(lista ?? [])].filter((x) => x.type.startsWith("image/")).slice(0, eu ? 2 : 1);
    if (!f.length) return;
    megszakitva.current = false;
    setToltes(0);
    const ki: Foto[] = [];
    for (let i = 0; i < f.length; i++) {
      const adat = await kicsinyit(f[i]!).catch(() => null);
      if (megszakitva.current) return;
      setToltes(Math.round(((i + 1) / f.length) * 100));
      if (adat) ki.push({ adat, x: 50, y: 50, nagyitas: 1 });
    }
    setToltes(null);
    if (ki.length) {
      setFotok(eu && ki.length === 1 && fotok.length === 2 ? [fotok[0]!, ki[0]!] : ki);
      setIgazit(true);
    }
  };
  const fotoModosit = (i: number, m: Partial<Foto>) => setFotok((fs) => fs.map((f, j) => (j === i ? { ...f, ...m } : f)));
  // húzás a képen: a fotó a mutatóval együtt mozdul (a kép közepe az ellenkező irányba); elengedéskor készül az új kép
  const ujjak = useRef(new Map<number, { x: number; y: number }>());
  const csipes = useRef<{ tav: number; n: number } | null>(null);
  const tav = () => {
    const [a, b] = [...ujjak.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const huzasKezd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!fotok.length) return;
    if (!igazit) {
      setIgazit(true);
      return;
    }
    ujjak.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ujjak.current.size === 2) {
      // két ujj: nagyítás (telefonon) — a húzás ilyenkor szünetel
      huzas.current = null;
      csipes.current = { tav: tav(), n: fotok[0]!.nagyitas };
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const i = eu && fotok.length === 2 && e.clientX - r.left > r.width / 2 ? 1 : 0;
    huzas.current = { x: e.clientX, y: e.clientY, w: r.width, h: r.height, i };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const huzasMozog = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ujjak.current.has(e.pointerId)) return;
    ujjak.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const huzasVege = (e: React.PointerEvent<HTMLDivElement>) => {
    const cs = csipes.current;
    if (cs && ujjak.current.size === 2) {
      const n = Math.max(1, Math.min(3, cs.n * (tav() / (cs.tav || 1))));
      setFotok((fs) => fs.map((f) => ({ ...f, nagyitas: n })));
    }
    ujjak.current.delete(e.pointerId);
    if (ujjak.current.size < 2) csipes.current = null;
    const h = huzas.current;
    huzas.current = null;
    if (!h) return;
    const f = fotok[h.i];
    if (!f) return;
    const dx = ((e.clientX - h.x) / h.w) * 100 * 1.5, dy = ((e.clientY - h.y) / h.h) * 100 * 1.5;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    fotoModosit(h.i, { x: hatar(f.x - dx), y: hatar(f.y - dy) });
  };

  const tartalomNyelven = (ro: boolean) => {
    const ki: Record<string, string> = {};
    // román nézetben a román mező; ha egy mező még nincs lefordítva (pl. szám), a magyar marad
    // (amíg a fordítás fut, a magyar kép marad — nem kérünk félig román képet)
    for (const k of kerdesek) ki[k.mezo] = ((ro ? (roMezok[k.mezo] ?? "").trim() || ertek[k.mezo] : ertek[k.mezo]) ?? "").trim();
    return { ...ki, fotok, elotte_utana: eu && fotok.length === 2, masodik: "" };
  };
  const tartalom = useCallback(() => tartalomNyelven(roNezet), [kerdesek, ertek, fotok, eu, roNezet, roMezok]); // eslint-disable-line react-hooks/exhaustive-deps
  /** a kép nyelve a kérésben: román nézetben „ro”; magyar nézetben (ha a román is be van kapcsolva) kifejezetten „hu”,
   *  különben a munkatéré (a kiszolgáló dönti el) */
  const kepNyelv = roNezet ? { nyelv: kodja("masik") } : roKesz ? { nyelv: kodja("elso") } : {}; // c30 F4: a valódi nyelvkód (a kiszolgáló hu|ro|en-t ismer, mást a munkatéréből)
  const roKapcsol = async (be: boolean) => {
    setRoBe(be);
    if (be) { setNezet("masik"); setMitLetolt(egyben ? "ket" : null); }
    setRoHiba(false);
    if (!be || kerdesek.some((k) => (roMezok[k.mezo] ?? "").trim())) return;
    setRoTolt(true);
    try {
      const mezok = Object.fromEntries(kerdesek.map((k) => [k.mezo, (ertek[k.mezo] ?? "").trim()]));
      const v = await fetch("/api/vizual/fordit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mezok, cel: kodja("masik") }) });
      if (!v.ok) throw new Error(String(v.status));
      const ki = ((await v.json()) as { mezok: Record<string, string> }).mezok ?? {};
      // a betű nélküli mező (−15%, 100+) nem fordul: az marad, ami volt
      const teljes = Object.fromEntries(kerdesek.map((k) => [k.mezo, ki[k.mezo] ?? mezok[k.mezo] ?? ""]));
      setRoMezok(teljes);
      setRoGep(teljes);
    } catch {
      setRoHiba(true);
    } finally {
      setRoTolt(false);
    }
  };

  useEffect(() => {
    const sorszam = ++kerSzam.current;
    setKep("keszul");
    const idozito = setTimeout(async () => {
      try {
        const v = await fetch("/api/vizual/helyzet", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ helyzet, meret, tartalom: tartalom(), valtozat, ...kepNyelv }),
        });
        if (sorszam !== kerSzam.current) return;
        if (!v.ok) throw new Error(String(v.status));
        const e = (await v.json()) as Eredmeny;
        setEredmeny(e);
        // ha a választott változat ezen a képen / méretben kiesett, a gép a Világosat adta — a választó is azt mutassa
        if (e.valtozat && e.valtozat !== valtozat) setValtozat(e.valtozat);
        setKep("kesz");
      } catch {
        if (sorszam === kerSzam.current) setKep("hiba");
      }
    }, 600);
    return () => clearTimeout(idozito);
  }, [helyzet, meret, tartalom, ujra, valtozat, roNezet, roKesz]); // eslint-disable-line react-hooks/exhaustive-deps

  // VZ-3: a változatok kis mintaképe — a gépelés után a nagy képpel együtt frissül (a gép kicsiben rajzolja)
  const mintaSzam = useRef(0);
  useEffect(() => {
    const sorszam = ++mintaSzam.current;
    const idozito = setTimeout(async () => {
      try {
        const v = await fetch("/api/vizual/helyzet-valtozatok", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ helyzet, meret, tartalom: tartalom(), ...kepNyelv }),
        });
        if (sorszam !== mintaSzam.current || !v.ok) return;
        setMintak(((await v.json()) as { valtozatok: { id: string; kep: string }[] }).valtozatok ?? []);
      } catch {
        /* a választó ilyenkor a régi mintaképeket mutatja */
      }
    }, 900);
    return () => clearTimeout(idozito);
  }, [helyzet, meret, tartalom, roNezet, roKesz]); // eslint-disable-line react-hooks/exhaustive-deps
  const valtozatValaszt = (v: string) => {
    if (v === valtozat) return;
    setValtozat(v);
    void fetch("/api/vizual/valtozat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ valtozat: v }) }).catch(() => undefined);
  };

  const nemFer = kep === "kesz" && eredmeny?.nemFer ? (eredmeny.nemFer as Mezo) : null;
  const tiltasOka =
    toltes !== null
      ? t("vz2.varj_fotora")
      : kep === "keszul" ? t("vz2.par_masodperc") : kep === "hiba" ? t("vz2.amint_kesz") : nemFer ? t(helyzet === "hir" ? "vz2.rovidits" : "vz2.rovidits_szoveg") : null;

  // R-15 10w: a kép készül (első betöltés, méret- vagy színváltás, átírás után) — a fotó feltöltése nem ez (annak saját sora van)
  const keszulAKep = toltes === null && kep === "keszul";
  /** a fő gomb mellé írt mondat: munka közben a nyugtató sor, különben a tiltás oka (mint eddig) */
  const gombMondat = keszulAKep ? t("r15.kozos.par_masodperc") : tiltasOka;
  // VZ-2c: a Letöltés letölti a kiválasztott méretet, és a Kész lapra visz (ugyanezen a lapon — a kitöltés megmarad)
  const [kesz, setKesz] = useState(false);
  const [melle, setMelle] = useState<string | null>(null);
  const [melleHiba, setMelleHiba] = useState(false);
  const [mindTolt, setMindTolt] = useState(false);
  const fajlNev = (m: string) => `kep-${helyzet}-${m}`;
  const fajlba = (kepB64: string, m: string, nyelvVeg = "") => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${kepB64}`;
    a.download = `${fajlNev(m)}${nyelvVeg ? `-${nyelvVeg}` : ""}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // R-15 T8: a letöltés tényét feljegyezzük a heti haladás számlálóhoz (tűz-és-felejtsd).
    void fetch("/api/halad", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fajta: "kep_letoltve" }) }).catch(() => {});
  };
  const kepSzoveg = () => kerdesek.map((k) => (ertek[k.mezo] ?? "").trim()).filter(Boolean).join("\n");
  // R-15 08c (gepezet 20–21): a kész kép a Kész képeim közé kerül; posztból nyitva rögtön a poszthoz is.
  const [poszthoz, setPoszthoz] = useState<string | null>(null); // a „Melyik poszthoz?” lap ehhez a képhez nyílt
  const [mentesFut, setMentesFut] = useState(false);
  const kepetMent = async (posztId?: string): Promise<string | null> => {
    if (!eredmeny) return null;
    try {
      const bin = atob(eredmeny.kep);
      const bajtok = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bajtok[i] = bin.charCodeAt(i);
      const nev = (kepSzoveg().split("\n")[0] || helyzet).slice(0, 80);
      const v = await fetch("/api/r15/kep", {
        method: "POST", body: bajtok, credentials: "same-origin",
        // R-18 8. kör: a beállítások a képpel a posztra kerülnek (a „Kép szerkesztése” ebből nyitja újra a szerkesztőt)
        headers: { "x-fajl-nev": encodeURIComponent(nev), ...(posztId ? { "x-poszt": posztId, "x-kep-beallitas": encodeURIComponent(JSON.stringify({ helyzet, ertek, valtozat, meret, ...(roBe && masikNyelv ? { masik: { nyelv: masikNyelv, ertek: roMezok } } : {}) })) } : {}) },
      });
      if (v.status !== 201) return null;
      return ((await v.json()) as { kep: { id: string } }).kep.id;
    } catch {
      return null;
    }
  };
  const poszthozTeszem = async () => {
    if (tiltasOka || !eredmeny || mentesFut) return;
    setMentesFut(true);
    const id = await kepetMent(poszt?.id);
    if (id && poszt) { window.location.href = `/poszt?munka=${encodeURIComponent(poszt.id)}`; return; }
    setMentesFut(false);
    if (id) setPoszthoz(id);
  };
  const melleKer = async () => {
    setMelle(null);
    setMelleHiba(false);
    try {
      const v = await fetch("/api/vizual/melle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ meret, szoveg: kepSzoveg() }) });
      if (!v.ok) throw new Error(String(v.status));
      setMelle(((await v.json()) as { szoveg: string }).szoveg);
    } catch {
      setMelleHiba(true);
    }
  };
  /** a másik nyelvű kép ugyanebben a méretben és színben (a „Mit töltsünk le?” Román/Magyar/Mindkettő választásához) */
  const nyelvenKer = async (ny: "elso" | "masik"): Promise<string | null> => {
    try {
      const v = await fetch("/api/vizual/helyzet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ helyzet, meret, tartalom: tartalomNyelven(ny === "masik"), valtozat, nyelv: kodja(ny) }) });
      return v.ok ? ((await v.json()) as Eredmeny).kep : null;
    } catch {
      return null;
    }
  };
  const [nyelvTolt, setNyelvTolt] = useState(false);
  const letolt = async () => {
    if (tiltasOka || !eredmeny || nyelvTolt) return;
    if (letoltNyelv) {
      // két nyelvű kép: a látott nyelv kész; a másikat most kérjük (egy kérés), és mindkettő „-hu” / „-ro” végű fájl lesz
      const lato = nezet;
      const masik = lato === "masik" ? "elso" : "masik";
      if (letoltNyelv === lato || letoltNyelv === "ket") fajlba(eredmeny.kep, eredmeny.meret, kodja(lato));
      if (letoltNyelv === masik || letoltNyelv === "ket") {
        setNyelvTolt(true);
        const k = await nyelvenKer(masik);
        setNyelvTolt(false);
        if (k) fajlba(k, eredmeny.meret, kodja(masik));
      }
    } else fajlba(eredmeny.kep, eredmeny.meret);
    void kepetMent(); // R-15 gepezet 18: a letöltött kép is a Kész képeim közé kerül (a letöltés nem vár rá)
    setKesz(true);
    void melleKer();
    window.scrollTo(0, 0);
    document.querySelector("main")?.scrollTo(0, 0); // telefonon a keret görög, nem az ablak (r15-lapok.css)
  };
  // Mindhárom méret: három külön fájl egymás után (VZ-2 kerdesek.md 7. — a telefon a zip-et nehezen nyitja)
  const mindharom = async () => {
    if (mindTolt) return;
    setMindTolt(true);
    try {
      for (const m of MERETEK) {
        if (m === eredmeny?.meret) { fajlba(eredmeny.kep, m); continue; }
        const v = await fetch("/api/vizual/helyzet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ helyzet, meret: m, tartalom: tartalom(), valtozat, ...kepNyelv }) });
        if (v.ok) fajlba(((await v.json()) as Eredmeny).kep, m);
      }
    } finally {
      setMindTolt(false);
    }
  };

  // R-15 08c 4–5: posztból nyitva a fő gomb „A poszthoz teszem” (mellette halkan „Csak letöltöm”); magában nyitva a Letöltés marad,
  // mellette halkan „Poszthoz teszem”. A halk gomb a mai szellem-gomb.
  const letoltesGomb = (osztaly: string) =>
    poszt ? (
      <span className={`km-vz2-r15-gombok ${osztaly}`}>
        <button type="button" className="km-vz-gomb-szellem" onClick={() => void letolt()} disabled={!!tiltasOka}>{t("r15.kep.csak_letoltom")}</button>
        <button type="button" className={tiltasOka ? "km-vz2-letolt km-vz2-letolt-tiltva" : "km-vz2-letolt"} data-r15="fo-gomb" aria-disabled={tiltasOka ? "true" : undefined} title={tiltasOka ?? undefined} onClick={() => void poszthozTeszem()}>
          {t("r15.kep.a_poszthoz_teszem")}
        </button>
      </span>
    ) : (
      <span className={`km-vz2-r15-gombok ${osztaly}`}>
        <button type="button" className="km-vz-gomb-szellem" onClick={() => void poszthozTeszem()} disabled={!!tiltasOka || mentesFut}>{t("r15.kep.poszthoz_teszem")}</button>
        {letoltesAlap("")}
      </span>
    );
  const letoltFelirat = roKesz ? t("kep.letoltom") : t("vz.letoltes");
  const letoltesAlap = (osztaly: string) =>
    keszulAKep || nyelvTolt ? (
      <DolgozoGomb osztaly={`km-vz2-letolt ${osztaly}`}>{t("r15.kep.keszitjuk")}</DolgozoGomb>
    ) : tiltasOka ? (
      <button type="button" className={`km-vz2-letolt km-vz2-letolt-tiltva ${osztaly}`} data-r15="fo-gomb" aria-disabled="true" title={tiltasOka}>
        {letoltFelirat}
      </button>
    ) : (
      <button type="button" className={`km-vz2-letolt ${osztaly}`} data-r15="fo-gomb" onClick={() => void letolt()}>
        {letoltFelirat}
      </button>
    );

  const kepBlokk = (
    <div className="km-vz2-kepblokk">
      <span className="km-vz2-hova">{t("vz2.hova_kerul")}</span>
      <div className="km-vz2-meretek" role="radiogroup" aria-label={t("vz2.hova_kerul")}>
        {MERETEK.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={meret === m}
            className={meret === m ? "km-vz2-meret km-vz2-meret-aktiv" : "km-vz2-meret"}
            onClick={() => {
              if (m !== meret) setValtott(true);
              setMeret(m);
            }}
          >
            <span className="km-vz2-meret-nev">{meret === m ? <span aria-hidden="true">✓ </span> : null}{t(`vz2.meret_${m}`)}</span>
            <span className="km-vz2-meret-al">{t(`vz2.meret_${m}_al`)}</span>
          </button>
        ))}
      </div>
      {mintak.length > 1 && (
        <div className="km-vz3-valtozatok" role="radiogroup" aria-label={t("vz3.szinek")}>
          {mintak.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={valtozat === m.id}
              className={valtozat === m.id ? "km-vz3-valtozat km-vz3-valtozat-aktiv" : "km-vz3-valtozat"}
              onClick={() => valtozatValaszt(m.id)}
            >
              <img className="km-vz3-minta" src={`data:image/png;base64,${m.kep}`} alt="" draggable={false} />
              <span className="km-vz3-nev">{t(VALTOZAT_NEV[m.id] ?? "vz3.vilagos")}</span>
            </button>
          ))}
        </div>
      )}
      {roKesz && (
        <div className="r18k-nyelv" role="radiogroup" aria-label={t("kep.nyelv")}>
          {(["elso", "masik"] as const).map((ny) => (
            <button key={ny} type="button" role="radio" aria-checked={nezet === ny} className="r18k-nyelv-gomb" onClick={() => setNezet(ny)}>
              {nyNev(kodja(ny))}
            </button>
          ))}
        </div>
      )}
      {!rejtve && (
        <div
          className={igazit && fotok.length ? `km-vz2-kep-hely km-vz2-kep-${meret} km-vz2-kep-igazit` : `km-vz2-kep-hely km-vz2-kep-${meret}`}
          onPointerDown={huzasKezd}
          onPointerMove={huzasMozog}
          onPointerUp={huzasVege}
          onPointerCancel={(e) => { huzas.current = null; ujjak.current.delete(e.pointerId); csipes.current = null; }}
        >
          {eredmeny ? (
            <img className={kep === "kesz" ? "km-vz2-kep" : "km-vz2-kep km-vz2-kep-halvany"} src={`data:image/png;base64,${eredmeny.kep}`} alt="" draggable={false} />
          ) : (
            <span className="km-vz2-kep km-vz2-kep-vaz" aria-hidden="true" />
          )}
          {igazit && fotok.length > 0 && (
            <span className="km-vz2-huzd" aria-hidden="true">
              <span>✥ {t("vz2.huzd_el")}</span>
            </span>
          )}
          {kep === "keszul" && <span className="km-vz2-kep-porgo" role="status" aria-label={t("vz2.kep_frissul")}><span className="r15-porgo" aria-hidden="true" /></span>}
          {kep === "hiba" && (
            <div className="km-vz2-kep-hiba" role="alert">
              <span>{t("vz2.kep_hiba")}</span>
              <button type="button" className="km-vz-gomb-szellem" onClick={() => setUjra((u) => u + 1)}>
                {t("vz.ujra")}
              </button>
            </div>
          )}
        </div>
      )}
      {valtott && meret === "story" && !rejtve && <span className="km-vz2-valtas">{t("vz2.meret_valtas")}</span>}
      {roKesz && letoltNyelv && (
        <div className="r18k-mit">
          <span className="km-vz2-kerdes-cimke" id="r18k-mit-cim">{t("kep.mit_letolt")}</span>
          <div className="r18k-mit-sor" role="radiogroup" aria-labelledby="r18k-mit-cim">
            {(["elso", "masik", "ket"] as const).map((ny) => (
              <button key={ny} type="button" role="radio" aria-checked={letoltNyelv === ny} className="r18k-mit-gomb" onClick={() => setMitLetolt(ny)}>
                <span className="r18k-pont" aria-hidden="true" />
                {ny === "ket" ? t("kep.mindketto") : nyNev(kodja(ny))}
              </button>
            ))}
          </div>
          {letoltNyelv === "ket" && eredmeny ? <span className="r18k-mit-info">{t("c30.kep.ket_kep", { fajl: fajlNev(eredmeny.meret), a: kodja("elso"), b: kodja("masik"), meret: MERET_PX[eredmeny.meret] ?? "" })}</span> : null}
        </div>
      )}
      <button type="button" className="km-vz2-elrejt" onClick={() => setRejtve((r) => !r)}>
        {rejtve ? `${t("vz2.kep_mutat")} ▾` : `${t("vz2.kep_elrejt")} ▴`}
      </button>
    </div>
  );

  // R-15 10b: a Kész lap fő gombja (asztalon a kártyában, telefonon az alsó sávban — egyszerre mindig csak egy látszik)
  const masolGomb = (osztaly: string) => (
    <button type="button" className={`km-vz2-letolt km-vz2-masol ${osztaly}`} data-r15="fo-gomb" disabled={!melle} onClick={() => melle && void navigator.clipboard?.writeText(melle)}>
      {t("vz2.szoveg_masolasa")}
    </button>
  );

  if (kesz && eredmeny)
    return (
      <>
        <FelsoSav adat={sav} aktiv="kepek" />
        <main className="km-lap-keret km-vz km-vz2 km-vz2-kesz">
          {/* R-15 10b: telefonon is cím („Kész a képed.”) — a régi zöld ✓ sáv helyett; a mondat a régi sávé */}
          <div className="km-vz2-kesz-fej km-vz2-kesz-fej-tel" role="status">
            <h1 className="km-vz-cim">{t("vz2.kesz_cim")}</h1>
            <p className="km-vz-bevezeto">{t("vz2.kesz_letoltve")}</p>
          </div>
          <div className="km-vz2-kesz-racs">
            <div className="km-vz2-kesz-kep">
              <img className={`km-vz2-kep km-vz2-kesz-${eredmeny.meret}`} src={`data:image/png;base64,${eredmeny.kep}`} alt="" draggable={false} />
              <span className="km-vz2-kesz-gombok">
                <button type="button" className="km-vz-gomb-szellem" onClick={() => fajlba(eredmeny.kep, eredmeny.meret)}>{t("vz2.letoltes_ujra")}</button>
                <button type="button" className="km-vz-gomb-szellem" aria-busy={mindTolt} onClick={() => void mindharom()}>{t("vz2.mindharom_meret")}</button>
              </span>
            </div>
            <div className="km-vz2-kesz-jobb">
              <div className="r15-csak-asztal km-vz2-kesz-fej">
                <h1 className="km-vz-cim">{t("vz2.kesz_cim")}</h1>
                <p className="km-vz-bevezeto">{t("vz2.kesz_letoltve_asz")}</p>
              </div>
              <div className="km-vz2-melle">
                <span className="km-vz2-melle-fej">
                  <span className="km-vz2-kerdes-cimke">{t("vz2.mit_irj_melle")}</span>
                </span>
                {melle ? (
                  <p className="km-vz2-melle-szoveg" data-r15="eredmeny">{melle}</p>
                ) : melleHiba ? (
                  <span className="km-vz2-melle-hiba">
                    <span>{t("vz2.kep_hiba")}</span>
                    <button type="button" className="km-vz-gomb-szellem" onClick={() => void melleKer()}>{t("vz.ujra")}</button>
                  </span>
                ) : (
                  <span className="km-vz2-melle-vaz" aria-hidden="true"><span /><span /><span /></span>
                )}
                {masolGomb("r15-csak-asztal")}
              </div>
              <p className="km-vz2-igy">{t(eredmeny.meret === "story" ? "vz2.igy_story" : "vz2.igy_fb")}</p>
              <span className="km-vz2-kesz-linkek">
                <Link href={visszaCim}>{t("vz2.meg_egy_kep")}</Link>
                <button type="button" className="km-vz2-link" onClick={() => setKesz(false)}>{t("vz2.mas_meretben")}</button>
              </span>
            </div>
          </div>
          <div className="r15-also-sav">{masolGomb("")}</div>
        </main>
      </>
    );

  return (
    <>
      <FelsoSav adat={sav} aktiv="kepek" />
      <main className="km-lap-keret km-vz km-vz2 km-vz2-kitolto">
        <div className="km-vz2-fej">
          <div className="km-vz2-fej-bal">
            <Link href={visszaCim} className="km-vz2-vissza" onClick={folytatastMent}>
              {t("vz2.vissza")}
            </Link>
            {poszt ? <p className="km-vz-bevezeto">{t("r15.kep.poszthoz_ehhez", { nev: poszt.nev })}</p> : null}
            <h1 className="km-vz-cim">{t(`vz2.h_${helyzet}`)}</h1>
            <p className="km-vz2-megirtuk">{t("vz2.megirtuk")}</p>
          </div>
          <div className="km-vz2-fej-jobb">
            {gombMondat && (keszulAKep ? <Info osztaly="km-vz2-tiltas-oka">{gombMondat}</Info> : <span className="km-vz2-tiltas-oka">{gombMondat}</span>)}
            {letoltesGomb("km-vz2-letolt-asztal")}
          </div>
        </div>
        <div className="km-vz2-racs">
          <div className="km-vz2-urlap">
            <div className="km-vz2-kep-telefon">{kepBlokk}</div>
            {fotoCimke && (
              <div className="km-vz2-foto">
                <span className="km-vz2-kerdes-cimke">{t(fotoCimke)}</span>
                <input ref={fajlMezo} type="file" accept="image/*" multiple={eu} hidden onChange={(e) => { void fajlok(e.target.files); e.target.value = ""; }} />
                {toltes !== null ? (
                  <div className="km-vz2-foto-doboz km-vz2-foto-tolt">
                    <span className="km-vz2-foto-tolt-sor">
                      <span>{t("vz2.foto_feltolt", { szazalek: toltes })}</span>
                      <span className="km-vz2-csik" aria-hidden="true"><span style={{ width: `${toltes}%` }} /></span>
                    </span>
                    <button type="button" className="km-vz2-link" onClick={() => { megszakitva.current = true; setToltes(null); }}>{t("kozos.megse")}</button>
                  </div>
                ) : fotok.length === 0 ? (
                  <div
                    className="km-vz2-foto-doboz km-vz2-foto-ures"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); void fajlok(e.dataTransfer.files); }}
                  >
                    <button type="button" className="km-vz2-foto-gomb" onClick={fotoValaszt}>{t("vz2.foto_hozzaad")}</button>
                    <span className="km-vz2-foto-szoveg">
                      <span className="km-vz2-tel-csak">{t("vz2.foto_honnan")}</span>
                      <span className="km-vz2-asztal-csak">{t("vz2.foto_honnan_asz")}</span>
                      {helyzet === "kesz" && !eu && (
                        <button type="button" className="km-vz2-link" onClick={() => setEu(true)}>{t("vz2.elotte_utana")}</button>
                      )}
                    </span>
                  </div>
                ) : igazit ? (
                  <div className="km-vz2-foto-doboz km-vz2-foto-igazit">
                    <span className="km-vz2-tel-csak">{t("vz2.foto_igazit_tel")}</span>
                    <span className="km-vz2-asztal-csak">{t("vz2.foto_igazit_asz")}</span>
                    <label className="km-vz2-nagyitas km-vz2-asztal-csak">
                      <span className="km-vz2-nagyitas-cimke">{t("vz2.nagyitas")}</span>
                      <span aria-hidden="true">−</span>
                      <input
                        type="range" min={1} max={3} step={0.05}
                        value={fotok[0]!.nagyitas}
                        onChange={(e) => { const n = Number(e.target.value); setFotok((fs) => fs.map((f) => ({ ...f, nagyitas: n }))); }}
                      />
                      <span aria-hidden="true">+</span>
                    </label>
                    <span className="km-vz2-foto-gombok">
                      <button type="button" className="km-vz-gomb-szellem" onClick={fotoValaszt}>{t("vz2.foto_masik")}</button>
                      <button type="button" className="km-vz-gomb-szellem" onClick={() => setIgazit(false)}>{t("vz2.foto_kesz")}</button>
                    </span>
                  </div>
                ) : (
                  // R-15 10a (R15-lapok-5): „Így jó” után egy csendes sor — a fotó kicsiben, „Másik fotó”, és (Kész munkánál) az előtte–utána.
                  // A képre koppintva továbbra is újra igazítható (VZ-2).
                  <div className="km-vz2-foto-kesz">
                    <img className="km-vz2-foto-kicsi" src={fotok[0]!.adat} alt="" draggable={false} />
                    <span className="km-vz2-foto-kesz-gombok">
                      <HalkGomb onClick={fotoValaszt}>{t("vz2.foto_masik")}</HalkGomb>
                      {helyzet === "kesz" && !eu ? <button type="button" className="km-vz2-link" onClick={() => { setEu(true); setFotok([]); }}>{t("vz2.elotte_utana")}</button> : null}
                    </span>
                  </div>
                )}
              </div>
            )}
            {kerdesek.map((k) => {
              const baj = nemFer === k.mezo && !roBe; // román nézetben a román mező alatt jelez
              return (
                <label key={k.mezo} className="km-vz2-kerdes">
                  <span className="km-vz2-kerdes-cimke">{t(k.cimke)}</span>
                  <input
                    className={baj ? "km-vz2-mezo km-vz2-mezo-baj" : "km-vz2-mezo"}
                    value={ertek[k.mezo] ?? ""}
                    onChange={(e) => setErtek((v) => ({ ...v, [k.mezo]: e.target.value }))}
                  />
                  {baj ? (
                    <span className="km-vz2-baj">
                      <span>
                        {t("vz2.nem_fer_ki")} <strong>„{rovidebb(ertek[k.mezo] ?? "")}”</strong>
                      </span>
                      <button type="button" className="km-vz-gomb-szellem" onClick={() => setErtek((v) => ({ ...v, [k.mezo]: rovidebb(v[k.mezo] ?? "") }))}>
                        {t("vz2.legyen_ez")}
                      </button>
                    </span>
                  ) : (ertek[k.mezo] ?? "").trim() === "" ? (
                    // R-15 kerdesek-5 · 3: a példa csak üres mező alatt — kitöltött mezőnél zaj (T4/T5)
                    <span className="km-vz2-pelda">{t("vz2.igy_jo", { pelda: t(`vz2.pelda_${helyzet}_${k.mezo}`) })}</span>
                  ) : null}
                </label>
              );
            })}
            {kep === "kesz" && eredmeny?.kisebbBetu && !nemFer && <span className="km-vz2-lepett">{t("vz2.gep_kisebb_betu", { mit: t("vz2.mit_cim") })}</span>}
            {/* c30 F4: a kapcsoló csak második nyelvvel létezik (nincs halott vezérlő); a felirat a szervezet második nyelvét mondja */}
            {masikNyelv ? (
            <div className="km-vz2-ro">
              <div className="km-vz2-ro-sor">
                <span>{masikIs}</span>
                <Kapcsolo be={roBe} valt={(b) => void roKapcsol(b)} cimke={masikIs} />
              </div>
              {roBe && (
                <>
                  <span className="km-vz2-ro-fej">
                    <span className="km-vz2-kerdes-cimke">{masikNyelven}</span>
                    {roGep !== null && kerdesek.every((k) => (roMezok[k.mezo] ?? "") === (roGep[k.mezo] ?? "")) && <span className="km-vz2-jelveny">{t("vz2.gep_forditotta")}</span>}
                  </span>
                  {roHiba ? <span className="km-vz2-baj"><span>{t("vz2.amint_kesz")}</span><button type="button" className="km-vz-gomb-szellem" onClick={() => void roKapcsol(true)}>{t("vz.ujra")}</button></span> : null}
                  {kerdesek.map((k) => {
                    const baj = nemFer === k.mezo;
                    return (
                      <label key={k.mezo} className="km-vz2-kerdes">
                        <span className="km-vz2-kerdes-cimke">{t(k.cimke)}</span>
                        <NovoMezo ertek={roMezok[k.mezo] ?? ""} tiltva={roTolt} valt={(v) => setRoMezok((m) => ({ ...m, [k.mezo]: v }))} />
                        {baj ? (
                          <span className="km-vz2-baj">
                            <span>{t("vz2.nem_fer_ki")} <strong>„{rovidebb(roMezok[k.mezo] ?? "")}”</strong></span>
                            <button type="button" className="km-vz-gomb-szellem" onClick={() => setRoMezok((m) => ({ ...m, [k.mezo]: rovidebb(m[k.mezo] ?? "") }))}>{t("vz2.legyen_ez")}</button>
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </>
              )}
            </div>
            ) : null}
          </div>
          <div className="km-vz2-kep-asztal">{kepBlokk}</div>
        </div>
        {/* R-15 10a/10w telefon: a közös alsó sáv (r15-lapok.css) — halk „Poszthoz teszem” + a Letöltés; a mondat (nyugtató sor / tiltás oka) fölötte */}
        <div className="r15-also-sav km-vz2-also">
          {gombMondat && (keszulAKep ? <div className="r15-also-nyugtato"><Info>{gombMondat}</Info></div> : <span className="km-vz2-tiltas-oka">{gombMondat}</span>)}
          {letoltesGomb("km-vz2-letolt-telefon")}
        </div>
        {poszthoz ? <R15PoszthozTeszem kepId={poszthoz} kepSzoveg={kepSzoveg()} onZar={() => setPoszthoz(null)} /> : null}
      </main>
    </>
  );
}
