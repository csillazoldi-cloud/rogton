"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Kapcsolo } from "../_kozos/Kapcsolo";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";

// VZ-2b — Kitöltő (design/vz2/rajz/VZ2b-kitolto.dc.html). A kép MINDIG a gép képe (a képgyártó, a Gigabyte-on):
// ugyanaz a fájl, amit a Letöltés ad. Gépelés után ~600 ms-mal frissül; a régi kép addig 40%-on marad, a korábbi,
// még futó kérés eredményét eldobjuk. Ha minden jó, nincs jelzés; ha nem fér ki, egy mondat a baj helyén, kész javaslattal.
// Ebben a lépésben még nincs: fotó, román változat, a Kész lap (a következő lépések).

type Mezo = "cim" | "sor" | "szam" | "mikor" | "hol";
type Kerdes = { mezo: Mezo; cimke: string };
type Meret = "poszt" | "story" | "negyzet";
type Eredmeny = { kep: string; meret: Meret; valtozat?: string; fok: number; kisebbBetu: boolean; nemFer: string | null };
/** VZ-3: a színváltozatok a rajz sorrendjében; a gép dönti el, melyik marad meg az adott képen */
const VALTOZAT_NEV: Record<string, string> = { vilagos: "vz3.vilagos", szines: "vz3.szines", sotet: "vz3.sotet", masodik: "vz3.masik_szin", atmenet: "vz3.atmenet" };
const MERETEK: Meret[] = ["poszt", "story", "negyzet"];
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

/** Rövidítési javaslat: az első tagmondat, vagy a szavak kétharmada — a gép mondata, a munkatárs dönt róla. */
function rovidebb(s: string): string {
  const t = s.trim();
  const m = t.match(/^(.{8,}?)[,;:.!?–—]\s/);
  if (m && m[1]!.length < t.length * 0.8) return m[1]!.trim();
  const szavak = t.split(/\s+/);
  return szavak.slice(0, Math.max(2, Math.floor(szavak.length * 0.66))).join(" ");
}

