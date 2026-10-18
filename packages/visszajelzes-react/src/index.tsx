"use client";
// R-9: a Visszajelzés modul — gomb → jelölő mód → buborék → küldés.
// A modul nem tud a befogadó adatbázisáról, végpontjairól, feliratairól: mindent a `kuldes` és a `feliratok` ad át.
// Minden saját elemünk `data-vj="1"` attribútumot kap — a jelölő mód ezeket engedi át.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { toPng } from "html-to-image";

export type VisszajelzesAdat = {
  lap: string;
  lap_cim: string;
  elem: { cimke: string; szelektor: string; szoveg_reszlet: string } | null;
  kijelolt_szoveg: string;
  szoveg: string;
  nyelv: string;
  kep: string | null;
  ablak: { w: number; h: number };
};

export type VisszajelzesFeliratok = {
  gomb: string;
  jelolo_mod: string;
  jelolo_szoveg: string;
  kilepes: string;
  ehhez: string;
  szovegresz: string;
  egesz_lap: string;
  mezo_sugo: string;
  jegyzet: string;
  kuldes: string;
  megse: string;
  feljegyeztuk: string;
  koszonjuk: string;
  hiba: string;
};

type Jelolt = {
  elem: HTMLElement | null;
  cimke: string;
  szelektor: string;
  szoveg_reszlet: string;
  kijelolt_szoveg: string;
  poz: { x: number; y: number };
  szovegresz: boolean;
};

// A buborék alapértelmezett mérete (a CSS `--vj-buborek-w`/`-h` alapértéke), amíg a mérés meg nem érkezik.
const BUBOREK_W_ALAP = 380;
const BUBOREK_H_ALAP = 240;
const SZEL = 12;

/**
 * A buborék helyzetének befogása az ablakba.
 * - `x` legfeljebb `ablak.w - w - 12`, legalább 12.
 * - `y` ugyanígy.
 * - Ha az elem jobb oldalán nincs hely (a kért `x` + `w` túllóg), a buborék BAL oldalra kerül.
 */
export function poziciotBefog(
  poz: { x: number; y: number },
  meret: { w: number; h: number },
  ablak: { w: number; h: number },
): { x: number; y: number } {
  const maxX = Math.max(SZEL, ablak.w - meret.w - SZEL);
  const maxY = Math.max(SZEL, ablak.h - meret.h - SZEL);
  let x = poz.x;
  let y = poz.y;
  // Ha a jobb oldalon nincs hely, balra tesszük: a buborék jobb széle az elem bal széle mellé kerül.
  if (x + meret.w > ablak.w - SZEL) {
    // A hívó a jobb oldali pozíciót adja (elem jobb széle + 12); a bal oldali pozíció az elem bal széle mínusz a buborék szélessége mínusz 12.
    // Ha a hívó már eleve bal oldali pozíciót adott (x kisebb), akkor csak befogjuk.
    const balra = poz.x - meret.w - 2 * SZEL;
    if (balra >= SZEL) x = balra;
  }
  x = Math.min(Math.max(x, SZEL), maxX);
  y = Math.min(Math.max(y, SZEL), maxY);
  return { x, y };
}

// A rögzített adat (rendszergazdának) — NEM a feliratokból jön.
function cimkeSzerep(elem: HTMLElement): string {
  const tag = elem.tagName.toLowerCase();
  if (tag === "button") return "gomb";
  if (tag === "a") return "hivatkozás";
  if (tag === "h1" || tag === "h2" || tag === "h3") return "cím";
  if (tag === "img") return "kép";
  if (tag === "input" || tag === "select" || tag === "textarea") return "mező";
  return "szöveg";
}

function rovidSzelektor(elem: HTMLElement): string {
  const reszek: string[] = [];
  let aktualis: HTMLElement | null = elem;
  let szint = 0;
  while (aktualis && szint < 4) {
    let resz = aktualis.tagName.toLowerCase();
    if (aktualis.id) {
      resz += `#${aktualis.id}`;
      reszek.unshift(resz);
      break;
    }
    const kmOsztaly = Array.from(aktualis.classList).find((o) => o.startsWith("km-"));
    if (kmOsztaly) {
      resz += `.${kmOsztaly}`;
      reszek.unshift(resz);
      break;
    }
    reszek.unshift(resz);
    aktualis = aktualis.parentElement;
    szint += 1;
  }
  return reszek.join(" > ");
}

