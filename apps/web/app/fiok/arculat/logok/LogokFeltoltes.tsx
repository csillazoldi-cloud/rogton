"use client";
// R-16 K1 · 12f „Töltsd fel a logóidat” (design/R16-arculat/R16-arculat.dc.html 12f, TERV 2-K1, gepezet 2–3).
// Négy hely, mindegyik a saját próbahátterén (világos · sötét · egy színnel · négyzetes); állapotok: üres (+) · feltöltés (sáv) · kész (✓).
// Fő gomb: „Logók kiválasztása” (több fájl egyszerre); asztalon „vagy húzd ide őket”. A böngésző minden képet megnéz (canvas →
// @km/arculat-core `logoElemzes`), a csomagot besorolja (`besorol`), és egymás után tölti fel (A-7 `feltoltSorban` minta) a hellyel
// és az elemzéssel (x-logo-valtozat, x-logo-elemzes). Egy helyre koppintva csak az az egy hely cserélhető; jóváhagyott arculatnál a
// kitöltött hely cseréje előbb a meglévő R-6 05/A megerősítőt mutatja. R-16 K6: „Nincs logóm” (halk link a „Melyik hova?” és a „Vissza” között,
// a rajz 12f) → 12g /fiok/arculat/nevlogo, ahol a gép a névből készít egyet.
// R-16 utókérés 2 · 12f0 (UTOKERES-2.md; R16-arculat.dc.html „12f0 Logók — még egy sincs”; gepezet-3 4): TELEFONON, ha még egy logó
// sincs (`kerdes`), előbb „Van már logód?” — két egyenrangú kártya („Van, feltöltöm” · „Nincs, kérek egyet”), a „Nincs” előre kijelölve
// (a fiókban nincs logó, T4); a fő gomb felirata a választást követi: Nincs → „Kérek egyet a nevemből” (→ 12g), Van → „Logók kiválasztása”
// (a fájlválasztó, utána a négy hely). `valasztoNyit` (a 12a „Van saját logóm” linkje, `?van=1`): a kérdés kimarad, a 12f jön.
// Asztal: változatlan 12f.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { besorol, elemzesFejlecbe, logoElemzes, type LogoElemzes } from "@km/arculat-core";
import { KEP_LOGO_MAX_BAJT, type FajlMeta, type LogoValtozat } from "@km/fajl-core";
import { useFeliratok } from "../../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink, Info, KerdesCim, Reszletek, Teendo } from "../../../_kozos/R15";
import { hibaBekuld, hibaMitKulcs } from "../../../_kozos/ArculatAnyagok";
import { IgyNezKi } from "../_kozos/IgyNezKi";
import { VisszaSzakasz } from "../_kozos/VisszaSzakasz";
import { ProfilkepMinta } from "./ProfilkepMinta";
import "../../../_kozos/r15-lapok.css";

const HELYEK: readonly LogoValtozat[] = ["vilagos", "sotet", "egyszinu", "negyzetes"];
/** A fájlválasztó: csak kép — a PDF logó a képre nem kerül (kepreAlkalmasLogo), itt nem volna mit mutatni. */
const ELFOGAD = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
/** A böngésző ekkora (legfeljebb) képen elemez — TERV 1.4. */
const ELEMZES_MERET = 64;

type Logok = Record<LogoValtozat, FajlMeta | null>;
type Folyamat = Partial<Record<LogoValtozat, number>>; // hely → feltöltött hányad (0–1)
const URES: Logok = { vilagos: null, sotet: null, egyszinu: null, negyzetes: null };

/** A logó elemzése a böngészőben: kicsinyítés ≤ 64 × 64-re egy canvason, a képpontok az arculat-core-nak. PDF / olvashatatlan → null. */
async function elemez(f: File): Promise<LogoElemzes | null> {
  const kep = /^image\/(png|jpeg|webp)$/.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name);
  if (!kep || typeof createImageBitmap !== "function") return null;
  try {
    const bmp = await createImageBitmap(f);
    const arany = Math.min(1, ELEMZES_MERET / Math.max(bmp.width, bmp.height, 1));
    const w = Math.max(1, Math.round(bmp.width * arany)), h = Math.max(1, Math.round(bmp.height * arany));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) { bmp.close(); return null; }
    ctx.drawImage(bmp, 0, 0, w, h);
    const e = logoElemzes({ rgba: ctx.getImageData(0, 0, w, h).data, szelesseg: w, magassag: h }, bmp.width, bmp.height);
    bmp.close();
    return e;
  } catch {
    return null;
  }
}

