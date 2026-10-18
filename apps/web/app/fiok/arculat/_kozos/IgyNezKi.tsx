"use client";
// R-16 · „Így néz ki egy képed:” — két kész kép a munkatér arculatával: a világos és a színes változat (a rajz 12a–12g jobb oszlopa).
// K1: a mentett arculat képei (GET /api/vizual/helyzet-minta/<helyzet>?valtozat=…).
// K3 (TERV §2-K3): POST-mód — `valasztas` megadásával a kép a még NEM mentett választással készül (POST ugyanarra az útra, törzs:
// vizual/minta.ts MintaKeres). Képenként legfeljebb EGY kérés fut; ha közben új választás jön, a legutolsó indul, amint a futó
// visszaért (a köztes választások elmaradnak — a képgyártó egyszerre egy képet rajzol, TERV §4 23.). Lebontáskor AbortController.
// „Másik minta” = a következő helyzet (kesz → akcio → uj → hir → tudtad → esemeny → szam). Telefonon csak a két kép látszik (a rajz szerint).
import { useEffect, useRef, useState } from "react";
import type { MintaKeres } from "../../../../vizual/minta";
import { useFeliratok } from "../../../../nyelv/kliens";
import { HalkLink, Info } from "../../../_kozos/R15";

export const MINTA_HELYZETEK = ["kesz", "akcio", "uj", "hir", "tudtad", "esemeny", "szam"] as const;
type Valtozat = "vilagos" | "szines";
/** A POST-mód választása: a törzs a változat nélkül (azt a kép maga adja). */
export type MintaValasztas = Omit<MintaKeres, "valtozat">;

/** `frissites`: ha nő (pl. új logó ment fel), a képek újratöltődnek. `valasztas`: POST-mód (null/hiány: a mentett arculat, GET).
 *  `meret="szakasz"`: a 12a–12c telefonos mérete (150 + 104 px), különben a 12f-é. */
export function IgyNezKi({ frissites = 0, valasztas = null, meret }: { frissites?: number; valasztas?: MintaValasztas | null; meret?: "szakasz" }) {
  const { t } = useFeliratok();
  const [i, setI] = useState(0);
  const helyzet = MINTA_HELYZETEK[i % MINTA_HELYZETEK.length]!;
  return (
    <div className={`r16a-igy${meret === "szakasz" ? " r16a-igy-szakasz" : ""}`}>
      <Info osztaly="r15-csak-asztal">{t("r16.arculat.igy_nez_ki")}</Info>
      <div className="r16a-igy-kepek">
        <MintaKep helyzet={helyzet} valtozat="vilagos" frissites={frissites} valasztas={valasztas} osztaly="r16a-igy-nagy" />
        <MintaKep helyzet={helyzet} valtozat="szines" frissites={frissites} valasztas={valasztas} osztaly="r16a-igy-kicsi" />
      </div>
      <span className="r15-csak-asztal">
        <HalkLink onClick={() => setI((x) => x + 1)}>{t("r16.arculat.masik_minta")}</HalkLink>
      </span>
    </div>
  );
}

export type KepProps = { helyzet: string; valtozat: Valtozat; frissites: number; valasztas: MintaValasztas | null; osztaly: string };

/** Egy mintakép; amíg tölt (vagy ha a képgyártó nem felel), a helye üres, halvány felület — szöveg nélkül (T3). */
function MintaKep(p: KepProps) {
  return p.valasztas ? <PostKep {...p} valasztas={p.valasztas} /> : <GetKep {...p} />;
}

function GetKep({ helyzet, valtozat, frissites, osztaly }: KepProps) {
  const src = `/api/vizual/helyzet-minta/${helyzet}?valtozat=${valtozat}&v=${frissites}`;
  const [kesz, setKesz] = useState<string | null>(null);
  const kep = useRef<HTMLImageElement>(null);
  // K3 (mérve helyben, 2026-09-30): ha a képgyártó a képet már tárolta, a kép a hidratálás ELŐTT betölt — az onLoad akkor nem fut le,
  // és a kép örökre rejtve maradna. Ezért felcsatoláskor (és új src-nél) megnézzük, kész-e már.
  useEffect(() => {
    const el = kep.current;
    if (el && el.complete && el.naturalWidth > 0) setKesz(src);
  }, [src]);
  return (
    <div className={`r16a-igy-kep ${osztaly}`} data-r15="eredmeny">
      <img ref={kep} key={src} src={src} alt="" onLoad={() => setKesz(src)} onError={() => setKesz(null)} style={kesz === src ? undefined : { visibility: "hidden" }} />
    </div>
  );
}

/** POST-mód, összevont kérésekkel: egy fut; a várakozó mindig a legújabb; a régi objektum-URL felszabadul.
 *  R-16 K4: exportálva — a 12d négy kártyája ugyanezzel a géppel kér képet (egy kártya = egy kép, `valtozat: "szines"`). */
export function PostKep({ helyzet, valtozat, frissites, valasztas, osztaly }: KepProps & { valasztas: MintaValasztas }) {
  const [url, setUrl] = useState<string | null>(null);
  const fut = useRef(false);
  const var_ = useRef<{ ut: string; torzs: string } | null>(null);
  const vezerlo = useRef<AbortController | null>(null);
  const el = useRef(true);
  const torzs = JSON.stringify({ ...valasztas, valtozat });
  const ut = `/api/vizual/helyzet-minta/${helyzet}`;

  useEffect(() => {
    el.current = true;
    return () => {
      el.current = false;
      vezerlo.current?.abort();
      setUrl((regi) => { if (regi) URL.revokeObjectURL(regi); return null; });
    };
  }, []);

  useEffect(() => {
    const indit = (k: { ut: string; torzs: string }) => {
      fut.current = true;
      const v = new AbortController();
      vezerlo.current = v;
      void (async () => {
        try {
          const r = await fetch(k.ut, { method: "POST", body: k.torzs, headers: { "content-type": "application/json" }, credentials: "same-origin", signal: v.signal });
          if (r.ok && r.headers.get("content-type")?.startsWith("image/")) {
            const uj = URL.createObjectURL(await r.blob());
            if (el.current) setUrl((regi) => { if (regi) URL.revokeObjectURL(regi); return uj; });
            else URL.revokeObjectURL(uj);
          }
        } catch {
          /* megszakítva vagy a képgyártó nem felel: a régi kép marad (T3: gépezetet nem mutatunk) */
        } finally {
          fut.current = false;
          const kov = var_.current;
          var_.current = null;
          if (kov && el.current) indit(kov);
        }
      })();
    };
    const k = { ut, torzs };
    if (fut.current) var_.current = k; // a futó visszaérkezése után ez indul (a köztesek elmaradnak)
    else indit(k);
  }, [ut, torzs, frissites]);

  return (
    <div className={`r16a-igy-kep ${osztaly}`} data-r15="eredmeny">
      {url ? <img src={url} alt="" /> : null}
    </div>
  );
}