function cimkeSzoveg(elem: HTMLElement): string {
  const szerep = cimkeSzerep(elem);
  const nyers = (elem.innerText || elem.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
  const resz = nyers.slice(0, 60);
  return resz ? `${szerep} „${resz}"` : szerep;
}

function adatVjAlatt(node: Node | null): boolean {
  let aktualis: Node | null = node;
  while (aktualis) {
    if (aktualis instanceof HTMLElement && aktualis.dataset.vj) return true;
    aktualis = aktualis.parentNode;
  }
  return false;
}

export function VisszajelzesModul(p: {
  kuldes: (adat: VisszajelzesAdat) => Promise<boolean>;
  feliratok: VisszajelzesFeliratok;
  nyelv: string;
  kepMaxSzelesseg?: number;
  /** Megjelenjen-e a lebegő gomb a jobb alsó sarokban (alap: igen). R-12 A10: a befogadó menüből is indíthatja. */
  lebego?: boolean;
  /** Ha meg van adva: erre a `window`-eseményre indul a jelölő mód (pl. egy menüpontból). */
  inditoEsemeny?: string;
}): ReactElement {
  const kepMaxSzelesseg = p.kepMaxSzelesseg ?? 480;
  const [jelol, setJelol] = useState(false);
  const [jelolt, setJelolt] = useState<Jelolt | null>(null);
  const [szoveg, setSzoveg] = useState("");
  const [kuldes, setKuldes] = useState(false);
  const [kesz, setKesz] = useState(false);
  const [hiba, setHiba] = useState(false);
  const [buborekMeret, setBuborekMeret] = useState<{ w: number; h: number }>({
    w: BUBOREK_W_ALAP,
    h: BUBOREK_H_ALAP,
  });
  const jeloltElemRef = useRef<HTMLElement | null>(null);
  const celElemRef = useRef<HTMLElement | null>(null);
  const buborekRef = useRef<HTMLDivElement | null>(null);

  // R-12 A10: a jelölő mód kívülről is indítható (a befogadó menüpontjából), a lebegő gomb nélkül.
  useEffect(() => {
    if (!p.inditoEsemeny) return;
    const nev = p.inditoEsemeny;
    const indit = (): void => setJelol(true);
    window.addEventListener(nev, indit);
    return () => window.removeEventListener(nev, indit);
  }, [p.inditoEsemeny]);

  const kilep = useCallback(() => {
    setJelol(false);
    setJelolt(null);
    setSzoveg("");
    setHiba(false);
    if (jeloltElemRef.current) {
      jeloltElemRef.current.classList.remove("km-vj-jelolt");
      jeloltElemRef.current = null;
    }
    if (celElemRef.current) {
      celElemRef.current.classList.remove("km-vj-cel");
      celElemRef.current = null;
    }
  }, []);

  // Jelölő mód: a lap vezérlői nem indítanak semmit; a saját elemeinket átengedjük.
  // A figyelők a `document`-en capture fázisban futnak — a felugró (portál) elemeire is célba érnek.
  useEffect(() => {
    if (!jelol) return;
    document.body.classList.add("km-vj-jelol");
    // A felugró (HirFelugro) ezt nézi: jelölő módban nem záródik be kattintásra.
    document.body.dataset.vjJelol = "1";

    function blokkol(e: Event) {
      const cel = e.target as Node | null;
      if (adatVjAlatt(cel)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "click" && cel instanceof HTMLElement) {
        valaszt(cel);
      }
    }
    function billentyu(e: KeyboardEvent) {
      if (e.key === "Escape") {
        kilep();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        const cel = e.target as Node | null;
        if (adatVjAlatt(cel)) return;
        e.preventDefault();
        e.stopPropagation();
      }
    }
    function fole(e: MouseEvent) {
      const cel = e.target as Node | null;
      if (!(cel instanceof HTMLElement) || adatVjAlatt(cel)) return;
      if (celElemRef.current && celElemRef.current !== cel) {
        celElemRef.current.classList.remove("km-vj-cel");
      }
      celElemRef.current = cel;
      cel.classList.add("km-vj-cel");
    }
    function le(e: MouseEvent) {
      const cel = e.target as Node | null;
      if (cel instanceof HTMLElement && cel === celElemRef.current) {
        cel.classList.remove("km-vj-cel");
        celElemRef.current = null;
      }
    }
    function kijelolesValto() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const szovegKijelolt = sel.toString().trim().slice(0, 1000);
      if (!szovegKijelolt) return;
      const tart = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      if (!tart) return;
      if (adatVjAlatt(tart.commonAncestorContainer)) return;
      const szulo =
        tart.commonAncestorContainer instanceof HTMLElement
          ? tart.commonAncestorContainer
          : tart.commonAncestorContainer.parentElement;
      if (!szulo) return;
      const r = tart.getBoundingClientRect();
      valaszt(szulo, {
        kijelolt_szoveg: szovegKijelolt,
        poz: { x: r.left, y: r.bottom + 8 },
        szovegresz: true,
      });
    }

    document.addEventListener("click", blokkol, { capture: true });
    document.addEventListener("mousedown", blokkol, { capture: true });
    document.addEventListener("mouseup", blokkol, { capture: true });
    document.addEventListener("submit", blokkol, { capture: true });
    document.addEventListener("keydown", billentyu, { capture: true });
    document.addEventListener("mouseover", fole, { capture: true });
    document.addEventListener("mouseout", le, { capture: true });
    document.addEventListener("selectionchange", kijelolesValto);

    return () => {
      document.body.classList.remove("km-vj-jelol");
      delete document.body.dataset.vjJelol;
      document.removeEventListener("click", blokkol, { capture: true });
      document.removeEventListener("mousedown", blokkol, { capture: true });
      document.removeEventListener("mouseup", blokkol, { capture: true });
      document.removeEventListener("submit", blokkol, { capture: true });
      document.removeEventListener("keydown", billentyu, { capture: true });
      document.removeEventListener("mouseover", fole, { capture: true });
      document.removeEventListener("mouseout", le, { capture: true });
      document.removeEventListener("selectionchange", kijelolesValto);
      if (celElemRef.current) {
        celElemRef.current.classList.remove("km-vj-cel");
        celElemRef.current = null;
      }
    };
  }, [jelol, kilep]);

  // A buborék méretének mérése az első render után (a pozíció befogásához).
  useLayoutEffect(() => {
    if (!jelolt) return;
    const el = buborekRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      setBuborekMeret((elozo) =>
        elozo.w === r.width && elozo.h === r.height ? elozo : { w: r.width, h: r.height },
      );
    }
  }, [jelolt]);

  function valaszt(
    elem: HTMLElement,
    opts?: { kijelolt_szoveg?: string; poz?: { x: number; y: number }; szovegresz?: boolean },
  ) {
    if (jeloltElemRef.current && jeloltElemRef.current !== elem) {
      jeloltElemRef.current.classList.remove("km-vj-jelolt");
    }
    jeloltElemRef.current = elem;
    elem.classList.add("km-vj-jelolt");
    const r = elem.getBoundingClientRect();
    const poz = opts?.poz ?? { x: r.right + 12, y: r.top };
    setJelolt({
      elem,
      cimke: cimkeSzoveg(elem),
      szelektor: rovidSzelektor(elem),
      szoveg_reszlet: (elem.innerText || "").trim().slice(0, 300),
      kijelolt_szoveg: opts?.kijelolt_szoveg ?? "",
      poz,
      szovegresz: opts?.szovegresz ?? false,
    });
    setSzoveg("");
    setHiba(false);
    setKesz(false);
  }

  function egeszLap() {
    if (jeloltElemRef.current) {
      jeloltElemRef.current.classList.remove("km-vj-jelolt");
      jeloltElemRef.current = null;
    }
    setJelolt({
      elem: null,
      cimke: "",
      szelektor: "",
      szoveg_reszlet: "",
      kijelolt_szoveg: "",
      poz: { x: window.innerWidth / 2 - 190, y: window.innerHeight / 2 - 120 },
      szovegresz: false,
    });
    setSzoveg("");
    setHiba(false);
    setKesz(false);
  }

  async function kepetKeszit(cel: HTMLElement | null): Promise<string | null> {
    if (!cel) return null;
    try {
      const szelesseg = cel.getBoundingClientRect().width || 1;
      const pixelRatio = Math.min(1, kepMaxSzelesseg / szelesseg);
      return await toPng(cel, {
        pixelRatio,
        cacheBust: false,
        // 0148 (a gomb a belépés előtti lapokon is): jelszómező soha nem kerül a képre — a „mutasd” gombbal szövegként látható jelszó
        // sem (az autocomplete-jele marad: current-/new-password)
        filter: (n) => !(n instanceof HTMLElement && n.dataset.vj) && !(n instanceof HTMLInputElement && (n.type === "password" || /password/.test(n.autocomplete))),
      });
    } catch {
      return null;
    }
  }

  async function kuld() {
    if (!jelolt || !szoveg.trim() || kuldes) return;
    setKuldes(true);
    setHiba(false);
    const cel = jelolt.elem ?? document.body;
    const kep = await kepetKeszit(cel);
    const adat: VisszajelzesAdat = {
      lap: location.pathname + location.search,
      lap_cim: document.title,
      elem: jelolt.elem
        ? { cimke: jelolt.cimke, szelektor: jelolt.szelektor, szoveg_reszlet: jelolt.szoveg_reszlet }
        : null,
      kijelolt_szoveg: jelolt.kijelolt_szoveg,
      szoveg: szoveg.trim(),
      nyelv: p.nyelv,
      kep,
      ablak: { w: window.innerWidth, h: window.innerHeight },
    };
    let siker = false;
    try {
      siker = await p.kuldes(adat);
    } catch {
      siker = false;
    }
    setKuldes(false);
    if (siker) {
      if (jeloltElemRef.current) {
        jeloltElemRef.current.classList.remove("km-vj-jelolt");
        jeloltElemRef.current = null;
      }
      setJelolt(null);
      setSzoveg("");
      setKesz(true);
      window.setTimeout(() => setKesz(false), 2500);
    } else {
      setHiba(true);
    }
  }

  // A buborék pozíciója: a kért pozíció befogva az ablakba, a mért (vagy alap) mérettel.
  const buborekPoz = jelolt
    ? poziciotBefog(jelolt.poz, buborekMeret, { w: window.innerWidth, h: window.innerHeight })
    : null;

  return (
    <>
      {p.lebego !== false && (
        <button
          type="button"
          className="km-vj-gomb"
          data-vj="1"
          data-r15="lebego"
          aria-pressed={jelol}
          onClick={() => (jelol ? kilep() : setJelol(true))}
        >
          {p.feliratok.gomb}
        </button>
      )}

      {jelol && (
        <div className="km-vj-sav" data-vj="1" role="status">
          <span className="km-vj-sav-jelveny">{p.feliratok.jelolo_mod}</span>
          <span>{p.feliratok.jelolo_szoveg}</span>
          <button
            type="button"
            className="km-vj-gomb-masodik"
            data-vj="1"
            style={{ marginLeft: "auto" }}
            onClick={egeszLap}
          >
            {p.feliratok.egesz_lap}
          </button>
          <button type="button" className="km-vj-gomb-masodik" data-vj="1" onClick={kilep}>
            {p.feliratok.kilepes}
          </button>
        </div>
      )}

      {kesz && (
        <div className="km-vj-kesz" data-vj="1" role="status">
          <span className="km-vj-sav-jelveny">✓ {p.feliratok.feljegyeztuk}</span>
          <span>{p.feliratok.koszonjuk}</span>
        </div>
      )}

      {jelolt && !kesz && buborekPoz && (
        <div
          ref={buborekRef}
          className="km-vj-bub"
          data-vj="1"
          role="dialog"
          aria-modal="false"
          style={{ left: buborekPoz.x, top: buborekPoz.y }}
        >
          <div className="km-vj-bub-tartalom">
            <div className="km-vj-bub-cimke">
              {jelolt.szovegresz ? p.feliratok.szovegresz : p.feliratok.ehhez}
            </div>
            {jelolt.cimke && <div className="km-vj-bub-elem">{jelolt.cimke}</div>}
            {jelolt.kijelolt_szoveg && (
              <div className="km-vj-bub-elem">„{jelolt.kijelolt_szoveg}"</div>
            )}
            <textarea
              autoFocus
              value={szoveg}
              placeholder={p.feliratok.mezo_sugo}
              onChange={(e) => setSzoveg(e.target.value)}
            />
            <div className="km-vj-bub-jegyzet">{p.feliratok.jegyzet}</div>
            {hiba && <div className="km-vj-bub-elem" style={{ color: "var(--accent-warm)" }}>{p.feliratok.hiba}</div>}
          </div>
          <div className="km-vj-bub-gombok">
            <button type="button" className="km-vj-gomb-masodik" onClick={() => setJelolt(null)}>
              {p.feliratok.megse}
            </button>
            <button
              type="button"
              className="km-vj-gomb-fo"
              disabled={!szoveg.trim() || kuldes}
              onClick={() => void kuld()}
            >
              {p.feliratok.kuldes}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
