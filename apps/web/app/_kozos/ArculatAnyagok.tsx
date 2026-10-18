"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArculatLepes } from "@km/contracts";
import { hasznaltLogoId, type FajlCel, type FajlMeta } from "@km/fajl-core";
import { arculatModosit } from "@km/profile-core";
import { useFeliratok } from "../../nyelv/kliens";

type FeltoltesAllapot = { tipus: "kozben"; nev: string } | { tipus: "hiba"; nev: string; kod: string };

type CelAllapot = {
  fajlok: FajlMeta[];
  feltoltes: FeltoltesAllapot | null;
};

const CELOK: FajlCel[] = ["logo", "kezikonyv", "referencia", "dokumentum"];

function celCimKulcs(cel: FajlCel): string {
  return `arculat_fajl.cel_${cel}`;
}

function celSegitKulcs(cel: FajlCel): string {
  return `arculat_fajl.${cel === "logo" ? "logo_megj" : cel === "kezikonyv" ? "kezikonyv_megj" : cel === "referencia" ? "referencia_megj" : "dokumentum_megj"}`;
}

/**
 * A hibaágak (V4, 2026-09-18, Vilmos 8.):
 *  - TUL_NAGY → arculat_fajl.nagy_mit_100 (betűnél: nagy_mit, 10 MB)
 *  - TIPUS_NEM_ENGEDETT / SVG_NEM_ENGEDETT → arculat_fajl.tipus_mit
 *  - hálózati hiba (statusz 0) vagy proxy-413 törzs nélkül → arculat_fajl.halozat_mit_100 (betűnél: halozat_mit)
 *  - BELSO_HIBA / 500 → arculat_fajl.szerver_mit
 *  - URES → arculat_fajl.ures_mit
 *  - minden más → arculat_fajl.hiba_bezar (általános)
 */
export function hibaMitKulcs(kod: string, korlat10: boolean = false): string {
  // Csilla 2026-10-10: az arculati/szervezeti fájl korlátja 100 MB (a „_100” kulcsok); a betűé 10 MB marad (a Betuk lap `korlat10`-zel hív)
  if (kod === "SVG_NEM_ENGEDETT" || kod === "TIPUS_NEM_ENGEDETT") return "arculat_fajl.tipus_mit";
  if (kod === "TUL_NAGY") return korlat10 ? "arculat_fajl.nagy_mit" : "arculat_fajl.nagy_mit_100";
  if (kod === "URES") return "arculat_fajl.ures_mit";
  if (kod === "HALOZAT") return korlat10 ? "arculat_fajl.halozat_mit" : "arculat_fajl.halozat_mit_100";
  if (kod === "BELSO_HIBA") return "arculat_fajl.szerver_mit";
  return "arculat_fajl.hiba_bezar";
}

function hibaRendszerKulcs(kod: string): string {
  if (kod === "SVG_NEM_ENGEDETT") return "fajl.hiba_svg_nem_engedett";
  if (kod === "TIPUS_NEM_ENGEDETT") return "fajl.hiba_tipus_nem_engedett";
  if (kod === "TUL_NAGY") return "fajl.hiba_tul_nagy_100"; // ez a lap csak arculati fájlt tölt fel (100 MB)
  if (kod === "URES") return "fajl.hiba_ures";
  if (kod === "HALOZAT") return "fajl.hiba_halozat";
  if (kod === "BELSO_HIBA") return "fajl.hiba_belso";
  return "hiba.ALTALANOS";
}

function meretSzoveg(bajt: number): string {
  if (bajt < 1024) return `${bajt} B`;
  if (bajt < 1024 * 1024) return `${Math.round(bajt / 1024)} kB`;
  return `${(bajt / (1024 * 1024)).toFixed(1).replace(".0", "")} MB`;
}

function logoFajlId(arculat: ArculatLepes): string | null {
  return arculat.tervezet?.logo_fajl_id ?? null;
}

