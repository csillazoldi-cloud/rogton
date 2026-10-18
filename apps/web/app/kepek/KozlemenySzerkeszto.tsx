"use client";
// VZ-1 · a közlemény szerkesztője (design/VZ1-szerkeszto/rajz/VZ1-szerkeszto.dc.html V2–V6; gepezet 2–9; Csilla 2026-10-06 17:32, ★).
// A régi VZ-1b (Szerkeszto.tsx, 09-23) helyett — a gépezete marad: a kép MINDIG a képgyártó képe (POST /api/vizual/keszit), ugyanaz a fájl,
// amit a Letöltés ad; gépelés után ~600 ms-mal frissül, a régebbi kérés eredménye eldobva, közben a régi kép halványan.
//  V2/V3/V4: a recept mezői egyszerű kérdésekként (vizual/kozlemeny-szabaly.ts), mindegyik egyszer, a lap nyelvén; „Románul is” → a gép
//            fordítja (POST /api/vizual/fordit), a román mezők csak ekkor látszanak. Posztból nyitva a mezőket a gép tölti ki (EGY AI-hívás,
//            POST /api/vizual/kozlemeny/kitolt). Ha valami nem fér ki: egy mondat a mező alatt, kész rövidebb javaslattal („Legyen ez”),
//            és a kép addig a rövidebb változatot mutatja (kerdesek 5). Szabálynevet, betűméret-lépcsőt Tibor nem lát (kerdesek 4): a nem
//            az arculatból eredő tiltás egy mondat; a jelzések a letöltéskor a rendszergazda listájába kerülnek.
//  V5:       letöltve — ✓, ami nem fért a képre (a poszt mellé, Másolás), fő gomb: „A poszthoz teszem” (posztból) / „Még egy kép”.
//  V6:       a képgyártó nem válaszol — egy mondat + Újra a kép helyén; a beírt szöveg megmarad, a Letöltés szürke.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { Kapcsolo } from "../_kozos/Kapcsolo";
import { FoGomb, HalkGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import {
  ALLAPOTOK, ALLAPOT_FELIRAT, SABLON_NEV, SOR_MAX, SOR_MIN, bajKeres, ertekIr, ertekOlvas, forditandoMezok, hianyzo, javaslat,
  idoNormal, jelzesKivonat, kepalairasSorok, kisebbBetu, napSzoveg, pontosDatum, szamErtelmez, tartalomEpit, uresUrlap,
  type Allapot, type HolFajta, type KepValasz, type Masodik, type Sablon, type Urlap,
} from "../../vizual/kozlemeny-szabaly";
import "../_kozos/r15-lapok.css";
import "./kozlemeny.css";

export type KozlemenyProps = {
  sablon: Sablon;
  ma: string;
  sorszam: number;
  holFajta: HolFajta;
  /** a második nyelv (román) szavai a kép sávjára / rovatcímkéjére / járat-főcímére */
  ro: { allapot: Record<Allapot, string>; rovat: string; jaratFocim: string };
  poszt: { id: string; nev: string } | null;
};

type KepAllapot = "ures" | "keszul" | "kesz" | "hiba";

/** A lap mezőjének címkéje (a tiltás mondatához és a román mezők fölé). */
const MEZO_CIMKE: Record<string, string> = { hol: "vz1r.hol", helyette: "vz1r.helyette", mondat: "vz1r.mondat", cim: "vz1r.szam_cim", honnan: "vz1r.honnan", savok: "vz1r.savok" };

export function KozlemenySzerkeszto({ sablon, ma, sorszam: kezdoSorszam, holFajta, ro: roSzavak, poszt }: KozlemenyProps) {
  const { t, nyelv } = useFeliratok();
  const [urlap, setUrlap] = useState<Urlap>(() => uresUrlap(ma));
  const [betolt, setBetolt] = useState(!!poszt);
  const [posztbol, setPosztbol] = useState(false);
  const [sorszam, setSorszam] = useState(String(kezdoSorszam));
  const [reszletek, setReszletek] = useState(false);
  // „Románul is”: csak ha a lap nyelve nem román
  const roLehet = nyelv !== "ro";
  const [roBe, setRoBe] = useState(false);
  const [ro, setRo] = useState<Masodik>({});
  const [roGep, setRoGep] = useState<Masodik>({});
  const [roTolt, setRoTolt] = useState<Record<string, boolean>>({});
  // a kép
  const [kep, setKep] = useState<KepAllapot>("ures");
  const [eredmeny, setEredmeny] = useState<KepValasz | null>(null);
  const [mutatott, setMutatott] = useState<KepValasz | null>(null);
  const [ujra, setUjra] = useState(0);
  const kerSzam = useRef(0);
  // V5
  const [kesz, setKesz] = useState(false);
  const [kepId, setKepId] = useState<string | null>(null);
  const [tesz, setTesz] = useState(false);

  // gepezet 2: posztból nyitva a gép tölti ki (EGY hívás); hiba esetén a lap üresen nyílik, mint poszt nélkül
  useEffect(() => {
    if (!poszt) return;
    let el = false;
    void (async () => {
      try {
        const v = await fetch("/api/vizual/kozlemeny/kitolt", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ poszt: poszt.id, sablon }) });
        if (!v.ok || el) return;
        const d = (await v.json()) as { urlap: Partial<Urlap> };
        const u = d.urlap[sablon];
        if (u && !el) {
          setUrlap((x) => ({ ...x, [sablon]: { ...x[sablon], ...u } }));
          setPosztbol(Object.values(u).some((x) => (typeof x === "string" ? x.trim() !== "" : Array.isArray(x) ? x.some((r) => r.nev) : false)));
        }
      } catch {
        /* a lap üresen marad — mint poszt nélkül */
      } finally {
        if (!el) setBetolt(false);
      }
    })();
    return () => { el = true; };
  }, [poszt, sablon]);

  const allapotSzo = useMemo(() => Object.fromEntries(ALLAPOTOK.map((a) => [a, t(ALLAPOT_FELIRAT[a])])) as Record<Allapot, string>, [t]);
  const szam = Number(sorszam);
  const szamJo = /^\d{1,6}$/.test(sorszam.trim());
  const epites = useCallback((rovidites?: Record<string, string>) => tartalomEpit({
    sablon, urlap, nyelv, ro: roLehet && roBe ? ro : null, allapotRo: roSzavak.allapot, allapotSzo,
    rovat: { elso: t("vz1r.szamok_nev"), masodik: roSzavak.rovat }, jaratFocim: { elso: t("vz1r.jarat_focim"), masodik: roSzavak.jaratFocim },
    holFajta, sorszam: szamJo ? szam : kezdoSorszam, ...(rovidites ? { rovidites } : {}),
  }, ma), [sablon, urlap, nyelv, roLehet, roBe, ro, roSzavak, allapotSzo, t, holFajta, szamJo, szam, kezdoSorszam, ma]);

  const hiany = hianyzo(sablon, urlap);
  const baj = eredmeny && kep === "kesz" ? bajKeres(sablon, eredmeny, urlap) : null;
  const bajJavaslat = baj?.fajta === "nem_fer" ? javaslat(baj.lapMezo, ertekOlvas(urlap, baj.lapMezo)) : null;

  // a kép: 600 ms szünet után; a régebbi kérés eredménye eldobva. Ha nem fér ki, a második kép a rövidebb javaslattal (kerdesek 5).
  const tartalomKulcs = JSON.stringify(epites());
  useEffect(() => {
    if (betolt) return;
    if (hiany) { setKep("ures"); setEredmeny(null); setMutatott(null); return; }
    const sor = ++kerSzam.current;
    setKep((k) => (k === "ures" ? "ures" : "keszul"));
    const ido = setTimeout(async () => {
      setKep("keszul");
      const keszit = async (tartalom: unknown): Promise<KepValasz> => {
        const v = await fetch("/api/vizual/keszit", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ sablon, tartalom }) });
        if (!v.ok) throw new Error(String(v.status));
        return (await v.json()) as KepValasz;
      };
      try {
        const e = await keszit(epites());
        if (sor !== kerSzam.current) return;
        const b = bajKeres(sablon, e, urlap);
        let m = e;
        if (b?.fajta === "nem_fer") {
          const r: Record<string, string> = { [b.lapMezo]: javaslat(b.lapMezo, ertekOlvas(urlap, b.lapMezo)) };
          const roSz = roLehet && roBe && b.masodikIs ? ro[b.lapMezo] : undefined;
          if (roSz) r[`ro:${b.lapMezo}`] = javaslat(b.lapMezo, roSz);
          m = await keszit(epites(r)).catch(() => e);
          if (sor !== kerSzam.current) return;
        }
        setEredmeny(e);
        setMutatott(m);
        setKep("kesz");
      } catch {
        if (sor === kerSzam.current) setKep("hiba");
      }
    }, 600);
    return () => clearTimeout(ido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tartalomKulcs, ujra, betolt, hiany]);

  // „Románul is”: a gép fordítja a még üres román mezőket (mezőnként egy hívás); amíg a munkatárs nem írja át, „a gép fordította”
  const mezok = forditandoMezok(sablon, urlap, holFajta);
  const fordit = useCallback(async (mezo: string, szoveg: string) => {
    if (!szoveg.trim()) return;
    setRoTolt((x) => ({ ...x, [mezo]: true }));
    try {
      const v = await fetch("/api/vizual/fordit", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ szoveg, cel: "ro" }) });
      if (v.ok) {
        const sz = ((await v.json()) as { szoveg: string }).szoveg;
        setRo((x) => (x[mezo]?.trim() ? x : { ...x, [mezo]: sz }));
        setRoGep((x) => ({ ...x, [mezo]: sz }));
      }
    } finally {
      setRoTolt((x) => ({ ...x, [mezo]: false }));
    }
  }, []);
  const roKapcsol = (be: boolean) => {
    setRoBe(be);
    if (!be) return;
    for (const m of mezok) if (!ro[m]?.trim() && !roTolt[m]) void fordit(m, ertekOlvas(urlap, m));
  };

  const legyenEz = () => {
    if (baj?.fajta !== "nem_fer" || bajJavaslat === null) return;
    const m = baj.lapMezo;
    setUrlap((u) => ertekIr(u, m, bajJavaslat));
    if (roLehet && roBe && baj.masodikIs && ro[m]) setRo((x) => ({ ...x, [m]: javaslat(m, x[m] ?? "") }));
  };

  // a Letöltés tiltásának oka (az első igaz) — egy mondat
  const mezoNev = (m: string) => (m === "hol" && holFajta === "jarat" ? t("vz1r.jarat") : t(MEZO_CIMKE[m] ?? (/^sor\d$/.test(m) ? "vz1r.savok" : "vz1r.mondat")));
  const tiltas: string | null = betolt ? t("vz2.par_masodperc")
    : hiany === "honnan" ? t("vz1r.tiltas_honnan")
      : hiany ? t("vz1r.tiltas_ures", { mezo: mezoNev(hiany) })
        : !szamJo ? t("vz1r.tiltas_ures", { mezo: t("vz1r.sorszam") })
          : kep === "hiba" ? t("vz1r.tiltas_nincs_kep")
            : kep !== "kesz" || !mutatott ? t("vz2.par_masodperc")
              : baj?.fajta === "nem_fer" ? t("vz1r.tiltas_nem_fer")
                : baj?.fajta === "szabaly" ? t("vz1r.tiltas_szabaly", { mezo: baj.lapMezo ? mezoNev(baj.lapMezo) : t(SABLON_NEV[sablon].nev) })
                  : null;

  const fajlNev = `kozlemeny-${sablon}-${szamJo ? szam : kezdoSorszam}.png`;
  const fajlba = (b64: string) => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${b64}`;
    a.download = fajlNev;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const kepNev = (sablon === "zavar" ? urlap.zavar.hol : sablon === "allitas" ? urlap.allitas.mondat : urlap.adatsavok.cim).trim();
  const letolt = async () => {
    if (tiltas || !mutatott || !eredmeny) return;
    fajlba(mutatott.kep);
    // a szám lesz az utolsó (a következő eggyel több), a jelzések a rendszergazdáé; a heti haladás; a kép a Kész képeim közé (R-15 gepezet 18)
    void fetch("/api/vizual/kozlemeny/letoltve", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ sablon, sorszam: szam, jelzesek: jelzesKivonat(eredmeny) }) }).catch(() => undefined);
    void fetch("/api/halad", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ fajta: "kep_letoltve" }) }).catch(() => undefined);
    setKesz(true);
    try { window.scrollTo(0, 0); document.querySelector(".km-lap-keret")?.scrollTo(0, 0); } catch { /* nem fontos */ }
    setKepId(await kepetMent(mutatott.kep));
  };
  const kepetMent = async (b64: string): Promise<string | null> => {
    try {
      const bin = atob(b64);
      const bajtok = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bajtok[i] = bin.charCodeAt(i);
      const v = await fetch("/api/r15/kep", { method: "POST", body: bajtok, credentials: "same-origin", headers: { "x-fajl-nev": encodeURIComponent((kepNev || t(SABLON_NEV[sablon].nev)).slice(0, 80)) } });
      if (v.status !== 201) return null;
      return ((await v.json()) as { kep: { id: string } }).kep.id;
    } catch {
      return null;
    }
  };
  // R-15 08c: „A poszthoz teszem” — a már elmentett kép a poszthoz kerül, és a poszt nyílik
  const poszthoz = async () => {
    if (!poszt || !mutatott || tesz) return;
    setTesz(true);
    const id = kepId ?? (await kepetMent(mutatott.kep));
    if (id) {
      const v = await fetch(`/api/r15/poszt/${encodeURIComponent(poszt.id)}/kep`, { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ kep_id: id }) }).catch(() => null);
      if (v?.ok) { window.location.href = `/poszt?munka=${encodeURIComponent(poszt.id)}`; return; }
    }
    setTesz(false);
  };

  // ——— a kép blokkja ———
  const kepAlt = t(SABLON_NEV[sablon].nev);
  const kepBlokk = (
    <div className="km-vz1r-kepblokk">
      <span className="km-vz1r-igy r15-csak-asztal">{t("vz1r.igy_nez_ki")}</span>
      {kep === "hiba" ? (
        <div className="km-vz1r-kep-hiba" data-r15="baj" role="alert">
          <p>{t("vz1r.kep_hiba")}</p>
          <HalkGomb onClick={() => setUjra((u) => u + 1)}>{t("vz.ujra")}</HalkGomb>
        </div>
      ) : mutatott ? (
        <div className="km-vz1r-kep-hely">
          <img className={kep === "keszul" ? "km-vz1r-kep km-vz1r-kep-halvany" : "km-vz1r-kep"} src={`data:image/png;base64,${mutatott.kep}`} alt={kepAlt} draggable={false} />
          {kep === "keszul" ? <span className="km-vz1r-kep-felirat">{t("vz2.kep_frissul")}</span> : null}
        </div>
      ) : (
        <span className="km-vz1r-kep km-vz1r-kep-vaz" aria-hidden="true" />
      )}
    </div>
  );

  // ——— V5: kész ———
  if (kesz && mutatott) {
    const kiesett = eredmeny ? kepalairasSorok(eredmeny) : [];
    const masol = () => void navigator.clipboard?.writeText(kiesett.map((s) => [s.elso, s.masodik].filter(Boolean).join("\n")).join("\n\n"));
    const datum = pontosDatum(sablon === "zavar" ? urlap.zavar.nap : ma);
    const fo = poszt
      ? <FoGomb onClick={() => void poszthoz()} disabled={tesz} aria-busy={tesz}>{t("vz1r.poszthoz")}</FoGomb>
      : <FoGomb href="/kepek/szoveges-kepek">{t("vz1r.meg_egy")}</FoGomb>;
    return (
      <main className="km-lap-keret km-vz1r">
        <div className="km-vz1r-racs km-vz1r-kesz">
          <div className="km-vz1r-bal">
            <div className="km-vz1r-fej">
              <KerdesCim cim={t("vz1r.kesz_cim")} />
            </div>
            <p className="km-vz1r-pipa-sor" role="status"><span className="km-vz1r-pipa" aria-hidden="true">✓</span><span>{[kepNev, datum].filter(Boolean).join(" · ")}</span></p>
            <div className="km-vz1r-kesz-kep r15-csak-tel"><img className="km-vz1r-kep" src={`data:image/png;base64,${mutatott.kep}`} alt={kepAlt} draggable={false} /></div>
            {kiesett.length > 0 ? (
              <div className="km-vz1r-kiesett">
                <span className="km-vz1r-kiesett-cim">{t("vz1r.irj_melle")}</span>
                <div className="km-vz1r-kiesett-sorok">
                  {kiesett.map((s, i) => (
                    <p key={i}><span>{s.elso}</span>{s.masodik ? <span className="km-vz1r-halk">{s.masodik}</span> : null}</p>
                  ))}
                </div>
                <span><HalkGomb onClick={masol}>{t("vz1r.masolas")}</HalkGomb></span>
              </div>
            ) : null}
            <span className="r15-csak-asztal">{fo}</span>
            <span className="km-vz1r-linkek">
              {poszt ? <HalkLink href="/kepek/szoveges-kepek">{t("vz1r.meg_egy")}</HalkLink> : null}
              <HalkLink onClick={() => fajlba(mutatott.kep)}>{t("vz1r.ujra_letolt")}</HalkLink>
            </span>
          </div>
          <div className="km-vz1r-jobb r15-csak-asztal"><img className="km-vz1r-kep" src={`data:image/png;base64,${mutatott.kep}`} alt={kepAlt} draggable={false} /></div>
        </div>
        <div className="r15-also-sav">{fo}</div>
      </main>
    );
  }

  // ——— V2–V4, V6: a szerkesztő ———
  const mezo = (cimke: string, ertek: string, valt: (s: string) => void, o: { pelda?: string; nev?: string; hosszu?: boolean } = {}) => (
    <label className="km-vz1r-mezo">
      <span className="km-vz1r-cimke">{cimke}</span>
      {o.hosszu ? (
        <textarea className="km-vz1r-be km-vz1r-be-hosszu" rows={3} value={ertek} disabled={betolt} placeholder={o.pelda ? t(o.pelda) : undefined} onChange={(e) => valt(e.target.value)} />
      ) : (
        <input className="km-vz1r-be" value={ertek} disabled={betolt} placeholder={o.pelda ? t(o.pelda) : undefined} onChange={(e) => valt(e.target.value)} />
      )}
    </label>
  );
  const bajBlokk = (m: string) =>
    baj?.fajta === "nem_fer" && baj.lapMezo === m && bajJavaslat !== null ? (
      <div className="r15-baj km-vz1r-baj" data-r15="baj" role="alert">
        <p className="r15-baj-szoveg">{t("vz1r.nem_fer")} <strong>„{bajJavaslat}”</strong></p>
        <span><HalkGomb onClick={legyenEz}>{t("vz1r.legyen_ez")}</HalkGomb></span>
      </div>
    ) : null;
  const roMezo = (m: string, cimke: string) => (
    <label key={`ro-${m}`} className="km-vz1r-mezo">
      <span className="km-vz1r-cimke-sor">
        <span className="km-vz1r-cimke">{cimke}</span>
        {roGep[m] !== undefined && ro[m] === roGep[m] ? <span className="km-vz1r-gep">{t("vz1r.gep_forditotta")}</span> : null}
      </span>
      <input className="km-vz1r-be" lang="ro" value={ro[m] ?? ""} disabled={!!roTolt[m]} aria-busy={!!roTolt[m]} onChange={(e) => setRo((x) => ({ ...x, [m]: e.target.value }))} />
    </label>
  );
  const roCimke = (m: string) => (mezok.length === 1 ? t("vz1r.romanul") : `${mezoNev(m)} · ${t("vz1r.romanul")}`);
  const roSor = roLehet ? (
    <span className="km-vz1r-ro-kapcsolo">
      <Kapcsolo be={roBe} valt={roKapcsol} cimke={t("vz1r.romanul_is")} />
      <span>{t("vz1r.romanul_is")}</span>
    </span>
  ) : null;
  const roMezok = roLehet && roBe ? mezok.filter((m) => ertekOlvas(urlap, m).trim() || ro[m]).map((m) => roMezo(m, roCimke(m))) : null;
  const sorszamMezo = (
    <label className="km-vz1r-mezo km-vz1r-mezo-kicsi">
      <span className="km-vz1r-cimke">{t("vz1r.sorszam")}</span>
      <input className="km-vz1r-be km-vz1r-szam" inputMode="numeric" value={sorszam} onChange={(e) => setSorszam(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
    </label>
  );

  const z = urlap.zavar;
  const valtZ = (m: Partial<typeof z>) => setUrlap((u) => ({ ...u, zavar: { ...u.zavar, ...m } }));
  const s = urlap.adatsavok;
  const valtS = (m: Partial<typeof s>) => setUrlap((u) => ({ ...u, adatsavok: { ...u.adatsavok, ...m } }));
  const rosszSzam = s.sorok.some((r) => !szamErtelmez(r.szam).ok);

  const letoltGomb = (
    <FoGomb onClick={() => void letolt()} disabled={!!tiltas} osztaly={tiltas ? "km-vz1r-letolt-szurke" : "km-vz1r-letolt-gomb"}>{t("vz1r.letoltes")}</FoGomb>
  );

  const urlapBlokk = (
    <section className="r15-teendo km-vz1r-urlap" data-r15="teendo" aria-busy={betolt}>
      {sablon === "zavar" ? (
        <>
          <div className="km-vz1r-mezo">
            <span className="km-vz1r-cimke">{t("vz1r.helyzet")}</span>
            <div className="km-vz1r-valaszto" role="radiogroup" aria-label={t("vz1r.helyzet")}>
              {ALLAPOTOK.map((a) => (
                <button key={a} type="button" role="radio" aria-checked={z.allapot === a} disabled={betolt} className={z.allapot === a ? "km-vz1r-valasz km-vz1r-valasz-ki" : "km-vz1r-valasz"} onClick={() => valtZ({ allapot: a })}>
                  {allapotSzo[a]}
                </button>
              ))}
            </div>
          </div>
          {mezo(holFajta === "jarat" ? t("vz1r.jarat") : t("vz1r.hol"), z.hol, (v) => valtZ({ hol: v }), { pelda: holFajta === "jarat" ? "vz1r.pelda_jarat" : "vz1r.pelda_hol" })}
          {bajBlokk("hol")}
          <div className="km-vz1r-mezo">
            <span className="km-vz1r-cimke">{t("vz1r.mikor")}</span>
            <div className="km-vz1r-mikor">
              <label className="km-vz1r-nap">
                <input className="km-vz1r-be km-vz1r-nap-szoveg" readOnly tabIndex={-1} aria-hidden="true" value={napSzoveg(z.nap, nyelv)} />
                <input type="date" className="km-vz1r-nap-be" aria-label={t("vz1r.melyik_nap")} value={z.nap} disabled={betolt}
                  onClick={(e) => { try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* régi böngésző */ } }}
                  onChange={(e) => e.target.value && valtZ({ nap: e.target.value })} />
              </label>
              {/* 24 órás szövegmező (a rajz szerint), gépeléskor „8” → „08:00” a mező elhagyásakor; a kép csak helyes időt kap */}
              <input className="km-vz1r-be km-vz1r-ido" inputMode="numeric" maxLength={5} aria-label={t("vz1r.kezdete")} value={z.kezdet} disabled={betolt} onChange={(e) => valtZ({ kezdet: e.target.value })} onBlur={(e) => valtZ({ kezdet: idoNormal(e.target.value) })} />
              <span className="km-vz1r-kotojel" aria-hidden="true">–</span>
              <input className="km-vz1r-be km-vz1r-ido" inputMode="numeric" maxLength={5} aria-label={t("vz1r.vege")} value={z.veg} disabled={betolt} onChange={(e) => valtZ({ veg: e.target.value })} onBlur={(e) => valtZ({ veg: idoNormal(e.target.value) })} />
              <label className="km-vz1r-pipa-be">
                <input type="checkbox" checked={z.vegKb} disabled={betolt} onChange={(e) => valtZ({ vegKb: e.target.checked })} />
                <span>{t("vz1r.vege_kb")}</span>
              </label>
            </div>
          </div>
          {mezo(t("vz1r.helyette"), z.helyette, (v) => valtZ({ helyette: v }), { pelda: "vz1r.pelda_helyette" })}
          {bajBlokk("helyette")}
          <div className="km-vz1r-sor">
            {roSor}
            <HalkLink onClick={() => setReszletek((r) => !r)} aria-expanded={reszletek}>{t("vz1r.reszletek")}</HalkLink>
          </div>
          {roMezok}
          {reszletek ? (
            <div className="km-vz1r-reszletek" data-r15="reszletek">
              {sorszamMezo}
              <label className="km-vz1r-mezo km-vz1r-mezo-kicsi">
                <span className="km-vz1r-cimke">{t("vz1r.frissites")}</span>
                <input className="km-vz1r-be km-vz1r-ido" inputMode="numeric" maxLength={5} value={z.frissites} onChange={(e) => valtZ({ frissites: e.target.value })} onBlur={(e) => valtZ({ frissites: idoNormal(e.target.value) })} />
              </label>
            </div>
          ) : null}
        </>
      ) : sablon === "allitas" ? (
        <>
          {mezo(t("vz1r.mondat"), urlap.allitas.mondat, (v) => setUrlap((u) => ({ ...u, allitas: { mondat: v } })), { pelda: "vz1r.pelda_mondat", hosszu: true })}
          {bajBlokk("mondat")}
          {roSor ? <div className="km-vz1r-sor">{roSor}</div> : null}
          {roMezok}
        </>
      ) : (
        <>
          {mezo(t("vz1r.szam_cim"), s.cim, (v) => valtS({ cim: v }), { pelda: "vz1r.pelda_szam_cim" })}
          {bajBlokk("cim")}
          <div className="km-vz1r-mezo">
            <span className="km-vz1r-cimke">{t("vz1r.savok")}</span>
            <div className="km-vz1r-savok">
              {s.sorok.map((r, i) => (
                <div key={i} className="km-vz1r-sav-sor">
                  <input className="km-vz1r-be km-vz1r-sav-nev" aria-label={t("vz1r.sor_nev")} value={r.nev} disabled={betolt} placeholder={i === 0 ? t("vz1r.pelda_sor") : undefined}
                    onChange={(e) => valtS({ sorok: s.sorok.map((x, j) => (j === i ? { ...x, nev: e.target.value } : x)) })} />
                  <input className={szamErtelmez(r.szam).ok ? "km-vz1r-be km-vz1r-sav-szam" : "km-vz1r-be km-vz1r-sav-szam km-vz1r-be-baj"} aria-label={t("vz1r.sor_szam")} inputMode="decimal" value={r.szam} disabled={betolt}
                    onChange={(e) => valtS({ sorok: s.sorok.map((x, j) => (j === i ? { ...x, szam: e.target.value.slice(0, 6) } : x)) })} />
                  <span className="km-vz1r-szazalek" aria-hidden="true">%</span>
                  {s.sorok.length > SOR_MIN ? (
                    <button type="button" className="km-vz1r-torles" aria-label={t("vz1r.sor_torles")} onClick={() => valtS({ sorok: s.sorok.filter((_, j) => j !== i) })}>×</button>
                  ) : <span className="km-vz1r-torles-hely" aria-hidden="true" />}
                  {bajBlokk(`sor${i}`) ? <div className="km-vz1r-sav-baj">{bajBlokk(`sor${i}`)}</div> : null}
                </div>
              ))}
            </div>
            {rosszSzam ? <span className="km-vz1r-hiba">{t("vz1r.szam_hiba")}</span> : null}
            {s.sorok.length < SOR_MAX ? (
              <span><HalkLink onClick={() => valtS({ sorok: [...s.sorok, { nev: "", szam: "" }] })}>{t("vz1r.meg_egy_sor")}</HalkLink></span>
            ) : null}
          </div>
          {mezo(t("vz1r.honnan"), s.honnan, (v) => valtS({ honnan: v }), { pelda: "vz1r.pelda_honnan" })}
          <label className="km-vz1r-pipa-be">
            <input type="checkbox" checked={s.csakPelda} disabled={betolt} onChange={(e) => valtS({ csakPelda: e.target.checked })} />
            <span>{t("vz1r.csak_pelda")}</span>
          </label>
          <span><HalkLink onClick={() => setReszletek((r) => !r)} aria-expanded={reszletek}>{t("vz1r.reszletek")}</HalkLink></span>
          {reszletek ? (
            <div className="km-vz1r-reszletek" data-r15="reszletek">
              {roSor ? <div className="km-vz1r-sor">{roSor}</div> : null}
              {roMezok}
              {sorszamMezo}
            </div>
          ) : null}
        </>
      )}
      {kep === "kesz" && mutatott && !baj && kisebbBetu(mutatott) ? (
        <Info>{t("vz2.gep_kisebb_betu", { mit: t(sablon === "zavar" ? "vz1r.mit_hol" : sablon === "allitas" ? "vz1r.mit_mondat" : "vz2.mit_cim") })}</Info>
      ) : null}
      <div className="km-vz1r-letolt r15-csak-asztal">
        {letoltGomb}
        {tiltas ? <span className="km-vz1r-tiltas">{tiltas}</span> : null}
      </div>
    </section>
  );

  const alcim = posztbol && poszt ? t("vz1r.posztbol", { nev: poszt.nev }) : undefined;
  return (
    <main className="km-lap-keret km-vz1r">
      <div className={baj?.fajta === "nem_fer" ? "km-vz1r-racs km-vz1r-racs-baj" : "km-vz1r-racs"}>
        <div className="km-vz1r-bal">
          <div className="km-vz1r-fej">
            <a href={poszt ? `/kepek/szoveges-kepek?poszt=${encodeURIComponent(poszt.id)}` : "/kepek/szoveges-kepek"} className="km-vz1r-vissza"><span aria-hidden="true">‹</span>{t("vz1r.kozlemenyek")}</a>
            <KerdesCim cim={t("vz1r.szerk_cim")} {...(alcim ? { alcim } : {})} />
          </div>
          <div className="km-vz1r-tel-kep r15-csak-tel">{kepBlokk}</div>
          {urlapBlokk}
        </div>
        <div className="km-vz1r-jobb r15-csak-asztal">{kepBlokk}</div>
      </div>
      <div className="r15-also-sav">
        {letoltGomb}
        {tiltas && baj?.fajta !== "nem_fer" ? <span className="km-vz1r-tiltas km-vz1r-tiltas-tel">{tiltas}</span> : null}
      </div>
    </main>
  );
}
