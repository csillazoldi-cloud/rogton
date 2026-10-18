"use client";
// c30 F10 — a fotóalbum a Posztszövegen (terv §6; rajz D8a „feltöltés 12 / 30”, D8b „kiválasztott fotók + Megosztom”, D8c „sorrend:
// Előrébb / Hátrébb / Kiveszem”). Az „album” fajtájú poszton:
//   · fotó még nincs → a mai album-panel (szöveg + mit fotózz), alatta halkan „Fotók hozzáadása” (a D8b gombja);
//   · feltöltés közben (D8a) → „12 / 30 feltöltve”, a feltöltött fotók kicsiben, a hátralévők szaggatott helye, „Még fotók”; fő gomb nincs
//     (Csilla 10-17, q30c: elfogadott kivétel);
//   · a gép válogat → ugyanez a lap a „Válogatjuk a fotókat…” sorral (a munka látszik — Csilla szabálya);
//   · kész (D8b) → a választott fotók sorban (számmal, „…” gombbal), a felirat (egyben módban két nyelven), „Fotók hozzáadása”, alul a
//     „Megosztom” és mellette halkan „A szöveget is kimásoljuk.”;
//   · a „…” (D8c) → alsó lap: Előrébb · Hátrébb · Kiveszem · Mégse.
// A telefon kicsinyít: `createImageBitmap(file, {imageOrientation: "from-image"})` → vászon → JPEG q≈0,82, `nagy` ≤ 2048 px és `kicsi` ≤ 512 px.
// Az újrakódolás az EXIF-et (a GPS-t is) eldobja; a készítés idejét előtte olvassuk ki (album/exif.ts). A feltöltés egyesével megy,
// fotónként 3 újrapróbával; ami megérkezett, megvan (frissítés után is látszik — a lista a kiszolgálóról jön).
import { useCallback, useEffect, useRef, useState } from "react";
import type { PosztAlbum, PosztMunka } from "@rogton/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { FoGomb, Halad, HalkGomb, Info, KerdesCim } from "../_kozos/R15";
import { hibaSzoveg } from "../_kozos/hibaszoveg";
import { exifIso, exifKeszult, kicsinyitMeret } from "../../album/exif";
import { athelyez, zipNev, type AlbumFoto } from "../../album/szabaly";
import "./c30-album.css";

const NAGY = 2048, KICSI = 512;
const MAX_BAJT = Math.round(2.5 * 1024 * 1024);
const VAR_MS = 2000;
const VAR_MAX_MS = 6 * 60_000;

export type AlbumMod = "ures" | "feltolt" | "valogat" | "kesz";

const kep = (id: string) => `/api/arculat/fajl/${encodeURIComponent(id)}`;

function FotoIkon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-5-5-8.5 8.5" />
    </svg>
  );
}

/** Egy fotó újrakódolva (a hosszabbik oldal ≤ max), JPEG — ha 2,5 MB fölött lenne, gyengébb minőséggel még egyszer. */
async function ujrakodol(bitkep: ImageBitmap, max: number): Promise<Blob> {
  const m = kicsinyitMeret(bitkep.width, bitkep.height, max);
  const vaszon = document.createElement("canvas");
  vaszon.width = m.szel; vaszon.height = m.mag;
  const ctx = vaszon.getContext("2d");
  if (!ctx) throw new Error("vaszon");
  ctx.drawImage(bitkep, 0, 0, m.szel, m.mag);
  for (const q of [0.82, 0.72, 0.62]) {
    const b = await new Promise<Blob | null>((ok) => vaszon.toBlob(ok, "image/jpeg", q));
    if (b && b.size <= MAX_BAJT) return b;
  }
  throw new Error("tul-nagy");
}

/** Egy feltöltés, 3 újrapróbával (1 · 2 · 4 mp) — csak hálózati hibánál és 5xx-nél; a 4xx a hívóé. */
async function kuld(blob: Blob, fejlec: Record<string, string>): Promise<{ statusz: number; torzs: Record<string, unknown> }> {
  for (let proba = 0; ; proba++) {
    let statusz = 0, torzs: Record<string, unknown> = {};
    try {
      const v = await fetch("/api/album/foto", { method: "POST", credentials: "same-origin", body: blob, headers: { "content-type": "application/octet-stream", ...fejlec } });
      statusz = v.status;
      torzs = (await v.json().catch(() => ({}))) as Record<string, unknown>;
    } catch { /* hálózat: újra */ }
    if ((statusz > 0 && statusz < 500) || proba >= 3) return { statusz, torzs };
    await new Promise((ok) => setTimeout(ok, 1000 * 2 ** proba));
  }
}