export function Kitolto({ sav, helyzet, kerdesek, kezdo, kezdoValtozat = "vilagos" }: { sav: FelsoSavAdat; helyzet: string; kerdesek: Kerdes[]; kezdo: Record<string, string>; kezdoValtozat?: string }) {
  const [valtozat, setValtozat] = useState(kezdoValtozat);
  const [mintak, setMintak] = useState<{ id: string; kep: string }[]>([]);
  const { t } = useFeliratok();
  const [ertek, setErtek] = useState<Record<string, string>>(() => Object.fromEntries(kerdesek.map((k) => [k.mezo, kezdo[k.mezo] ?? ""])));
  const [meret, setMeret] = useState<Meret>("poszt");
  const [valtott, setValtott] = useState(false);
  const [eredmeny, setEredmeny] = useState<Eredmeny | null>(null);
  const [kep, setKep] = useState<"keszul" | "kesz" | "hiba">("keszul");
  const [rejtve, setRejtve] = useState(false);
  const [ujra, setUjra] = useState(0);
  const kerSzam = useRef(0);
  // fotó: a kép része; feltöltés (olvasás + kicsinyítés) közben a letöltés tiltva; igazítás: húzás a képen, nagyítás
  const fotoCimke = FOTO[helyzet];
  // Román változat is: a gép fordítja a kép szövegét egy sorba, javaslatként; amíg a munkatárs nem írja át, jelvény mutatja
  const [roBe, setRoBe] = useState(false);
  const [ro, setRo] = useState("");
  const [roGep, setRoGep] = useState<string | null>(null);
  const [roTolt, setRoTolt] = useState(false);
  const [fotok, setFotok] = useState<Foto[]>([]);
  const [eu, setEu] = useState(false);
  const [toltes, setToltes] = useState<number | null>(null);
  const [igazit, setIgazit] = useState(false);
  const fajlMezo = useRef<HTMLInputElement>(null);
  const megszakitva = useRef(false);
  const huzas = useRef<{ x: number; y: number; w: number; h: number; i: number } | null>(null);

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

  const tartalom = useCallback(() => {
    const ki: Record<string, string> = {};
    for (const k of kerdesek) ki[k.mezo] = (ertek[k.mezo] ?? "").trim();
    return { ...ki, fotok, elotte_utana: eu && fotok.length === 2, masodik: roBe ? ro.trim() : "" };
  }, [kerdesek, ertek, fotok, eu, roBe, ro]);
  const roKapcsol = async (be: boolean) => {
    setRoBe(be);
    if (!be || ro.trim()) return;
    setRoTolt(true);
    try {
      const forras = kerdesek.map((k) => (ertek[k.mezo] ?? "").trim()).filter(Boolean).join(" — ");
      const v = await fetch("/api/vizual/fordit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ szoveg: forras, cel: "ro" }) });
      if (v.ok) {
        const sz = ((await v.json()) as { szoveg: string }).szoveg;
        setRo(sz);
        setRoGep(sz);
      }
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
          body: JSON.stringify({ helyzet, meret, tartalom: tartalom(), valtozat }),
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
  }, [helyzet, meret, tartalom, ujra, valtozat]);

  // VZ-3: a változatok kis mintaképe — a gépelés után a nagy képpel együtt frissül (a gép kicsiben rajzolja)
  const mintaSzam = useRef(0);
  useEffect(() => {
    const sorszam = ++mintaSzam.current;
    const idozito = setTimeout(async () => {
      try {
        const v = await fetch("/api/vizual/helyzet-valtozatok", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ helyzet, meret, tartalom: tartalom() }),
        });
        if (sorszam !== mintaSzam.current || !v.ok) return;
        setMintak(((await v.json()) as { valtozatok: { id: string; kep: string }[] }).valtozatok ?? []);
      } catch {
        /* a választó ilyenkor a régi mintaképeket mutatja */
      }
    }, 900);
    return () => clearTimeout(idozito);
  }, [helyzet, meret, tartalom]);
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

  // VZ-2c: a Letöltés letölti a kiválasztott méretet, és a Kész lapra visz (ugyanezen a lapon — a kitöltés megmarad)
  const [kesz, setKesz] = useState(false);
  const [melle, setMelle] = useState<string | null>(null);
  const [melleHiba, setMelleHiba] = useState(false);
  const [mindTolt, setMindTolt] = useState(false);
  const fajlba = (kepB64: string, m: string) => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${kepB64}`;
    a.download = `kep-${helyzet}-${m}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // R-15 T8: a letöltés tényét feljegyezzük a heti haladás számlálóhoz (tűz-és-felejtsd).
    void fetch("/api/halad", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fajta: "kep_letoltve" }) }).catch(() => {});
  };
  const kepSzoveg = () => kerdesek.map((k) => (ertek[k.mezo] ?? "").trim()).filter(Boolean).join("\n");
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
  const letolt = () => {
    if (tiltasOka || !eredmeny) return;
    fajlba(eredmeny.kep, eredmeny.meret);
    setKesz(true);
    void melleKer();
    window.scrollTo(0, 0);
  };
  // Mindhárom méret: három külön fájl egymás után (VZ-2 kerdesek.md 7. — a telefon a zip-et nehezen nyitja)
  const mindharom = async () => {
    if (mindTolt) return;
    setMindTolt(true);
    try {
      for (const m of MERETEK) {
        if (m === eredmeny?.meret) { fajlba(eredmeny.kep, m); continue; }
        const v = await fetch("/api/vizual/helyzet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ helyzet, meret: m, tartalom: tartalom(), valtozat }) });
        if (v.ok) fajlba(((await v.json()) as Eredmeny).kep, m);
      }
    } finally {
      setMindTolt(false);
    }
  };

  const letoltesGomb = (osztaly: string) =>
    tiltasOka ? (
      <button type="button" className={`km-vz2-letolt km-vz2-letolt-tiltva ${osztaly}`} aria-disabled="true" title={tiltasOka}>
        {t("vz.letoltes")}
      </button>
    ) : (
      <button type="button" className={`km-vz2-letolt ${osztaly}`} onClick={letolt}>
        {t("vz.letoltes")}
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
            <span className="km-vz2-meret-nev">{t(`vz2.meret_${m}`)}</span>
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
          {kep === "keszul" && <span className="km-vz2-kep-felirat">{t("vz2.kep_frissul")}</span>}
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
      <button type="button" className="km-vz2-elrejt" onClick={() => setRejtve((r) => !r)}>
        {rejtve ? `${t("vz2.kep_mutat")} ▾` : `${t("vz2.kep_elrejt")} ▴`}
      </button>
    </div>
  );

  if (kesz && eredmeny)
    return (
      <>
        <FelsoSav adat={sav} aktiv="kepek" />
        <main className="km-lap-keret km-vz km-vz2 km-vz2-kesz">
          <p className="km-vz2-kesz-sav km-vz2-tel-csak" role="status">✓ {t("vz2.kesz_letoltve")}</p>
          <div className="km-vz2-kesz-racs">
            <div className="km-vz2-kesz-kep">
              <img className={`km-vz2-kep km-vz2-kesz-${eredmeny.meret}`} src={`data:image/png;base64,${eredmeny.kep}`} alt="" draggable={false} />
              <span className="km-vz2-kesz-gombok">
                <button type="button" className="km-vz-gomb-szellem" onClick={() => fajlba(eredmeny.kep, eredmeny.meret)}>{t("vz2.letoltes_ujra")}</button>
                <button type="button" className="km-vz-gomb-szellem" aria-busy={mindTolt} onClick={() => void mindharom()}>{t("vz2.mindharom_meret")}</button>
              </span>
            </div>
            <div className="km-vz2-kesz-jobb">
              <div className="km-vz2-asztal-csak km-vz2-kesz-fej">
                <h1 className="km-vz-cim">{t("vz2.kesz_cim")}</h1>
                <p className="km-vz-bevezeto">{t("vz2.kesz_letoltve_asz")}</p>
              </div>
              <div className="km-vz2-melle">
                <span className="km-vz2-melle-fej">
                  <span className="km-vz2-kerdes-cimke">{t("vz2.mit_irj_melle")}</span>
                  <span className="km-vz2-jelveny">{t("jelzes.javaslat")}</span>
                </span>
                {melle ? (
                  <p className="km-vz2-melle-szoveg">{melle}</p>
                ) : melleHiba ? (
                  <span className="km-vz2-melle-hiba">
                    <span>{t("vz2.kep_hiba")}</span>
                    <button type="button" className="km-vz-gomb-szellem" onClick={() => void melleKer()}>{t("vz.ujra")}</button>
                  </span>
                ) : (
                  <span className="km-vz2-melle-vaz" aria-hidden="true"><span /><span /><span /></span>
                )}
                <button type="button" className="km-vz2-letolt km-vz2-masol" disabled={!melle} onClick={() => melle && void navigator.clipboard?.writeText(melle)}>
                  {t("vz2.szoveg_masolasa")}
                </button>
              </div>
              <p className="km-vz2-igy">{t(eredmeny.meret === "story" ? "vz2.igy_story" : "vz2.igy_fb")}</p>
              <span className="km-vz2-kesz-linkek">
                <Link href="/kepek">{t("vz2.meg_egy_kep")}</Link>
                <button type="button" className="km-vz2-link" onClick={() => setKesz(false)}>{t("vz2.mas_meretben")}</button>
              </span>
            </div>
          </div>
        </main>
      </>
    );

  return (
    <>
      <FelsoSav adat={sav} aktiv="kepek" />
      <main className="km-lap-keret km-vz km-vz2 km-vz2-kitolto">
        <div className="km-vz2-fej">
          <div className="km-vz2-fej-bal">
            <Link href="/kepek" className="km-vz2-vissza">
              {t("vz2.vissza")}
            </Link>
            <h1 className="km-vz-cim">{t(`vz2.h_${helyzet}`)}</h1>
          </div>
          <div className="km-vz2-fej-jobb">
            {tiltasOka && <span className="km-vz2-tiltas-oka">{tiltasOka}</span>}
            {letoltesGomb("km-vz2-letolt-asztal")}
          </div>
        </div>
        <div className="km-vz2-racs">
          <div className="km-vz2-urlap">
            <div className="km-vz2-kep-telefon">{kepBlokk}</div>
            <p className="km-vz2-megirtuk">{t("vz2.megirtuk")}</p>
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
                ) : null /* „Így jó” után a rajzon nincs vezérlő: a képre koppintva újra igazítható (kerdesek: VZ-2 vissza) */}
              </div>
            )}
            {kerdesek.map((k) => {
              const baj = nemFer === k.mezo;
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
                  ) : (
                    <span className="km-vz2-pelda">{t("vz2.igy_jo", { pelda: t(`vz2.pelda_${helyzet}_${k.mezo}`) })}</span>
                  )}
                </label>
              );
            })}
            {kep === "kesz" && eredmeny?.kisebbBetu && !nemFer && <span className="km-vz2-lepett">{t("vz2.gep_kisebb_betu", { mit: t("vz2.mit_cim") })}</span>}
            <div className="km-vz2-ro">
              <div className="km-vz2-ro-sor">
                <span>{t("vz2.roman_is")}</span>
                <Kapcsolo be={roBe} valt={(b) => void roKapcsol(b)} cimke={t("vz2.roman_is")} />
              </div>
              {roBe && (
                <label className="km-vz2-kerdes">
                  <span className="km-vz2-ro-fej">
                    <span className="km-vz2-kerdes-cimke">{t("vz2.romanul")}</span>
                    {roGep !== null && ro === roGep && <span className="km-vz2-jelveny">{t("vz2.gep_forditotta")}</span>}
                  </span>
                  <input className="km-vz2-mezo" value={ro} disabled={roTolt} onChange={(e) => setRo(e.target.value)} />
                </label>
              )}
            </div>
          </div>
          <div className="km-vz2-kep-asztal">{kepBlokk}</div>
        </div>
        <div className="km-vz2-also-hely" aria-hidden="true" />
        <div className="km-vz2-also-sav">
          {tiltasOka && <span className="km-vz2-tiltas-oka">{tiltasOka}</span>}
          {letoltesGomb("km-vz2-letolt-telefon")}
        </div>
      </main>
    </>
  );
}