/** Egy fájl feltöltése a hellyel és az elemzéssel. XHR, hogy a sáv a valódi feltöltött hányadot mutassa. */
function kuld(f: File, hely: LogoValtozat, e: LogoElemzes | null, halad: (h: number) => void): Promise<{ statusz: number; torzs: Record<string, unknown> | null }> {
  return new Promise((kesz) => {
    const x = new XMLHttpRequest();
    x.open("POST", "/api/arculat/fajl");
    x.withCredentials = true;
    x.setRequestHeader("x-fajl-nev", encodeURIComponent(f.name));
    x.setRequestHeader("x-fajl-cel", "logo");
    x.setRequestHeader("x-logo-valtozat", hely);
    if (e) x.setRequestHeader("x-logo-elemzes", elemzesFejlecbe(e));
    x.setRequestHeader("content-type", "application/octet-stream");
    x.upload.onprogress = (p) => { if (p.lengthComputable && p.total > 0) halad(p.loaded / p.total); };
    x.onload = () => {
      let torzs: Record<string, unknown> | null = null;
      try { torzs = JSON.parse(x.responseText) as Record<string, unknown>; } catch { torzs = null; }
      kesz({ statusz: x.status, torzs });
    };
    x.onerror = () => kesz({ statusz: 0, torzs: null });
    x.send(f);
  });
}

/** A válaszból a hibakód — ugyanaz a döntés, mint a régi dobozban (ArculatAnyagok `feltolt`). */
function hibaKod(v: { statusz: number; torzs: Record<string, unknown> | null }): string {
  if (typeof v.torzs?.["hiba"] === "string") return v.torzs["hiba"];
  if (v.statusz === 0 || v.statusz === 413) return "HALOZAT";
  if (v.statusz >= 500) return "BELSO_HIBA";
  return "ALTALANOS";
}

/**
 * VJ-1011 (Kati #9, „telefonon a feltöltött logók nem látszanak” — mérve 10-11): a telefon fényképezőgépének képe 3–5 MB, a logóhely
 * viszont csak a képre alkalmas fájlt mutatja (`kepreAlkalmasLogo`: < KEP_LOGO_MAX_BAJT = 2 MB, packages/fajl-core/src/logo.ts:12,16).
 * A nagy fájl feltöltése sikerült (201), de egyik helyen sem jelent meg, és az áttekintés „nincs logó”-t mondott. Ezért a böngésző a
 * feltöltés ELŐTT kicsinyít: ha a fájl a határ fölött van, canvason legfeljebb 1600 px-es hosszabb oldalra (átlátszó logónál PNG,
 * különben JPEG 0,9), és amíg nem fér a határ alá, tovább felez. Ami a határ alatt van, változatlanul megy. Nem olvasható → az eredeti
 * (a kiszolgáló szabálya dönt, mint eddig).
 */
async function kepreMeretez(f: File, e: LogoElemzes | null): Promise<File> {
  const hatar = KEP_LOGO_MAX_BAJT - 64 * 1024;
  if (f.size < hatar || typeof createImageBitmap !== "function") return f;
  try {
    const bmp = await createImageBitmap(f);
    const png = e?.atlatszo === true || (e === null && /\.png$/i.test(f.name));
    let oldal = Math.min(1600, Math.max(bmp.width, bmp.height));
    for (let probak = 0; probak < 5; probak++) {
      const arany = oldal / Math.max(bmp.width, bmp.height, 1);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bmp.width * arany));
      c.height = Math.max(1, Math.round(bmp.height * arany));
      c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((kesz) => c.toBlob(kesz, png ? "image/png" : "image/jpeg", 0.9));
      if (blob && blob.size < hatar) {
        bmp.close();
        const nev = f.name.replace(/\.[a-z0-9]+$/i, "") + (png ? ".png" : ".jpg");
        return new File([blob], nev, { type: blob.type });
      }
      oldal = Math.round(oldal / 2);
    }
    bmp.close();
  } catch {
    /* olvashatatlan: az eredeti megy, a kiszolgáló dönt */
  }
  return f;
}

