"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KATEGORIAK, TARTALOMNYELVEK, kategoria, szervezetTipus, type OnboardingPiszkozat, type Tartalomnyelv } from "@rogton/contracts";
import { javaslatokBeolvaszt, leirasTulRovid } from "@rogton/onboarding-core";
import { useFeliratok } from "../../nyelv/kliens";
import { Nyelvvalaszto } from "../_kozos/Nyelvvalaszto";
import { Marka } from "../_kozos/Marka";
import { ModValto } from "../_kozos/ModValto";
import { Visszajelzes } from "../_kozos/Visszajelzes";
import { hivas, nyelvNev, usePiszkozat } from "./_kozos/keret";
import { Baj, DolgozoGomb, FoGomb, HalkGomb, HalkLink, Info, KerdesCim, Reszletek, Teendo } from "../_kozos/R15";
import "../_kozos/r15-lapok.css";
import { MentesAllapot } from "../_kozos/kliens";

type Lap = "urlap" | "dolgozik" | "atnezes";
type TetelAllapot = "var" | "keszul" | "kesz" | "hiba";
type HfTervezet = {
  celok: string[];
  temak: { nev: string; nevvaltozatok: string[]; megkulonboztetes: string }[];
  foldrajzi_fokusz: string;
  nyelvek: string[];
  kizarasok: string[];
  idozites: { mod: "kezi" | "napi"; ora: number; perc: number; idozona: string };
  szabad_szoveg: string;
};
type OldalAjanlat = { cim: string; nev: string; nyelv: string; leiras: string; miert: string };

const TETEL_KULCSOK = [
  "eb_tetel_bemutatkozas",
  "eb_tetel_kiknek",
  "eb_tetel_cel",
  "eb_tetel_hangnem",
  "eb_tetel_temak",
  "eb_tetel_oldalak",
] as const;

// A cél-kockák kulcsai (a felirat kulcsából származtatjuk a stabil azonosítót)
const CEL_KOCKAK = [
  "eb_cel_tobb_vevo",
  "eb_cel_ismertseg",
  "eb_cel_bizalom",
  "eb_cel_erdeklodok",
  "eb_cel_kozosseg",
  "eb_cel_munkatarsak",
] as const;

const HANG_KOCKAK = [
  "eb_hang_baratsagos",
  "eb_hang_szakmai",
  "eb_hang_oktato",
  "eb_hang_elado",
  "eb_hang_nyugodt",
  "eb_hang_jatekos",
  "eb_hang_tavolsagtarto",
  "eb_hang_tomor",
] as const;

const NYELV_ELSO_HAROM: Tartalomnyelv[] = ["hu", "ro", "en"];

// A hangnem-leírás első sorában tárolt jelölő: "[barátságos, nyugodt]"
function hangnemJelolo(nevek: string[]): string {
  return `[${nevek.join(", ")}]`;
}
function hangnemJeloloOlvas(leiras: string): string[] {
  const elso = leiras.split("\n")[0]?.trim() ?? "";
  if (!elso.startsWith("[") || !elso.endsWith("]")) return [];
  return elso
    .slice(1, -1)
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}
function hangnemTorzs(leiras: string): string {
  const sorok = leiras.split("\n");
  if (sorok[0]?.trim().startsWith("[")) return sorok.slice(1).join("\n").trim();
  return leiras.trim();
}

