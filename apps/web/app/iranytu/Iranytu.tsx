"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { hivas } from "../_kozos/kliens";
import { IRANYTU_HATAR } from "@km/contracts";
import { BlokkValaszto, type IranytuBlokkKod } from "./BlokkValaszto";

type Forras = "" | "sajat" | "weboldal" | "ai";

type Cel = { id: string; nev: string; miert: string; mikorra: string; mirol_tudod: string; forras: Forras };
type Ertek = { id: string; nev: string; magyarazat: string; forras: Forras };
type Idoszak = { id: string; nev: string; mettol: string; meddig: string; mit: string; forras: Forras };
type Tolni = { id: string; nev: string; forras: Forras };

type Iranytu = {
  celok: Cel[];
  vizio: string;
  vizio_forras: Forras;
  ertekek: Ertek[];
  idoszakok: Idoszak[];
  tolni: Tolni[];
  tiltott_szavak: string[];
  kerulendo_temak: string[];
};

type Allapot = {
  tervezet: Iranytu | null;
  jovahagyott: Iranytu | null;
  jovahagyva: string | null;
  jovahagyta_nev: string;
  verzio: number;
  van_tervezet: boolean;
};

type Verzio = { verzio: number; adatok: Iranytu; jovahagyva: string; jovahagyta_nev: string };

type Valasz = { allapot: Allapot; verziok?: Verzio[] };

/** Teljesen üres-e az űrlap? Üreset nem mentünk — különben az üres lapból rögtön „tervezet" lenne. */
function uresUrlap(u: Iranytu): boolean {
  return (
    u.celok.length === 0 &&
    !u.vizio.trim() &&
    u.ertekek.length === 0 &&
    u.idoszakok.length === 0 &&
    u.tolni.length === 0 &&
    u.tiltott_szavak.length === 0 &&
    u.kerulendo_temak.length === 0
  );
}

const URES: Iranytu = {
  celok: [],
  vizio: "",
  vizio_forras: "",
  ertekek: [],
  idoszakok: [],
  tolni: [],
  tiltott_szavak: [],
  kerulendo_temak: [],
};

function ujId(): string {
  return crypto.randomUUID();
}

function idoBelyeg(d: Date): string {
  const oo = String(d.getHours()).padStart(2, "0");
  const pp = String(d.getMinutes()).padStart(2, "0");
  return `${oo}:${pp}`;
}

function datumSzoveg(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("hu-HU");
}

function maiNap(): string {
  const d = new Date();
  const hh = String(d.getFullYear()).padStart(4, "0");
  const nn = String(d.getMonth() + 1).padStart(2, "0");
  const nn2 = String(d.getDate()).padStart(2, "0");
  return `${hh}-${nn}-${nn2}`;
}

/** c5 (R-15 11, gepezet-4 · 4): a mai szerkesztő, a R-15 Iránytű lap „Átírom” / „Módosítás” / „Inkább magam töltöm ki” / „Az egész
 *  iránytű” mögött. `kezdoMod`: milyen módban nyíljon; `sajatKezdesKezdo`: üresen, kézi kitöltésre; `onKesz`: jóváhagyás után vissza
 *  a R-15 nézetre (11c). Prop nélkül pontosan úgy viselkedik, mint eddig. */
