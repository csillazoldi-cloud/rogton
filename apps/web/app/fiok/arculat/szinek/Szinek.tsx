"use client";
// R-16 K4 · 12d „Színek — javaslatok” (design/R16-arculat/R16-arculat.dc.html 12d; TERV §2-K4, gepezet 6, kerdesek 4). A rajz a szerződés.
// Négy kész kép, mindegyik egy színösszeállítással (a „Kész munka” helyzet, színes változat, ugyanazok a szövegek) — az első a mostani (✓).
// Egy koppintás kijelöl; fő gomb: „Ez legyen” (ment ÉS jóváhagy, POST /api/arculat/szinek → vissza a 12c-re); halk: „Más színt” (→ 12d2,
// a kijelölt összeállítással), „Mégse” (→ /fiok/arculat). Asztal: négy kép egy sorban (230 × 288); telefon: 2 × 2 (158 × 198), a fő gomb
// a lap alján. A címke mondja, honnan jött („A logódból”, „Természetes”…); a színek neve, kódja sehol (a rajz szerint).
// Az alcím („Ezeket a logódból és a szakmádból raktuk össze.”) csak, ha van logó — logó nélkül nem állítjuk (TERV §4 15. elve).
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SzinJavaslat } from "@km/arculat-core";
import type { SzinekAdat } from "../../../../arculat/szinek";
import { useFeliratok } from "../../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink } from "../../../_kozos/R15";
import { PostKep } from "../_kozos/IgyNezKi";
import { useLogoSzinek } from "./logoSzinek";
import { VisszaSzakasz } from "../_kozos/VisszaSzakasz";
import "../../../_kozos/r15-lapok.css";

/** A 12d2 címe a kijelölt összeállítással (a 12d2 ebből indul; a fül: fő). */
export function masSzinUt(j: Pick<SzinJavaslat, "fo" | "masodik" | "hatter">): string {
  const q = new URLSearchParams({ ful: "fo", fo: j.fo, masodik: j.masodik, hatter: j.hatter });
  return `/fiok/arculat/szinek/mas?${q.toString()}`;
}

/** A mentés törzse egy kártyából: a forrás és (szettnél) a szett. */
export function mentesTorzs(j: SzinJavaslat) {
  return { fo: j.fo, masodik: j.masodik, hatter: j.hatter, forras: j.forras, ...(j.forras === "szett" && j.szett ? { szett: j.szett } : {}) };
}

export function Szinek({ adat }: { adat: SzinekAdat }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const { javaslatok } = useLogoSzinek(adat);
  const [kulcs, setKulcs] = useState("jelenlegi");
  const [folyik, setFolyik] = useState(false);
  const [hiba, setHiba] = useState(false);
  const valasztott = javaslatok.find((j) => j.kulcs === kulcs) ?? javaslatok[0]!;

  async function ment() {
    setFolyik(true);
    setHiba(false);
    try {
      const v = await fetch("/api/arculat/szinek", { method: "POST", body: JSON.stringify(mentesTorzs(valasztott)), headers: { "content-type": "application/json" }, credentials: "same-origin" });
      if (!v.ok) { setHiba(true); setFolyik(false); return; }
      router.push("/fiok/arculat"); // 12c: az új színekkel, jóváhagyva (a lap kiszolgálói, mindig friss)
      router.refresh();
    } catch {
      setHiba(true);
      setFolyik(false);
    }
  }

  const foGomb = <FoGomb onClick={() => void ment()} disabled={folyik} aria-busy={folyik}>{t("r16.arculat.ez_legyen")}</FoGomb>;

  return (
    <main className="km-lap-keret r16a-lap">
      <div className="r16sz-lap">
        <div className="r17-fej">
          <VisszaSzakasz />
          <div>
          <h1 className="r15-kerdes" data-r15="kerdes">{t("r16.arculat.szettek.kerdes")}</h1>
          {adat.bemenet.vanLogo ? (
            <p className="r15-kerdes-alcim r16sz-alcim" data-r15="kerdes-alcim">
              <span className="r15-csak-asztal">{t("r16.arculat.szettek.alcim")}</span>
              <span className="r15-csak-tel">{t("r16.arculat.szettek.alcim_rovid")}</span>
            </p>
          ) : null}
          </div>
        </div>

        <div className="r16sz-kartyak" role="radiogroup" aria-label={t("r16.arculat.szettek.kerdes")}>
          {javaslatok.map((j) => {
            const nev = t(j.nev);
            const ki = j.kulcs === valasztott.kulcs;
            return (
              <button key={j.kulcs} type="button" role="radio" aria-checked={ki} aria-label={nev} className="r16sz-kartya" onClick={() => setKulcs(j.kulcs)}>
                <span className={`r16sz-keret${ki ? " r16sz-keret-ki" : ""}`}>
                  <PostKep helyzet="kesz" valtozat="szines" frissites={0} valasztas={{ szinek: { fo: j.fo, masodik: j.masodik, hatter: j.hatter } }} osztaly="r16sz-kep" />
                </span>
                <span className="r16sz-cimke">{j.jelenlegi ? `${nev} ✓` : nev}</span>
              </button>
            );
          })}
        </div>

        {hiba ? <Baj szoveg={t("fiok.mentes_hiba")} gomb={<HalkGomb onClick={() => setHiba(false)}>{t("kozos.rendben")}</HalkGomb>} /> : null}

        <div className="r16sz-gombok">
          <span className="r15-csak-asztal">{foGomb}</span>
          <HalkLink href={masSzinUt(valasztott)}>{t("r16.arculat.szettek.mas")}</HalkLink>
          <HalkLink href="/fiok/arculat">{t("r16.arculat.megse")}</HalkLink>
        </div>
      </div>

      <div className="r15-also-sav">{foGomb}</div>
    </main>
  );
}
