"use client";
// R-15 · 08 Posztszöveg — „Kész a posztom?” (design/R15/rajz/R15-lapok-1.dc.html, 08). Első vázlat: DeepSeek (A3), a rajzhoz igazítva: Claude.
// Asztal: balra a posztok (Vár rád · Kész), középen a kész szöveg és egy fő gomb („Kész, másolom”), jobbra a kép és a „Más nyelven”.
// Telefon: a lista helyett egy lenyíló a lap tetején; a fő gomb a lap alján. A „Kész, másolom” után a lap a posztON marad (Kati 10-11):
// a gombon „✓ Kimásoltuk”, mellette halkan a következő poszt (a régi kész-pillanat lapváltása kikerült).
// A régi gépezet végpontjait hívja (írás, átírás, fordítás, mentés, összhang); semmi nem került le: ami hátrébb ment, a „Továbbiak” menüben van.
// R-13 13d4 (design/R13/rajz/R13-lapok.dc.html; gepezet.md 13d): elfogyott kreditnél minden AI-művelet halvány (Rövidebben · Közvetlenebbül ·
// Új változat · Továbbiak · Más nyelven · Saját ötletből), az átíró gombok alatt a mondat a kis jellel és a rövid pénz-mondat; a kész szöveg
// szerkeszthető és kimásolható — a „Kész, másolom” működik (nem kér kreditet). Az üres cellát a gép ilyenkor nem kezdi el megírni.
// Ha egy AI-művelet a keret-hibával tér vissza, a lap újraolvassa a kreditet, és elfogyottnál a hibaszöveg helyett ez az állapot jön.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PosztMunka, PosztNyelvMod, PosztTipus } from "@rogton/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas, nyelvNev } from "../_kozos/kliens";
import { masNyelvenLista } from "@rogton/profile-core";
import { KARAKTERHATAR } from "../../poszt/bemenet";
import { KETNYELVU_ELVALASZTO, ketnyelvuFelulet, ketnyelvuOsszefuz, kozosHashtagek, masodikTeendo, mezoOsszerak, mezoTorzs, tulHosszu } from "../../poszt/ketnyelvu";
import { useNyelvMn } from "../_kozos/C30NyelvMod";
import type { R15Ceg, R15Felulet, R15Halad, R15Kep, R15KeszValasz, R15PosztLista } from "../../r15/tipusok";
import { FoGomb, Halad, HalkGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import { eredetDarabok } from "./eredet";
import { forditasKell } from "./forditando";
import { R15Elonezet } from "./R15Elonezet";
import { R15KepAlatta, R15KepHely } from "./R15KepHely";
import { ElfogyottSor, sajatKreditOlvas } from "../_kozos/R13Kredit";
import { SAJAT_OTLET_MAX, SajatOtletLap, SajatOtletPanel } from "./R18SajatOtlet";
import { R18Emoji } from "./R18Emoji";
import { TipusChipek, TipusPanel, tipusCim } from "./R18Tipus";
import { C30Album, type AlbumMod } from "./C30Album";
import { kurzorhozSzur } from "./kurzor";
import type { SajatKredit } from "../../kredit/tipusok";
import "../_kozos/r15-lapok.css";

const FELULETEK: { kod: R15Felulet; nev: string }[] = [
  { kod: "fb", nev: "Facebook" },
  { kod: "ig", nev: "Instagram" },
  { kod: "li", nev: "LinkedIn" },
  // R-17 C1 (Erika #20, Csilla 10-06): a negyedik felület — a neve felirat (a másik három márkanév)
  { kod: "blog", nev: "" },
];
/** R-17 C2 (kerdesek 6): a cikk PUHA határa — a számláló csak tájékoztat, a másolást nem tiltja, színt sem vált (T7). */
const BLOG_HATAR = 2_500;
/** The three languages with their own label (`poszt.nyelv_*`); any other profile language is named by `nyelvNev` (Intl). */
const CIMKES_NYELVEK: readonly string[] = ["hu", "ro", "en"];
type Nyelv = string;

const poszt = (id: string) => `/poszt?munka=${encodeURIComponent(id)}`;

function Lenyilo({ gomb, children }: { gomb: (nyit: () => void, nyitva: boolean) => React.ReactNode; children: (zar: () => void) => React.ReactNode }) {
  const [nyitva, setNyitva] = useState(false);
  const hely = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!nyitva) return;
    const kattint = (e: MouseEvent) => { if (hely.current && !hely.current.contains(e.target as Node)) setNyitva(false); };
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape") setNyitva(false); };
    document.addEventListener("mousedown", kattint);
    document.addEventListener("keydown", bill);
    return () => { document.removeEventListener("mousedown", kattint); document.removeEventListener("keydown", bill); };
  }, [nyitva]);
  return (
    <span className="r15-menu-hely" ref={hely}>
      {gomb(() => setNyitva((v) => !v), nyitva)}
      {nyitva ? <div className="r15-menu" role="menu">{children(() => setNyitva(false))}</div> : null}
    </span>
  );
}

/** R-18 8. kör · Naptár: a „+” gombbal választott nap (sessionStorage; a „Kész, másolom” használja fel). */
const NAPTAR_NAP_KULCS = "km-naptar-nap";