export function Iranytu({ szerkesztheto, jovahagyhat, sav, kezdoMod, sajatKezdesKezdo = false, onKesz }: { szerkesztheto: boolean; jovahagyhat: boolean; sav: FelsoSavAdat; kezdoMod?: "olvas" | "szerkeszt"; sajatKezdesKezdo?: boolean; onKesz?: () => void }) {
  const { t } = useFeliratok();
  const router = useRouter();

  const [allapot, setAllapot] = useState<Allapot | null>(null);
  const [verziok, setVerziok] = useState<Verzio[]>([]);
  const [urlap, setUrlap] = useState<Iranytu>(URES);
  const [mod, setMod] = useState<"olvas" | "szerkeszt">("olvas");
  const [mentesAllapot, setMentesAllapot] = useState<"csend" | "folyik" | "kesz" | "hiba">("csend");
  const [mentveEkkor, setMentveEkkor] = useState<Date | null>(null);
  const [hibaUzenet, setHibaUzenet] = useState("");
  const [visszaallitva, setVisszaallitva] = useState(false);
  const [aktivBlokk, setAktivBlokk] = useState<IranytuBlokkKod>("celok");
  const [sajatKezdes, setSajatKezdes] = useState(sajatKezdesKezdo);
  const [javaslatFut, setJavaslatFut] = useState<string | null>(null);
  const [javaslatHiba, setJavaslatHiba] = useState("");
  const [ujTiltott, setUjTiltott] = useState("");
  const [ujTema, setUjTema] = useState("");

  const idozito = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elsoBetoltes = useRef(true);
  const urlapRef = useRef<Iranytu>(URES);
  urlapRef.current = urlap;

  const betolt = useCallback(async () => {
    const valasz = await fetch("/api/iranytu", { credentials: "same-origin", cache: "no-store" });
    const r = { statusz: valasz.status, torzs: (await valasz.json().catch(() => ({}))) as Record<string, unknown> };
    if (r.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (r.statusz !== 200) {
      setMentesAllapot("hiba");
      setHibaUzenet(t("kozos.hiba"));
      return;
    }
    const adat = r.torzs as Valasz;
    setAllapot(adat.allapot);
    setVerziok(adat.verziok ?? []);
    const alap = adat.allapot.tervezet ?? adat.allapot.jovahagyott ?? URES;
    setUrlap(alap);
    // Üres iránytűnél (se tervezet, se jóváhagyott) egyből szerkeszthető a lap — különben
    // a felhasználó egy üres, olvasható lapot kapna, amin nincs mit megnyomnia.
    setMod(kezdoMod ?? (adat.allapot.tervezet || !adat.allapot.jovahagyott ? "szerkeszt" : "olvas"));
  }, [router, t, kezdoMod]);

  useEffect(() => {
    void betolt();
  }, [betolt]);

  // 2026-09-21: a mentés hibája megmondja, melyik mező a gond (a szerver „mezok” listájából).
  const mentesHibaSzoveg = useCallback(
    (torzs: unknown): string => {
      const mezok = (torzs as { mezok?: Record<string, string> } | null)?.mezok ?? {};
      const ut = Object.keys(mezok)[0];
      if (!ut) return t("hiba.mentes") || t("kozos.hiba");
      const [szakasz, sor, mezo] = ut.split(".");
      const CIMKE: Record<string, string> = {
        "celok.nev": "iranytu.cel_nev", "celok.miert": "iranytu.cel_miert", "celok.mikorra": "iranytu.cel_mikorra",
        "celok.mirol_tudod": "iranytu.cel_mirol", "ertekek.nev": "iranytu.ertek_nev", "ertekek.magyarazat": "iranytu.ertek_magyarazat",
        "idoszakok.nev": "iranytu.idoszak_nev", "idoszakok.mit": "iranytu.idoszak_mit", "tolni.nev": "iranytu.tolni",
      };
      const SZAKASZ: Record<string, string> = {
        celok: "iranytu.celok", vizio: "iranytu.vizio", ertekek: "iranytu.ertekrend", idoszakok: "iranytu.idoszakok",
        tolni: "iranytu.tolni", tiltott_szavak: "iranytu.tiltott_szavak", kerulendo_temak: "iranytu.kerulni",
      };
      const reszek = [t(SZAKASZ[szakasz ?? ""] ?? "iranytu.celok")];
      if (sor !== undefined && /^\d+$/.test(sor)) reszek.push(`${Number(sor) + 1}.`);
      const cimkeKulcs = CIMKE[`${szakasz}.${mezo}`];
      if (cimkeKulcs) reszek.push(t(cimkeKulcs));
      return t("iranytu.mentes_hiba_mezo", { mezo: reszek.join(" · ") });
    },
    [t],
  );

  const ment = useCallback(
    async (adat: Iranytu) => {
      if (!szerkesztheto) return;
      setMentesAllapot("folyik");
      const r = await hivas("/api/iranytu", "PUT", adat);
      if (r.statusz === 401) {
        router.push("/belepes");
        return;
      }
      if (r.statusz !== 200) {
        setMentesAllapot("hiba");
        setHibaUzenet(mentesHibaSzoveg(r.torzs));
        return;
      }
      const v = r.torzs as Valasz;
      setAllapot(v.allapot);
      setMentesAllapot("kesz");
      setMentveEkkor(new Date());
    },
    [router, szerkesztheto, mentesHibaSzoveg],
  );

  // 800 ms-os automatikus mentés minden mezőváltozás után.
  useEffect(() => {
    if (elsoBetoltes.current) {
      elsoBetoltes.current = false;
      return;
    }
    if (!szerkesztheto || mod !== "szerkeszt") return;
    if (uresUrlap(urlap)) return; // üres lapból nem csinálunk tervezetet
    if (idozito.current) clearTimeout(idozito.current);
    idozito.current = setTimeout(() => {
      void ment(urlapRef.current);
    }, 800);
    return () => {
      if (idozito.current) clearTimeout(idozito.current);
    };
  }, [urlap, szerkesztheto, mod, ment]);

  function frissit(uj: Iranytu) {
    setUrlap(uj);
  }

  function celValtozas(id: string, resz: Partial<Cel>) {
    frissit({
      ...urlap,
      celok: urlap.celok.map((c) => (c.id === id ? { ...c, ...resz, forras: "sajat" } : c)),
    });
  }
  function celTorles(id: string) {
    frissit({ ...urlap, celok: urlap.celok.filter((c) => c.id !== id) });
  }
  function celHozzaadas() {
    frissit({
      ...urlap,
      celok: [...urlap.celok, { id: ujId(), nev: "", miert: "", mikorra: "", mirol_tudod: "", forras: "sajat" }],
    });
  }

  function ertekValtozas(id: string, resz: Partial<Ertek>) {
    frissit({
      ...urlap,
      ertekek: urlap.ertekek.map((e) => (e.id === id ? { ...e, ...resz, forras: "sajat" } : e)),
    });
  }
  function ertekTorles(id: string) {
    frissit({ ...urlap, ertekek: urlap.ertekek.filter((e) => e.id !== id) });
  }
  function ertekHozzaadas() {
    frissit({ ...urlap, ertekek: [...urlap.ertekek, { id: ujId(), nev: "", magyarazat: "", forras: "sajat" }] });
  }

  function idoszakValtozas(id: string, resz: Partial<Idoszak>) {
    frissit({
      ...urlap,
      idoszakok: urlap.idoszakok.map((i) => (i.id === id ? { ...i, ...resz, forras: "sajat" } : i)),
    });
  }
  function idoszakTorles(id: string) {
    frissit({ ...urlap, idoszakok: urlap.idoszakok.filter((i) => i.id !== id) });
  }
  function idoszakHozzaadas() {
    frissit({
      ...urlap,
      idoszakok: [...urlap.idoszakok, { id: ujId(), nev: "", mettol: "", meddig: "", mit: "", forras: "sajat" }],
    });
  }

  function tolniValtozas(id: string, nev: string) {
    frissit({
      ...urlap,
      tolni: urlap.tolni.map((x) => (x.id === id ? { ...x, nev, forras: "sajat" } : x)),
    });
  }
  function tolniTorles(id: string) {
    frissit({ ...urlap, tolni: urlap.tolni.filter((x) => x.id !== id) });
  }
  /** AI-javaslat egy blokkra (R-11/B4). A javaslat HOZZÁAD, nem ír felül: a kézi munka megmarad. */
  async function javaslatKer(blokk: "celok" | "vizio" | "ertekek" | "idoszakok" | "tolni" | "kerulni" | "mind") {
    if (javaslatFut) return;
    setJavaslatFut(blokk);
    setJavaslatHiba("");
    try {
      const v = await fetch("/api/iranytu/javaslat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blokk }),
      });
      const torzs = (await v.json().catch(() => ({}))) as { javaslat?: Partial<Iranytu>; hiba?: string; mezok?: Record<string, string> };
      if (v.status !== 200 || !torzs.javaslat) {
        const kod = torzs.hiba ?? "";
        const mezoHiba = torzs.mezok?.profil;
        setJavaslatHiba(
          mezoHiba ? t("iranytu.javaslat_hiba_profil")
            : kod === "AI_KERET_KIMERULT" ? t("r13.kredit.elfogyott") // c5 (kerdesek-4 · 9): a „…AI-keret…” mondat helyett (T3)
            : kod === "AI_KIKAPCSOLVA" ? t("iranytu.javaslat_hiba_kikapcsolva")
            : t("iranytu.javaslat_hiba_ai"),
        );
        return;
      }
      const j = torzs.javaslat;
      const uj: Iranytu = {
        ...urlap,
        celok: j.celok ? [...urlap.celok, ...j.celok] : urlap.celok,
        vizio: j.vizio && !urlap.vizio.trim() ? j.vizio : urlap.vizio,
        vizio_forras: j.vizio && !urlap.vizio.trim() ? "ai" : urlap.vizio_forras,
        ertekek: j.ertekek ? [...urlap.ertekek, ...j.ertekek] : urlap.ertekek,
        idoszakok: j.idoszakok ? [...urlap.idoszakok, ...j.idoszakok] : urlap.idoszakok,
        tolni: j.tolni ? [...urlap.tolni, ...j.tolni] : urlap.tolni,
        tiltott_szavak: j.tiltott_szavak ? [...urlap.tiltott_szavak, ...j.tiltott_szavak.filter((x) => !urlap.tiltott_szavak.includes(x))] : urlap.tiltott_szavak,
        kerulendo_temak: j.kerulendo_temak ? [...urlap.kerulendo_temak, ...j.kerulendo_temak.filter((x) => !urlap.kerulendo_temak.includes(x))] : urlap.kerulendo_temak,
      };
      setMod("szerkeszt");
      frissit(uj);
    } catch {
      setJavaslatHiba(t("iranytu.javaslat_hiba_ai"));
    } finally {
      setJavaslatFut(null);
    }
  }

  /** Egy blokk fejlécének „új javaslat" gombja. */
  function JavaslatGomb({ blokk }: { blokk: "celok" | "vizio" | "ertekek" | "idoszakok" | "tolni" | "kerulni" }) {
    if (!szerkesztheto) return null;
    return (
      <button type="button" className="km-ir-javaslat-gomb" onClick={() => void javaslatKer(blokk)} disabled={javaslatFut !== null}>
        {javaslatFut === blokk ? <><span className="r15e-porgo km-ir-porgo" aria-hidden="true" />{t("r15.eb.irjuk")}</> : t("iranytu.uj_javaslat")}
      </button>
    );
  }

  function tolniHozzaadas() {
    frissit({ ...urlap, tolni: [...urlap.tolni, { id: ujId(), nev: "", forras: "sajat" }] });
  }
  function tolniMozgat(index: number, irany: -1 | 1) {
    const uj = [...urlap.tolni];
    const cel = index + irany;
    if (cel < 0 || cel >= uj.length) return;
    const a = uj[index];
    const b = uj[cel];
    if (!a || !b) return;
    uj[index] = b;
    uj[cel] = a;
    frissit({ ...urlap, tolni: uj });
  }

  function tiltottHozzaadas() {
    const s = ujTiltott.trim();
    if (!s) return;
    frissit({ ...urlap, tiltott_szavak: [...urlap.tiltott_szavak, s] });
    setUjTiltott("");
  }
  function tiltottTorles(i: number) {
    frissit({ ...urlap, tiltott_szavak: urlap.tiltott_szavak.filter((_, idx) => idx !== i) });
  }
  function temaHozzaadas() {
    const s = ujTema.trim();
    if (!s) return;
    frissit({ ...urlap, kerulendo_temak: [...urlap.kerulendo_temak, s] });
    setUjTema("");
  }
  function temaTorles(i: number) {
    frissit({ ...urlap, kerulendo_temak: urlap.kerulendo_temak.filter((_, idx) => idx !== i) });
  }

  async function jovahagy() {
    setMentesAllapot("folyik");
    const r = await hivas("/api/iranytu/jovahagyas", "POST", urlap);
    if (r.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (r.statusz !== 200) {
      setMentesAllapot("hiba");
      setHibaUzenet(mentesHibaSzoveg(r.torzs));
      return;
    }
    const v = r.torzs as Valasz;
    setAllapot(v.allapot);
    setUrlap(v.allapot.jovahagyott ?? URES);
    setMod("olvas");
    setMentesAllapot("kesz");
    setMentveEkkor(new Date());
    onKesz?.();
  }

  async function tervezetElvetese() {
    const alap = allapot?.jovahagyott ?? URES;
    setUrlap(alap);
    setMod("szerkeszt");
    await ment(alap);
  }

  async function visszaallitas(verzio: number) {
    setMentesAllapot("folyik");
    const r = await hivas(`/api/iranytu/verziok/${verzio}`, "POST");
    if (r.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (r.statusz !== 200) {
      setMentesAllapot("hiba");
      setHibaUzenet(t("hiba.mentes") || t("kozos.hiba"));
      return;
    }
    const v = r.torzs as Valasz;
    setAllapot(v.allapot);
    setUrlap(v.allapot.tervezet ?? URES);
    setMod("szerkeszt");
    setMentesAllapot("kesz");
    setMentveEkkor(new Date());
    setVisszaallitva(true);
    setTimeout(() => setVisszaallitva(false), 4000);
  }

  function modositas() {
    setMod("szerkeszt");
  }

  if (!allapot) {
    return (
      <>
      <FelsoSav adat={sav} aktiv="iranytu" />
      <main className="km-lap-keret km-ir">
        <p className="km-ir-toltes">{t("kozos.betoltes")}</p>
      </main>
      </>
    );
  }

  const olvashato = !szerkesztheto || mod === "olvas";
  const vanTervezet = allapot.van_tervezet;
  const vanJovahagyott = allapot.jovahagyott !== null;
  const ures = !vanJovahagyott && uresUrlap(urlap);
  // Üres lapon csak a hívogató kártya áll: nincs mit szerkeszteni és nincs mit jóváhagyni.
  const uresLap = ures && !sajatKezdes;
  const ma = maiNap();

  return (
    <>
    <FelsoSav adat={sav} aktiv="iranytu" />
    <main className="km-lap-keret km-ir">

      {vanTervezet && (
        <div className="km-ir-sav km-ir-sav-tervezet">
          <span>{t("iranytu.tervezet_cimke")}</span>
          <span className="km-ir-sav-jobbra">
            {mentesAllapot === "hiba"
              ? hibaUzenet
              : mentesAllapot === "kesz" && mentveEkkor
                ? `${t("iranytu.mentve")} · ${idoBelyeg(mentveEkkor)}`
                : ""}
          </span>
        </div>
      )}
      {!vanTervezet && vanJovahagyott && (
        <div className="km-ir-sav km-ir-sav-jovahagyott">
          <span>{t("iranytu.jovahagyva")}</span>
          <span className="km-ir-sav-jobbra">
            {datumSzoveg(allapot.jovahagyva)} · {allapot.jovahagyta_nev}
          </span>
        </div>
      )}
      {uresLap && (
        <div className="km-ir-ures">
          <h2>{t("iranytu.ures_cim")}</h2>
          <p>{t("iranytu.ures_szoveg")}</p>
          {szerkesztheto && (
            <div className="km-ir-ures-gombok">
              <button type="button" className="km-ir-fogomb" onClick={() => void javaslatKer("mind")} disabled={javaslatFut !== null} aria-busy={javaslatFut !== null}>
                {javaslatFut ? t("r15.ir.irjuk") : t("iranytu.javaslatot_kerek")}
              </button>
              <button type="button" className="km-ir-halvany-gomb" onClick={() => setSajatKezdes(true)}>
                {t("iranytu.inkabb_magam")}
              </button>
            </div>
          )}
          {javaslatHiba && <p className="km-ir-javaslat-hiba">{javaslatHiba}</p>}
        </div>
      )}

      {!uresLap && javaslatHiba && <p className="km-ir-javaslat-hiba">{javaslatHiba}</p>}
      {javaslatFut && <p className="km-ir-halvany">{t("iranytu.javaslat_nem_torol")}</p>}

      {!uresLap && (
      <div className="km-ir-racs">
        <BlokkValaszto
          sorok={[
            { kod: "celok", cim: t("iranytu.celok"), allapot: urlap.celok.length ? String(urlap.celok.length) : "—" },
            { kod: "vizio", cim: t("iranytu.vizio"), allapot: urlap.vizio.trim() ? "✓" : "—" },
            { kod: "ertekek", cim: t("iranytu.ertekrend"), allapot: urlap.ertekek.length ? String(urlap.ertekek.length) : "—" },
            { kod: "idoszakok", cim: t("iranytu.idoszakok"), allapot: urlap.idoszakok.length ? String(urlap.idoszakok.length) : "—" },
            { kod: "tolni", cim: t("iranytu.tolni"), allapot: urlap.tolni.length ? String(urlap.tolni.length) : "—" },
            { kod: "kerulni", cim: t("iranytu.kerulni"), allapot: (urlap.tiltott_szavak.length + urlap.kerulendo_temak.length) ? String(urlap.tiltott_szavak.length + urlap.kerulendo_temak.length) : "—" },
          ]}
          aktiv={aktivBlokk}
          valaszt={setAktivBlokk}
        />
        <div className="km-ir-bal">
          {/* 1. Célok */}
          {aktivBlokk === "celok" && (
          <section className="km-ir-szakasz">
            <div className="km-ir-cimsor"><h2 className="km-ir-cim">{t("iranytu.celok")}</h2><JavaslatGomb blokk="celok" /></div>
            {urlap.celok.length > 5 && <p className="km-ir-halvany">{t("iranytu.sok_cel")}</p>}
            {urlap.celok.map((c) => (
              <div key={c.id} className="km-ir-kartya">
                <div className="km-ir-kartya-fej">
                  <span className="km-ir-jelveny">
                    {/* c5 (kerdesek-4 · 3): a forrás-jelölés nem látszik (T3); az adat (forras) megmarad */ null}
                  </span>
                  {!olvashato && (
                    <button type="button" className="km-ir-torles" onClick={() => celTorles(c.id)}>
                      {t("iranytu.torles")}
                    </button>
                  )}
                </div>
                <label className="km-ir-mezo">
                  <span>{t("iranytu.cel_nev")}</span>
                  <input
                    type="text"
                    value={c.nev}
                    readOnly={olvashato}
                    onChange={(e) => celValtozas(c.id, { nev: e.target.value })}
                    maxLength={IRANYTU_HATAR.nev}
                  />
                </label>
                <label className="km-ir-mezo">
                  <span>{t("iranytu.cel_miert")}</span>
                  <textarea
                    value={c.miert}
                    readOnly={olvashato}
                    onChange={(e) => celValtozas(c.id, { miert: e.target.value })}
                    maxLength={IRANYTU_HATAR.miert}
                  />
                  <small className="km-ir-sugo">{t("iranytu.cel_miert_sugo")}</small>
                </label>
                <div className="km-ir-sor">
                  <label className="km-ir-mezo">
                    <span>{t("iranytu.cel_mikorra")}</span>
                    <input
                      type="text"
                      value={c.mikorra}
                      readOnly={olvashato}
                      onChange={(e) => celValtozas(c.id, { mikorra: e.target.value })}
                    maxLength={IRANYTU_HATAR.mikorra}
                    />
                  </label>
                  <label className="km-ir-mezo">
                    <span>{t("iranytu.cel_mirol")}</span>
                    <input
                      type="text"
                      value={c.mirol_tudod}
                      readOnly={olvashato}
                      onChange={(e) => celValtozas(c.id, { mirol_tudod: e.target.value })}
                    maxLength={IRANYTU_HATAR.mirol_tudod}
                    />
                    <small className="km-ir-sugo">{t("iranytu.cel_mirol_sugo")}</small>
                  </label>
                </div>
              </div>
            ))}
            {!olvashato && (
              <button type="button" className="km-ir-hozzaadas" onClick={celHozzaadas}>
                {t("iranytu.cel_hozzaadas")}
              </button>
            )}
          </section>
          )}

          {/* 2. Vízió */}
          {aktivBlokk === "vizio" && (
          <section className="km-ir-szakasz">
            <div className="km-ir-cimsor"><h2 className="km-ir-cim">{t("iranytu.vizio")}</h2><JavaslatGomb blokk="vizio" /></div>
            <div className="km-ir-kartya">
              <div className="km-ir-kartya-fej">
                <span className="km-ir-jelveny">
                  {/* c5 (kerdesek-4 · 3): a forrás-jelölés nem látszik (T3); az adat (forras) megmarad */ null}
                </span>
              </div>
              <textarea
                value={urlap.vizio}
                readOnly={olvashato}
                onChange={(e) => frissit({ ...urlap, vizio: e.target.value, vizio_forras: "sajat" })}
                    maxLength={IRANYTU_HATAR.vizio}
              />
              <small className="km-ir-sugo">{t("iranytu.vizio_sugo")}</small>
            </div>
          </section>
          )}

          {/* 3. Értékrend */}
          {aktivBlokk === "ertekek" && (
          <section className="km-ir-szakasz">
            <div className="km-ir-cimsor"><h2 className="km-ir-cim">{t("iranytu.ertekrend")}</h2><JavaslatGomb blokk="ertekek" /></div>
            <p className="km-ir-halvany">{t("iranytu.ertekrend_sugo")}</p>
            {urlap.ertekek.map((e) => (
              <div key={e.id} className="km-ir-kartya">
                <div className="km-ir-kartya-fej">
                  <span className="km-ir-jelveny">
                    {/* c5 (kerdesek-4 · 3): a forrás-jelölés nem látszik (T3); az adat (forras) megmarad */ null}
                  </span>
                  {!olvashato && (
                    <button type="button" className="km-ir-torles" onClick={() => ertekTorles(e.id)}>
                      {t("iranytu.torles")}
                    </button>
                  )}
                </div>
                <label className="km-ir-mezo">
                  <span>{t("iranytu.ertek_nev")}</span>
                  <input
                    type="text"
                    value={e.nev}
                    readOnly={olvashato}
                    onChange={(ev) => ertekValtozas(e.id, { nev: ev.target.value })}
                    maxLength={IRANYTU_HATAR.nev}
                  />
                </label>
                <label className="km-ir-mezo">
                  <span>{t("iranytu.ertek_magyarazat")}</span>
                  <textarea
                    value={e.magyarazat}
                    readOnly={olvashato}
                    onChange={(ev) => ertekValtozas(e.id, { magyarazat: ev.target.value })}
                    maxLength={IRANYTU_HATAR.magyarazat}
                  />
                </label>
              </div>
            ))}
            {!olvashato && (
              <button type="button" className="km-ir-hozzaadas" onClick={ertekHozzaadas}>
                {t("iranytu.ertek_hozzaadas")}
              </button>
            )}
          </section>
          )}

          {/* 4. Időszakok */}
          {aktivBlokk === "idoszakok" && (
          <section className="km-ir-szakasz">
            <div className="km-ir-cimsor"><h2 className="km-ir-cim">{t("iranytu.idoszakok")}</h2><JavaslatGomb blokk="idoszakok" /></div>
            {urlap.idoszakok.map((i) => {
              const lejart = i.meddig !== "" && i.meddig < ma;
              return (
                <div key={i.id} className="km-ir-kartya">
                  <div className="km-ir-kartya-fej">
                    {lejart && <span className="km-ir-halvany">{t("iranytu.lejart")}</span>}
                    {!olvashato && (
                      <button type="button" className="km-ir-torles" onClick={() => idoszakTorles(i.id)}>
                        {t("iranytu.torles")}
                      </button>
                    )}
                  </div>
                  <label className="km-ir-mezo">
                    <span>{t("iranytu.idoszak_nev")}</span>
                    <input
                      type="text"
                      value={i.nev}
                      readOnly={olvashato}
                      onChange={(e) => idoszakValtozas(i.id, { nev: e.target.value })}
                    maxLength={IRANYTU_HATAR.nev}
                    />
                  </label>
                  <div className="km-ir-sor">
                    <label className="km-ir-mezo">
                      <span>{t("iranytu.idoszak_mettol")}</span>
                      <input
                        type="date"
                        value={i.mettol}
                        readOnly={olvashato}
                        onChange={(e) => idoszakValtozas(i.id, { mettol: e.target.value })}
                      />
                    </label>
                    <label className="km-ir-mezo">
                      <span>{t("iranytu.idoszak_meddig")}</span>
                      <input
                        type="date"
                        value={i.meddig}
                        readOnly={olvashato}
                        onChange={(e) => idoszakValtozas(i.id, { meddig: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="km-ir-mezo">
                    <span>{t("iranytu.idoszak_mit")}</span>
                    <textarea
                      value={i.mit}
                      readOnly={olvashato}
                      onChange={(e) => idoszakValtozas(i.id, { mit: e.target.value })}
                    maxLength={IRANYTU_HATAR.mit}
                    />
                  </label>
                </div>
              );
            })}
            {!olvashato && (
              <button type="button" className="km-ir-hozzaadas" onClick={idoszakHozzaadas}>
                {t("iranytu.idoszak_hozzaadas")}
              </button>
            )}
          </section>
          )}

          {/* 5. Tólni */}
          {aktivBlokk === "tolni" && (
          <section className="km-ir-szakasz">
            <div className="km-ir-cimsor"><h2 className="km-ir-cim">{t("iranytu.tolni")}</h2><JavaslatGomb blokk="tolni" /></div>
            <p className="km-ir-halvany">{t("iranytu.tolni_sugo")}</p>
            {urlap.tolni.map((x, idx) => (
              <div key={x.id} className="km-ir-sor-szamlalva">
                <span className="km-ir-sorszam">{idx + 1}.</span>
                <input
                  type="text"
                  value={x.nev}
                  readOnly={olvashato}
                  onChange={(e) => tolniValtozas(x.id, e.target.value)}
                    maxLength={IRANYTU_HATAR.nev}
                />
                {!olvashato && (
                  <>
                    <button
                      type="button"
                      className="km-ir-nyil"
                      aria-label={t("iranytu.fel")}
                      onClick={() => tolniMozgat(idx, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="km-ir-nyil"
                      aria-label={t("iranytu.le")}
                      onClick={() => tolniMozgat(idx, 1)}
                    >
                      ↓
                    </button>
                    <button type="button" className="km-ir-torles" onClick={() => tolniTorles(x.id)}>
                      {t("iranytu.torles")}
                    </button>
                  </>
                )}
              </div>
            ))}
            {!olvashato && (
              <button type="button" className="km-ir-hozzaadas" onClick={tolniHozzaadas}>
                {t("iranytu.tolni_hozzaadas")}
              </button>
            )}
          </section>
          )}

          {/* 6. Kerülni */}
          {aktivBlokk === "kerulni" && (
          <section className="km-ir-szakasz">
            <div className="km-ir-cimsor"><h2 className="km-ir-cim">{t("iranytu.kerulni")}</h2><JavaslatGomb blokk="kerulni" /></div>
            <p className="km-ir-halvany">{t("iranytu.kerulni_sugo")}</p>

            <h3 className="km-ir-alcim">{t("iranytu.tiltott_szavak")}</h3>
            <p className="km-ir-halvany">{t("iranytu.tiltott_szavak_sugo")}</p>
            {urlap.tiltott_szavak.length === 0 ? (
              <p className="km-ir-halvany">{t("iranytu.ures_lista")}</p>
            ) : (
              <div className="km-ir-chipek">
                {urlap.tiltott_szavak.map((s, i) => (
                  <span key={`${s}-${i}`} className="km-ir-chip">
                    {s}
                    {!olvashato && (
                      <button type="button" className="km-ir-chip-torles" onClick={() => tiltottTorles(i)} aria-label={t("iranytu.torles")}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {!olvashato && (
              <div className="km-ir-sor">
                <input
                  type="text"
                  value={ujTiltott}
                  onChange={(e) => setUjTiltott(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      tiltottHozzaadas();
                    }
                  }}
                />
                <button type="button" className="km-ir-hozzaadas" onClick={tiltottHozzaadas}>
                  {t("iranytu.tolni_hozzaadas")}
                </button>
              </div>
            )}

            <h3 className="km-ir-alcim">{t("iranytu.kerulendo_temak")}</h3>
            <p className="km-ir-halvany">{t("iranytu.kerulendo_temak_sugo")}</p>
            {urlap.kerulendo_temak.length === 0 ? (
              <p className="km-ir-halvany">{t("iranytu.ures_lista")}</p>
            ) : (
              <div className="km-ir-chipek">
                {urlap.kerulendo_temak.map((s, i) => (
                  <span key={`${s}-${i}`} className="km-ir-chip">
                    {s}
                    {!olvashato && (
                      <button type="button" className="km-ir-chip-torles" onClick={() => temaTorles(i)} aria-label={t("iranytu.torles")}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {!olvashato && (
              <div className="km-ir-sor">
                <input
                  type="text"
                  value={ujTema}
                  onChange={(e) => setUjTema(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      temaHozzaadas();
                    }
                  }}
                />
                <button type="button" className="km-ir-hozzaadas" onClick={temaHozzaadas}>
                  {t("iranytu.tolni_hozzaadas")}
                </button>
              </div>
            )}
          </section>
          )}

          {/* Gombsor */}
          {vanJovahagyott && !vanTervezet && mod === "olvas" ? (
            <div className="km-ir-gombsor">
              {szerkesztheto ? (
                <>
                  <button type="button" className="km-ir-fogomb" onClick={modositas}>
                    {t("iranytu.modositas")}
                  </button>
                  <p className="km-ir-halvany">{t("iranytu.modositas_sugo")}</p>
                </>
              ) : (
                <p className="km-ir-halvany">{t("iranytu.csak_tulajdonos")}</p>
              )}
            </div>
          ) : (
            !uresUrlap(urlap) && (
            <div className="km-ir-gombsor">
              {jovahagyhat ? (
                <button type="button" className="km-ir-fogomb" onClick={jovahagy}>
                  {t("iranytu.jovahagyas")}
                </button>
              ) : (
                <p className="km-ir-halvany">{t("iranytu.csak_tulajdonos")}</p>
              )}
              {szerkesztheto && (
                <button type="button" className="km-ir-halvany-gomb" onClick={tervezetElvetese}>
                  {t("iranytu.tervezet_elvetese")}
                </button>
              )}
              {mentesAllapot === "hiba" && hibaUzenet ? (
                <p className="km-ir-javaslat-hiba" role="alert">{hibaUzenet}</p>
              ) : null}
            </div>
            )
          )}
        </div>

        <aside className="km-ir-jobb">
          <div className="km-ir-doboz">
            <h3>{t("iranytu.mire_hasznalja")}</h3>
            <p>{t("iranytu.mire_hasznalja_szoveg")}</p>
            <hr />
            <h3>{t("iranytu.pelda_cim")}</h3>
            <p>{t("iranytu.pelda_szoveg")}</p>
          </div>

          {verziok.length > 0 && (
            <div className="km-ir-doboz">
              {/* c5 (T3): a „Verziók” / „v{n}” szó nem látszik — a lista dátum + jóváhagyó szerint */}
              <p className="km-ir-halvany">{t("iranytu.korabbi")}</p>
              {visszaallitva && <p className="km-ir-vissza">{t("iranytu.visszaallitva")}</p>}
              <ul className="km-ir-verziok">
                {verziok.map((v) => (
                  <li key={v.verzio}>
                    <span>
                      {datumSzoveg(v.jovahagyva)} · {v.jovahagyta_nev}
                    </span>
                    {jovahagyhat && (
                      <button type="button" className="km-ir-halvany-gomb" onClick={() => visszaallitas(v.verzio)}>
                        {t("iranytu.visszaallitas")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      )}
    </main>
    </>
  );
}
