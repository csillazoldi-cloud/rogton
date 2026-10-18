"use client";
// R-18 6. kör (Kati E; rajz: „Poszt · emoji választó · asztali”, „Poszt · emoji (alsó lap) · telefon”). 44 px-es mosoly-gomb a mező jobb alsó
// sarkában; asztalon lebegő ablak alatta, telefonon alsó lap halvány fátyollal (a mező látszik). Fülek: Legutóbbi · Arcok · Munka · Jelek;
// 8 oszlop, 44 px-es cellák. Koppintásra a kurzorhoz kerül, a választó nyitva marad (asztalon kívül kattintva, telefonon ✕-szel zárul).
// A „Legutóbbi” az utolsó 16, ebben a böngészőben (localStorage, try/catch — ha tiltva, üres). A rendszer emoji-betűjét használja.
import { useEffect, useRef, useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";

const CSOPORTOK = {
  arcok: ["😀", "😊", "😍", "🤩", "😎", "🤔", "😅", "🥳", "😂", "🙂", "😉", "🤗", "😇", "🥰", "😌", "😮", "👍", "👏", "🙏", "💪", "🤝", "👋", "❤️", "🔥"],
  munka: ["🏗️", "🧱", "🛠️", "🔨", "🚚", "📐", "📏", "🏡", "🌳", "🌿", "💧", "❄️", "☀️", "🌧️", "📅", "📍", "📞", "✉️", "🛒", "💼", "🎨", "📸", "🍽️", "☕"],
  jelek: ["✅", "☑️", "✔️", "❗", "❓", "⭐", "✨", "🎉", "🎁", "📣", "🔔", "💡", "➡️", "⬇️", "👉", "📌", "🔝", "🆕", "💯", "⏰", "🕒", "€", "%", "🇭🇺"],
} as const;
type Ful = "legutobbi" | keyof typeof CSOPORTOK;
const KULCS = "km-emoji-legutobbi";
const LEGUTOBBI_MAX = 16;

function legutobbiOlvas(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KULCS) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, LEGUTOBBI_MAX) : []; } catch { return []; }
}
function legutobbiIr(e: string): string[] {
  const uj = [e, ...legutobbiOlvas().filter((x) => x !== e)].slice(0, LEGUTOBBI_MAX);
  try { localStorage.setItem(KULCS, JSON.stringify(uj)); } catch { /* tiltott tár: csak most nem jegyezzük meg */ }
  return uj;
}

/** A gomb és a választó. `beszur` a kurzorhoz teszi az emojit (a hívó tudja, hol a kurzor). */
export function R18Emoji({ beszur, tiltva = false }: { beszur: (e: string) => void; tiltva?: boolean }) {
  const { t } = useFeliratok();
  const [nyitva, setNyitva] = useState(false);
  const [legutobbi, setLegutobbi] = useState<string[]>([]);
  const [ful, setFul] = useState<Ful>("legutobbi");
  const hely = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!nyitva) return;
    const l = legutobbiOlvas();
    setLegutobbi(l);
    if (l.length === 0) setFul((f) => (f === "legutobbi" ? "munka" : f));
    const kattint = (ev: MouseEvent) => { if (hely.current && !hely.current.contains(ev.target as Node) && window.matchMedia("(min-width: 641px)").matches) setNyitva(false); };
    const bill = (ev: KeyboardEvent) => { if (ev.key === "Escape") setNyitva(false); };
    document.addEventListener("mousedown", kattint);
    document.addEventListener("keydown", bill);
    return () => { document.removeEventListener("mousedown", kattint); document.removeEventListener("keydown", bill); };
  }, [nyitva]);
  const valaszt = (e: string) => { beszur(e); setLegutobbi(legutobbiIr(e)); };
  const lista = ful === "legutobbi" ? legutobbi : CSOPORTOK[ful];
  return (
    <div className="r18e-hely" ref={hely}>
      <button type="button" className="r18e-gomb" aria-label={t("poszt.emoji")} title={t("poszt.emoji_tipp")} aria-haspopup="dialog" aria-expanded={nyitva} disabled={tiltva}
        onMouseDown={(e) => e.preventDefault() /* a mező kurzora maradjon */} onClick={() => setNyitva((v) => !v)}>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>
      </button>
      {nyitva ? (
        <>
          <div className="r18e-fatyol r15-csak-tel" aria-hidden="true" onClick={() => setNyitva(false)} />
          <div className="r18e-ablak" role="dialog" aria-label={t("poszt.emoji")}>
            <div className="r18e-fogo r15-csak-tel" aria-hidden="true" />
            <div className="r18e-fej">
              <div className="r18e-fulek" role="tablist" aria-label={t("poszt.emoji")}>
                {(["legutobbi", "arcok", "munka", "jelek"] as const).map((f) => (
                  <button key={f} type="button" role="tab" aria-selected={ful === f} className="r18e-ful" onMouseDown={(e) => e.preventDefault()} onClick={() => setFul(f)}>{t(`emoji.${f}`)}</button>
                ))}
              </div>
              <button type="button" className="r18e-bezar r15-csak-tel" aria-label={t("emoji.bezar")} onClick={() => setNyitva(false)}>✕</button>
            </div>
            <div className="r18e-racs" role="tabpanel">
              {lista.map((e) => (
                <button key={e} type="button" className="r18e-emoji" aria-label={e} onMouseDown={(ev) => ev.preventDefault()} onClick={() => valaszt(e)}>{e}</button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