export function ElsoBeallitas({ szervezetNev, kezdo, kezdoFrissitve, fiokNev }: { szervezetNev: string; kezdo: OnboardingPiszkozat; kezdoFrissitve: string | null; fiokNev: string }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const { piszkozat, setPiszkozat, allapot, mentMost, mentveEkkor } = usePiszkozat(kezdo, kezdoFrissitve);
  const b = piszkozat.bemutatkozas;
  const k = piszkozat.kommunikacio;

  const [lap, setLap] = useState<Lap>(() => (b.osszefoglalo.trim() && k.celkozonseg.trim() ? "atnezes" : "urlap"));
  const [tetelek, setTetelek] = useState<Record<string, TetelAllapot>>(() => {
    const alap: Record<string, TetelAllapot> = {};
    for (const kulcs of TETEL_KULCSOK) alap[kulcs] = "var";
    return alap;
  });
  const [folyamatHiba, setFolyamatHiba] = useState(false);
  const [hfTervezet, setHfTervezet] = useState<HfTervezet | null>(null);
  const [oldalAjanlat, setOldalAjanlat] = useState<OldalAjanlat[]>([]);
  const [oldalAjanlatFut, setOldalAjanlatFut] = useState(false);
  const [jeloltOldalak, setJeloltOldalak] = useState<Set<string>>(new Set());
  const [sajatOldal, setSajatOldal] = useState("");
  const [ujTema, setUjTema] = useState("");
  const [sajatNevMod, setSajatNevMod] = useState<"csak_szervezet" | "nevemet_is">("csak_szervezet");
  const [sajatNev, setSajatNev] = useState("");
  const [sajatCel, setSajatCel] = useState("");
  const [sajatHang, setSajatHang] = useState("");
  const [sajatNyelv, setSajatNyelv] = useState("");
  const [tobbNyelv, setTobbNyelv] = useState(false);
  const [hangnemFut, setHangnemFut] = useState(false);
  const [hibasMezok, setHibasMezok] = useState<Set<string>>(new Set());
  const [jovahagyFut, setJovahagyFut] = useState(false);
  const [jovahagyHiba, setJovahagyHiba] = useState(false);
  // A8: a „Mivel foglalkoztok?” kevés — „leiras”: az AI hívása előtt mérve vagy a gép mondta; „weboldal”: az oldalból nem derült ki
  const [kevesForras, setKevesForras] = useState<null | "leiras" | "weboldal">(null);
  // R-15 02 (gepezet-4 · 2): csak megjelenítési állapot — „Nincs weboldalunk” nyitja a leírást; „Átírom” a két kártyán; Részletek
  const [leirasNyitva, setLeirasNyitva] = useState(false);
  const [atir1, setAtir1] = useState(false);
  const [atir2, setAtir2] = useState(false);
  const [reszletekNyitva, setReszletekNyitva] = useState(false);
  const indult = useRef(false);
  const hangnemIdozito = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hangnemUtolso = useRef<string>("");
  const tervezetLekerve = useRef(false);

  async function tervezetLeker(): Promise<HfTervezet | null> {
    const r = await hivas("/api/hirfigyelo/beallitas", "GET");
    if (r.statusz === 401) { router.push("/belepes"); return null; }
    if (r.statusz !== 200) return null;
    const hf = (r.torzs["hirfigyelo"] as { tervezet?: HfTervezet | null } | undefined)?.tervezet;
    return hf ?? null;
  }

  function modositBemutatkozas(resz: Partial<OnboardingPiszkozat["bemutatkozas"]>) {
    setPiszkozat((p) => ({ ...p, bemutatkozas: { ...p.bemutatkozas, ...resz } }));
  }
  function modositKommunikacio(resz: Partial<OnboardingPiszkozat["kommunikacio"]>) {
    setPiszkozat((p) => ({ ...p, kommunikacio: { ...p.kommunikacio, ...resz } }));
  }
  function tetel(kulcs: string, allapot: TetelAllapot) {
    setTetelek((r) => ({ ...r, [kulcs]: allapot }));
  }

  // A8: a gomb már egy szónál is nyomható — a túl rövid leírásra a mező alatti mondat felel, nem a néma, letiltott gomb.
  const keszitheto = b.nev.trim().length > 0 && (b.weboldal.trim().length > 0 || b.leiras.trim().length > 0);
  function indit() {
    if (!keszitheto) return;
    // A8 (Kami, 09-25): 2–3 szóból a gép nem tud összefoglalni — ilyenkor nem hívjuk (nem költünk rá), hanem kérünk pár mondatot.
    if (!b.weboldal.trim() && leirasTulRovid(b.leiras)) { setKevesForras("leiras"); return; }
    setKevesForras(null);
    setLap("dolgozik");
  }
  useEffect(() => {
    if (!b.nev.trim() && szervezetNev.trim()) modositBemutatkozas({ nev: szervezetNev });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A dolgozik állapot valódi lépései — sorban. Hiba esetén a folyamat MEGY TOVÁBB (a rajz szerint).
  async function dolgozik() {
    if (indult.current) return;
    indult.current = true;
    setFolyamatHiba(false);
    setLap("dolgozik");
    for (const kulcs of TETEL_KULCSOK) tetel(kulcs, "var");

    // (1) mentés
    if (!(await mentMost())) { setFolyamatHiba(true); }

    // (2) összefoglaló
    tetel("eb_tetel_bemutatkozas", "keszul");
    const forrasTipus: "weboldal" | "leiras" = b.weboldal.trim().length > 0 ? "weboldal" : "leiras";
    const r1 = await hivas("/api/onboarding/osszefoglalo", "POST", { nev: b.nev, forras_tipus: forrasTipus, weboldal: b.weboldal, leiras: b.leiras });
    if (r1.statusz === 401) { router.push("/belepes"); return; }
    // A8: a gép szerint a forrásból nem derül ki a tevékenység — vissza az űrlapra, a mező alatt egy mondat: mit írjon.
    // (A többi lépést nem futtatjuk: üres bemutatkozásra a javaslatok is üresek lennének, és AI-keretet költenének.)
    const r1Mezok = r1.torzs["mezok"];
    if (r1.statusz === 400 && typeof r1Mezok === "object" && r1Mezok !== null && (r1Mezok as Record<string, unknown>)["tevekenyseg"] === "nem_derul_ki") {
      indult.current = false;
      setKevesForras(forrasTipus);
      setLap("urlap");
      return;
    }
    if (r1.statusz === 200 && typeof r1.torzs["osszefoglalo"] === "string") {
      const szoveg = r1.torzs["osszefoglalo"];
      const forras: "weboldal" | "ai" = forrasTipus === "weboldal" ? "weboldal" : "ai";
      modositBemutatkozas({ osszefoglalo: szoveg, osszefoglalo_forras: forras, osszefoglalo_modositva: false });
      tetel("eb_tetel_bemutatkozas", "kesz");
    } else {
      tetel("eb_tetel_bemutatkozas", "hiba");
      setFolyamatHiba(true);
    }

    // (3) javaslatok — egyszerre tölti a Kiknek/Mit/Hogyan tételeket
    tetel("eb_tetel_kiknek", "keszul");
    tetel("eb_tetel_cel", "keszul");
    tetel("eb_tetel_hangnem", "keszul");
    const r2 = await hivas("/api/onboarding/javaslatok", "POST");
    if (r2.statusz === 401) { router.push("/belepes"); return; }
    if (r2.statusz === 200) {
      const v = r2.torzs as unknown;
      const parsed = (await import("@rogton/contracts")).JavaslatokValasz.safeParse(v);
      if (parsed.success) {
        // J-1: a „Mit szeretnétek elérni” ezen a lapon választókockákból áll — az AI szabad célmondata nem látszana,
        // mégis elmentődne a profilba (mérve 2026-09-25: 0 jelölt cél mellett AI-célmondat a Szervezet adatainál). Ezért a cél
        // itt csak abból lesz, amit a felhasználó bejelöl.
        setPiszkozat((p) => {
          const uj = javaslatokBeolvaszt(p.kommunikacio, parsed.data);
          // c30 F1: the machine's type/category guess goes into the draft (nothing on screen — the line is D1, with F6);
          // profile-core copies it into the profile at approval only when `tipus_biztos`
          const tipus = parsed.data.szervezet_tipus
            ? { szervezet_tipus: parsed.data.szervezet_tipus, kategoria: parsed.data.kategoria ?? "semleges", tipus_biztos: parsed.data.biztos === true, ...(parsed.data.rendezveny ? { rendezveny: parsed.data.rendezveny } : {}) }
            : {};
          return { ...p, bemutatkozas: { ...p.bemutatkozas, ...tipus }, kommunikacio: { ...uj, cel: p.kommunikacio.cel, cel_forras: p.kommunikacio.cel_forras, cel_modositva: p.kommunikacio.cel_modositva } };
        });
        tetel("eb_tetel_kiknek", "kesz");
        tetel("eb_tetel_cel", "kesz");
        tetel("eb_tetel_hangnem", "kesz");
      } else {
        tetel("eb_tetel_kiknek", "hiba");
        tetel("eb_tetel_cel", "hiba");
        tetel("eb_tetel_hangnem", "hiba");
        setFolyamatHiba(true);
      }
    } else {
      tetel("eb_tetel_kiknek", "hiba");
      tetel("eb_tetel_cel", "hiba");
      tetel("eb_tetel_hangnem", "hiba");
      setFolyamatHiba(true);
    }

    // (4) mentés
    if (!(await mentMost())) setFolyamatHiba(true);

    // (5) hírfigyelés-javaslat — a profil_tervezetből (a piszkozat még nem jóváhagyott profil)
    tetel("eb_tetel_temak", "keszul");
    const r3 = await hivas("/api/hirfigyelo/beallitas/javaslat", "POST", {
      profil_tervezet: {
        nev: b.nev,
        tevekenyseg: b.osszefoglalo,
        celkozonseg: k.celkozonseg,
        cel: k.cel,
        nyelvek: k.nyelvek,
        hangnem_leiras: k.hangnem_leiras,
      },
    });
    if (r3.statusz === 401) { router.push("/belepes"); return; }
    if (r3.statusz === 200) {
      const hf = (r3.torzs["hirfigyelo"] as { tervezet?: HfTervezet } | undefined)?.tervezet;
      if (hf) {
        setHfTervezet(hf);
        tetel("eb_tetel_temak", "kesz");
      } else {
        tetel("eb_tetel_temak", "hiba");
      }
    } else {
      tetel("eb_tetel_temak", "hiba");
    }

    // (6) átnézés
    setLap("atnezes");
  }

  useEffect(() => {
    if (lap === "dolgozik") void dolgozik();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lap]);

  // c30 F6b (élő 10-17): ha még nincs nyelv, a javaslat (a leírásban kimondott nyelvek, különben a gép tippje) jelölődik be — átírható;
  // ha javaslat sincs, a felület nyelve az alap (a régi viselkedés)
  useEffect(() => {
    if (lap === "atnezes" && k.nyelvek.length === 0) {
      const javasolt = (k.nyelvek_javasolt ?? []).filter((x) => (TARTALOMNYELVEK as readonly string[]).includes(x));
      modositKommunikacio(javasolt.length ? { nyelvek: javasolt, nyelvek_javasolt: [], nyelvek_forras: "ai" } : { nyelvek: [nyelv as Tartalomnyelv], nyelvek_forras: "sajat" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lap]);

  // Az átnézés betöltésekor: oldal-ajánlat lekérése
  useEffect(() => {
    if (lap !== "atnezes") return;
    if (oldalAjanlat.length > 0 || oldalAjanlatFut) return;
    let megszakitva = false;
    setOldalAjanlatFut(true);
    void (async () => {
      const szoveg = `${b.osszefoglalo} ${b.leiras}`.trim();
      const r = await hivas("/api/hirfigyelo/forrasok/ajanlat", "POST", { nyelvek: k.nyelvek, szoveg });
      if (megszakitva) return;
      setOldalAjanlatFut(false);
      if (r.statusz === 401) { router.push("/belepes"); return; }
      if (r.statusz === 200) {
        const lista = (r.torzs["hirfigyelo"] as { ajanlat?: OldalAjanlat[] } | undefined)?.ajanlat ?? [];
        setOldalAjanlat(lista);
        const elsoHarom = lista.slice(0, 3).map((x) => x.cim);
        setJeloltOldalak(new Set(elsoHarom));
      }
    })();
    return () => { megszakitva = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lap]);

  // Az átnézés lapon: a félbehagyott tervezet lekérése, ha még nincs
  useEffect(() => {
    if (lap !== "atnezes") return;
    if (hfTervezet !== null) return;
    if (tervezetLekerve.current) return;
    tervezetLekerve.current = true;
    void (async () => {
      const hf = await tervezetLeker();
      if (hf) setHfTervezet(hf);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lap]);

  // A témák alapból: az első 4 jelölve
  const jeloltTemak = useMemo(() => {
    if (!hfTervezet) return new Set<string>();
    return new Set(hfTervezet.temak.slice(0, 4).map((x) => x.nev));
  }, [hfTervezet]);
  const [temakJelolve, setTemakJelolve] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (hfTervezet && temakJelolve.size === 0) setTemakJelolve(new Set(jeloltTemak));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hfTervezet]);

  // Hangnem AI-hívás — a kockák változása után 1,2 mp késleltetéssel
  const hangKockakJelolve = useMemo(() => hangnemJeloloOlvas(k.hangnem_leiras), [k.hangnem_leiras]);
  const hangKockakKulcs = hangKockakJelolve.join("|");
  useEffect(() => {
    if (lap !== "atnezes") return;
    if (k.hangnem_modositva) return;
    if (hangKockakJelolve.length === 0) return;
    if (hangnemUtolso.current === hangKockakKulcs) return;
    if (hangnemIdozito.current) clearTimeout(hangnemIdozito.current);
    hangnemIdozito.current = setTimeout(() => {
      void (async () => {
        setHangnemFut(true);
        const megjegyzes = hangKockakJelolve.join(", ");
        const r = await hivas("/api/onboarding/hangnem", "POST", {
          irany: "kockak",
          megjegyzes,
          hangnem_leiras: hangnemTorzs(k.hangnem_leiras),
          hangnem_minta: k.hangnem_minta,
          tartalomnyelv: k.nyelvek[0] ?? nyelv,
        });
        setHangnemFut(false);
        if (r.statusz === 401) { router.push("/belepes"); return; }
        if (r.statusz === 200) {
          const ujLeiras = typeof r.torzs["hangnem_leiras"] === "string" ? r.torzs["hangnem_leiras"] : "";
          const ujMinta = typeof r.torzs["hangnem_minta"] === "string" ? r.torzs["hangnem_minta"] : "";
          const jelolo = hangnemJelolo(hangKockakJelolve);
          const torzs = hangnemTorzs(ujLeiras);
          modositKommunikacio({
            hangnem_leiras: `${jelolo}\n${torzs}`.trim(),
            hangnem_minta: ujMinta,
            hangnem_forras: "ai",
            hangnem_modositva: false,
          });
          hangnemUtolso.current = hangKockakKulcs;
        }
      })();
    }, 1200);
    return () => { if (hangnemIdozito.current) clearTimeout(hangnemIdozito.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hangKockakKulcs, lap]);

  async function mentesEsVissza() {
    if (!(await mentMost())) return;
    router.push("/kezdolap");
  }

  // --- átnézés: kockák ---
  function celKockaValt(kulcs: string) {
    const nev = t(`onboarding.${kulcs}`);
    const jelen = k.cel.split(" · ").map((x) => x.trim()).filter((x) => x.length > 0);
    const van = jelen.includes(nev);
    const uj = van ? jelen.filter((x) => x !== nev) : [...jelen, nev];
    modositKommunikacio({ cel: uj.join(" · "), cel_forras: "sajat", cel_modositva: true });
  }
  function celSajatHozzaad() {
    const nev = sajatCel.trim();
    if (!nev) return;
    const jelen = k.cel.split(" · ").map((x) => x.trim()).filter((x) => x.length > 0);
    if (!jelen.includes(nev)) jelen.push(nev);
    modositKommunikacio({ cel: jelen.join(" · "), cel_forras: "sajat", cel_modositva: true });
    setSajatCel("");
  }
  function hangKockaValt(kulcs: string) {
    const nev = t(`onboarding.${kulcs}`);
    const jelen = hangnemJeloloOlvas(k.hangnem_leiras);
    const van = jelen.includes(nev);
    const uj = van ? jelen.filter((x) => x !== nev) : [...jelen, nev];
    const torzs = hangnemTorzs(k.hangnem_leiras);
    modositKommunikacio({
      hangnem_leiras: `${hangnemJelolo(uj)}\n${torzs}`.trim(),
      hangnem_forras: "sajat",
      hangnem_modositva: true,
    });
  }
  function hangSajatHozzaad() {
    const nev = sajatHang.trim();
    if (!nev) return;
    const jelen = hangnemJeloloOlvas(k.hangnem_leiras);
    if (!jelen.includes(nev)) jelen.push(nev);
    const torzs = hangnemTorzs(k.hangnem_leiras);
    modositKommunikacio({
      hangnem_leiras: `${hangnemJelolo(jelen)}\n${torzs}`.trim(),
      hangnem_forras: "sajat",
      hangnem_modositva: true,
    });
    setSajatHang("");
  }
  function hangnemLeirasIr(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const jelolo = hangnemJelolo(hangnemJeloloOlvas(k.hangnem_leiras));
    modositKommunikacio({
      hangnem_leiras: `${jelolo}\n${e.target.value}`.trim(),
      hangnem_forras: k.hangnem_forras === "" || k.hangnem_forras === "sajat" ? "sajat" : k.hangnem_forras,
      hangnem_modositva: true,
    });
  }
  function hangnemMintaIr(e: React.ChangeEvent<HTMLTextAreaElement>) {
    modositKommunikacio({
      hangnem_minta: e.target.value,
      hangnem_forras: k.hangnem_forras === "" || k.hangnem_forras === "sajat" ? "sajat" : k.hangnem_forras,
      hangnem_modositva: true,
    });
  }
  function nyelvValt(kod: Tartalomnyelv) {
    const van = k.nyelvek.includes(kod);
    modositKommunikacio({ nyelvek: van ? k.nyelvek.filter((x) => x !== kod) : [...k.nyelvek, kod], nyelvek_forras: "sajat" });
  }
  function sajatNyelvHozzaad() {
    const kod = sajatNyelv.trim().toLowerCase() as Tartalomnyelv;
    if (!kod) return;
    if (!TARTALOMNYELVEK.includes(kod)) return;
    if (!k.nyelvek.includes(kod)) modositKommunikacio({ nyelvek: [...k.nyelvek, kod], nyelvek_forras: "sajat" });
    setSajatNyelv("");
  }
  function temaKockaValt(nev: string) {
    setTemakJelolve((r) => {
      const uj = new Set(r);
      if (uj.has(nev)) uj.delete(nev); else uj.add(nev);
      return uj;
    });
  }
  function temaHozzaad() {
    const nyers = ujTema;
    if (!nyers.trim()) return;
    const darabok = nyers.split(",").map((x) => x.trim()).filter((x) => x.length > 0);
    if (darabok.length === 0) return;
    setHfTervezet((h) => {
      const alap: HfTervezet = h ?? { celok: ["sajat_marka"], temak: [], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 6, perc: 0, idozona: "Europe/Budapest" }, szabad_szoveg: "" };
      const meglevo = new Set(alap.temak.map((x) => x.nev));
      const ujak = darabok.filter((x) => !meglevo.has(x)).map((nev) => ({ nev, nevvaltozatok: [], megkulonboztetes: "" }));
      return { ...alap, temak: [...alap.temak, ...ujak] };
    });
    setTemakJelolve((r) => {
      const uj = new Set(r);
      for (const d of darabok) uj.add(d);
      return uj;
    });
    setUjTema("");
  }
  function oldalKockaValt(cim: string) {
    setJeloltOldalak((r) => {
      const uj = new Set(r);
      if (uj.has(cim)) { uj.delete(cim); return uj; }
      if (uj.size >= 5) return uj;
      uj.add(cim);
      return uj;
    });
  }
  function sajatOldalHozzaad() {
    const cim = sajatOldal.trim();
    if (!cim) return;
    if (oldalAjanlat.some((x) => x.cim === cim)) { setSajatOldal(""); return; }
    if (jeloltOldalak.size >= 5) return;
    setOldalAjanlat((r) => [...r, { cim, nev: cim, nyelv: "", leiras: "", miert: "" }]);
    setJeloltOldalak((r) => {
      const uj = new Set(r);
      if (uj.size < 5) uj.add(cim);
      return uj;
    });
    setSajatOldal("");
  }

  // --- jóváhagyás ---
  async function jovahagy() {
    if (jovahagyFut) return;
    setJovahagyFut(true);
    setJovahagyHiba(false);
    setHibasMezok(new Set());

    // (1) mentés
    if (!(await mentMost())) { setJovahagyFut(false); setJovahagyHiba(true); return; }

    // (2) jóváhagyás — 409 = már jóváhagyva, azt sikerként kezeljük
    const r1 = await hivas("/api/onboarding/jovahagyas", "POST");
    if (r1.statusz === 401) { router.push("/belepes"); return; }
    if (r1.statusz === 400) {
      const mezok = r1.torzs["mezok"];
      if (Array.isArray(mezok)) setHibasMezok(new Set(mezok.filter((x): x is string => typeof x === "string")));
      setJovahagyFut(false);
      setJovahagyHiba(true);
      return;
    }
    if (r1.statusz !== 200 && r1.statusz !== 409) {
      setJovahagyFut(false);
      setJovahagyHiba(true);
      return;
    }

    // (3) hírfigyelés beállítás — csak a jelölt témákkal
    let tervezet = hfTervezet;
    if (tervezet === null) {
      tervezet = await tervezetLeker();
      if (tervezet) setHfTervezet(tervezet);
    }
    const jeloltTemaLista = (tervezet?.temak ?? []).filter((x) => temakJelolve.has(x.nev));
    if (jeloltTemaLista.length === 0 && tervezet) {
      for (const tema of tervezet.temak.slice(0, 4)) jeloltTemaLista.push(tema);
    }
    let vanBeallitas = false;
    if (jeloltTemaLista.length > 0) {
      const celok = tervezet && tervezet.celok.length > 0 ? tervezet.celok : ["sajat_marka"];
      const idozites = tervezet?.idozites ?? { mod: "kezi" as const, ora: 6, perc: 0, idozona: "Europe/Budapest" };
      const r2 = await hivas("/api/hirfigyelo/beallitas", "PUT", {
        celok,
        temak: jeloltTemaLista,
        foldrajzi_fokusz: tervezet?.foldrajzi_fokusz ?? "",
        nyelvek: tervezet?.nyelvek ?? [],
        kizarasok: tervezet?.kizarasok ?? [],
        idozites,
        szabad_szoveg: tervezet?.szabad_szoveg ?? "",
      });
      if (r2.statusz === 401) { router.push("/belepes"); return; }
      if (r2.statusz === 200) {
        vanBeallitas = true;
        await hivas("/api/hirfigyelo/beallitas/tervezet", "DELETE");
      }
    }

    // (4) források egyenként — csak a jelölt oldalak
    let vanForras = false;
    for (const cim of jeloltOldalak) {
      const r3 = await hivas("/api/hirfigyelo/forrasok", "POST", { cim });
      if (r3.statusz === 401) { router.push("/belepes"); return; }
      if (r3.statusz === 403) break; // FORRAS_KORLAT — a többi kimarad
      if (r3.statusz === 200 || r3.statusz === 201) vanForras = true;
    }

    // (5) első gyűjtés
    if (vanBeallitas && vanForras) {
      const r4 = await hivas("/api/hirfigyelo/futas", "POST", {});
      if (r4.statusz === 401) { router.push("/belepes"); return; }
    }

    // (6) R-18 7. kör: a beállítás új lépései (kínálat, lista, árak, oldal, témák) — onnan a Kezdőlap
    router.push("/onboarding/beallitas");
  }

  const lepesCimke = lap === "atnezes" ? t("onboarding.eb_lepes_2") : t("onboarding.eb_lepes_1");

  const celKockak = useMemo(() => k.cel.split(" · ").map((x) => x.trim()).filter((x) => x.length > 0), [k.cel]);
  const hangKockak = hangKockakJelolve;
  const hangnemTorzsSzoveg = hangnemTorzs(k.hangnem_leiras);

  const oldalJeloltDb = jeloltOldalak.size;
  const oldalKorlatElert = oldalJeloltDb >= 5;

  // R-15 · 02 (design/R15/rajz/R15-lapok-4.dc.html 02a · 02a2 · 02b; gepezet-4 · 2, 5): csak a megjelenítés új, a gépezet a fenti.
  const tevekenysegNyitva = leirasNyitva || kevesForras === "leiras" || b.leiras.trim().length > 0;
  const jeloltOldalNevek = oldalAjanlat.filter((o) => jeloltOldalak.has(o.cim)).map((o) => o.nev || o.cim);
  for (const cim of jeloltOldalak) if (!oldalAjanlat.some((o) => o.cim === cim)) jeloltOldalNevek.push(cim);
  // c30 F6 (rajz D1): a típus-sor — „Cég · Építőipar” / „Fesztivál / rendezvény”; ha a gép nem biztos és a felhasználó még nem
  // válaszolt: a kétválaszos kérdés (D1c). Válasz nélkül a jóváhagyás „Cég”-et jelent (Csilla 10-17, q30b — semmi nem íródik).
  const tipusMost = szervezetTipus(piszkozat.bemutatkozas.szervezet_tipus);
  const katMost = kategoria(piszkozat.bemutatkozas.kategoria);
  const tipusKerdes = !!piszkozat.bemutatkozas.szervezet_tipus && piszkozat.bemutatkozas.tipus_biztos === false && piszkozat.bemutatkozas.tipus_sajat !== true;
  const tipusSor = tipusMost === "fesztival" ? t("c30.tipus.fesztival") : katMost === "semleges" ? t("c30.tipus.ceg") : `${t("c30.tipus.ceg")} · ${t(`c30.kat.${katMost}`)}`;
  const tipusValaszt = (tipus: "ceg" | "fesztival", kat?: string) =>
    modositBemutatkozas({ szervezet_tipus: tipus, kategoria: tipus === "fesztival" ? "semleges" : kat ?? piszkozat.bemutatkozas.kategoria ?? "semleges", tipus_sajat: true });
  const kartya1Nyitva = atir1 || hibasMezok.has("nev") || hibasMezok.has("osszefoglalo") || hibasMezok.has("celkozonseg");
  const vanHiba = jovahagyHiba || hibasMezok.size > 0;
  const fejlec = (
    <header className="km-fejlec km-eb-fej r15e-fejlec" data-r15="sotet-sav">
      <div className="km-fejlec-bal r15e-fejlec-bal">
        {/* R-18 2. kör: a/t jel + termék neve; a név telefonon — mint eddig a régi név — nem fér a lépés mellé, ott csak a jel látszik */}
        <Marka nev={t("fejlec.termeknev")} nevOsztaly="r15-csak-asztal" />
        <div className="km-eb-lepes-cimke r15e-lepes">{lepesCimke}</div>
      </div>
      <div className="km-fejlec-jobb r15e-fejlec-jobb">
        <span className="r15-csak-asztal"><ModValto valtozat="gomb" /></span>
        <Nyelvvalaszto className="km-nyelv r15-csak-asztal" />
        {/* Csilla 10-10 (T2): telefonon a nyelv és a „Mentés és vissza” halk szöveg, nem gomb — ugyanaz a művelet */}
        <Nyelvvalaszto className="r15e-nyelv-halk r15-csak-tel" rovid />
        <span className={allapot === "hiba" ? undefined : "r15-csak-asztal"}><MentesAllapot allapot={allapot} mentveEkkor={mentveEkkor} ujra={() => { void mentMost(); }} /></span>
        <button className="km-gomb-szellem r15-csak-asztal" type="button" onClick={mentesEsVissza}>{t("onboarding.eb_mentes_vissza")}</button>
        <button className="r15-halk-link r15-csak-tel r15e-vissza" type="button" onClick={mentesEsVissza}>{t("onboarding.eb_mentes_vissza")}</button>
      </div>
    </header>
  );
  const ketReszesCim = (k1: string, k2: string) => (
    <h1 className="r15-kerdes" data-r15="kerdes">{t(k1)} <span className="km-grad">{t(k2)}</span></h1>
  );

  return (
    <div className="km-hatter r15e-hatter r15-keretes">
      <div className="km-tartalom">
        {fejlec}
        <main className="km-lap-keret r15e-lap">
          {lap === "urlap" ? (
            <div className="r15e-belso r15e-keskeny">
              <KerdesCim cim={t("onboarding.eb_cim")} alcim={t("r15.eb.alcim")} />
              <Teendo osztaly="r15e-kartya">
                <div className="km-mezo">
                  <label className="km-cimke" htmlFor="eb-nev">{t("mezo.nev")}</label>
                  <input id="eb-nev" className="km-eb-mezo" data-r15-forras="gep" value={b.nev || szervezetNev} onChange={(e) => modositBemutatkozas({ nev: e.target.value })} />
                </div>
                <div className="km-mezo">
                  <label className="km-cimke" htmlFor="eb-weboldal">{t("onboarding.eb_weboldal")} <span className="km-sugo-inline">{t("onboarding.eb_weboldal_megj")}</span></label>
                  <input id="eb-weboldal" className="km-eb-mezo" inputMode="url" placeholder={t("onboarding.eb_weboldal_pl")} value={b.weboldal} onChange={(e) => { modositBemutatkozas({ weboldal: e.target.value }); if (kevesForras === "weboldal") setKevesForras(null); }} />
                  {kevesForras === "weboldal" ? <div className="km-mezo-hiba" role="alert">{t("onboarding.eb_weboldal_keves")}</div> : null}
                </div>
                {tevekenysegNyitva ? (
                  <div className="km-mezo">
                    <label className="km-cimke" htmlFor="eb-leiras">{t("mezo.tevekenyseg")}</label>
                    <textarea id="eb-leiras" className="km-eb-mezo km-eb-terulet" rows={4} value={b.leiras} aria-describedby="eb-leiras-megj" onChange={(e) => { modositBemutatkozas({ leiras: e.target.value }); if (kevesForras === "leiras") setKevesForras(null); }} />
                    {kevesForras === "leiras"
                      ? <div id="eb-leiras-megj" className="km-mezo-hiba" role="alert">{t("onboarding.eb_leiras_keves")}</div>
                      : <div id="eb-leiras-megj" className="km-sugo">{t("onboarding.eb_leiras_megj")}</div>}
                  </div>
                ) : (
                  <div><HalkLink onClick={() => setLeirasNyitva(true)}>{t("r15.eb.nincs_weboldal")}</HalkLink></div>
                )}
              </Teendo>
              <div className="r15e-gombsor r15-csak-asztal">
                <FoGomb disabled={!keszitheto} onClick={indit}>{t("onboarding.eb_gomb")}</FoGomb>
                <Info>{t("onboarding.eb_sugo")}</Info>
              </div>
              <Info osztaly="r15-csak-tel">{t("onboarding.eb_sugo")}</Info>
              <div className="r15-also-sav">
                <FoGomb disabled={!keszitheto} onClick={indit}>{t("onboarding.eb_gomb")}</FoGomb>
              </div>
            </div>
          ) : null}

          {lap === "dolgozik" ? (
            <div className="r15e-belso r15e-keskeny">
              <div>
                {ketReszesCim("onboarding.eb_dolgozik_cim_1", "onboarding.eb_dolgozik_cim_2")}
                <p className="r15-kerdes-alcim" data-r15="kerdes-alcim">{t("onboarding.eb_dolgozik_szoveg")}</p>
              </div>
              <ul className="r15e-tetelek">
                {TETEL_KULCSOK.map((kulcs) => {
                  const tAllapot = tetelek[kulcs] ?? "var";
                  const ertek = kulcs === "eb_tetel_bemutatkozas" ? b.osszefoglalo
                    : kulcs === "eb_tetel_kiknek" ? k.celkozonseg
                    : kulcs === "eb_tetel_cel" ? k.cel
                    : kulcs === "eb_tetel_hangnem" ? hangnemTorzs(k.hangnem_leiras)
                    : kulcs === "eb_tetel_temak" ? (hfTervezet?.temak.map((x) => x.nev).join(" · ") ?? "")
                    : "";
                  return (
                    <li key={kulcs} className="r15e-tetel" data-allapot={tAllapot}>
                      <span className="r15e-tetel-jel" aria-hidden="true">
                        {tAllapot === "kesz" ? "✓" : tAllapot === "keszul" ? <span className="r15e-porgo" /> : tAllapot === "hiba" ? "!" : ""}
                      </span>
                      <span className="r15e-tetel-szoveg">
                        <span className="r15e-tetel-cim">{t(`onboarding.${kulcs}`)}</span>
                        {tAllapot === "kesz" && ertek && kulcs !== "eb_tetel_oldalak" ? <span className="r15e-tetel-ertek r15-csak-asztal" data-r15="eredmeny">{ertek.split("\n")[0]}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {folyamatHiba ? <Info>{t("onboarding.eb_hiba_megj")}</Info> : null}
              <div className="r15e-gombsor r15-csak-asztal">
                <DolgozoGomb>{t("r15.eb.keszitjuk")}</DolgozoGomb>
                <Info>{t("r15.eb.fel_perc")}</Info>
              </div>
              <div className="r15-also-sav">
                <div className="r15-also-nyugtato"><Info>{t("r15.eb.fel_perc")}</Info></div>
                <DolgozoGomb>{t("r15.eb.keszitjuk")}</DolgozoGomb>
              </div>
            </div>
          ) : null}

          {lap === "atnezes" ? (
            <div className="r15e-belso">
              <div className="r15e-fej">
                {ketReszesCim("onboarding.eb_atnez_cim_1", "onboarding.eb_atnez_cim_2")}
                <p className="r15-kerdes-alcim" data-r15="kerdes-alcim">{t("r15.eb.atnez_alcim")}</p>
              </div>
              {vanHiba ? <Baj szoveg={t("onboarding.eb_hiba")} gomb={<HalkGomb onClick={() => void jovahagy()} disabled={jovahagyFut}>{t("hf.ujra")}</HalkGomb>} /> : null}

              <div className="r15e-racs">
                <Teendo osztaly="r15e-kartya">
                  <div className="r15e-kartya-fej">
                    <span className="r15e-cimke">{t("onboarding.eb_rolatok")}</span>
                    <HalkLink onClick={() => setAtir1((x) => !x)} aria-expanded={kartya1Nyitva}>{kartya1Nyitva ? t("r15.mit.kesz") : t("r15.mit.atirom")}</HalkLink>
                  </div>
                  {kartya1Nyitva ? (
                    <>
                      <div className="r18k7-lista" role="radiogroup" aria-label={t("c30.tipus.mi_vagytok")}>
                        {(["ceg", "fesztival"] as const).map((x) => (
                          <div key={x} className="r18k7-sor">
                            <button type="button" className="r18k7-pipa" role="radio" aria-checked={tipusMost === x && !tipusKerdes} aria-label={t(`c30.tipus.${x}`)} onClick={() => tipusValaszt(x)}>
                              {tipusMost === x && !tipusKerdes ? <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : null}
                            </button>
                            <span className="r18k7-sor-szoveg">{t(`c30.tipus.${x}`)}</span>
                          </div>
                        ))}
                      </div>
                      {tipusMost === "ceg" ? (
                        <div className="c30-tipus-blokk">
                          <span className="r15e-cimke">{t("c30.tipus.szakma")}</span>
                          <div className="r18k7-chipek" role="radiogroup" aria-label={t("c30.tipus.szakma")}>
                            {[...KATEGORIAK, "semleges" as const].map((k) => <button key={k} type="button" className="r18k7-chip" role="radio" aria-checked={katMost === k} onClick={() => tipusValaszt("ceg", k)}>{t(`c30.kat.${k}`)}</button>)}
                          </div>
                        </div>
                      ) : null}
                      <div className="km-mezo">
                        <label className="r15e-cimke" htmlFor="eb-nev2">{t("mezo.nev")}</label>
                        <input id="eb-nev2" className="km-eb-mezo" value={b.nev} onChange={(e) => modositBemutatkozas({ nev: e.target.value })} />
                      </div>
                      <div className="km-mezo">
                        <label className="r15e-cimke" htmlFor="eb-tev">{t("mezo.tevekenyseg")}</label>
                        <textarea id="eb-tev" className="km-eb-mezo km-eb-terulet" rows={3} value={b.osszefoglalo} onChange={(e) => modositBemutatkozas({ osszefoglalo: e.target.value, osszefoglalo_forras: b.osszefoglalo_forras === "" || b.osszefoglalo_forras === "sajat" ? "sajat" : b.osszefoglalo_forras, osszefoglalo_modositva: b.osszefoglalo_forras !== "" && b.osszefoglalo_forras !== "sajat" })} />
                      </div>
                      <div className="km-mezo">
                        <label className="r15e-cimke" htmlFor="eb-kik">{t("mezo.celkozonseg")}</label>
                        <textarea id="eb-kik" className="km-eb-mezo km-eb-terulet" rows={3} value={k.celkozonseg} onChange={(e) => modositKommunikacio({ celkozonseg: e.target.value, celkozonseg_forras: k.celkozonseg_forras === "" || k.celkozonseg_forras === "sajat" ? "sajat" : k.celkozonseg_forras, celkozonseg_modositva: k.celkozonseg_forras !== "" && k.celkozonseg_forras !== "sajat" })} />
                      </div>
                      <div className="km-mezo">
                        <span className="r15e-cimke">{t("mezo.hangnem")}</span>
                        <div className="km-eb-kockak">
                          {HANG_KOCKAK.map((kulcs) => {
                            const nev = t(`onboarding.${kulcs}`);
                            const jelolt = hangKockak.includes(nev);
                            return (
                              <button key={kulcs} type="button" className="km-eb-kocka" aria-pressed={jelolt} onClick={() => hangKockaValt(kulcs)}>
                                {jelolt ? "✓ " : ""}{nev}
                              </button>
                            );
                          })}
                          <input className="km-eb-mezo km-eb-kocka-uj" value={sajatHang} onChange={(e) => setSajatHang(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); hangSajatHozzaad(); } }} placeholder={t("onboarding.eb_sajat_pl")} />
                        </div>
                        {hangnemFut ? <span className="r15e-irjuk" aria-live="polite"><span className="r15e-porgo" aria-hidden="true" />{t("r15.eb.irjuk")}</span> : null}
                        <textarea className="km-eb-mezo km-eb-terulet" rows={2} value={hangnemTorzsSzoveg} onChange={hangnemLeirasIr} />
                        <textarea className="km-eb-mezo km-eb-terulet" rows={2} value={k.hangnem_minta} onChange={hangnemMintaIr} placeholder={t("onboarding.eb_minta_pl")} />
                      </div>
                    </>
                  ) : (
                    <>
                      {tipusKerdes ? (
                        <div className="c30-tipus-kerdes">
                          <div className="c30-tipus-kerdes-cim">{t("c30.tipus.kerdes")}</div>
                          <div className="r18k7-opciok r18k7-ketto c30-tipus-valasz" role="group" aria-label={t("c30.tipus.kerdes")}>
                            <button type="button" className="r18k7-opcio" onClick={() => tipusValaszt("ceg")}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 10h4a1 1 0 0 1 1 1v10" /><path d="M8 8h3M8 12h3M8 16h3M3 21h18" /></svg>{t("c30.tipus.ceg_vagyunk")}</button>
                            <button type="button" className="r18k7-opcio" onClick={() => tipusValaszt("fesztival")}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18" /><path d="M5 20V9l7-5 7 5v11" /><path d="M9 20v-5h6v5" /><path d="M12 4V2" /></svg>{t("c30.tipus.fesztival_vagyunk")}</button>
                          </div>
                        </div>
                      ) : <Info osztaly="c30-tipus-sor">{tipusSor}</Info>}
                      <div className="r15e-sor"><span className="r15e-cimke">{t("mezo.tevekenyseg")}</span><span className="r15e-ertek" data-r15="eredmeny" data-r15-forras="gep">{b.osszefoglalo}</span></div>
                      <div className="r15e-sor"><span className="r15e-cimke">{t("mezo.celkozonseg")}</span><span className="r15e-ertek" data-r15="eredmeny" data-r15-forras="gep">{k.celkozonseg}</span></div>
                      <div className="r15e-sor"><span className="r15e-cimke">{t("mezo.hangnem")}</span><span className="r15e-ertek" data-r15="eredmeny" data-r15-forras="gep">{k.hangnem_minta}</span></div>
                    </>
                  )}
                </Teendo>

                <Teendo osztaly="r15e-kartya">
                  <div className="r15e-kartya-fej">
                    <span className="r15e-cimke">{t("onboarding.eb_hirek")}</span>
                    <HalkLink onClick={() => setAtir2((x) => !x)} aria-expanded={atir2}>{atir2 ? t("r15.mit.kesz") : t("r15.mit.atirom")}</HalkLink>
                  </div>
                  {atir2 ? (
                    <>
                      <div className="km-mezo">
                        <span className="r15e-cimke">{t("r15.mit.temak")}</span>
                        {hfTervezet ? (
                          <div className="km-eb-kockak">
                            {hfTervezet.temak.map((tema) => {
                              const jelolt = temakJelolve.has(tema.nev);
                              return (
                                <button key={tema.nev} type="button" className="km-eb-kocka" aria-pressed={jelolt} onClick={() => temaKockaValt(tema.nev)}>
                                  {jelolt ? "✓ " : ""}{tema.nev}
                                </button>
                              );
                            })}
                          </div>
                        ) : <div className="km-sugo">{t("onboarding.eb_temak_kesobb")}</div>}
                        <input className="km-eb-mezo km-eb-kocka-uj" value={ujTema} onChange={(e) => setUjTema(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); temaHozzaad(); } }} placeholder={t("onboarding.eb_tema_pl")} />
                      </div>
                      <div className="km-mezo">
                        <span className="r15e-cimke">{t("r15.mit.oldalak")} <span className="r15e-halk">{t("onboarding.eb_oldalak_n").replace("{n}", String(oldalJeloltDb))}</span></span>
                        <div className="km-eb-oldalak">
                          {oldalAjanlat.map((o) => {
                            const jelolt = jeloltOldalak.has(o.cim);
                            const tilt = !jelolt && oldalKorlatElert;
                            return (
                              <div key={o.cim} className="km-eb-oldal">
                                <button type="button" className="km-eb-kocka" aria-pressed={jelolt} disabled={tilt} onClick={() => oldalKockaValt(o.cim)}>
                                  {jelolt ? "✓ " : ""}{o.nev || o.cim}
                                </button>
                                {o.leiras ? <span className="km-eb-oldal-leiras">{o.leiras}</span> : null}
                              </div>
                            );
                          })}
                        </div>
                        <input className="km-eb-mezo km-eb-kocka-uj" value={sajatOldal} onChange={(e) => setSajatOldal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sajatOldalHozzaad(); } }} placeholder={t("onboarding.eb_oldal_uj_pl")} disabled={oldalKorlatElert} />
                        {oldalKorlatElert ? <div className="km-sugo">{t("onboarding.eb_korlat")}</div> : null}
                        <div className="km-eb-lab">{t("onboarding.eb_oldalak_lab")}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="r15e-sor">
                        <span className="r15e-cimke">{t("r15.mit.temak")}</span>
                        {hfTervezet && hfTervezet.temak.some((x) => temakJelolve.has(x.nev)) ? (
                          <div className="r15e-chipek" data-r15="eredmeny">
                            {hfTervezet.temak.filter((x) => temakJelolve.has(x.nev)).map((x) => <span key={x.nev} className="r15e-chip" data-r15-forras="gep">{x.nev}</span>)}
                          </div>
                        ) : <Info>{t("onboarding.eb_temak_kesobb")}</Info>}
                      </div>
                      <div className="r15e-sor">
                        <span className="r15e-cimke">{t("r15.mit.oldalak")}</span>
                        {oldalAjanlatFut ? <Info>{t("onboarding.eb_oldalak_keres")}</Info>
                          : jeloltOldalNevek.length > 0 ? <span className="r15e-ertek" data-r15="eredmeny" data-r15-forras="gep">{jeloltOldalNevek.join(" · ")}</span>
                          : <Info>{t("onboarding.eb_nincs_oldal")}</Info>}
                      </div>
                    </>
                  )}
                </Teendo>
              </div>

              <div className="r15e-gombsor r15-csak-asztal">
                <FoGomb disabled={jovahagyFut || oldalAjanlatFut} onClick={() => void jovahagy()}>{jovahagyFut ? t("onboarding.eb_jovahagy_fut") : t("onboarding.eb_jovahagy")}</FoGomb>
                <Info>{t("r15.eb.elso_hirek")}</Info>
              </div>
              <div className="r15-linksor">
                <HalkLink onClick={() => setReszletekNyitva((x) => !x)} aria-expanded={reszletekNyitva}>{t("r15.kozos.reszletek")}</HalkLink>
                <HalkLink onClick={() => void mentesEsVissza()}>{t("onboarding.eb_kesobb")}</HalkLink>
              </div>
              {reszletekNyitva ? (
                <Reszletek>
                  <div className="r15e-reszletek">
                    <div className="km-mezo">
                      <span className="r15e-cimke">{t("mezo.cel")} <span className="r15e-halk">{t("onboarding.eb_tobb_jelolheto")}</span></span>
                      <div className="km-eb-kockak">
                        {CEL_KOCKAK.map((kulcs) => {
                          const nev = t(`onboarding.${kulcs}`);
                          const jelolt = celKockak.includes(nev);
                          return (
                            <button key={kulcs} type="button" className="km-eb-kocka" aria-pressed={jelolt} onClick={() => celKockaValt(kulcs)}>
                              {jelolt ? "✓ " : ""}{nev}
                            </button>
                          );
                        })}
                        <input className="km-eb-mezo km-eb-kocka-uj" value={sajatCel} onChange={(e) => setSajatCel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); celSajatHozzaad(); } }} placeholder={t("onboarding.eb_sajat_pl")} />
                      </div>
                    </div>
                    <div className="km-mezo">
                      <span className="r15e-cimke">{t("mezo.nyelvek")}</span>
                      <div className="km-eb-kockak">
                        {NYELV_ELSO_HAROM.map((kod) => {
                          const jelolt = k.nyelvek.includes(kod);
                          return (
                            <button key={kod} type="button" className="km-eb-kocka" aria-pressed={jelolt} onClick={() => nyelvValt(kod)}>
                              {jelolt ? "✓ " : ""}{nyelvNev(kod, nyelv)}
                            </button>
                          );
                        })}
                        {tobbNyelv ? (
                          TARTALOMNYELVEK.filter((x) => !NYELV_ELSO_HAROM.includes(x)).map((kod) => {
                            const jelolt = k.nyelvek.includes(kod);
                            return (
                              <button key={kod} type="button" className="km-eb-kocka" aria-pressed={jelolt} onClick={() => nyelvValt(kod)}>
                                {jelolt ? "✓ " : ""}{nyelvNev(kod, nyelv)}
                              </button>
                            );
                          })
                        ) : (
                          <button type="button" className="km-eb-kocka" onClick={() => setTobbNyelv(true)}>{t("onboarding.eb_mas_nyelv")}</button>
                        )}
                        {tobbNyelv ? (
                          <input className="km-eb-mezo km-eb-kocka-uj" value={sajatNyelv} onChange={(e) => setSajatNyelv(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sajatNyelvHozzaad(); } }} placeholder={t("onboarding.eb_nyelv_pl")} />
                        ) : null}
                      </div>
                    </div>
                    <div className="km-mezo">
                      <span className="r15e-cimke">{t("onboarding.eb_kit")}</span>
                      <div className="km-eb-kockak" role="radiogroup">
                        <button type="button" className="km-eb-kocka" aria-pressed={sajatNevMod === "csak_szervezet"} onClick={() => setSajatNevMod("csak_szervezet")}>{t("onboarding.eb_csak_szervezet")}</button>
                        <button type="button" className="km-eb-kocka" aria-pressed={sajatNevMod === "nevemet_is"} onClick={() => setSajatNevMod("nevemet_is")}>{t("onboarding.eb_nevemet_is")}</button>
                      </div>
                      {sajatNevMod === "nevemet_is" ? (
                        <input className="km-eb-mezo" value={sajatNev} onChange={(e) => setSajatNev(e.target.value)} placeholder={fiokNev} />
                      ) : null}
                    </div>
                    <Info>{t("onboarding.eb_lab")}</Info>
                  </div>
                </Reszletek>
              ) : null}
              <div className="r15-also-sav">
                <FoGomb disabled={jovahagyFut || oldalAjanlatFut} onClick={() => void jovahagy()}>{jovahagyFut ? t("onboarding.eb_jovahagy_fut") : t("onboarding.eb_jovahagy")}</FoGomb>
              </div>
            </div>
          ) : null}
        </main>
      </div>
      {/* Kati 10-02: a lebegő Visszajelzés gomb az első beállításon is */}
      <Visszajelzes />
    </div>
  );
}
