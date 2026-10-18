"use client";

import { R15IkonDoboz, type R15IkonNev } from "../_kozos/R15Ikon";
import { useRouter } from "next/navigation";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdatpolitikaNezet, BeallitasokNezet, ErtesitesSor, SajatBeallitas, SajatFajta } from "../../ertesites/tipusok";
import {
  ERTESITES_FAJTAK,
  RENDSZERGAZDA_FAJTA,
} from "../../ertesites/tipusok";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { Kapcsolo } from "../_kozos/Kapcsolo";
import { FoGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { BeallitasokMenu } from "./BeallitasokMenu";
import { NyelvModValaszto, useNyelvMn } from "../_kozos/C30NyelvMod";
import type { PosztNyelvMod } from "@km/contracts";
import "../_kozos/r15-lapok.css";
import "./beallitasok.css";

// R-15 c5 2. kör (design/R15/rajz/R15-lapok-5.dc.html 14a · 14b · 14c; gepezet-5 5; kerdesek-5 11–15, Csilla 10-10 18:08):
// az Értesítések fülön a cím az állapotot mondja („2 új értesítésed van” / „Nincs új értesítésed”), a fő gomb a legújabb olvasatlant
// nyitja (üresen: vissza a Kezdőlapra), a „Mind olvasottnak jelölöm” halk link; a kapcsolók a „Miről szóljon ▾” mögött.
// A két halott csatorna-sor (E-mail, Telefon — „még nem működik”) lekerült; az „A felületen” kapcsoló él, ezért MARAD (a kapcsolók között).
// Az Adatkezelés fül változatlan (kerdesek-5 · 13).

/** c5 3. kör (R15-lapok-6 14cI, gen6 IKON14): a kapcsolók ikonjai a felirat kulcsa szerint. */
const KAPCSOLO_IKON: Partial<Record<string, R15IkonNev>> = {
  "ertesites.csatorna_feluleten": "harang",
  "esemeny.futas_kesz_cim": "hirek",
  "esemeny.forras_hibas_cim": "figyelem",
  "r15.ert.keret_cim": "kredit",
  "esemeny.ai_nem_valaszol_cim": "chip",
  "esemeny.futas_beragadt_cim": "ora",
};
export function Beallitasok({
  nezet,
  ful,
  sav,
  szervezetNev,
  nyelvAdat = null,
}: {
  nezet: BeallitasokNezet;
  /** null: telefonon a lista (asztalon az Értesítések); a fül a `?ful=` címből */
  ful: "ertesitesek" | "adatpolitika" | "nyelv" | null;
  sav: FelsoSavAdat;
  szervezetNev: string;
  /** c30 F3 (rajz D9b): a szervezet nyelvei és a posztok nyelvi módja; null: egy nyelvű szervezet vagy néző — nincs „Posztok nyelve” */
  nyelvAdat?: { nyelvek: string[]; mod: PosztNyelvMod } | null;
}) {
  const { t, nyelv } = useFeliratok();
  const aktualisFul = ful ?? "ertesitesek";
  const [beallitas, setBeallitas] = useState<SajatBeallitas>(
    nezet.beallitas
  );
  const [lista, setLista] = useState(nezet.lista);
  const [mindOlvasottFolyik, setMindOlvasottFolyik] = useState(false);

  const kapcsoloValt = useCallback(
    async (fajta: SajatFajta, ertek: boolean) => {
      const uj: SajatBeallitas = {
        ...beallitas,
        esemenyek: { ...beallitas.esemenyek, [fajta]: ertek },
      };
      setBeallitas(uj);
      const eredmeny = await hivas("/api/ertesites/sajat", "PUT", uj);
      if (eredmeny.statusz !== 200) {
        setBeallitas(beallitas);
      }
    },
    [beallitas]
  );

  const feluletenValt = useCallback(
    async (ertek: boolean) => {
      const uj: SajatBeallitas = { ...beallitas, feluleten: ertek };
      setBeallitas(uj);
      const eredmeny = await hivas("/api/ertesites/sajat", "PUT", uj);
      if (eredmeny.statusz !== 200) {
        setBeallitas(beallitas);
      }
    },
    [beallitas]
  );

  const mindOlvasott = useCallback(async () => {
    setMindOlvasottFolyik(true);
    const eredmeny = await hivas("/api/ertesites/olvasott", "POST", {
      mind: true,
    });
    setMindOlvasottFolyik(false);
    if (eredmeny.statusz === 200 && "lista" in eredmeny.torzs) {
      setLista(eredmeny.torzs.lista as typeof lista);
    }
  }, []);

  const idoFormatum = useMemo(() => {
    return new Intl.DateTimeFormat(nyelv, {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Bucharest",
    });
  }, [nyelv]);

  // R-18 8. kör (Round 8 rajz): a régi fülsor helyett a Beállítások listája (BeallitasokMenu). Telefonon ?ful= nélkül csak a lista látszik
  // („Beállítások” cím); egy részben fölül „‹ Beállítások”. Asztalon mindig a lista + a rész (?ful= nélkül az Értesítések).
  return (
    <main className="km-lap-keret km-be-lap r18b-lap" data-nezet={ful ? "resz" : "lista"}>
      <h1 className="r15-kerdes r18b-lista-cim">{t("r15.nav.beallitasok")}</h1>
      <div className="r18b-racs">
        <div className="r18b-bal">
          <BeallitasokMenu sav={sav} szervezetNev={szervezetNev} aktiv={aktualisFul} posztokNyelve={!!nyelvAdat} />
        </div>
        <div className="r18b-jobb">
          <a href="/beallitasok" className="r18b-vissza">{t("r18.beall.vissza")}</a>
          {aktualisFul === "nyelv" && nyelvAdat ? (
            <PosztokNyelveFul nyelvek={nyelvAdat.nyelvek} kezdo={nyelvAdat.mod} />
          ) : aktualisFul === "ertesitesek" ? (
            <ErtesitesekFul
              lista={lista}
              beallitas={beallitas}
              rendszergazda={nezet.rendszergazda}
              mindOlvasottFolyik={mindOlvasottFolyik}
              idoFormatum={idoFormatum}
              t={t}
              nyelv={nyelv}
              onKapcsoloValt={kapcsoloValt}
              onFeluletenValt={feluletenValt}
              onMindOlvasott={mindOlvasott}
              alsoSav={ful !== null}
            />
          ) : (
            <AdatpolitikaFul
              adatpolitika={nezet.adatpolitika}
              t={t}
              nyelv={nyelv}
            />
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * c30 F3 · Beállítások → Posztok nyelve (rajz D9b). Egy koppintás ment (nincs fő gomb a rajzon): a választás a válasz, mint az
 * Értesítések kapcsolóinál. Csak a profil `poszt_nyelv_mod` mezője változik — a meglévő posztok szövegéhez nem nyúl (ezt mondja a halk sor).
 */
function PosztokNyelveFul({ nyelvek, kezdo }: { nyelvek: string[]; kezdo: PosztNyelvMod }) {
  const { t } = useFeliratok();
  const mn = useNyelvMn();
  const [mod, setMod] = useState<PosztNyelvMod>(kezdo);
  const [fut, setFut] = useState(false);
  async function valt(uj: PosztNyelvMod) {
    if (fut || uj === mod) return;
    const regi = mod;
    setMod(uj);
    setFut(true);
    const r = await hivas("/api/profil/nyelvmod", "PUT", { mod: uj });
    setFut(false);
    if (r.statusz !== 200) setMod(regi);
  }
  return (
    <div className="c30-nyelv-ful">
      <KerdesCim cim={t("c30.beall.posztok_nyelve")} />
      <NyelvModValaszto nyelvek={nyelvek} mod={mod} valt={(m) => void valt(m)} tiltva={fut} />
      <Info>{t("c30.nyelvmod.meglevo")}</Info>
      <Info>{t("c30.nyelvmod.nyelvek", { nyelvek: nyelvek.map(mn).join(", ") })} · <a href="/fiok" className="r15-halk-link">{t("r15.nav.szervezet")} ›</a></Info>
    </div>
  );
}

function ErtesitesekFul({
  lista,
  beallitas,
  rendszergazda,
  mindOlvasottFolyik,
  idoFormatum,
  t,
  nyelv,
  onKapcsoloValt,
  onFeluletenValt,
  onMindOlvasott,
  alsoSav,
}: {
  lista: BeallitasokNezet["lista"];
  beallitas: SajatBeallitas;
  rendszergazda: boolean;
  mindOlvasottFolyik: boolean;
  idoFormatum: Intl.DateTimeFormat;
  t: (kulcs: string, ertekek?: Record<string, string | number>) => string;
  nyelv: string;
  onKapcsoloValt: (fajta: SajatFajta, ertek: boolean) => void;
  onFeluletenValt: (ertek: boolean) => void;
  onMindOlvasott: () => void;
  /** a telefonos alsó gombsáv — a lista-nézetben (?ful= nélkül) nincs, hogy a lista alá ne kerüljön fő gomb */
  alsoSav: boolean;
}) {
  const vanOlvasatlan = lista.osszes > 0 && lista.olvasatlan > 0;
  const [nyitva, setNyitva] = useState(false);
  // a lista a legújabbal kezdődik (ertesites/index.ts: ido szerint csökkenő) — a fő gomb az első olvasatlant nyitja
  const legujabb = lista.sorok.find((x) => !x.olvasott) ?? null;
  const cim = !vanOlvasatlan ? t("r15.ert.kerdes_nincs") : lista.olvasatlan === 1 ? t("r15.ert.kerdes_egy") : t("r15.ert.kerdes_uj", { n: lista.olvasatlan });
  const foGomb = vanOlvasatlan && legujabb
    ? <FoGomb href={`/beallitasok/nyit/${legujabb.id}`}>{t("r15.ert.legujabb")}</FoGomb>
    : <FoGomb href="/kezdolap">{t("r15.kozos.kezdolapra")}</FoGomb>;
  // c5 3. kör (R15-lapok-6 14cI; Csilla 10-10 21:02): minden kapcsoló előtt egy ikon a kis négyzetben (csak megjelenés).
  // A rendszergazdai „belépési kísérletek” sor nincs a rajzon — ikon nélkül marad (kérdés a következő rajzkörre).
  const kapcsoloSor = (kulcs: string, be: boolean, valt: (x: boolean) => void) => (
    <div className="km-be-kapcsolo-sor">
      <span className="km-be-kapcsolo-szoveg r15-ikonos">{KAPCSOLO_IKON[kulcs] ? <R15IkonDoboz nev={KAPCSOLO_IKON[kulcs]} /> : null}<span>{t(kulcs)}</span></span>
      <Kapcsolo be={be} valt={valt} cimke={t(kulcs)} />
    </div>
  );

  return (
    <div className="km-be-ertesitesek r15ert">
      {vanOlvasatlan ? <KerdesCim cim={cim} /> : <KerdesCim cim={cim} alcim={t("r15.ert.nincs_alcim")} />}
      {lista.sorok.length > 0 ? (
        <div className="km-be-lista-sorok r15ert-lista">
          {lista.sorok.map((sor) => (
            <ErtesitesSorKomponens key={sor.id} sor={sor} idoFormatum={idoFormatum} t={t} nyelv={nyelv} />
          ))}
        </div>
      ) : null}
      <div className="r15ert-gombsor">
        <span className="r15-csak-asztal">{foGomb}</span>
        {vanOlvasatlan ? <HalkLink onClick={onMindOlvasott} disabled={mindOlvasottFolyik}>{t("r18.beall.mind_olvasott")}</HalkLink> : null}
        <HalkLink aria-expanded={nyitva} onClick={() => setNyitva((x) => !x)}>{`${t("r18.beall.mikor_szolunk")} ${nyitva ? "▴" : "▾"}`}</HalkLink>
      </div>
      <div className="r15ert-kapcsolok">
        {nyitva ? (
          <div className="km-be-kapcsolok-lista" data-r15="reszletek">
            <Info>{t("ertesites.csatorna_mondat")}</Info>
            {kapcsoloSor("ertesites.csatorna_feluleten", beallitas.feluleten, onFeluletenValt)}
            {ERTESITES_FAJTAK.map((fajta) => (
              <div key={fajta}>{kapcsoloSor(fajta === "keret_kimerult" ? "r15.ert.keret_cim" : `esemeny.${fajta}_cim`, beallitas.esemenyek[fajta], (ertek) => onKapcsoloValt(fajta, ertek))}</div>
            ))}
            {rendszergazda ? kapcsoloSor(`esemeny.${RENDSZERGAZDA_FAJTA}_cim`, beallitas.esemenyek[RENDSZERGAZDA_FAJTA], (ertek) => onKapcsoloValt(RENDSZERGAZDA_FAJTA, ertek)) : null}
          </div>
        ) : null}
      </div>
      {alsoSav ? <div className="r15-also-sav">{foGomb}</div> : null}
    </div>
  );
}

/** R-18 8. kör (Round 8 rajz): az értesítés ideje röviden — „most” · „{n} perce” · „{n} órája” · „tegnap” · „okt. 11.” */
function rovidIdo(t: (kulcs: string, ertekek?: Record<string, string | number>) => string, nyelv: string, ido: string | Date): string {
  const d = new Date(ido);
  const perc = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (perc < 1) return t("r18.beall.ido_most");
  if (perc < 60) return t("r18.beall.ido_perce", { n: perc });
  if (perc < 24 * 60) return t("r18.beall.ido_oraja", { n: Math.floor(perc / 60) });
  if (perc < 48 * 60) return t("r18.beall.ido_tegnap");
  return new Intl.DateTimeFormat(nyelv, { month: "short", day: "numeric", timeZone: "Europe/Bucharest" }).format(d);
}

function ErtesitesSorKomponens({
  sor,
  t,
  nyelv,
}: {
  sor: ErtesitesSor;
  idoFormatum: Intl.DateTimeFormat;
  t: (kulcs: string, ertekek?: Record<string, string | number>) => string;
  nyelv: string;
}) {
  const esemenySzoveg = (() => {
    if (sor.fajta === "futas_kesz") {
      return t("ertesites.esemeny_futas_kesz", sor.ertekek);
    }
    if (sor.fajta === "forras_hibas" && sor.ertekek?.forras) {
      return t("ertesites.esemeny_forras_hiba", { forras: String(sor.ertekek.forras) });
    }
    return t(`ertesites.esemeny_${sor.fajta}`, sor.ertekek);
  })();

  // R-18 8. kör (Round 8 rajz): az egész sor a megnyitás (a régi „Megnyitás”/„Teendő” link helyett) — pötty · esemény · idő jobbra
  return (
    <a href={`/beallitasok/nyit/${sor.id}`} className="km-be-lista-sor r18b-ert-sor" data-olvasott={sor.olvasott}>
      <span className="r15ert-pont" aria-hidden="true" />
      <span className="km-be-lista-esemeny">{esemenySzoveg}</span>
      <span className="r18b-ert-ido" suppressHydrationWarning>{rovidIdo(t, nyelv, sor.ido)}</span>
    </a>
  );
}

function AdatpolitikaFul({
  adatpolitika,
  t,
}: {
  adatpolitika: BeallitasokNezet["adatpolitika"];
  t: (kulcs: string, ertekek?: Record<string, string | number>) => string;
  nyelv: string;
}) {
  // R-18 8. kör (Round 8 rajz „Beállítások · Adatkezelés · telefon”): elöl EGY kapcsoló és egy mondat; minden magyarázat
  // („mit küldünk, kinek, mire”, a betűkészlet sora, a felhő-kapcsoló) a „Részletek: mit, kinek, mire? ▾” mögött — semmi nem tűnt el.
  const [reszletek, setReszletek] = useState(false);
  return (
    <div className="km-be-adatpolitika r18b-adat">
      <KerdesCim cim={t("beallitasok.adatkezeles_cim")} />
      <AiKapcsoloDoboz adatpolitika={adatpolitika} />
      <HalkLink aria-expanded={reszletek} onClick={() => setReszletek((x) => !x)}>{`${t("r18.beall.reszletek_adat")} ${reszletek ? "▴" : "▾"}`}</HalkLink>
      {reszletek ? (
        <div className="r18b-adat-reszletek" data-r15="reszletek">
          <p className="km-be-adatpolitika-alcim">{t("beallitasok.adatkezeles_alcim")}</p>
          <div className="km-be-kerdesek">
            <div className="km-be-kerdes">
              <span className="km-be-kerdes-cim">{t("beallitasok.mit_kuldunk")}</span>
              <span className="km-be-kerdes-valasz">{t("beallitasok.mit_kuldunk_valasz")}</span>
            </div>
            <div className="km-be-kerdes">
              <span className="km-be-kerdes-cim">{t("beallitasok.kinek")}</span>
              <span className="km-be-kerdes-valasz">{t("beallitasok.kinek_valasz")}</span>
            </div>
            <div className="km-be-kerdes">
              <span className="km-be-kerdes-cim">{t("beallitasok.mire_hasznalja")}</span>
              <span className="km-be-kerdes-valasz">{t("beallitasok.mire_hasznalja_valasz")}</span>
            </div>
          </div>
          <p className="km-be-betukeszlet-sor">{t("beallitasok.betukeszlet_sor")}</p>
          {adatpolitika.felho_kapcsolo_latszik ? (
            <div className="km-be-felho-kapcsolo-doboz">
              <div className="km-be-felho-kapcsolo-fejlec">
                <div className="km-be-felho-kapcsolo-szoveg">
                  <span className="km-be-felho-kapcsolo-nev-jelveny">
                    <span className="km-be-felho-kapcsolo-nev">{t("adatpolitika.kapcsolo_cim")}</span>
                    <span className="km-be-keszul-jelveny">{t("jelzes.meg_nem_mukodik")}</span>
                  </span>
                  <span className="km-be-felho-kapcsolo-megj">{t("adatpolitika.kapcsolo_miert")}</span>
                </div>
                <Kapcsolo be={false} letiltva cimke={t("adatpolitika.kapcsolo_cim")} />
              </div>
              <div className="km-be-felho-kapcsolo-mit-fog">
                <span className="km-be-felho-kapcsolo-mit-fog-cim">{t("adatpolitika.kapcsolo_mit_fog_cim")}</span>
                <span className="km-be-felho-kapcsolo-mit-fog-mondat">{t("adatpolitika.kapcsolo_mit_fog_1")}</span>
                <span className="km-be-felho-kapcsolo-mit-fog-mondat">{t("adatpolitika.kapcsolo_mit_fog_2")}</span>
                <span className="km-be-felho-kapcsolo-mit-fog-mondat">{t("adatpolitika.kapcsolo_mit_fog_3")}</span>
              </div>
            </div>
          ) : null}
          <p className="km-be-adatpolitika-alcim">{t("ai_kapcsolo.kovetkezmeny")}</p>
        </div>
      ) : null}
    </div>
  );
}

/** F-7b (R-5, 05. artboard): a munkatér AI-kapcsolója — MŰKÖDŐ kapcsoló (PUT /api/beallitas/ai). Kikapcsolva egyetlen AI-hívás sem indul a
 *  munkatér nevében. R-18 8. kör (Round 8 rajz): egy sor („Az AI dolgozhat a cégem adataival” + kapcsoló), alatta egy mondat; kikapcsolva
 *  a „Kikapcsolva {ido} · {ki}” sor is (az eseménynaplóból). A régi „Automatikus értékelés … következmény” mondat a Részletek alá került. */
function AiKapcsoloDoboz({ adatpolitika }: { adatpolitika: AdatpolitikaNezet }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const [be, setBe] = useState(adatpolitika.ai_engedelyezve);
  const [fut, setFut] = useState(false);
  useEffect(() => { setBe(adatpolitika.ai_engedelyezve); }, [adatpolitika.ai_engedelyezve]);
  async function valt(uj: boolean) {
    setBe(uj); setFut(true);
    const v = await hivas("/api/beallitas/ai", "PUT", { engedelyezve: uj });
    setFut(false);
    if (v.statusz !== 200) { setBe(!uj); return; }
    router.refresh(); // a „Kikapcsolva {ido} · {ki}" sor az eseménynaplóból jön — a kiszolgáló adja újra
  }
  const mikor = adatpolitika.ai_kikapcsolva
    ? new Intl.DateTimeFormat(nyelv, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Bucharest" }).format(new Date(adatpolitika.ai_kikapcsolva.ido))
    : null;
  return (
    <div className="r18b-ai" data-allapot={be ? "be" : "ki"}>
      <div className="r18b-ai-sor">
        <span className="r18b-ai-cim">{t("r18.beall.ai_sor")}</span>
        <Kapcsolo be={be} valt={(uj) => void valt(uj)} letiltva={fut} cimke={t("r18.beall.ai_sor")} />
      </div>
      <span className="r18b-ai-mondat">{t("r18.beall.ai_ki_mondat")}</span>
      {!be && mikor && adatpolitika.ai_kikapcsolva ? (
        <span className="r18b-ai-mondat">{t("ai_kapcsolo.kikapcsolva_mikor", { ido: mikor, ki: adatpolitika.ai_kikapcsolva.ki })}</span>
      ) : null}
    </div>
  );
}