export function LogokFeltoltes({ hatterek, jovahagyott, kerdes = false, valasztoNyit = false, kezdobetu = "", cegNev = "", cegAlcim = "" }: { hatterek: Record<"vilagos" | "sotet" | "negyzetes", string>; jovahagyott: boolean; kerdes?: boolean; valasztoNyit?: boolean; kezdobetu?: string; cegNev?: string; cegAlcim?: string }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const [valasz, setValasz] = useState<"van" | "nincs">("nincs");
  const [megvalaszolva, setMegvalaszolva] = useState(false);
  const [logok, setLogok] = useState<Logok>(URES);
  const [folyamat, setFolyamat] = useState<Folyamat>({});
  const [hiba, setHiba] = useState<string | null>(null);
  const [reszletek, setReszletek] = useState(false);
  const [frissites, setFrissites] = useState(0);
  // R-17 A2 (12f2, Kati #11): a kijelölt KITÖLTÖTT hely — az előnézet ezt mutatja (négyzetes → profilkép-minta). Csak kliens-állapot.
  const [kijelolt, setKijelolt] = useState<LogoValtozat | null>(null);
  const [csere, setCsere] = useState<{ hely: LogoValtozat; regi: FajlMeta; uj: File; elonezet: string } | null>(null);
  const tobbRef = useRef<HTMLInputElement>(null);
  const egyRef = useRef<HTMLInputElement>(null);
  const egyHely = useRef<LogoValtozat>("vilagos");

  const betolt = useCallback(async () => {
    try {
      const v = await fetch("/api/arculat/logok", { credentials: "same-origin" });
      if (!v.ok) return;
      const j = (await v.json()) as { logok: Logok };
      setLogok({ ...URES, ...j.logok });
    } catch {
      /* a helyek üresen maradnak; a feltöltés ettől még működik */
    }
  }, []);
  useEffect(() => { void betolt(); }, [betolt]);
  // ?van=1 (12a „Van saját logóm”): a kérdés kimarad (a hívó `kerdes`-t hamisra állítja), a 12f a „Logók kiválasztása” fő gombbal jön.
  // A fájlválasztót NEM nyitjuk magától: a böngésző csak a felhasználó saját lépésére nyit ilyet (mérve: Chromium, oldalváltás után nem).
  void valasztoNyit;
  const kerdesLatszik = kerdes && !megvalaszolva;
  function kerdesFo() {
    if (valasz === "nincs") { router.push("/fiok/arculat/nevlogo"); return; }
    setMegvalaszolva(true);
    tobbRef.current?.click();
  }

  async function feltoltEgyet(eredeti: File, hely: LogoValtozat, e: LogoElemzes | null): Promise<void> {
    setFolyamat((p) => ({ ...p, [hely]: 0 }));
    const f = await kepreMeretez(eredeti, e); // VJ-1011 (Kati #9): a telefonos fotó is a képekre alkalmas méretben menjen fel
    const v = await kuld(f, hely, e, (h) => setFolyamat((p) => ({ ...p, [hely]: h })));
    setFolyamat((p) => { const u = { ...p }; delete u[hely]; return u; });
    if (v.statusz === 201) return;
    const kod = hibaKod(v);
    setHiba(kod);
    if (kod === "BELSO_HIBA") hibaBekuld(kod, f.name, "logo"); // a „Szóltunk a fejlesztőknek” mondat mögötti gépezet (V4)
  }

  /** Több fájl: elemzés → besorolás → egymás után feltöltés (a helyek egymás állapotát így nem írják felül). */
  function feltoltSorban(lista: File[]) {
    if (lista.length === 0) return;
    setHiba(null);
    void (async () => {
      const elemzesek = await Promise.all(lista.map(elemez));
      const helyek = besorol(elemzesek);
      for (let i = 0; i < lista.length; i++) {
        await feltoltEgyet(lista[i]!, helyek[i]!, elemzesek[i] ?? null);
        await betolt();
      }
      setFrissites((x) => x + 1);
    })();
  }

  /** Egy hely cseréje: csak az az egy hely; a hely a kiválasztott, az elemzés megy mellé. */
  function feltoltHelyre(f: File, hely: LogoValtozat) {
    setHiba(null);
    void (async () => {
      await feltoltEgyet(f, hely, await elemez(f));
      await betolt();
      setFrissites((x) => x + 1);
    })();
  }

  /** R-17 A2: kitöltött hely első koppintása → kijelöl (az előnézet erre vált); a MÁR kijelölt kitöltött hely koppintása → csere
   *  (a régi út: egy fájl erre a helyre); üres hely → a fájlválasztó, mint eddig. */
  function helyKoppint(hely: LogoValtozat) {
    if (logok[hely] && kijelolt !== hely) { setKijelolt(hely); return; }
    egyHely.current = hely;
    egyRef.current?.click();
  }
  const vanLogo = HELYEK.some((h) => logok[h] !== null);

  function egyValasztva(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const hely = egyHely.current;
    const regi = logok[hely];
    // R-6 05/A: jóváhagyott arculatnál a kitöltött hely cseréje előbb megerősítést kér (a fájl már ki van választva: mostani → új)
    if (jovahagyott && regi) {
      setCsere({ hely, regi, uj: f, elonezet: URL.createObjectURL(f) });
      return;
    }
    feltoltHelyre(f, hely);
  }

  function csereMegerosit() {
    if (!csere) return;
    URL.revokeObjectURL(csere.elonezet);
    setCsere(null);
    feltoltHelyre(csere.uj, csere.hely);
  }
  function csereMegse() {
    if (csere) URL.revokeObjectURL(csere.elonezet);
    setCsere(null);
  }

  function tobbValasztva(e: React.ChangeEvent<HTMLInputElement>) {
    const lista = Array.from(e.target.files ?? []);
    e.target.value = "";
    feltoltSorban(lista);
  }

  function dobva(e: React.DragEvent) {
    e.preventDefault();
    feltoltSorban(Array.from(e.dataTransfer.files));
  }

  const hatter = (hely: LogoValtozat): string | undefined => (hely === "egyszinu" ? undefined : hatterek[hely]);

  return (
    <main className="km-lap-keret r16a-lap">
      {kerdesLatszik ? (
        <div className="r16a-f0 r15-csak-tel">
          <div className="r17-fej"><VisszaSzakasz /><KerdesCim cim={t("r16.arculat.logok.van_kerdes")} alcim={t("r16.arculat.logok.van_alcim")} /></div>
          <div className="r16a-f0-utak" role="radiogroup" aria-label={t("r16.arculat.logok.van_kerdes")}>
            <button type="button" role="radio" aria-checked={valasz === "van"} className={`r16a-f0-ut${valasz === "van" ? " r16a-f0-ki" : ""}`} onClick={() => setValasz("van")}>
              <span className="r16a-f0-ikon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 16V4M6 10l6-6 6 6M4 20h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span className="r16a-f0-cim">{t("r16.arculat.logok.van_igen")}</span>
              <span className="r16a-f0-alcim">{t("r16.arculat.logok.van_igen_alcim")}</span>
            </button>
            <button type="button" role="radio" aria-checked={valasz === "nincs"} className={`r16a-f0-ut${valasz === "nincs" ? " r16a-f0-ki" : ""}`} onClick={() => setValasz("nincs")}>
              <span className="r16a-f0-ikon" aria-hidden="true"><span className="r16a-f0-jel">{kezdobetu}</span></span>
              <span className="r16a-f0-cim">{t("r16.arculat.logok.van_nem")}</span>
              <span className="r16a-f0-alcim">{t("r16.arculat.logok.van_nem_alcim")}</span>
            </button>
          </div>
          {/* R-17 (Kati #13): a lenti „Vissza” helyett a fenti „‹ Logó, színek, betűk” */}
        </div>
      ) : null}
      <div className={kerdesLatszik ? "r16a-racs r15-csak-asztal" : "r16a-racs"}>
        <div className="r16a-bal">
          <div className="r17-fej"><VisszaSzakasz /><KerdesCim cim={t("r16.arculat.logok.kerdes")} alcim={t("r16.arculat.logok.alcim")} /></div>
          <div onDragOver={(e) => e.preventDefault()} onDrop={dobva}>
            <Teendo osztaly="r16a-teendo">
              <div className="r16a-helyek">
                {HELYEK.map((hely) => {
                  const f = logok[hely];
                  const halad = folyamat[hely];
                  const kozben = halad !== undefined;
                  const telt = kozben || f !== null;
                  return (
                    <button key={hely} type="button" className={`r16a-hely r16a-hely-${hely}${kijelolt === hely && f ? " r17-hely-ki" : ""}`} aria-label={t(`r16.arculat.logok.${hely}`)} aria-pressed={f ? kijelolt === hely : undefined} onClick={() => helyKoppint(hely)} disabled={kozben}>
                      <span className={`r16a-hely-kep${telt ? " r16a-telt" : ""}`} style={telt && hatter(hely) ? { background: hatter(hely) } : undefined}>
                        {kozben ? (
                          <span className="r16a-feltoltes">
                            <span aria-hidden="true" className="r16a-sav"><span className="r16a-sav-telt" style={{ width: `${Math.round(Math.max(0.05, halad) * 100)}%` }} /></span>
                            {t("r16.arculat.logok.feltoltes")}
                          </span>
                        ) : f ? (
                          <img src={`/api/arculat/fajl/${f.id}`} alt="" />
                        ) : (
                          <span className="r16a-plusz" aria-hidden="true">+</span>
                        )}
                      </span>
                      <span className="r16a-hely-cimke">{t(`r16.arculat.logok.${hely}`)}{f && !kozben ? " ✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
              <div className="r16a-gombsor r15-csak-asztal">
                {/* R-17 A1 (Kati #14 #15): ha már van legalább egy logó, a fő gomb „Kész” (→ a szakasz; a feltöltés már mentett) */}
                {vanLogo ? <FoGomb href="/fiok/arculat">{t("r17.arculat.logok.kesz")}</FoGomb> : <FoGomb onClick={() => tobbRef.current?.click()}>{t("r16.arculat.logok.valasztas")}</FoGomb>}
                <Info>{t("r16.arculat.logok.huzd")}</Info>
              </div>
            </Teendo>
          </div>
          {hiba ? <Baj szoveg={t(hibaMitKulcs(hiba))} gomb={<HalkGomb onClick={() => setHiba(null)}>{t("kozos.rendben")}</HalkGomb>} /> : null}
          <div className="r16a-linkek">
            <HalkLink onClick={() => setReszletek((r) => !r)} aria-expanded={reszletek}>{t("r16.arculat.logok.melyik_hova")}</HalkLink>
            <HalkLink href="/fiok/arculat/nevlogo">{t("r16.arculat.nincs_logom")}</HalkLink>
          </div>
          {reszletek ? <Reszletek><p className="r16a-reszletek">{t("r16.arculat.logok.melyik_hova_szoveg")}</p></Reszletek> : null}
        </div>
        {/* R-17 A2: a kijelölt hely előnézete — négyzetes → profilkép-minta; a másik három → a két kép azzal a logóval */}
        {kijelolt === "negyzetes" && logok.negyzetes
          ? <ProfilkepMinta logoId={logok.negyzetes.id} hatter={hatterek.negyzetes} borito={hatterek.sotet} nev={cegNev} alcim={cegAlcim} />
          : <IgyNezKi frissites={frissites} valasztas={kijelolt && logok[kijelolt] ? { logo_hely: kijelolt as "vilagos" | "sotet" | "egyszinu" } : null} />}
      </div>

      <div className="r15-also-sav">
        {kerdesLatszik
          ? <FoGomb onClick={kerdesFo}>{valasz === "nincs" ? t("r16.arculat.logok.keszits_egyet") : t("r16.arculat.logok.valasztas")}</FoGomb>
          : vanLogo ? <FoGomb href="/fiok/arculat">{t("r17.arculat.logok.kesz")}</FoGomb> : <FoGomb onClick={() => tobbRef.current?.click()}>{t("r16.arculat.logok.valasztas")}</FoGomb>}
      </div>

      <input ref={tobbRef} type="file" accept={ELFOGAD} multiple hidden onChange={tobbValasztva} />
      <input ref={egyRef} type="file" accept={ELFOGAD} hidden onChange={egyValasztva} />

      {csere ? (
        <div className="km-af-csere-overlay" onClick={csereMegse}>
          <div className="km-af-csere-kartya" onClick={(e) => e.stopPropagation()}>
            <h3 className="km-af-csere-cim">{t("arculat_fajl.csere_cim")}</h3>
            <div className="km-af-csere-kepek">
              <div className="km-af-csere-regi">
                <img src={`/api/arculat/fajl/${csere.regi.id}`} alt="" loading="eager" />
                <span>{t("arculat_fajl.csere_regi")}</span>
              </div>
              <span className="km-af-csere-nyil" aria-hidden="true">→</span>
              <div className="km-af-csere-uj">
                <img src={csere.elonezet} alt="" />
                <span>{t("arculat_fajl.csere_uj")}</span>
              </div>
            </div>
            {/* A régi doboz „új tervezet, újra jóvá kell hagyni” mondata és gombja itt NEM igaz: a logó a munkatér saját fájlja, a
                jóváhagyáson kívül (R-16 kerdesek 5, A5) — a csere nem nyit tervezetet. Ezért csak a kép-pár és a „Csere” marad. */}
            <div className="km-af-csere-gombok">
              <button type="button" className="km-af-gomb-primary" onClick={csereMegerosit}>{t("arculat_fajl.csere_gomb")}</button>
              <button type="button" className="km-af-gomb-ghost" onClick={csereMegse}>{t("kozos.megse")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