function jovahagyottLogoFajlId(arculat: ArculatLepes, verzioSzam: number): string | null {
  // a verziók a szerződésben Record<verziószám, pillanatkép>, nem tömb
  const v = arculat.verziok[String(verzioSzam)];
  return v?.logo_fajl_id ?? null;
}

/**
 * A hiba beküldése a Visszajelzés modulnak (V4, 2026-09-18, Vilmos 8.).
 * A `forras: "rendszer"` jelöléssel megy; ha a végpont nem fogadja, csak console.error.
 * A hívás tűz-és-felejts: a felhasználót nem blokkolja.
 */
export function hibaBekuld(kod: string, nev: string, cel: FajlCel): void {
  void (async () => {
    try {
      const v = await fetch("/api/visszajelzes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lap: typeof window === "undefined" ? "/" : window.location.pathname,
          lap_cim: typeof document === "undefined" ? "" : document.title,
          elem: null,
          kijelolt_szoveg: "",
          szoveg: `[rendszer] Feltöltés hiba: ${kod} — ${nev} (${cel})`,
          nyelv: typeof document === "undefined" ? "hu" : (document.documentElement.lang || "hu").slice(0, 2),
          kep: null,
          ablak: typeof window === "undefined" ? { w: 0, h: 0 } : { w: window.innerWidth, h: window.innerHeight },
        }),
      });
      if (!v.ok) {
        console.error("[arculat-fajl] visszajelzes bekuld nem sikerult:", v.status);
      }
    } catch (h) {
      console.error("[arculat-fajl] visszajelzes bekuld halozati hiba:", h);
    }
  })();
}

