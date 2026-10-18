"use client";
// R-13 · a Kreditek nézet (/tagok/kreditek) — design/R13/rajz/R13-lapok.dc.html 13b1 · 13b2 · 13b3; gepezet.md 13b.
//   13b1 mindenki egyenlő részen: soronként „500 kredit · Átírom”; fő gomb „Jó így” (adat nem változik — minden már mentve, vissza a Tagokra).
//   13b2 egy tagnak külön összeg: a sorában „800 kredit · külön · Vissza egyenlő részre” (PUT null).
//   „Átírom” után a lista helyben szerkeszthető (13b2 jobb oldali panel): szám-mező (szürke = egyenlő rész), maradt, elhasznált,
//     Szerep · Eltávolítás (R-2 gépezet); minden változás magától mentődik (PUT /api/kredit/tagok/{fiok}), nincs Mentés gomb.
//   13b3 egy tagé elfogyott: a cím mondja, az alcím a következményt, a táblázatban a 0 figyelmeztető színű, a fő gomb „Többet adok neki”
//     (megnyitja a szerkesztést, az ő mezőjén).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../../nyelv/kliens";
import { hivas } from "../../_kozos/kliens";
import { FoGomb, HalkGomb, HalkLink, Info, KerdesCim } from "../../_kozos/R15";
import { useKreditSzam } from "../../_kozos/R13Kredit";
import { elfogyottTag } from "../../_kozos/r13-szabaly";
import type { KreditekNezet, TagKreditSor } from "../../../kredit/tipusok";
import "../../_kozos/r15-lapok.css";
import "../../_kozos/r13.css";

type Szerep = TagKreditSor["szerep"];
const SZEREPEK: Szerep[] = ["nezo", "szerkeszto", "tulajdonos"];
const szerepKulcs = (sz: Szerep) => (sz === "tulajdonos" ? "nav.szerep_tulajdonos" : sz === "szerkeszto" ? "nav.szerep_szerkeszto" : "nav.szerep_nezo");

/** A GET /api/kredit/tagok válaszából a nézet adata (ugyanaz a szerkezet, mint a kiszolgálói `kreditekNezet`). */
export function nezetValaszbol(torzs: Record<string, unknown>, sajat: string): KreditekNezet | null {
  const k = torzs["kredit"] as Omit<KreditekNezet, "sajat_fiok_id"> | undefined;
  return k && Array.isArray(k.tagok) ? { ...k, sajat_fiok_id: sajat } : null;
}

