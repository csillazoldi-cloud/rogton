"use client";
// R-15 · 08c 6 — „Melyik poszthoz tegyük?” (a Képek lapról, a kész kép mellől; gepezet 21). A kép már a Kész képeim között van
// (kepId); a választott poszthoz kerül, vagy a gép új posztot ír hozzá a kép szövegéből. A kész poszt kész marad (kerdesek 18).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import type { R15PosztLista } from "../../r15/tipusok";
import { FoGomb, HalkLink, KerdesCim } from "../_kozos/R15";
import "../poszt/r15-kephely.css";

export function R15PoszthozTeszem({ kepId, kepSzoveg, onZar }: { kepId: string; kepSzoveg: string; onZar: () => void }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const [lista, setLista] = useState<R15PosztLista | null>(null);
  const [valasztott, setValasztott] = useState<string | null>(null);
  const [fut, setFut] = useState(false);

  useEffect(() => {
    void hivas("/api/r15/poszt-lista", "GET").then((v) => {
      const l = v.torzs["lista"] as R15PosztLista | undefined;
      if (l) { setLista(l); setValasztott(l.varo[0]?.id ?? l.kesz[0]?.id ?? null); }
    });
  }, []);

  async function hozzatesz() {
    if (!valasztott) return;
    setFut(true);
    const v = await hivas(`/api/r15/poszt/${encodeURIComponent(valasztott)}/kep`, "PUT", { kep_id: kepId });
    if (v.statusz === 200) router.push(`/poszt?munka=${encodeURIComponent(valasztott)}`);
    else setFut(false);
  }

  async function ujPoszt() {
    setFut(true);
    const v = await hivas(`/api/r15/kep/${encodeURIComponent(kepId)}/poszt`, "POST", { szoveg: kepSzoveg });
    const id = typeof v.torzs["munka_id"] === "string" ? v.torzs["munka_id"] : null;
    if (id) router.push(`/poszt?munka=${encodeURIComponent(id)}`);
    else setFut(false);
  }

  const sor = (id: string, nev: string, allapot: string) => (
    <button key={id} type="button" role="radio" aria-checked={id === valasztott} className={id === valasztott ? "r15k-posztsor r15k-posztsor-aktiv" : "r15k-posztsor"} onClick={() => setValasztott(id)}>
      <span>{nev}</span><span className="r15k-posztsor-allapot">{allapot}</span>
    </button>
  );

  return (
    <div className="r15k-reteg" role="dialog" aria-modal="true" aria-label={t("r15.kep.melyik_poszt")}>
      <div className="r15k-hatter" aria-hidden="true" onClick={onZar} />
      <div className="r15k-lap">
        <span className="r15k-fogo" aria-hidden="true" />
        <div className="r15k-lap-tartalom">
          <KerdesCim cim={t("r15.kep.melyik_poszt")} />
          {lista ? (
            <div className="r15k-posztok" role="radiogroup">
              {lista.varo.map((p) => sor(p.id, p.rovid_nev, t("r15.kep.var_rad")))}
              {lista.kesz.map((p) => sor(p.id, p.rovid_nev, `${t("r15.kep.kesz")} ✓`))}
            </div>
          ) : null}
          <span><HalkLink onClick={() => void ujPoszt()} disabled={fut}>{t("r15.kep.uj_poszt")}</HalkLink></span>
        </div>
        <div className="r15k-lap-lab">
          <FoGomb onClick={() => void hozzatesz()} disabled={!valasztott || fut}>{t("r15.kep.hozzateszem")}</FoGomb>
        </div>
      </div>
    </div>
  );
}