export function ArculatAnyagok({ arculat, szerkesztheto, valtozik, celok = CELOK }: {
  arculat: ArculatLepes;
  szerkesztheto: boolean;
  valtozik: (uj: (regi: ArculatLepes) => ArculatLepes) => void;
  /** R-16 K3 (TERV §2-K3, §4 9.): mely mezők látszanak — alapból mind a négy; az Arculat szakasz „Fájlok”-ja a logó nélküli hármat
   *  kéri (a logó helye a 12f). A tárolásból semmi nem tűnik el: csak a megjelenítés szűkül. */
  celok?: readonly FajlCel[];
}) {
  const { t, nyelv } = useFeliratok();
  const [celAllapotok, setCelAllapotok] = useState<Record<FajlCel, CelAllapot>>({
    logo: { fajlok: [], feltoltes: null },
    kezikonyv: { fajlok: [], feltoltes: null },
    referencia: { fajlok: [], feltoltes: null },
    dokumentum: { fajlok: [], feltoltes: null },
    kep: { fajlok: [], feltoltes: null }, // R-15: a posztok képei — itt nem jelennek meg (a lista nem hozza őket)
    betu: { fajlok: [], feltoltes: null }, // R-16 K5: a saját betűk — itt nem jelennek meg (a 12e-n élnek; a lista nem hozza őket)
    album: { fajlok: [], feltoltes: null }, // c30 F9: az albumfotók — itt nem jelennek meg (a cél nélküli lista nem hozza őket)
  });
  const [betoltesHiba, setBetoltesHiba] = useState(false);
  // a csere megerősítője: a fájl MÁR ki van választva (a rajz 05/A: mostani → új), a feltöltés a megerősítéssel indul
  const [csereAktiv, setCsereAktiv] = useState<{ cel: FajlCel; regi: FajlMeta; uj: File; elonezet: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const betolt = useCallback(async () => {
    try {
      const v = await fetch("/api/arculat/fajl", { credentials: "same-origin" });
      if (!v.ok) throw new Error("betoltes");
      const t = await v.json() as { fajl: FajlMeta[] };
      const uj: Record<FajlCel, CelAllapot> = {
        logo: { fajlok: [], feltoltes: null },
        kezikonyv: { fajlok: [], feltoltes: null },
        referencia: { fajlok: [], feltoltes: null },
        dokumentum: { fajlok: [], feltoltes: null },
        kep: { fajlok: [], feltoltes: null },
        betu: { fajlok: [], feltoltes: null }, // R-16 K5: a lista nem hozza (GET /api/arculat/fajl cél nélkül kiszűri)
        album: { fajlok: [], feltoltes: null }, // c30 F9: ezt sem hozza
      };
      for (const f of t.fajl) {
        if (uj[f.cel]) {
          uj[f.cel]!.fajlok.push(f);
        }
      }
      for (const cel of CELOK) {
        uj[cel]!.fajlok.sort((a, b) => new Date(b.feltoltve).getTime() - new Date(a.feltoltve).getTime());
      }
      setCelAllapotok(uj);
      setBetoltesHiba(false);
    } catch {
      setBetoltesHiba(true);
    }
  }, []);

  useEffect(() => {
    void betolt();
  }, [betolt]);

  async function feltolt(file: File, cel: FajlCel) {
    setCelAllapotok((regi) => ({ ...regi, [cel]: { ...regi[cel]!, feltoltes: { tipus: "kozben", nev: file.name } } }));
    try {
      const v = await fetch("/api/arculat/fajl", {
        method: "POST",
        body: file,
        headers: {
          "x-fajl-nev": encodeURIComponent(file.name),
          "x-fajl-cel": cel,
          // R-16 K1 (TERV 2-K1): a régi doboz logója kifejezetten a világos helyre megy — a viselkedés változatlan (a hely nélküli sor is az volna)
          ...(cel === "logo" ? { "x-logo-valtozat": "vilagos" } : {}),
          "content-type": "application/octet-stream",
        },
        credentials: "same-origin",
      });
      if (v.status === 201) {
        const t = await v.json() as { fajl: FajlMeta };
        if (cel === "logo" && arculat.tervezet && arculat.allapot !== "kesobb") {
          // D-F31: a logó a jelenlegi tervezetbe kerül; jóváhagyott állapotban ez ÚJ tervezetet nyit (verzió+1), a pillanatkép a régi fájlra mutat.
          // A5 (2026-09-30): a képek már NEM ebből veszik a logót, hanem a legfrissebb logó-fájlból (`hasznaltLogoId`, @km/fajl-core) —
          // ezért „kesobb” és tervezet nélküli állapotban sem vész el a feltöltés. Ez az ág így ártalmatlan (a tervezet a verziótörténetnek
          // mondja, melyik logó volt), és nem töröljük: az R-16 gepezet 2. pontja (logóváltozatok, `logok` térkép) írja át.
          valtozik((r) => (r.tervezet ? arculatModosit(r, { logo_fajl_id: t.fajl.id }) : r));
        }
        await betolt();
      } else {
        // A valódi okot mondjuk: a szerver `hiba` kódját, vagy ha a törzs üres (proxy-413),
        // akkor a hálózati ágat. A 413 törzs nélkül a proxy vágta el — nem a kód.
        let kod = "ALTALANOS";
        try {
          const t = await v.json() as Record<string, unknown>;
          if (typeof t["hiba"] === "string") kod = t["hiba"];
          else if (v.status === 413) kod = "HALOZAT";
          else if (v.status >= 500) kod = "BELSO_HIBA";
        } catch {
          if (v.status === 413) kod = "HALOZAT";
          else if (v.status >= 500) kod = "BELSO_HIBA";
        }
        setCelAllapotok((regi) => ({ ...regi, [cel]: { ...regi[cel]!, feltoltes: { tipus: "hiba", nev: file.name, kod } } }));
        if (kod === "BELSO_HIBA") {
          hibaBekuld(kod, file.name, cel);
        }
      }
    } catch {
      // hálózati hiba (statusz 0): a kapcsolat szakadt meg, vagy a proxy vágta el
      setCelAllapotok((regi) => ({ ...regi, [cel]: { ...regi[cel]!, feltoltes: { tipus: "hiba", nev: file.name, kod: "HALOZAT" } } }));
    }
  }

  function fajlValasztva(e: React.ChangeEvent<HTMLInputElement>, cel: FajlCel) {
    const files = e.target.files;
    if (!files?.length) return;
    // A-7 (Csilla, 09-25): több fájl egyszerre. Egymás után töltjük fel, mert a célnak egy
    // feltöltés-állapota van — párhuzamosan a sorok egymás állapotát (és hibáját) írnák felül.
    feltoltSorban(Array.from(files), cel);
    e.target.value = "";
  }

  function feltoltSorban(lista: File[], cel: FajlCel) {
    void (async () => {
      for (const f of lista) await feltolt(f, cel);
    })();
  }

  function huzasDobva(e: React.DragEvent, cel: FajlCel) {
    e.preventDefault();
    feltoltSorban(Array.from(e.dataTransfer.files), cel);
  }

  function hibaBezar(cel: FajlCel) {
    setCelAllapotok((regi) => ({ ...regi, [cel]: { ...regi[cel]!, feltoltes: null } }));
  }

  // Csere: a gomb a fájlválasztót nyitja; logónál JÓVÁHAGYOTT arculat mellett a kiválasztott fájl előbb a megerősítő kártyára kerül (05/A),
  // egyébként (kézikönyv; nem jóváhagyott tervezet) azonnal felmegy — következmény nélkül nincs mit megerősíteni.
  const csereRegi = useRef<{ cel: FajlCel; regi: FajlMeta } | null>(null);
  function csereIndit(cel: FajlCel, regi: FajlMeta) {
    csereRegi.current = { cel, regi };
    inputRef.current?.click();
  }

  function csereFajlValasztva(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const regi = csereRegi.current;
    e.target.value = "";
    if (!file || !regi) return;
    if (regi.cel === "logo" && arculat.allapot === "jovahagyott") {
      const kep = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      setCsereAktiv({ cel: regi.cel, regi: regi.regi, uj: file, elonezet: kep });
    } else {
      void feltolt(file, regi.cel);
    }
  }

  function csereMegerosit() {
    if (!csereAktiv) return;
    const { uj, cel, elonezet } = csereAktiv;
    if (elonezet) URL.revokeObjectURL(elonezet);
    setCsereAktiv(null);
    void feltolt(uj, cel);
  }

  function csereMegse() {
    if (csereAktiv?.elonezet) URL.revokeObjectURL(csereAktiv.elonezet);
    setCsereAktiv(null);
  }

  // „ez van használatban”: ugyanaz a logó, amelyet a képek kapnak (A5 — a legfrissebb képre alkalmas logó-fájl; ha nincs, a tervezeté),
  // hogy a jelvény ne mondjon mást, mint a Képek lap. Korábban a tervezet logo_fajl_id-je volt, ami „kesobb”/tervezet nélkül üres maradt.
  const aktualisLogoId = hasznaltLogoId(celAllapotok["logo"]?.fajlok, logoFajlId(arculat));

  /** A sor jelvénye: „ez van használatban" (a tervezet logója) · „az N. jóváhagyott tervezetben" (egy pillanatkép hivatkozik rá) · semmi. */
  function fajlJelveny(f: FajlMeta): { szoveg: string; tipus: "hasznalatban" | "korabbi" } | null {
    if (f.cel !== "logo") return null;
    if (f.id === aktualisLogoId) return { szoveg: t("arculat_fajl.mostani"), tipus: "hasznalatban" };
    const hivatkozo = Object.values(arculat.verziok).filter((v) => v.logo_fajl_id === f.id).sort((a, b) => b.verzio - a.verzio)[0];
    if (hivatkozo) return { szoveg: t("arculat_fajl.korabbi", { v: hivatkozo.verzio }), tipus: "korabbi" };
    return null;
  }

  function idoSzoveg(iso: string): string {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat(nyelv, {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Europe/Bucharest",
      }).format(d);
    } catch {
      return iso;
    }
  }

  function metaSor(f: FajlMeta): string {
    return t("arculat_fajl.meta", { tipus: f.tipus.toUpperCase(), meret: meretSzoveg(f.meret), ido: idoSzoveg(f.feltoltve) });
  }

  return (
    <div className="km-af-blokk">
      <div className="km-af-fej">
        <h2 className="km-af-cim">{t("arculat_fajl.cim")}</h2>
        <span className="km-af-jelveny">{t("arculat_fajl.opcionalis")}</span>
        {!szerkesztheto ? <span className="km-af-jelveny">{t("arculat_fajl.nezo_jelveny")}</span> : null}
        {arculat.allapot === "tervezet" && arculat.tervezet?.logo_fajl_id ? <span className="km-af-jelveny-tervezet">{t("arculat_fajl.tervezet_jelveny", { v: arculat.verzio })}</span> : null}
        <p className="km-af-bevezeto">{t("arculat_fajl.bevezeto")}</p>
      </div>

      {betoltesHiba ? (
        <div className="km-af-hiba-uzenet">
          <span>{t("arculat_fajl.hiba_betoltes")}</span>
          <button type="button" className="km-af-gomb-ghost" onClick={() => void betolt()}>{t("kozos.rendben")}</button>
        </div>
      ) : null}

      <div className="km-af-racs">
        {celok.map((cel) => {
          const allapot = celAllapotok[cel]!;
          const aktivFeltoltes = allapot.feltoltes;
          const elsoFajl = allapot.fajlok[0];

          return (
            <div key={cel} className="km-af-oszlop">
              <span className="km-af-cel-cim">{t(celCimKulcs(cel))}</span>

              {aktivFeltoltes?.tipus === "kozben" ? (
                <div className="km-af-feltoltes-kozben">
                  <span className="km-af-porogo" aria-hidden="true" />
                  <div className="km-af-feltoltes-szoveg">
                    <span className="km-af-fajl-nev">{aktivFeltoltes.nev}</span>
                    <span className="km-af-feltoltes-mondat">{t("arculat_fajl.feltoltes_kozben")}</span>
                  </div>
                  <p className="km-af-ellenorzes-megj">{t("arculat_fajl.ellenorzes_megj")}</p>
                  <p className="km-af-nincs-szazalek">{t("arculat_fajl.nincs_szazalek")}</p>
                </div>
              ) : aktivFeltoltes?.tipus === "hiba" ? (
                <div className="km-af-hiba-doboz">
                  <div className="km-af-hiba-fej">
                    <span className="km-af-hiba-ikon">{aktivFeltoltes.kod === "SVG_NEM_ENGEDETT" ? "SVG" : aktivFeltoltes.kod === "TIPUS_NEM_ENGEDETT" ? "?" : aktivFeltoltes.kod === "TUL_NAGY" ? "PDF" : aktivFeltoltes.kod === "URES" ? "0" : "!"}</span>
                    <span className="km-af-fajl-nev">{aktivFeltoltes.nev}</span>
                  </div>
                  <span className="km-af-hiba-cim">{t(hibaRendszerKulcs(aktivFeltoltes.kod))}</span>
                  <span className="km-af-hiba-mit">{t(hibaMitKulcs(aktivFeltoltes.kod))}</span>
                  <button type="button" className="km-af-gomb-ghost" onClick={() => hibaBezar(cel)}>
                    {t("kozos.rendben")}
                  </button>
                </div>
              ) : szerkesztheto && !elsoFajl && cel !== "referencia" && cel !== "dokumentum" ? (
                <label
                  className="km-af-mezo"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => huzasDobva(e, cel)}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf"
                    hidden
                    onChange={(e) => fajlValasztva(e, cel)}
                  />
                  <span className="km-af-mezo-plusz" aria-hidden="true">+</span>
                  <span className="km-af-mezo-huzd">{t("arculat_fajl.dobd_ide")}</span>
                  <span className="km-af-mezo-tipusok">{t("arculat_fajl.tipusok")}</span>
                </label>
              ) : szerkesztheto && (cel === "referencia" || cel === "dokumentum") ? (
                <>
                  {allapot.fajlok.map((f) => (
                    <FajlSor
                      key={f.id}
                      f={f}
                      meta={metaSor(f)}
                      jelveny={null}
                      szerkesztheto={szerkesztheto}
                      onCsere={() => csereIndit(cel, f)}
                      onMegnyitas={() => window.open(`/api/arculat/fajl/${f.id}`, "_blank")}
                    />
                  ))}
                  <label
                    className="km-af-mezo"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => huzasDobva(e, cel)}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      multiple
                      hidden
                      onChange={(e) => fajlValasztva(e, cel)}
                    />
                    <span className="km-af-mezo-plusz" aria-hidden="true">+</span>
                    <span className="km-af-mezo-huzd">{t("arculat_fajl.dobd_ide")}</span>
                    <span className="km-af-mezo-tipusok">{t("arculat_fajl.tipusok")}</span>
                  </label>
                </>
              ) : elsoFajl ? (
                <>
                  {allapot.fajlok.map((f, i) => {
                    const jv = fajlJelveny(f);
                    const halvany = i > 0 || jv?.tipus === "korabbi" || (f.cel === "logo" && aktualisLogoId !== null && f.id !== aktualisLogoId);
                    return (
                      <FajlSor
                        key={f.id}
                        f={f}
                        meta={metaSor(f)}
                        jelveny={jv}
                        halvany={halvany}
                        szerkesztheto={szerkesztheto}
                        onCsere={szerkesztheto && !halvany && (cel === "logo" || cel === "kezikonyv") ? () => csereIndit(cel, f) : undefined}
                        onMegnyitas={() => window.open(`/api/arculat/fajl/${f.id}`, "_blank")}
                      />
                    );
                  })}
                  {cel === "referencia" || cel === "dokumentum" ? (
                    <label
                      className="km-af-mezo"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => huzasDobva(e, cel)}
                    >
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.pdf"
                        multiple
                        hidden
                        onChange={(e) => fajlValasztva(e, cel)}
                      />
                      <span className="km-af-mezo-plusz" aria-hidden="true">+</span>
                      <span className="km-af-mezo-huzd">{t("arculat_fajl.dobd_ide")}</span>
                      <span className="km-af-mezo-tipusok">{t("arculat_fajl.tipusok")}</span>
                    </label>
                  ) : null}
                </>
              ) : !szerkesztheto ? (
                <span className="km-af-nincs-fajl">{t("arculat_fajl.nincs_fajl")}</span>
              ) : null}

              {cel === "logo" && elsoFajl && !aktivFeltoltes ? (
                <div className="km-af-elonezet">
                  {/* Kati/Csilla visszajelzés 09-25 A5/A7 utómunka, mérve 09-30: ez a blokk a /fiok
                      lapon egy csukott <details> alatt jön létre; loading="lazy" mellett a Chrome a
                      kinyitás után sem kérte le a képet (naturalWidth 0, egy kérés sem ment ki), a
                      végpont maga jó volt (200, image/png). Ezért ezek a kevés, kicsi képek azonnal
                      töltődnek (eager) — a bélyegek (FajlSor) és a csere-ablak képe ugyanígy. */}
                  <span className="km-af-elonezet-cim">{t("arculat_fajl.elonezet_cim")}</span>
                  <div className="km-af-elonezet-dobozok">
                    <div className="km-af-elonezet-vilagos">
                      {/* tokenőr: ok — háttér-próba, ügyfélkreatív */}
                      <img src={`/api/arculat/fajl/${elsoFajl.id}`} alt="" loading="eager" />
                    </div>
                    <div className="km-af-elonezet-sotet">
                      {/* tokenőr: ok — háttér-próba, ügyfélkreatív */}
                      <img src={`/api/arculat/fajl/${elsoFajl.id}`} alt="" loading="eager" />
                    </div>
                  </div>
                  <p className="km-af-elonezet-megj">{t("arculat_fajl.elonezet_megj")}</p>
                </div>
              ) : null}

              <span className="km-af-segit">{t(celSegitKulcs(cel))}</span>
            </div>
          );
        })}
      </div>

      <p className="km-af-nem-torlunk">{t("arculat_fajl.nem_torlunk")}</p>

      {csereAktiv ? (
        <div className="km-af-csere-overlay" onClick={csereMegse}>
          <div className="km-af-csere-kartya" onClick={(e) => e.stopPropagation()}>
            <h3 className="km-af-csere-cim">{t("arculat_fajl.csere_cim")}</h3>
            <div className="km-af-csere-kepek">
              <div className="km-af-csere-regi">
                {csereAktiv.regi.tipus === "pdf" ? (
                  <span className="km-af-csere-pdf-jel">PDF</span>
                ) : (
                  <img src={`/api/arculat/fajl/${csereAktiv.regi.id}`} alt="" loading="eager" />
                )}
                <span>{t("arculat_fajl.csere_regi")}</span>
              </div>
              <span className="km-af-csere-nyil" aria-hidden="true">→</span>
              <div className="km-af-csere-uj">
                {csereAktiv.elonezet ? (
                  <img src={csereAktiv.elonezet} alt="" />
                ) : (
                  <span className="km-af-csere-pdf-jel">{csereAktiv.uj.type === "application/pdf" ? "PDF" : "?"}</span>
                )}
                <span>{t("arculat_fajl.csere_uj")}</span>
              </div>
            </div>
            <div className="km-af-csere-kovetkezmeny">
              <strong>{t("arculat_fajl.csere_kovetkezmeny_cim")}</strong>
              <p>{t("arculat_fajl.csere_kovetkezmeny")}</p>
            </div>
            <p className="km-af-csere-nem-torol">{t("arculat_fajl.csere_nem_torol")}</p>
            <div className="km-af-csere-gombok">
              <button type="button" className="km-af-gomb-primary" onClick={csereMegerosit}>
                {t("arculat_fajl.csere_megerosit_gomb")}
              </button>
              <button type="button" className="km-af-gomb-ghost" onClick={csereMegse}>
                {t("kozos.megse")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        hidden
        onChange={csereFajlValasztva}
      />
    </div>
  );
}

function FajlSor({ f, meta, jelveny, halvany, szerkesztheto, onCsere, onMegnyitas }: {
  f: FajlMeta;
  meta: string;
  jelveny: { szoveg: string; tipus: "hasznalatban" | "korabbi" } | null;
  halvany?: boolean | undefined;
  szerkesztheto: boolean;
  onCsere?: (() => void) | undefined;
  onMegnyitas: () => void;
}) {
  const { t } = useFeliratok();
  return (
    <div className={`km-af-fajl-sor${halvany ? " km-af-fajl-halvany" : ""}`}>
      <div className="km-af-belyeg">
        {/* eager, nem lazy: a csukott <details> alatt a lazy kép sosem töltődött be
            (Kati/Csilla visszajelzés 09-25 A5/A7 utómunka, mérve 09-30; lásd az előnézetnél) */}
        {f.tipus === "pdf" ? (
          <span className="km-af-belyeg-pdf">PDF</span>
        ) : (
          <img src={`/api/arculat/fajl/${f.id}`} alt="" loading="eager" />
        )}
      </div>
      <div className="km-af-fajl-info">
        <span className="km-af-fajl-nev">{f.nev}</span>
        <span className="km-af-fajl-meta">{meta}</span>
      </div>
      {jelveny?.tipus === "hasznalatban" ? (
        <span className="km-af-jelveny-hasznalatban">{jelveny.szoveg}</span>
      ) : jelveny?.tipus === "korabbi" ? (
        <span className="km-af-jelveny-korabbi">{jelveny.szoveg}</span>
      ) : null}
      <div className="km-af-fajl-gombok">
        {szerkesztheto && onCsere ? (
          <button type="button" className="km-af-gomb-ghost" onClick={onCsere}>{t("arculat_fajl.csere_gomb")}</button>
        ) : null}
        <a
          className="km-af-gomb-ghost"
          href={`/api/arculat/fajl/${f.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.preventDefault(); onMegnyitas(); }}
        >
          {t("arculat_fajl.megnyitas_gomb")}
        </a>
      </div>
    </div>
  );
}