export function Kreditek({ nezet: kezdo }: { nezet: KreditekNezet }) {
  const { t } = useFeliratok();
  const szam = useKreditSzam();
  const router = useRouter();
  const [nezet, setNezet] = useState(kezdo);
  const [szerkeszt, setSzerkeszt] = useState(false);
  const [fokusz, setFokusz] = useState<string | null>(null);
  const [mezok, setMezok] = useState<Record<string, string>>({});
  const [hiba, setHiba] = useState("");
  const [szerepMenu, setSzerepMenu] = useState<string | null>(null);
  const idozitok = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const frissit = useCallback(async () => {
    const v = await hivas("/api/kredit/tagok", "GET");
    const uj = v.statusz === 200 ? nezetValaszbol(v.torzs, nezet.sajat_fiok_id) : null;
    if (uj) setNezet(uj);
    return uj;
  }, [nezet.sajat_fiok_id]);

  useEffect(() => {
    if (!szerkeszt || !fokusz) return;
    document.getElementById(`r13-kredit-${fokusz}`)?.focus();
  }, [szerkeszt, fokusz]);

  async function havitMent(fiok: string, havi: number | null) {
    setHiba("");
    const v = await hivas(`/api/kredit/tagok/${encodeURIComponent(fiok)}`, "PUT", { havi });
    if (v.statusz !== 200) { setHiba(t("hiba.ALTALANOS")); return; }
    await frissit();
    setMezok((m) => { const u = { ...m }; delete u[fiok]; return u; });
  }

  function mezoValtozik(fiok: string, ertek: string) {
    setMezok((m) => ({ ...m, [fiok]: ertek }));
    const idozito = idozitok.current[fiok];
    if (idozito) clearTimeout(idozito);
    const n = Number(ertek.replace(",", "."));
    if (ertek.trim() === "" || !Number.isFinite(n) || n < 0) return; // félkész szám: nem mentjük, a mező marad
    idozitok.current[fiok] = setTimeout(() => void havitMent(fiok, Math.round(n * 1000) / 1000), 700);
  }

  async function szerepValt(sor: TagKreditSor, uj: Szerep) {
    setSzerepMenu(null);
    if (uj === sor.szerep) return;
    if (!window.confirm(t("tagok.megerosit_cim", { nev: sor.nev, szerep: t(szerepKulcs(uj)) }))) return;
    const v = await hivas(`/api/tagok/${encodeURIComponent(sor.fiok_id)}`, "PUT", { szerep: uj });
    if (v.statusz !== 200) { setHiba(t("hiba.ALTALANOS")); return; }
    await frissit();
  }

  async function eltavolit(sor: TagKreditSor) {
    if (!window.confirm(t("tagok.eltavolit_cim", { nev: sor.nev }))) return;
    const v = await hivas(`/api/tagok/${encodeURIComponent(sor.fiok_id)}`, "DELETE");
    if (v.statusz !== 200) { setHiba(t("hiba.ALTALANOS")); return; }
    await frissit();
  }

  function atirom(fiok: string) { setFokusz(fiok); setSzerkeszt(true); }

  const elfogyott = elfogyottTag(nezet.tagok);
  const kreditDb = (n: number) => t("r13.tagok.kredit_db", { n: szam(n) });

  const cim = elfogyott ? t("r13.kreditek.elfogyott_cim", { nev: elfogyott.nev }) : t("r13.kreditek.cim");
  const alcimAsztal = elfogyott ? t("r13.kreditek.elfogyott_alcim") : t("r13.kreditek.alcim", { havi: szam(nezet.munkater.havi) });
  const alcimTel = elfogyott ? t("r13.kreditek.elfogyott_alcim") : t("r13.kreditek.alcim_rovid");
  const foGomb = elfogyott
    ? { szoveg: t("r13.kreditek.tobbet_adok"), katt: () => atirom(elfogyott.fiok_id) }
    : { szoveg: t("r13.kozos.jo_igy"), katt: () => router.push("/tagok") };

  // ---- az „Átírom” utáni szerkesztő lista (13b2 jobb oldali panel) ----
  const szerkesztoLista = (
    <section className="r13b-panel" aria-label={t("r13.kreditek.cim")}>
      {nezet.tagok.map((s) => {
        const egyenlo = s.kulon === null;
        const ertek = mezok[s.fiok_id] ?? szam(s.havi);
        return (
          <div key={s.fiok_id} className="r13b-panel-sor">
            <div className="r13b-panel-fej">
              <strong>{s.nev}</strong>
              <span className={s.maradt <= 0 ? "r13-halk r13-figyel" : "r13-halk"}>{t("r13.tagok.maradt_db", { n: szam(s.maradt) })}</span>
            </div>
            <div className="r13b-panel-mezosor">
              <input id={`r13-kredit-${s.fiok_id}`} className={egyenlo ? "r13b-mezo r13b-mezo-egyenlo" : "r13b-mezo"} inputMode="decimal"
                value={ertek} onChange={(e) => mezoValtozik(s.fiok_id, e.target.value)} aria-label={`${s.nev} — ${t("r13.tagok.havonta")}`} />
              <span className="r13b-havonta">{t("r13.tagok.havonta")}</span>
              {egyenlo
                ? <span className="r13-halk r13-kicsi">{t("r13.tagok.egyenlo_resz")}</span>
                : <HalkLink onClick={() => void havitMent(s.fiok_id, null)}>{t("r13.tagok.vissza_egyenlo")}</HalkLink>}
              {s.fiok_id !== nezet.sajat_fiok_id ? (
                <span className="r13b-panel-gombok">
                  <span className="r15-menu-hely">
                    <HalkGomb onClick={() => setSzerepMenu((m) => (m === s.fiok_id ? null : s.fiok_id))} aria-haspopup="menu" aria-expanded={szerepMenu === s.fiok_id}>{t("tagok.szerep_gomb")}</HalkGomb>
                    {szerepMenu === s.fiok_id ? (
                      <div className="r15-menu" role="menu">
                        {SZEREPEK.map((sz) => (
                          <button key={sz} type="button" role="menuitem" className="r15-menu-sor" aria-current={sz === s.szerep ? "true" : undefined}
                            onClick={() => void szerepValt(s, sz)}>{t(szerepKulcs(sz))}</button>
                        ))}
                      </div>
                    ) : null}
                  </span>
                  <HalkGomb onClick={() => void eltavolit(s)}>{t("tagok.eltavolitas_gomb")}</HalkGomb>
                </span>
              ) : null}
            </div>
            <p className="r13-halk r13-kicsi">{t("r13.tagok.oszlop_elhasznalt")}: {szam(s.felhasznalt)}</p>
          </div>
        );
      })}
      <div className="r13a-kesz-sor">
        <button type="button" className="r15-halk-gomb" onClick={() => { setSzerkeszt(false); setSzerepMenu(null); }}>{t("r15.mit.kesz")}</button>
        <Info>{t("r13.kozos.automentes")}</Info>
      </div>
      <p className="r13-halk">{t("r13.tagok.hogyan_reszlet")}</p>
    </section>
  );

  // ---- 13b1 / 13b2 lista; 13b3 táblázat ----
  const lista = elfogyott ? (
    <>
      <table className="r13b-tabla r15-csak-asztal">
        <thead>
          <tr>
            <th scope="col">{t("r13.tagok.oszlop_tag")}</th>
            <th scope="col">{t("r13.tagok.oszlop_havi")}</th>
            <th scope="col">{t("r13.tagok.oszlop_elhasznalt")}</th>
            <th scope="col">{t("r13.tagok.oszlop_maradt")}</th>
          </tr>
        </thead>
        <tbody>
          {nezet.tagok.map((s) => (
            <tr key={s.fiok_id}>
              <td><span className="r13b-tabla-tag"><span className="r13b-nev">{s.nev}</span><span className="r13-halk r13-kicsi">{t(szerepKulcs(s.szerep))}</span></span></td>
              <td>{kreditDb(s.havi)}</td>
              <td className="r13-halk">{szam(s.felhasznalt)}</td>
              <td className={s.maradt <= 0 ? "r13-figyel r13-eros" : ""}>{szam(s.maradt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="r13b-lista r15-csak-tel">
        {nezet.tagok.map((s) => (
          <div key={s.fiok_id} className="r13b-sor">
            <div className="r13b-sor-bal">
              <span className="r13b-nev">{s.nev}</span>
              <span className={s.maradt <= 0 ? "r13-figyel r13-eros r13-kicsi" : "r13-halk r13-kicsi"}>{t("r13.tagok.maradt_db", { n: szam(s.maradt) })}</span>
            </div>
            <span className="r13b-sor-jobb r13-kicsi">{kreditDb(s.havi)}</span>
          </div>
        ))}
      </div>
    </>
  ) : (
    <div className="r13b-lista">
      {nezet.tagok.map((s) => (
        <div key={s.fiok_id} className="r13b-sor">
          <div className="r13b-sor-bal">
            <span className="r13b-nev">{s.nev}</span>
            <span className="r13-halk r13-kicsi r15-csak-asztal">{t(szerepKulcs(s.szerep))}</span>
          </div>
          <div className="r13b-sor-jobb">
            <span className="r13b-osszeg">{kreditDb(s.havi)}</span>
            {s.kulon !== null ? <span className="r13-halk r13-kicsi r15-csak-asztal">{t("r13.tagok.kulon_jel")}</span> : null}
            {s.kulon !== null
              ? <HalkLink onClick={() => void havitMent(s.fiok_id, null)}>{t("r13.tagok.vissza_egyenlo")}</HalkLink>
              : <HalkLink onClick={() => atirom(s.fiok_id)}>{t("r15.mit.atirom")}</HalkLink>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="km-lap-keret r15-lap r15-lapok2 r13b-lap">
      <div className="r15-lap-belso r13b-belso">
        <div className="r13b-fej">
          <span className="r15-csak-asztal"><a className="r15-halk-link r13b-vissza" href="/tagok">{t("r13.kreditek.vissza")}</a></span>
          <span className="r15-csak-asztal"><KerdesCim cim={cim} alcim={alcimAsztal} /></span>
          <span className="r15-csak-tel"><KerdesCim cim={cim} alcim={alcimTel} /></span>
        </div>
        {szerkeszt ? szerkesztoLista : lista}
        {hiba ? <Info>{hiba}</Info> : null}
        {szerkeszt ? null : (
          <div className="r13b-gombsor r15-csak-asztal">
            <FoGomb onClick={foGomb.katt}>{foGomb.szoveg}</FoGomb>
            <Info>{t("r13.kredit.penz_oszt")}</Info>
          </div>
        )}
      </div>
      {szerkeszt ? null : (
        <div className="r15-also-sav">
          <div className="r15-also-nyugtato"><Info>{t("r13.kredit.penz_rovid")}</Info></div>
          <FoGomb onClick={foGomb.katt}>{foGomb.szoveg}</FoGomb>
        </div>
      )}
    </main>
  );
}