export function C30Album({ posztId, felulet, nyelv, munkaFrissult, onMod, uresFej, uresPanel, chipek, mezo, konyvel, tiltva }: {
  posztId: string;
  felulet: string;
  nyelv: string;
  /** a válogatás (és a felirat) után a friss poszt — a Posztszöveg mezője ebből tölt */
  munkaFrissult: (m: PosztMunka) => void;
  /** a lap tudja, melyik állapotban van (a chipsor helye ettől függ: fotókkal a cím alatt, mint a rajzon) */
  onMod: (m: AlbumMod) => void;
  /** fotó nélkül: a mai album-panel feje és tartalma */
  uresFej: React.ReactNode;
  uresPanel: React.ReactNode;
  chipek: React.ReactNode;
  /** a felirat mezője (egyben módban a két nyelvű mező) */
  mezo: React.ReactNode;
  /** a „Kész, másolom” könyvelése (a szöveg a vágólapra + a poszt kész) — a Megosztom ezt is elvégzi */
  konyvel: () => void;
  tiltva: boolean;
}) {
  const { t } = useFeliratok();
  const [fotok, setFotok] = useState<AlbumFoto[] | null>(null);
  const [album, setAlbum] = useState<PosztAlbum | null>(null);
  const [sor, setSor] = useState<{ osszes: number; kesz: number } | null>(null);
  const [hiba, setHiba] = useState("");
  const [lap, setLap] = useState<number | null>(null);
  const [fut, setFut] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const kertValogatas = useRef(false);
  const fajlok = useRef<Map<string, File>>(new Map());

  const valogatasVar = useCallback(async () => {
    const vege = Date.now() + VAR_MAX_MS;
    while (Date.now() < vege) {
      await new Promise((ok) => setTimeout(ok, VAR_MS));
      const r = await hivas(`/api/poszt/${encodeURIComponent(posztId)}/album`, "GET");
      if (r.statusz !== 200) continue; // egy-egy kimaradt válasz nem hiba
      const a = r.torzs["album"] as PosztAlbum | null;
      setFotok(r.torzs["fotok"] as AlbumFoto[]);
      setAlbum(a);
      if (a?.allapot !== "fut") {
        if (r.torzs["munka"]) munkaFrissult(r.torzs["munka"] as PosztMunka);
        return;
      }
    }
  }, [posztId, munkaFrissult]);

  const valogatas = useCallback(async () => {
    setHiba("");
    const r = await hivas(`/api/poszt/${encodeURIComponent(posztId)}/album`, "POST", { felulet, nyelv });
    if (r.statusz !== 202) { setHiba(hibaSzoveg(t, r.torzs["hiba"] as string | undefined)); return; }
    setAlbum(r.torzs["album"] as PosztAlbum);
    await valogatasVar();
  }, [posztId, felulet, nyelv, t, valogatasVar]);

  // betöltés: a feltöltött fotók és a válogatás állapota (frissítés után is minden látszik, ami megérkezett)
  useEffect(() => {
    let el = false;
    void (async () => {
      const r = await hivas(`/api/poszt/${encodeURIComponent(posztId)}/album`, "GET");
      if (el || r.statusz !== 200) { if (!el) setFotok([]); return; }
      const a = r.torzs["album"] as PosztAlbum | null;
      setFotok(r.torzs["fotok"] as AlbumFoto[]);
      setAlbum(a);
      if (a?.allapot === "fut") void valogatasVar();
    })();
    return () => { el = true; };
  }, [posztId]); // eslint-disable-line react-hooks/exhaustive-deps

  // fotó van, de még soha nem válogattunk (pl. a feltöltés közben frissült a lap) → a gép most válogat
  useEffect(() => {
    if (!fotok || fotok.length === 0 || sor || album || kertValogatas.current) return;
    kertValogatas.current = true;
    void valogatas();
  }, [fotok, sor, album, valogatas]);

  const mod: AlbumMod = fotok === null || (fotok.length === 0 && !sor) ? "ures"
    : sor ? "feltolt"
    : !album || album.allapot === "fut" ? "valogat"
    : album.fotok.length === 0 && album.allapot === "hiba" ? "valogat"
    : "kesz";
  useEffect(() => { onMod(mod); }, [mod, onMod]);

  async function feltolt(lista: File[]) {
    if (!lista.length) return;
    setHiba("");
    setSor({ osszes: lista.length, kesz: 0 });
    let megallt = false;
    for (const f of lista) {
      try {
        const fej = new Uint8Array(await f.slice(0, 128 * 1024).arrayBuffer());
        const exif = exifKeszult(fej);
        const keszult = exif ? exifIso(exif) : new Date(f.lastModified || Date.now()).toISOString();
        const bitkep = await createImageBitmap(f, { imageOrientation: "from-image" });
        const nagy = await ujrakodol(bitkep, NAGY);
        const kicsi = await ujrakodol(bitkep, KICSI);
        bitkep.close();
        const nev = encodeURIComponent(f.name.replace(/\.[A-Za-z0-9]{1,5}$/, "") + ".jpg");
        const n = await kuld(nagy, { "x-fajl-nev": nev, "x-album": posztId, "x-keszult": keszult });
        if (n.statusz !== 201) {
          setHiba(hibaSzoveg(t, (n.torzs["hiba"] as string | undefined) ?? "ALTALANOS"));
          if (n.statusz === 413 || n.statusz === 429 || n.statusz === 409) { megallt = true; break; }
          continue;
        }
        const id = (n.torzs["fajl"] as { id: string }).id;
        const k = await kuld(kicsi, { "x-fajl-nev": nev, "x-album": posztId, "x-album-par": id, "x-keszult": keszult });
        const kicsiId = k.statusz === 201 ? (k.torzs["fajl"] as { id: string }).id : null;
        setFotok((l) => [...(l ?? []), { id, kicsi_id: kicsiId, nev: decodeURIComponent(nev), keszult, feltoltve: new Date().toISOString(), meret: nagy.size }]);
      } catch {
        setHiba(t("c30.album.nem_olvashato")); // ezt a fotót a böngésző nem tudja megnyitni — a többi megy tovább
      }
      setSor((s) => (s ? { ...s, kesz: s.kesz + 1 } : s));
    }
    setSor(null);
    if (!megallt) { kertValogatas.current = true; await valogatas(); }
  }

  const valaszt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = Array.from(e.target.files ?? []);
    e.target.value = "";
    void feltolt(lista);
  };
  const fajlValaszto = (
    <input ref={input} type="file" accept="image/*" multiple hidden onChange={valaszt} data-c30-album-fajl="" />
  );
  const fotokGomb = (cimke: string) => (
    <HalkGomb osztaly="c30a-ikon-gomb" onClick={() => input.current?.click()} disabled={tiltva || !!sor}><FotoIkon />{cimke}</HalkGomb>
  );

  // a kész album fotói (a sorrend a poszton; a fájl-adatok a listából)
  const fotoMap = new Map((fotok ?? []).map((f) => [f.id, f]));
  const valasztott = (album?.fotok ?? []).filter((f) => fotoMap.has(f.fajl_id));

  // telefonon a Megosztom a fájlokkal nyitja a megosztást — ehhez előre letöltjük őket (a kattintás után már nem lehet várni)
  const telefon = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  useEffect(() => {
    if (mod !== "kesz" || !telefon) return;
    let el = false;
    void (async () => {
      for (const [i, f] of valasztott.entries()) {
        const nev = zipNev(i + 1, fotoMap.get(f.fajl_id)?.nev ?? "foto", "jpg");
        const kulcs = `${f.fajl_id}|${nev}`;
        if (fajlok.current.has(kulcs)) continue;
        const v = await fetch(kep(f.fajl_id), { credentials: "same-origin" }).catch(() => null);
        if (el || !v?.ok) continue;
        fajlok.current.set(kulcs, new File([await v.blob()], nev, { type: "image/jpeg" }));
      }
    })();
    return () => { el = true; };
  }, [mod, telefon, valasztott.map((f) => f.fajl_id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  function megosztom() {
    const sorban = valasztott.map((f, i) => fajlok.current.get(`${f.fajl_id}|${zipNev(i + 1, fotoMap.get(f.fajl_id)?.nev ?? "foto", "jpg")}`)).filter((x): x is File => !!x);
    konyvel(); // a szöveg a vágólapra (a kattintás pillanatában) és a poszt kész
    if (telefon) {
      if (sorban.length === valasztott.length && navigator.canShare?.({ files: sorban })) {
        void navigator.share({ files: sorban }).catch(() => undefined); // a megszakított megosztás nem hiba
        return;
      }
      // nincs fájl-megosztás: a fotók egyenként a letöltések közé, a poszt sorrendjében
      sorban.forEach((f, i) => setTimeout(() => letolt(URL.createObjectURL(f), f.name, true), i * 400));
      return;
    }
    // asztalon: egy ZIP, a poszt sorrendjében („01-…jpg”)
    letolt(`/api/album/zip?fotok=${valasztott.map((f) => f.fajl_id).join(",")}`, "album.zip", false);
  }

  async function lapMuvelet(hol: number, m: "elorebb" | "hatrebb" | "kivesz") {
    const f = valasztott[hol];
    if (!f || !album) return;
    setFut(true);
    const r = m === "kivesz"
      ? await hivas(`/api/poszt/${encodeURIComponent(posztId)}/album`, "PUT", { muvelet: "kivesz", fajl_id: f.fajl_id })
      : await hivas(`/api/poszt/${encodeURIComponent(posztId)}/album`, "PUT", { muvelet: "sorrend", fotok: athelyez(valasztott, hol, m === "elorebb" ? -1 : 1).map((x) => x.fajl_id) });
    setFut(false);
    setLap(null);
    if (r.statusz !== 200) { setHiba(hibaSzoveg(t, r.torzs["hiba"] as string | undefined)); return; }
    const munka = r.torzs["munka"] as PosztMunka;
    setAlbum(munka.forras.album ?? null);
    if (m === "kivesz") setFotok((l) => (l ?? []).filter((x) => x.id !== f.fajl_id));
  }

  if (mod === "ures") {
    return (
      <>
        {uresFej}
        {uresPanel}
        <div className="c30a-ures-gomb">{fotokGomb(t("c30.album.fotok_hozzaadasa"))}</div>
        {hiba ? <Info>{hiba}</Info> : null}
        {fajlValaszto}
      </>
    );
  }

  if (mod === "feltolt" || mod === "valogat") {
    const kesz = fotok ?? [];
    const hatra = sor ? Math.max(0, sor.osszes - sor.kesz) : 0;
    return (
      <>
        <div className="r15-fej r15p-fej">
          <KerdesCim cim={t(mod === "feltolt" ? "c30.album.feltoltjuk_cim" : "c30.album.valogatjuk_cim")} alcim={t("c30.album.feltoltjuk_alcim")} />
        </div>
        <div className="c30a-tart">
          {chipek}
          {sor ? (
            <Halad arany={sor.osszes ? sor.kesz / sor.osszes : 0}><strong className="c30a-szam">{t("c30.album.szamlalo", { kesz: sor.kesz, osszes: sor.osszes })}</strong> {t("c30.album.feltoltve")}</Halad>
          ) : (
            <div className="c30a-dolgozik" aria-live="polite" data-r15="halad"><span className="r15p-porgo" aria-hidden="true" />{t("c30.album.valogatjuk")}</div>
          )}
          <div className="c30a-racs">
            {kesz.map((f) => (
              <span key={f.id} role="img" aria-label={t("c30.album.feltoltott_foto")} className="c30a-csempe">
                <img src={kep(f.kicsi_id ?? f.id)} alt="" loading="lazy" />
              </span>
            ))}
            {Array.from({ length: hatra }, (_, i) => <span key={`h${i}`} aria-hidden="true" className="c30a-csempe c30a-csempe-hely" />)}
          </div>
          {fotokGomb(t("c30.album.meg_fotok"))}
          {hiba ? <Info>{hiba}</Info> : null}
        </div>
        {fajlValaszto}
      </>
    );
  }

  // kész (D8b) + a sorrend-lap (D8c)
  const lapFoto = lap !== null ? valasztott[lap] : undefined;
  const leiras = (i: number) => {
    const l = valasztott[i]?.leiras ?? "";
    return l ? t("c30.album.foto_aria", { n: i + 1, leiras: l }) : t("c30.album.foto_aria_rovid", { n: i + 1 });
  };
  return (
    <>
      <div className="r15-fej r15p-fej" {...(lap !== null ? { "aria-hidden": true, inert: true } : {})}>
        <KerdesCim cim={t("c30.album.kesz_cim")} alcim={t("c30.album.kesz_alcim", { n: valasztott.length })} />
      </div>
      <div className="c30a-tart" {...(lap !== null ? { "aria-hidden": true, inert: true } : {})}>
        {chipek}
        <div role="list" aria-label={t("c30.album.lista_aria")} className="c30a-sor">
          {valasztott.map((f, i) => (
            <span key={f.fajl_id} role="listitem" className="c30a-sor-elem">
              <span role="img" aria-label={leiras(i)} className="c30a-csempe c30a-csempe-nagy">
                <img src={kep(fotoMap.get(f.fajl_id)?.kicsi_id ?? f.fajl_id)} alt="" loading="lazy" />
                <span className="c30a-sorszam" aria-hidden="true">{i + 1}</span>
                <button type="button" className="c30a-tobb" aria-label={t("c30.album.tovabbiak", { n: i + 1 })} onClick={() => setLap(i)} disabled={tiltva || fut}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                </button>
              </span>
            </span>
          ))}
        </div>
        {mezo}
        {fotokGomb(t("c30.album.fotok_hozzaadasa"))}
        {hiba ? <Info>{hiba}</Info> : null}
        <div className="c30a-asztal-gomb r15-csak-asztal">
          <FoGomb onClick={megosztom} disabled={tiltva || valasztott.length === 0}>{t("c30.album.megosztom")}</FoGomb>
          <Info>{t("c30.album.szoveget_is")}</Info>
        </div>
      </div>
      <div className="r15-also-sav" {...(lap !== null ? { "aria-hidden": true, inert: true } : {})}>
        <div className="r15-also-nyugtato"><Info>{t("c30.album.szoveget_is")}</Info></div>
        <FoGomb onClick={megosztom} disabled={tiltva || valasztott.length === 0}>{t("c30.album.megosztom")}</FoGomb>
      </div>
      {fajlValaszto}
      {lapFoto && lap !== null ? (
        <>
          <div className="c30-fatyol" aria-hidden="true" onClick={() => setLap(null)} />
          <div className="c30-lap c30a-lap" role="dialog" aria-modal="true" aria-label={t("c30.album.hely_aria", { n: lap + 1 })}>
            <div className="c30-fogo" aria-hidden="true" />
            <div className="c30-lap-fej">
              <h2 className="c30-lap-cim">{t("c30.album.hova")}</h2>
              <button type="button" className="c30-bezar" aria-label={t("r18.naptar.bezaras")} onClick={() => setLap(null)}>✕</button>
            </div>
            <div className="c30a-lap-foto">
              <span role="img" aria-label={leiras(lap)} className="c30a-csempe">
                <img src={kep(fotoMap.get(lapFoto.fajl_id)?.kicsi_id ?? lapFoto.fajl_id)} alt="" />
                <span className="c30a-sorszam" aria-hidden="true">{lap + 1}</span>
              </span>
            </div>
            {lap > 0 ? (
              <button type="button" className="c30a-opcio c30a-opcio-fo" data-r15="fo-gomb" disabled={fut} onClick={() => void lapMuvelet(lap, "elorebb")}>
                <b>{t("c30.album.elorebb")}</b><span>{t("c30.album.hely", { n: lap })}</span>
              </button>
            ) : null}
            {lap < valasztott.length - 1 ? (
              <button type="button" className={lap > 0 ? "c30a-opcio" : "c30a-opcio c30a-opcio-fo"} {...(lap > 0 ? {} : { "data-r15": "fo-gomb" })} disabled={fut} onClick={() => void lapMuvelet(lap, "hatrebb")}>
                <b>{t("c30.album.hatrebb")}</b><span>{t("c30.album.hely", { n: lap + 2 })}</span>
              </button>
            ) : null}
            <button type="button" className="c30a-opcio" disabled={fut} onClick={() => void lapMuvelet(lap, "kivesz")}>
              <b>{t("c30.album.kiveszem")}</b><span>{t("c30.album.megmarad")}</span>
            </button>
            <button type="button" className="c30a-megse" onClick={() => setLap(null)}>{t("kozos.megse")}</button>
          </div>
        </>
      ) : null}
    </>
  );
}

function letolt(href: string, nev: string, objektum: boolean) {
  const a = document.createElement("a");
  a.href = href;
  a.download = nev;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (objektum) setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