export function R15Poszt({ lista, munka: kezdo, nyelv: elsoNyelv, iranytuVan, halad, ceg, kep, kepek, kredit, tulajdonos = false, nevekSzama = 0, ctaHonlap = "", javasolt = null, profilNyelvek = [], nyelvModja = "kulon" }: {
  lista: R15PosztLista;
  munka: PosztMunka | null;
  nyelv: Nyelv;
  iranytuVan: boolean;
  halad?: R15Halad;
  /** 08b — a cég az előnézetben */
  ceg: R15Ceg;
  /** 08c — a poszt képe (ha van) és a Kész képeim */
  kep: R15Kep | null;
  kepek: R15Kep[];
  /** R-13 13d4 — a saját kredit (null: nem olvasható, akkor nincs elfogyott állapot) */
  kredit?: SajatKredit | null;
  /** Csilla 10-06: a tulajdonos az elfogyott-mondat helyett halk linket kap a Kreditek nézetre („Szeretnél több kreditet?”) */
  tulajdonos?: boolean;
  /** R-18 6. kör (Kati D): a cég hivatalos neveinek száma (a „Hivatalos nevek · N” linkhez) */
  nevekSzama?: number;
  /** R-18 6. kör (Kati C): a cég honlapja — ebből a felhívás javaslata („Nézz be hozzánk: …”); üres: nincs javaslat */
  ctaHonlap?: string;
  /** R-18 7. kör: a tématerv javasolt fajtája ehhez a poszthoz (a chipen „· javasolt”); null: nincs */
  javasolt?: PosztTipus | null;
  /** c30 F2 (plan §5): the profile's content languages — the „Más nyelven” menu is hu, ro, en plus these (nothing removed) */
  profilNyelvek?: readonly string[];
  /** c30 F3 (rajz D6): a posztok nyelvi módja — „egyben”: a szervezet első két nyelve egy posztban (nézet és másolás; a két cella marad) */
  nyelvModja?: PosztNyelvMod;
}) {
  const { t, nyelv: uiNyelv } = useFeliratok();
  const masNyelvek = masNyelvenLista(profilNyelvek);
  const ctaJavaslat = ctaHonlap ? t("poszt.cta_honlap", { cim: ctaHonlap }) : "";
  const [elfogyott, setElfogyott] = useState(kredit?.elfogyott === true);
  const router = useRouter();
  const [munka, setMunka] = useState<PosztMunka | null>(kezdo);
  const [felulet, setFelulet] = useState<R15Felulet>("fb");
  const [nyelv, setNyelv] = useState<Nyelv>(elsoNyelv);
  const [szoveg, setSzoveg] = useState("");
  // R-17 C2: a cikk címe (csak a blog felületen) — a cella `cim` mezője, a szöveggel együtt ment
  const [cikkCim, setCikkCim] = useState("");
  const [fut, setFut] = useState<string | null>(null);
  const [hiba, setHiba] = useState("");
  const [kesz, setKesz] = useState<R15KeszValasz | null>(null);
  const [masolvaKulcs, setMasolvaKulcs] = useState("");
  // R-18 6. kör: a szövegmező (az emoji a kurzorához kerül) és a cselekvésre hívás (nyelvenként a munkán)
  const mezoRef = useRef<HTMLTextAreaElement>(null);
  const mentettCta = (m: PosztMunka | null, n: Nyelv) => m?.forras.cta?.[n] ?? "";
  const [cta, setCta] = useState(() => mentettCta(kezdo, elsoNyelv) || ctaJavaslat);
  const [eredetNezet, setEredetNezet] = useState(false);
  const [elozoek, setElozoek] = useState<string[]>([]);
  // 08b (gepezet 15): telefonon „Szöveg” nézetben nyílik; az „Így fog kinézni” választást a lap megjegyzi, amíg Tibor el nem hagyja
  const [nezet, setNezet] = useState<"szoveg" | "elonezet">("szoveg");
  const szovegRef = useRef("");
  const idozito = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kertIras = useRef<string>("");
  // R-18 3. kör · „Saját ötlet”: a „Saját ötletből” egy mezőt nyit (asztalon panel, telefonon alsó lap) — R18SajatOtlet.tsx
  const [sajatNyitva, setSajatNyitva] = useState(false);
  const [otlet, setOtlet] = useState("");
  const [otletFut, setOtletFut] = useState(false);
  const [otletHiba, setOtletHiba] = useState("");
  // c30 F3 (rajz D6): „egy posztban két nyelv” — a második nyelv része (a cellája szövege), és hogy a „Más nyelven” most egy harmadik nyelvet
  // mutat-e külön (akkor a mai, egy nyelvű nézet áll)
  const [szoveg2, setSzoveg2] = useState("");
  const [egyedi, setEgyedi] = useState(false);
  const mezo2Ref = useRef<HTMLTextAreaElement>(null);
  const fokusz = useRef<"a" | "b">("a");
  const szoveg2Ref = useRef("");
  szoveg2Ref.current = szoveg2;
  const elsoNy = profilNyelvek[0] ?? elsoNyelv;
  const masodikNy = profilNyelvek[1] ?? null;
  const mn = useNyelvMn();
  // c30 F10 (rajz D8a–c): a fotóalbum állapota — fotókkal a chipsor a cím alá kerül, és kész albumnál a felirat egyben módban két nyelvű
  const [albumMod, setAlbumMod] = useState<AlbumMod>("ures");

  const cella = munka?.szovegek.find((c) => c.felulet === felulet && c.nyelv === nyelv) ?? null;
  const vanSzoveg = !!cella && cella.szoveg.trim().length > 0;
  szovegRef.current = szoveg;
  // c30 F3 (rajz D6, D1): „egy posztban két nyelv” — csak az első nyelven, a blog kivételével, szöveges posztnál (a fajtáknak saját paneljük
  // van), és amíg a „Más nyelven” nem egy harmadik nyelvet mutat. A két rész két cella marad; a közös poszt nézet és másolás.
  const ketnyelvu = nyelvModja === "egyben" && !!masodikNy && ketnyelvuFelulet(felulet) && (!munka?.forras.poszt_tipus || (munka.forras.poszt_tipus === "album" && albumMod === "kesz")) && !egyedi && nyelv === elsoNy;
  const cellaB = ketnyelvu && munka ? munka.szovegek.find((c) => c.felulet === felulet && c.nyelv === masodikNy) ?? null : null;
  const teendoB = masodikTeendo(cellaB);

  // Ha nincs kiválasztott poszt, az első váró nyílik meg.
  useEffect(() => {
    if (!kezdo && lista.varo[0]) router.replace(poszt(lista.varo[0].id));
  }, [kezdo, lista.varo, router]);

  // R-18 6. kör: más nyelven a felhívás is az adott nyelvé (ha még nincs: a magyar javaslat csak az első nyelven áll)
  useEffect(() => { setCta(mentettCta(munka, nyelv) || (nyelv === elsoNyelv ? ctaJavaslat : "")); }, [munka?.id, nyelv]); // eslint-disable-line react-hooks/exhaustive-deps

  // A mező a kiválasztott cellát követi.
  useEffect(() => { setSzoveg(cella?.szoveg ?? ""); setCikkCim(cella?.cim ?? ""); }, [munka?.id, felulet, nyelv]); // eslint-disable-line react-hooks/exhaustive-deps
  const blog = felulet === "blog";
  /** a kimásolt szöveg: a blogon „cím + üres sor + szöveg” (kerdesek 6), máshol a szöveg */
  const masolando = ketnyelvu ? ketnyelvuOsszefuz(szoveg, szoveg2) : blog && cikkCim.trim() ? `${cikkCim.trim()}\n\n${szoveg}` : szoveg;

  function hibaSzoveg(kod: unknown): string {
    if (kod === "AI_KERET_KIMERULT") return t("poszt.hiba_keret");
    if (kod === "AI_KIKAPCSOLVA") return t("poszt.hiba_kikapcsolva");
    return t("poszt.hiba_ai");
  }

  const muvelet = useCallback(async (ut: string, torzs: Record<string, unknown> = {}, cel?: { felulet: R15Felulet; nyelv: Nyelv; masodik?: boolean }): Promise<PosztMunka | null> => {
    if (!munka) return null;
    const f = cel?.felulet ?? felulet;
    const n = cel?.nyelv ?? nyelv;
    setFut(ut);
    setHiba("");
    const r = await hivas(`/api/poszt/${munka.id}/${ut}`, "POST", { felulet: f, nyelv: n, ...torzs });
    setFut(null);
    if (r.statusz !== 200) {
      // R-13: a keret-hiba lehet a saját kredit vége — akkor a 13d4 állapot jön, nem a hibaszöveg
      if (r.torzs["hiba"] === "AI_KERET_KIMERULT" && (await sajatKreditOlvas())?.elfogyott) { setElfogyott(true); return null; }
      setHiba(hibaSzoveg(r.torzs["hiba"]));
      return null;
    }
    const uj = r.torzs["munka"] as PosztMunka | undefined;
    if (!uj) return null;
    setMunka(uj);
    const ujCella = uj.szovegek.find((c) => c.felulet === f && c.nyelv === n);
    if (cel?.masodik) {
      // c30 F3: a második nyelv része íródott; a gép a túl hosszú közös posztnál az első részt is rövidíthette (egyszer) — mindkettő a cellából
      setSzoveg2(ujCella?.szoveg ?? "");
      const elsoCella = uj.szovegek.find((c) => c.felulet === f && c.nyelv === nyelv);
      if (elsoCella) setSzoveg(elsoCella.szoveg);
      return uj;
    }
    setElozoek((e) => [szovegRef.current, ...e].slice(0, 20));
    setSzoveg(ujCella?.szoveg ?? "");
    setCikkCim(ujCella?.cim ?? "");
    return uj;
  }, [munka, felulet, nyelv]); // eslint-disable-line react-hooks/exhaustive-deps

  // gepezet 1: üres lap soha — ha ezen a cellán még nincs szöveg, a gép most megírja („Írjuk a posztot…”).
  useEffect(() => {
    if (!munka || vanSzoveg || fut || elfogyott || munka.forras.poszt_tipus) return; // R-13 13d4: elfogyott kreditnél a gép nem kezd írni; 7. kör: fajtánál a fajta írja
    const kulcs = `${munka.id}|${felulet}|${nyelv}`;
    if (kertIras.current === kulcs) return;
    kertIras.current = kulcs;
    void muvelet("szoveg");
  }, [munka, vanSzoveg, felulet, nyelv, fut, muvelet, elfogyott]);

  // R-18 7. kör: ha a poszt fajtája ezen a nyelven még nincs megírva (pl. másik nyelvre váltott), a gép most megírja
  const kertTipus = useRef("");
  useEffect(() => {
    const tp = munka?.forras.poszt_tipus;
    if (!munka || !tp || fut || elfogyott || munka.forras.tipus_adat?.[nyelv]?.tipus === tp) return;
    const kulcs = `${munka.id}|${tp}|${nyelv}`;
    if (kertTipus.current === kulcs) return;
    kertTipus.current = kulcs;
    void muvelet("tipus", { tipus: tp });
  }, [munka, nyelv, fut, muvelet, elfogyott]);

  // Gépelés után 800 ms-mal mentünk (a mai Posztszöveg lap szerint).
  const cimRef = useRef("");
  cimRef.current = cikkCim;
  useEffect(() => {
    if (!munka || fut || (szoveg === (cella?.szoveg ?? "") && (!blog || cikkCim === (cella?.cim ?? "")))) return;
    if (idozito.current) clearTimeout(idozito.current);
    idozito.current = setTimeout(() => {
      void hivas(`/api/poszt/${munka.id}`, "PUT", { felulet, nyelv, szoveg: szovegRef.current, ...(blog ? { cim: cimRef.current } : {}) }).then((r) => {
        const uj = r.torzs["munka"] as PosztMunka | undefined;
        if (r.statusz === 200 && uj) setMunka(uj);
      });
    }, 800);
    return () => { if (idozito.current) clearTimeout(idozito.current); };
  }, [szoveg, cikkCim, munka, felulet, nyelv, cella, fut]); // eslint-disable-line react-hooks/exhaustive-deps

  // c30 F3 · a második nyelv része: a mező a cellát követi, gépelés után ugyanúgy 800 ms-mal ment (a saját cellájába)
  useEffect(() => { setSzoveg2(cellaB?.szoveg ?? ""); }, [munka?.id, felulet, masodikNy, ketnyelvu]); // eslint-disable-line react-hooks/exhaustive-deps
  const idozito2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ketnyelvu || !munka || !masodikNy || fut || !cellaB || szoveg2 === cellaB.szoveg) return;
    if (idozito2.current) clearTimeout(idozito2.current);
    idozito2.current = setTimeout(() => {
      void hivas(`/api/poszt/${munka.id}`, "PUT", { felulet, nyelv: masodikNy, szoveg: szoveg2Ref.current }).then((r) => {
        const uj = r.torzs["munka"] as PosztMunka | undefined;
        if (r.statusz === 200 && uj) setMunka(uj);
      });
    }, 800);
    return () => { if (idozito2.current) clearTimeout(idozito2.current); };
  }, [szoveg2, munka, felulet, masodikNy, cellaB, fut, ketnyelvu]); // eslint-disable-line react-hooks/exhaustive-deps

  // c30 F3 · üres második rész soha: ha az első nyelv része megvan, a második nyelvét a gép most megírja (hű fordítás, fél kerettel)
  const kertMasodik = useRef("");
  useEffect(() => {
    if (!ketnyelvu || !munka || !masodikNy || fut || elfogyott || !vanSzoveg || (cellaB && cellaB.szoveg.trim())) return;
    const kulcs = `${munka.id}|${felulet}|${masodikNy}`;
    if (kertMasodik.current === kulcs) return;
    kertMasodik.current = kulcs;
    void muvelet("forditas", {}, { felulet, nyelv: masodikNy, masodik: true });
  }, [ketnyelvu, munka, masodikNy, fut, elfogyott, vanSzoveg, cellaB, felulet, muvelet]);

  /** A vágólapra: szöveg vagy egy még készülő szöveg (ígéret) — az utóbbinál a böngésző a koppintás pillanatában kapja meg a jogot. */
  async function vagolapra(mit: string | Promise<string>) {
    try {
      if (typeof mit !== "string" && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": mit.then((x) => new Blob([x], { type: "text/plain" })) })]);
        return;
      }
      await navigator.clipboard.writeText(await mit);
    } catch { /* a vágólap tiltva: a szöveg a mezőben marad, kézzel kimásolható */ }
  }

  /**
   * c30 F3 (plan §5 Editing): „Kész, másolom” két nyelvű posztnál. Ha a második rész hiányzik, vagy az első változott és a második még a gép
   * érintetlen szövege, a gép előbb megírja (látszik: „Írjuk…”), aztán másol. Ha a másodikat ember írta át, nem írjuk felül — a halk sor
   * mutatja („A … rész változott.”), és úgy másol, ahogy van. A közös szöveg (D1) a vágólapra; mindkét cella véglegesítve, a poszt Kész.
   */
  async function ketnyelvuKesz() {
    if (!munka || !masodikNy || !szoveg.trim()) return;
    const kell = teendoB === "ir" || teendoB === "frissit";
    const iras = kell ? muvelet("forditas", {}, { felulet, nyelv: masodikNy, masodik: true }) : Promise.resolve(munka);
    const kozos = iras.then((uj) => {
      const a = uj?.szovegek.find((c) => c.felulet === felulet && c.nyelv === nyelv)?.szoveg ?? szovegRef.current;
      const b = uj?.szovegek.find((c) => c.felulet === felulet && c.nyelv === masodikNy)?.szoveg ?? szoveg2Ref.current;
      return ketnyelvuOsszefuz(a, b);
    });
    await vagolapra(kozos);
    const vegso = await kozos;
    if (kell && !(await iras)) return; // a gép nem válaszolt: a hiba sora látszik
    if (!kell && masolvaMost) return; // már Kész és kimásolt: csak újra a vágólapra
    if (kep) void kepetLetolt(kep);
    setFut("kesz");
    await hivas(`/api/poszt/${munka.id}/veglegesites`, "POST", { felulet, nyelv: masodikNy });
    const r = await hivas(`/api/r15/poszt/${munka.id}/kesz`, "POST", { felulet, nyelv });
    setFut(null);
    if (r.statusz !== 200) { setHiba(hibaSzoveg(r.torzs["hiba"])); return; }
    setKesz(r.torzs as unknown as R15KeszValasz);
    setMasolvaKulcs(`${felulet}|${nyelv}|${vegso}`);
    let nap: string | null = null;
    try { nap = sessionStorage.getItem(NAPTAR_NAP_KULCS); } catch { /* tiltott tároló: nincs nap */ }
    if (nap && /^\d{4}-\d{2}-\d{2}$/.test(nap)) {
      const n = await hivas(`/api/poszt/${encodeURIComponent(munka.id)}/naptar`, "POST", { muvelet: "nap", nap });
      if (n.statusz === 200) { try { sessionStorage.removeItem(NAPTAR_NAP_KULCS); } catch { /* nincs */ } }
    }
    router.refresh();
  }

  // Kati 10-11 („a lap továbbment, nem voltam rá felkészülve … lehet, hogy újra ki akarom másolni”): a „Kész, másolom” a POSZTON marad —
  // a gombon „✓ Kimásoltuk” áll, amíg a szöveg (és a felület, nyelv) nem változik; újra megnyomva csak újra kimásol. Továbblépni a halk
  // „Következő” linkkel lehet. A könyvelés változatlan: a poszt Kész lesz (véglegesítve) — ez NEM „Kitettem” (az a Naptárban van).
  const masolvaMost = !!kesz && masolvaKulcs === `${felulet}|${nyelv}|${masolando}`;
  async function keszMasolom() {
    if (ketnyelvu) return ketnyelvuKesz();
    if (!munka || !szoveg.trim()) return;
    try { await navigator.clipboard.writeText(masolando); } catch { /* a vágólap tiltva: a szöveg a mezőben marad, kézzel kimásolható */ }
    if (masolvaMost) return; // már Kész és kimásolt: csak újra a vágólapra
    if (kep) void kepetLetolt(kep); // gepezet 22, kerdesek 17 (a): a szöveg a vágólapra, a kép a letöltések közé
    setFut("kesz");
    const r = await hivas(`/api/r15/poszt/${munka.id}/kesz`, "POST", { felulet, nyelv });
    setFut(null);
    if (r.statusz !== 200) { setHiba(hibaSzoveg(r.torzs["hiba"])); return; }
    setKesz(r.torzs as unknown as R15KeszValasz);
    setMasolvaKulcs(`${felulet}|${nyelv}|${masolando}`);
    // R-18 8. kör · Naptár: a nap „+” gombjáról jött (?nap=…) — a kész poszt arra a napra kerül (a húzással azonos művelet)
    let nap: string | null = null;
    try { nap = sessionStorage.getItem(NAPTAR_NAP_KULCS); } catch { /* tiltott tároló: nincs nap */ }
    if (nap && /^\d{4}-\d{2}-\d{2}$/.test(nap)) {
      const n = await hivas(`/api/poszt/${encodeURIComponent(munka.id)}/naptar`, "POST", { muvelet: "nap", nap });
      if (n.statusz === 200) { try { sessionStorage.removeItem(NAPTAR_NAP_KULCS); } catch { /* nincs */ } }
    }
    router.refresh(); // a bal lista (Vár rád · Kész) és a menü száma is frissüljön
  }

  /** A poszt képének letöltése (a Kész, másolom mellé). Ha nem sikerül, a szöveg kimásolása akkor is kész. */
  async function kepetLetolt(k: R15Kep) {
    try {
      const v = await fetch(k.url, { credentials: "same-origin" });
      if (!v.ok) return;
      const blob = await v.blob();
      const kit = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(k.nev || "kep").replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "kep"}.${kit}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch { /* a letöltés nem sikerült — a szöveg már a vágólapon van */ }
  }

  async function csakMasolas() {
    try { await navigator.clipboard.writeText(masolando); } catch { /* lásd fent */ }
  }

  /** „Megírjuk”: új saját munka a beírt ötletből (üresen is — akkor a gép választ témát), és a Posztszöveg megnyitja („Írjuk a posztot…”). */
  async function sajatOtlet() {
    const tema = otlet.replace(/\s+/g, " ").trim().slice(0, SAJAT_OTLET_MAX);
    setOtletFut(true);
    setOtletHiba("");
    const r = await hivas("/api/poszt", "POST", {
      forras: { tipus: "sajat", azonosito: "", cim: tema.slice(0, 120), url: "", szoveg: tema },
      // a munka címe (a lista és a telefonos választó mutatja, amíg a gép rövid nevet nem ad): az ötlet első hat szava
      cim: tema ? (tema.split(" ").length > 6 ? `${tema.split(" ").slice(0, 6).join(" ").replace(/[,.;:!?–—-]+$/u, "")}…` : tema) : t("r15.poszt.sajat_otlet"),
      felulet: "fb",
      nyelv: elsoNyelv,
      uj: true,
    });
    const uj = r.torzs["munka"] as PosztMunka | undefined;
    if (r.statusz === 200 && uj) { router.push(poszt(uj.id)); return; } // a lap újranyílik (key = munka id): a panel magától zárul
    setOtletFut(false);
    if (r.torzs["hiba"] === "AI_KERET_KIMERULT" && (await sajatKreditOlvas())?.elfogyott) { setElfogyott(true); setSajatNyitva(false); }
    else setOtletHiba(hibaSzoveg(r.torzs["hiba"]));
  }
  const sajatNyit = () => { setOtletHiba(""); setSajatNyitva(true); };
  // R-18 8. kör: a Kezdőlap „Saját ötletből” linkje (?sajat=1) rögtön a mezővel nyitja a lapot; a Naptár „+” gombja (?nap=…) a napot
  // megjegyzi (a lapon belüli váltások után is), és a „Kész, másolom” arra a napra teszi a posztot
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("sajat") === "1" && !elfogyott) setSajatNyitva(true);
      const nap = q.get("nap");
      if (nap && /^\d{4}-\d{2}-\d{2}$/.test(nap)) sessionStorage.setItem(NAPTAR_NAP_KULCS, nap);
    } catch { /* nincs */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sajatZar = () => { if (!otletFut) setSajatNyitva(false); };
  const sajatKozos = { ertek: otlet, setErtek: setOtlet, onKuld: () => void sajatOtlet(), onZar: sajatZar, fut: otletFut, hiba: otletHiba };
  const sajatPanel = sajatNyitva ? <SajatOtletPanel {...sajatKozos} /> : null;
  const sajatLap = sajatNyitva ? <SajatOtletLap {...sajatKozos} /> : null;

  /** R-18 6. kör (Kati E): az emoji a kurzorhoz; a kurzor utána áll, a mező fókuszban marad */
  function emojiBe(e: string) {
    // c30 F3: két nyelvű posztnál abba a részbe, ahol utoljára a kurzor állt (a mező a rész szövegét mutatja, a hashtag-sor nélkül —
    // a kurzor helye így a cella szövegében is ugyanott van)
    if (ketnyelvu && fokusz.current === "b") {
      const el2 = mezo2Ref.current;
      const veg = mezoTorzs(szoveg2Ref.current).length;
      const b = kurzorhozSzur(szoveg2Ref.current, el2?.selectionStart ?? veg, el2?.selectionEnd ?? veg, e);
      setSzoveg2(b.szoveg);
      requestAnimationFrame(() => { if (el2) { el2.focus(); el2.setSelectionRange(b.kurzor, b.kurzor); } });
      return;
    }
    const el = mezoRef.current;
    const veg = ketnyelvu ? mezoTorzs(szovegRef.current).length : szovegRef.current.length;
    const { szoveg: uj, kurzor } = kurzorhozSzur(szovegRef.current, el?.selectionStart ?? veg, el?.selectionEnd ?? veg, e);
    setSzoveg(uj);
    requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(kurzor, kurzor); } });
  }

  /** R-18 6. kör (Kati C): „Beleírom” — a felhívás a poszt utolsó bekezdése (gép és kredit nélkül); a munkán nyelvenként megmarad */
  async function ctaBeleirom() {
    if (!munka || fut) return;
    if (idozito.current) clearTimeout(idozito.current);
    setFut("cta");
    const r = await hivas(`/api/poszt/${munka.id}`, "PUT", { felulet, nyelv, szoveg: szovegRef.current, cta });
    setFut(null);
    const uj = r.torzs["munka"] as PosztMunka | undefined;
    if (r.statusz !== 200 || !uj) { setHiba(hibaSzoveg(r.torzs["hiba"])); return; }
    setElozoek((e) => [szovegRef.current, ...e].slice(0, 20));
    setMunka(uj);
    setSzoveg(uj.szovegek.find((c) => c.felulet === felulet && c.nyelv === nyelv)?.szoveg ?? "");
  }

  function visszavon() {
    const [elozo, ...tobbi] = elozoek;
    if (elozo === undefined) return;
    setElozoek(tobbi);
    setSzoveg(elozo);
  }

  function felulettValt(f: R15Felulet) {
    setFelulet(f);
    setEredetNezet(false);
  }

  function nyelvreValt(n: Nyelv) {
    setNyelv(n);
    setEredetNezet(false);
    // H1 (Kati 10-05): az üres cellán kívül az elavult, kézzel nem írt cellát is újrafordítjuk (forditando.ts — a gyökérok ott)
    if (munka && forditasKell(munka.szovegek, felulet, n)) { kertIras.current = `${munka.id}|${felulet}|${n}`; void muvelet("forditas", {}, { felulet, nyelv: n }); }
  }

  const rovidNev = munka ? (munka.forras.rovid_nev || munka.cim) : "";
  const sajatTema = munka?.forras.tipus === "sajat" && !munka.forras.kep_fajl_id ? munka.forras.szoveg.replace(/\s+/g, " ").trim().slice(0, 140) : "";
  const hirbol = munka?.forras.tipus === "hir";
  const sorszam = lista.varo.findIndex((v) => v.id === munka?.id);
  const osszhang = munka?.osszhang ?? null;
  const iranytuSor = iranytuVan && osszhang
    ? osszhang.allapot === "ok" ? t("r15.poszt.illik_iranytu") : osszhang.allapot === "ellentmond" ? osszhang.mondat : ""
    : "";
  // R-18 7. kör: a poszt fajtája (nincs = a mai szöveges poszt) és a kimenete ezen a nyelven
  const tipus: PosztTipus | null = munka?.forras.poszt_tipus ?? null;
  const tipusAdatNyers = tipus ? munka?.forras.tipus_adat?.[nyelv] : undefined;
  const tipusAdat = tipusAdatNyers && tipusAdatNyers.tipus === tipus ? tipusAdatNyers : null;
  const irjuk = !tipus && (ketnyelvu
    ? fut === "szoveg" || (!!munka && !hiba && !elfogyott && !szoveg && !(cella?.javaslat ?? "").trim())
    : fut === "szoveg" || fut === "forditas" || (!!munka && !hiba && !elfogyott && !szoveg && !(cella?.javaslat ?? "").trim()));
  // c30 F3: a második rész íródik (fordítás) — a helyén látszik az „Írjuk…”, az első rész közben olvasható
  const irjukB = ketnyelvu && fut === "forditas";
  // c30 F3 (Csilla 10-17): a közös poszt a gép egyszeri rövidítése után is hosszabb a platform határánál → egy halk mondat
  const tulHosszuMost = ketnyelvu && !irjuk && !irjukB && !fut && tulHosszu(felulet, szoveg, szoveg2);
  const tulHosszuMondat = tulHosszuMost ? t(`c30.ket.tul_hosszu_${felulet}`, { elso: mn(elsoNy) }) : "";


  // c30 F3 (rajz D6a · D6b · D6 asztali): egy mezőben az első nyelv része, „———”, a második nyelv része, a végén EGYSZER a hashtagek.
  // Mindkét rész a saját cellájába ment; a hashtagek a részek végén maradnak (a sor csak egyszer látszik). Telefonon a számláló a mező
  // bal alsó sarkában (a platform határával), asztalon a „Kész, másolom” mellett. c30 F10: a kész fotóalbum (D8b) felirata is ez.
  const szamFormazo = new Intl.NumberFormat(nyelv === "en" ? "en-GB" : nyelv === "ro" ? "ro-RO" : "hu-HU");
  // c30 F10: a válogatás után a friss poszt — a felirat cellái (a mező a cellát csak id-váltáskor tölti újra, ezért itt kézzel)
  const albumFrissult = useCallback((m: PosztMunka) => {
    setMunka(m);
    setSzoveg(m.szovegek.find((c) => c.felulet === felulet && c.nyelv === nyelv)?.szoveg ?? "");
    if (masodikNy) setSzoveg2(m.szovegek.find((c) => c.felulet === felulet && c.nyelv === masodikNy)?.szoveg ?? "");
  }, [felulet, nyelv, masodikNy]);

  const ketMezo = ketnyelvu && masodikNy ? (
              <div className="r18p-mezo-tart">
                <div className="r15p-mezo c30-ket-mezo" data-r15="eredmeny">
                  <textarea ref={mezoRef} className="c30-ket-resz" data-r15="eredmeny" data-r15-forras="gep" value={mezoTorzs(szoveg)} onFocus={() => { fokusz.current = "a"; }}
                    onChange={(e) => setSzoveg(mezoOsszerak(e.target.value, szovegRef.current))} aria-label={t("c30.ket.resz_aria", { nyelv: mn(elsoNy) })} />
                  <span className="c30-ket-elvalaszto" aria-hidden="true" data-r15="eredmeny">{KETNYELVU_ELVALASZTO}</span>
                  {teendoB === "jelez" && !irjukB ? (
                    <div className="c30-ket-elavult">
                      <Info>{t("c30.ket.valtozott", { nyelv: mn(elsoNy) })}</Info>
                      <HalkGomb onClick={() => void muvelet("forditas", {}, { felulet, nyelv: masodikNy, masodik: true })} disabled={!!fut || elfogyott}>{t("c30.ket.frissitem", { targy: t(`nyelv.targy.${masodikNy}`) })}</HalkGomb>
                    </div>
                  ) : null}
                  {irjukB ? (
                    <div className="c30-ket-irjuk" aria-live="polite"><span className="r15p-porgo" aria-hidden="true" />{t("r15.poszt.irjuk")}</div>
                  ) : (
                    <textarea ref={mezo2Ref} className="c30-ket-resz" data-r15="eredmeny" data-r15-forras="gep" value={mezoTorzs(szoveg2)} onFocus={() => { fokusz.current = "b"; }}
                      onChange={(e) => setSzoveg2(mezoOsszerak(e.target.value, szoveg2Ref.current))} aria-label={t("c30.ket.resz_aria", { nyelv: mn(masodikNy) })} />
                  )}
                  {kozosHashtagek(szoveg, szoveg2).length ? <span className="c30-ket-hashtag" data-r15="eredmeny">{kozosHashtagek(szoveg, szoveg2).join(" ")}</span> : null}
                </div>
                <span className="r15-csak-tel"><Info osztaly="c30-ket-szamlalo">{t("c30.ket.karakter_hatar", { n: masolando.length, hatar: szamFormazo.format(KARAKTERHATAR[felulet]) })}</Info></span>
                <R18Emoji beszur={emojiBe} tiltva={!!fut} />
              </div>
  ) : null;

  // ---- Bal lista (asztal) és a telefonos lenyíló ----
  const balLista = (
    <nav className="r15p-lista r15-csak-asztal" aria-label={t("r15.nav.poszt")}>
      <div className="r15p-csoport">{t("r15.poszt.var_rad")} · {lista.varo.length}</div>
      {lista.varo.map((v) => (
        <a key={v.id} href={poszt(v.id)} className={v.id === munka?.id ? "r15p-elem r15p-elem-aktiv" : "r15p-elem"} aria-current={v.id === munka?.id ? "page" : undefined}>{v.rovid_nev}</a>
      ))}
      <div className="r15p-csoport r15p-csoport-kesz">{t("r15.poszt.kesz_csoport")} · {lista.kesz.length}</div>
      {lista.kesz.map((k) => (
        <a key={k.id} href={poszt(k.id)} className={k.id === munka?.id ? "r15p-elem r15p-elem-aktiv r15p-elem-kesz" : "r15p-elem r15p-elem-kesz"}>
          <span>{k.rovid_nev}</span><span className="r15p-pipa" aria-hidden="true">✓</span>
        </a>
      ))}
      <span className="r15p-sajat"><HalkLink onClick={sajatNyit} disabled={elfogyott}>{t("r15.poszt.sajat_otlet")}</HalkLink></span>
    </nav>
  );

  const telValaszto = munka ? (
    <div className="r15p-tel-valaszto r15-csak-tel">
      <Lenyilo gomb={(nyit, nyitva) => (
        <button type="button" className="r15p-tel-valaszto-gomb" aria-haspopup="menu" aria-expanded={nyitva} onClick={nyit}>
          {rovidNev}{sorszam >= 0 ? ` · ${sorszam + 1}/${lista.varo.length}` : ""} ▾
        </button>
      )}>
        {() => (
          <>
            {lista.varo.map((v) => <a key={v.id} className="r15-menu-sor" role="menuitem" href={poszt(v.id)}>{v.rovid_nev}</a>)}
            {lista.kesz.map((k) => <a key={k.id} className="r15-menu-sor" role="menuitem" href={poszt(k.id)}>{k.rovid_nev} ✓</a>)}
            <button type="button" className="r15-menu-sor" role="menuitem" onClick={sajatNyit} disabled={elfogyott}>{t("r15.poszt.sajat_otlet")}</button>
          </>
        )}
      </Lenyilo>
      {/* R-18 8. kör (Kati 10-13): telefonon is egy koppintás — halk link a választó mellett (a menüben is megvan) */}
      <span className="r18k8-sajat-tel"><HalkLink onClick={sajatNyit} disabled={elfogyott}>{t("r15.poszt.sajat_otlet")}</HalkLink></span>
    </div>
  ) : null;

  // ---- Nincs poszt ----
  // Tibor-bíráló / kirakás-zár 09-30 (Csilla döntése, 0140): üres fiókon is egy kérdés + egy fő gomb (T1, T2) — a „Saját ötletből”
  // itt a lap EGYETLEN fő gombja (asztalon középen, telefonon az alsó sávban); a bal lista halk linkje asztalon marad, mert a rajz része.
  if (!munka) {
    return (
      <main className="km-lap-keret r15-lap r15p-lap">
        <div className={sajatNyitva ? "r15p-racs r18s-nyitva" : "r15p-racs"}>
          {balLista}
          <div className="r15p-kozep">
            {sajatPanel}
            <KerdesCim cim={t("r15.poszt.ures_kerdes")} alcim={t("r15.poszt.ures_alcim")} />
            <div className="r15-kartya-gombsor r15-csak-asztal">
              <FoGomb onClick={sajatNyit} disabled={elfogyott}>{t("r15.poszt.sajat_otlet")}</FoGomb>
            </div>
            {hiba ? <Info>{hiba}</Info> : null}
          </div>
        </div>
        <div className="r15-also-sav">
          <FoGomb onClick={sajatNyit} disabled={elfogyott}>{t("r15.poszt.sajat_otlet")}</FoGomb>
        </div>
        {sajatLap}
      </main>
    );
  }

  const masNyelven = (
    <Lenyilo gomb={(nyit, nyitva) => (
      <HalkLink onClick={nyit} aria-haspopup="menu" aria-expanded={nyitva} disabled={elfogyott}>{t("r15.poszt.mas_nyelven")}</HalkLink>
    )}>
      {(zar) => (
        <>
          {masNyelvek.map((n) => (
            <button key={n} type="button" className="r15-menu-sor" role="menuitem" aria-current={n === nyelv ? "true" : undefined} disabled={!!fut}
              onClick={() => {
                zar();
                // c30 F3: „egyben” módban az első két nyelv a közös poszt; egy harmadik nyelv a mai, egy nyelvű nézetben nyílik
                if (nyelvModja === "egyben" && masodikNy && (n === elsoNy || n === masodikNy)) { setEgyedi(false); setNyelv(elsoNy); setEredetNezet(false); return; }
                if (nyelvModja === "egyben" && masodikNy) setEgyedi(true);
                nyelvreValt(n);
              }}>{CIMKES_NYELVEK.includes(n) ? t(`poszt.nyelv_${n}`) : nyelvNev(n, uiNyelv)}</button>
          ))}
        </>
      )}
    </Lenyilo>
  );

  // R-18 6. kör (Kati A): a régi „Továbbiak ▾” helyett minden átírás látható — halk gombsor, alatta halk linksor
  const atiro = (kulcs: string, felirat: string, muv: Record<string, unknown>, kellSzoveg = true) => (
    <HalkGomb key={kulcs} disabled={!!fut || (kellSzoveg && !vanSzoveg) || elfogyott} onClick={() => void muvelet(kulcs === "uj" ? "szoveg" : "atiras", muv)}>{felirat}</HalkGomb>
  );
  const atiroSor = (
    <div className="r18p-chipek" role="group" aria-label={t("r15.poszt.atirnad")}>
      {atiro("rovidebb", t("r15.poszt.rovidebben"), { muvelet: "rovidebb" })}
      {atiro("hosszabb", t("poszt.hosszabb"), { muvelet: "hosszabb" })}
      {atiro("kozvetlenebb", t("r15.poszt.kozvetlenebbul"), { muvelet: "kozvetlenebb" })}
      {atiro("targyilagosabb", t("poszt.targyilagosabb"), { muvelet: "targyilagosabb" })}
      {atiro("hashtag", `+ ${t("poszt.hashtag")}`, { muvelet: "hashtag" })}
      {atiro("uj", t("r15.poszt.uj_valtozat"), {}, false)}
    </div>
  );
  const eredetiHir = hirbol && munka.forras.url ? munka.forras.url : "";
  const linkSor = (
    <div className="r18p-linkek">
      {elozoek.length > 0 ? <HalkLink onClick={visszavon}>↶ {t("poszt.visszavonas")}</HalkLink> : null}
      {eredetiHir ? <a className="r15-halk-link" href={eredetiHir} target="_blank" rel="noopener noreferrer">{t("poszt.eredeti_hir")}</a> : null}
      {masNyelven}
      <a className="r15-halk-link" href={`/fiok/nevek?vissza=${encodeURIComponent(poszt(munka.id))}`}>{t("nevek.link", { n: nevekSzama })}</a>
      {/* a régi menü „Mit írtál át?” nézete megmarad (nincs a rajzon, de funkciót nem veszünk el) */}
      {!ketnyelvu && vanSzoveg && (cella?.javaslat ?? "").trim() ? <HalkLink onClick={() => setEredetNezet((v) => !v)}>{eredetNezet ? t("poszt.eredet_vissza") : t("poszt.eredet_gomb")}</HalkLink> : null}
      <span className="r15-csak-asztal"><HalkLink onClick={() => void csakMasolas()}>{t("r15.poszt.csak_masolas")}</HalkLink></span>
    </div>
  );
  const ctaMentett = mentettCta(munka, nyelv);
  const ctaBlokk = (
    <div className="r18p-cta">
      <label className="r18p-cta-cimke" htmlFor="r18p-cta">{t("poszt.cta_cimke")} <span className="r18p-halk">· {t("poszt.nem_kotelezo")}</span></label>
      <div className="r18p-cta-sor">
        <input id="r18p-cta" className="r18p-input" type="text" maxLength={300} value={cta} placeholder={t("poszt.cta_pelda")} onChange={(e) => setCta(e.target.value)} disabled={!!fut} />
        <HalkGomb onClick={() => void ctaBeleirom()} disabled={!!fut || (!cta.trim() && !ctaMentett) || !vanSzoveg}>{t("poszt.cta_gomb")}</HalkGomb>
      </div>
      <span className="r18p-halk">{!ctaMentett && ctaJavaslat && cta === ctaJavaslat ? t("poszt.cta_megj") : t("poszt.cta_megj_ures")}</span>
    </div>
  );
  const frissit = () => router.refresh();
  // a kimásolás után a halk továbblépés: a következő váró poszt, ha van (különben nincs link — a lap marad, ahogy Kati kérte)
  const kovetkezoId = kesz?.kovetkezo_id && kesz.kovetkezo_id !== munka.id ? kesz.kovetkezo_id : null;
  const tovabbLink = masolvaMost && kovetkezoId ? <HalkLink href={poszt(kovetkezoId)}>{t("r15.kesz.kovetkezo", { n: kesz!.varo_db })}</HalkLink> : null;
  const blogSzamlalo = t("r17.poszt.karakter_blog", { n: szamFormazo.format(cikkCim.length + szoveg.length), hatar: szamFormazo.format(BLOG_HATAR) });
  const elonezet = (
    <R15Elonezet
      felulet={felulet}
      szoveg={ketnyelvu ? masolando : szoveg}
      cim={cikkCim}
      ceg={ceg}
      kep={kep}
      kepHelye={<R15KepHely posztId={munka.id} kepek={kepek} uzenet={felulet !== "ig"} onValtozott={frissit} />}
      {...(elfogyott ? {} : { onRovidebben: () => void muvelet("atiras", { muvelet: "rovidebb" }) })}
    />
  );

  return (
    <main className="km-lap-keret r15-lap r15p-lap">
      <div className={`r15p-racs${sajatNyitva ? " r18s-nyitva" : ""}${tipus ? " r18k7-racs" : ""}`}>
        {balLista}

        <div className="r15p-kozep">
          {sajatPanel}
          {telValaszto}
          {tipus === "album" ? null : <div className="r15-fej r15p-fej">
            {tipus ? (
              <KerdesCim cim={t(tipusCim(tipus).cim)} alcim={t(tipusCim(tipus).alcim)} />
            ) : (
              <>
                <span className="r15-csak-asztal"><KerdesCim cim={t("r15.poszt.kerdes")} alcim={hirbol ? t("r15.poszt.alcim", { nev: rovidNev }) : t("r15.poszt.alcim_rovid")} /></span>
                <span className="r15-csak-tel"><KerdesCim cim={t("r15.poszt.kerdes")} alcim={t("r15.poszt.alcim_rovid")} /></span>
              </>
            )}
          </div>}

          {tipus === "album" ? (
            // c30 F10 (rajz D8a–c): a fotóalbum — fotó nélkül a mai album-panel (+ „Fotók hozzáadása”), fotókkal a feltöltés / a kész album
            <C30Album
              key={munka.id}
              posztId={munka.id}
              felulet={felulet}
              nyelv={nyelv}
              munkaFrissult={albumFrissult}
              onMod={setAlbumMod}
              uresFej={<div className="r15-fej r15p-fej"><KerdesCim cim={t(tipusCim(tipus).cim)} alcim={t(tipusCim(tipus).alcim)} /></div>}
              uresPanel={<div className="r18k7-tipus">
              <TipusPanel
                key={`${tipus}|${nyelv}`}
                tipus={tipus}
                adat={fut === "tipus" ? null : tipusAdat}
                posztId={munka.id}
                fut={!!fut}
                ujValtozat={() => void muvelet("tipus", { tipus })}
                mezo={<div className="r18p-mezo-tart"><textarea ref={mezoRef} className="r15p-mezo" data-r15="eredmeny" data-r15-forras="gep" value={szoveg} onChange={(e) => setSzoveg(e.target.value)} aria-label={t("album.cim")} /><R18Emoji beszur={emojiBe} tiltva={!!fut} /></div>}
                keszGomb={<FoGomb onClick={() => void keszMasolom()} disabled={!!fut || !vanSzoveg} aria-live="polite">{masolvaMost ? t("r18.poszt.kimasoltuk") : t("r15.poszt.kesz_masolom")}</FoGomb>}
              />
              {hiba ? <Info>{hiba}</Info> : null}
              {elfogyott ? <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor> : null}
            </div>}
              chipek={<TipusChipek tipus={tipus} javasolt={javasolt} tiltva={!!fut || elfogyott} valaszt={(x) => void muvelet("tipus", { tipus: x })} />}
              mezo={ketMezo ?? <div className="r18p-mezo-tart"><textarea ref={mezoRef} className="r15p-mezo" data-r15="eredmeny" data-r15-forras="gep" value={szoveg} onChange={(e) => setSzoveg(e.target.value)} aria-label={t("album.cim")} /><R18Emoji beszur={emojiBe} tiltva={!!fut} /></div>}
              konyvel={() => void keszMasolom()}
              tiltva={!!fut || elfogyott}
            />
          ) : tipus ? (
            // a rajz szerint csak a videó-táblázat áll dobozban; a szavazás, az album és a kártya mezői doboz nélkül (nincs doboz a dobozban)
            <div className={tipus === "video" ? "r15p-munka r18k7-tipus" : "r18k7-tipus"} {...(tipus === "video" ? { "data-r15": "teendo" } : {})}>
              <TipusPanel
                key={`${tipus}|${nyelv}`}
                tipus={tipus}
                adat={fut === "tipus" ? null : tipusAdat}
                posztId={munka.id}
                fut={!!fut}
                ujValtozat={() => void muvelet("tipus", { tipus })}
                mezo={<div className="r18p-mezo-tart"><textarea ref={mezoRef} className="r15p-mezo" data-r15="eredmeny" data-r15-forras="gep" value={szoveg} onChange={(e) => setSzoveg(e.target.value)} aria-label={t("album.cim")} /><R18Emoji beszur={emojiBe} tiltva={!!fut} /></div>}
                keszGomb={<FoGomb onClick={() => void keszMasolom()} disabled={!!fut || !vanSzoveg} aria-live="polite">{masolvaMost ? t("r18.poszt.kimasoltuk") : t("r15.poszt.kesz_masolom")}</FoGomb>}
              />
              {hiba ? <Info>{hiba}</Info> : null}
              {elfogyott ? <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor> : null}
            </div>
          ) : (<>
          <div className="r15p-fulek" role="group" aria-label={t("r15.nav.poszt")}>
            {FELULETEK.map((f) => (
              <button key={f.kod} type="button" aria-pressed={f.kod === felulet} className={f.kod === felulet ? "r15p-ful r15p-ful-aktiv" : "r15p-ful"} onClick={() => felulettValt(f.kod)} disabled={!!fut}>{f.kod === "blog" ? t("r17.poszt.felulet_blog") : f.nev}</button>
            ))}
          </div>

          <div className={nezet === "elonezet" && !irjuk ? "r15p-munka r15p-munka-tel-rejtve" : "r15p-munka"} data-r15="teendo">
            {irjuk ? (
              <div className="r15p-mezo r15p-irjuk" data-r15="eredmeny" aria-live="polite"><span className="r15p-porgo" aria-hidden="true" />{t("r15.poszt.irjuk")}</div>
            ) : eredetNezet ? (
              <div className="r15p-mezo" data-r15="eredmeny">
                {eredetDarabok(cella?.javaslat ?? "", szoveg).map((d, i) => (
                  <span key={`${i}-${d.sajat ? "e" : "a"}`} className={d.sajat ? "r15p-eredet-ember" : undefined}>{d.szoveg}</span>
                ))}
              </div>
            ) : ketnyelvu && masodikNy ? (
              // c30 F3 (rajz D6a · D6b · D6 asztali): a két nyelvű mező (lent, `ketMezo`) — a fotóalbum (F10, D8b) is ezt használja
              ketMezo
            ) : (
              <>
                {/* R-17 C2: a blogon a cikk címe külön sor a szöveg fölött (aria: „A cikk címe”) */}
                {blog ? <input className="r15p-mezo r17-cikk-cim" value={cikkCim} maxLength={90} onChange={(e) => setCikkCim(e.target.value)} aria-label={t("r17.poszt.cikk_cim")} /> : null}
                <div className="r18p-mezo-tart">
                  <textarea ref={mezoRef} className="r15p-mezo" data-r15="eredmeny" data-r15-forras="gep" value={szoveg} onChange={(e) => setSzoveg(e.target.value)} aria-label={t("r15.poszt.kerdes")} />
                  <R18Emoji beszur={emojiBe} tiltva={!!fut} />
                </div>
              </>
            )}

            {/* c30 F3 (Csilla 10-17): ha a gép egyszeri rövidítése után is hosszabb a platform határánál — egy halk mondat a számláló alatt
                (telefonon a mező alatt, asztalon a „Kész, másolom” sora alatt); nincs riasztó szín (T7), a szöveget nem vágjuk */}
            {tulHosszuMost ? <span className="r15-csak-tel"><Info>{tulHosszuMondat}</Info></span> : null}
            {atiroSor}
            {/* telefonon a linksor az „Így fog kinézni” nézetben áll (rajz: „Poszt · előnézet + képméret · telefon”) */}
            <div className="r15-csak-asztal">{linkSor}</div>
            {/* c30 F3 · D15: két nyelvű posztnál nincs külön felhívás-mező — a felhívást a gép írja mindkét részbe */}
            {ketnyelvu ? null : ctaBlokk}
            {elfogyott ? (
              <>
                <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor>
                <Info>{t("r13.kredit.penz_rovid")}</Info>
              </>
            ) : null}

            {hiba ? <Info>{hiba}</Info> : null}
            {iranytuSor ? <Info {...(osszhang?.allapot === "ok" ? { osztaly: "r18p-ok" } : {})}>{iranytuSor}</Info> : null}

            <div className="r15p-kesz-sor r15-csak-asztal">
              <FoGomb onClick={() => void keszMasolom()} disabled={!!fut || !vanSzoveg} aria-live="polite">{masolvaMost ? t("r18.poszt.kimasoltuk") : t("r15.poszt.kesz_masolom")}</FoGomb>
              {/* R-18 8. kör (Kati 10-13): a kép letöltése a „Kész, másolom” mellett (halk) — a „Kész, másolom” továbbra is letölti */}
              {kep ? <HalkGomb onClick={() => void kepetLetolt(kep)}>{t("r18.poszt.kep_letoltese")}</HalkGomb> : null}
              {tovabbLink}
              <Info>{blog ? blogSzamlalo : ketnyelvu ? t("c30.ket.karakter", { n: masolando.length }) : t("r15.poszt.karakter", { n: szoveg.length })}</Info>
            </div>
            {tulHosszuMost ? <span className="r15-csak-asztal"><Info>{tulHosszuMondat}</Info></span> : null}
            {blog ? <Info osztaly="r15-csak-tel">{blogSzamlalo}</Info> : null}
            {/* telefonon a halk továbblépés a dobozban (az alsó sáv egy gombnyi marad — a Visszajelzés helye nem csúszik) */}
            {tovabbLink ? <span className="r15-csak-tel r18p-tovabb-tel">{tovabbLink}</span> : null}
          </div>

          {/* c30 F3 (Csilla 10-17): a poszt elöl — a „Szöveg / Így fog kinézni” fülek a poszt alatt; az előnézet a fülek alatt nyílik */}
          <div className="r15p-nezet r15-csak-tel" role="tablist">
            <button type="button" role="tab" aria-selected={nezet === "szoveg"} className={nezet === "szoveg" ? "r15p-nezet-ful r15p-nezet-aktiv" : "r15p-nezet-ful"} onClick={() => setNezet("szoveg")}>{t("r15.elo.szoveg")}</button>
            <button type="button" role="tab" aria-selected={nezet === "elonezet"} className={nezet === "elonezet" ? "r15p-nezet-ful r15p-nezet-aktiv" : "r15p-nezet-ful"} onClick={() => setNezet("elonezet")}>{t("r15.elo.igy_fog")}</button>
          </div>

          {nezet === "elonezet" && !irjuk ? (
            <div className="r15p-tel-elonezet r15-csak-tel">
              {linkSor}
              {elonezet}
              <R15KepAlatta posztId={munka.id} kep={kep} kepek={kepek} onValtozott={frissit} szerkHelyzet={munka.forras.kep_beallitas?.helyzet ?? ""} />
            </div>
          ) : null}
          </>)}

          {/* c30 F3 (Csilla 10-17, mindkét módban): a poszt jön elsőnek, mint a D6 rajzon — a cím alatt a felület-fülek és a mező. A téma
              sora, a heti haladás és a poszt fajtája a poszt ALÁ költözött, halkan (semmi nem tűnt el; a fő gomb a „Kész, másolom” marad). */}
          <div className="c30-poszt-alatt">
              {halad ? (
                <Halad arany={(kesz?.halad ?? halad).arany} osztaly="r15-csak-asztal">{t("r15.kozos.halad_rovid", { poszt: (kesz?.halad ?? halad).poszt_kesz, kep: (kesz?.halad ?? halad).kep_letoltve })}</Halad>
              ) : null}
              {/* R-18 3. kör (rajz: „Saját ötlet · írjuk”): saját ötletnél a téma halk sorban — ebből tudja Tibor, miről íródik */}
              {/* c30 F10: a fotóalbum feltöltése / kész albuma alatt nincs ez a sor (rajz D8a–c: a fotók alatt semmi) */}
              {sajatTema && !(tipus === "album" && albumMod !== "ures") ? <Info>{t("r18.sajat.tema", { tema: sajatTema })}</Info> : null}
            {/* R-18 7. kör: a poszt fajtája (rajz: chipsor) — c30 F3 óta a poszt alatt; c30 F10: fotókkal a cím alatt (rajz D8a–c) */}
            {tipus === "album" && albumMod !== "ures" ? null : <TipusChipek tipus={tipus} javasolt={javasolt} tiltva={!!fut || elfogyott} valaszt={(x) => void muvelet("tipus", { tipus: x })} />}
          </div>
        </div>

        {tipus ? null : <aside className="r15p-oldal r15-csak-asztal">
          <div className="r15p-oldal-cim">{t("r15.elo.igy_fog")}</div>
          {irjuk ? null : elonezet}
          {/* c30 F3 (rajz D6 asztali): közvetlenül az előnézet alatt — a hírfolyam az első sorokat mutatja, ezek az első nyelven vannak */}
          {ketnyelvu && !irjuk && felulet !== "blog" ? <Info>{t(`c30.ket.elso_sorok_${felulet}`, { elso: t(`nyelv.hatarozo.${elsoNy}`) })}</Info> : null}
          {irjuk ? null : <R15KepAlatta posztId={munka.id} kep={kep} kepek={kepek} onValtozott={frissit} szerkHelyzet={munka.forras.kep_beallitas?.helyzet ?? ""} />}
        </aside>}
      </div>

      {tipus ? null : (
        <div className={kep ? "r15-also-sav r18p-also-ket" : "r15-also-sav"}>
          {/* R-18 8. kör (Kati 10-13: „Kép letöltése a Kész, másolom mellé”): telefonon is a fő gomb mellett, halkan (T2) — nem a dobozban */}
          {kep ? <HalkGomb onClick={() => void kepetLetolt(kep)}>{t("r18.poszt.kep_letoltese")}</HalkGomb> : null}
          <FoGomb onClick={() => void keszMasolom()} disabled={!!fut || !vanSzoveg} aria-live="polite">{masolvaMost ? t("r18.poszt.kimasoltuk") : t("r15.poszt.kesz_masolom")}</FoGomb>
        </div>
      )}
      {sajatLap}
    </main>
  );
}
