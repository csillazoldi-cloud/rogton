"use client";
// R-15 · 3. szállítmány (gepezet-2 4, kerdesek-2 8): a „Kész munka” kép mintája a 03c és a 04a ajánlatán.
// A kép a Képek „Kész munka” sablonja a munkatér arculatával — ugyanaz a kép, amit a Képek lap kártyája mutat
// (GET /api/vizual/helyzet-minta/kesz). c14 (Csilla döntése 2026-10-08 15:05 — FELÜLÍRJA a 10-01-i „nem stock-fotó” jegyzetet):
// a sablon fotóhelyén valódi példafotó áll (térkő gyepszegéllyel, Magnific 12455263, fizetős licenc, forrásmegjelölés nem kell),
// a képgyártó teszi be (apps/kepgyar/src/minta-foto.ts) — a csíkos helyet a bíráló feltöltő-helynek nézte (Tibor-kapu 10-06 18:36).
// Döntés: docs/decisions/2026-10-08-c14-mintafoto.md. A rajz térkő-mintája ennek a képnek a helyén áll (képtartalom, nem felületszín).
// Ha a képgyártó nem válaszol, a kép helyén üres, semleges lap marad ugyanazzal a leírással — törött kép soha.
import { useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";

export const MUNKA_MINTA_CIM = "/api/vizual/helyzet-minta/kesz";
/** gepezet-2 4 — „Képet készítek a munkámról”: a Képek kitöltője a „Kész munka” helyzettel; ott a fotó feltöltése az első lépés
 *  (Kitolto.tsx: a `kesz` helyzetnél a fotó-blokk áll a kérdések előtt). Mérve 10-01: az út már létezett, új bejegyzés nem kellett. */
export const KESZ_MUNKA_CIM = "/kepek/uj/kesz";

/** `fotoResz` (utókérés 2, gepezet-3 1–2: „a mintakép felirat nélkül”): csak a sablon fotó-helye látszik — a kép a doboz szélességének
 *  másfélszerese, felülre igazítva, így a sablon alsó, apró betűs szövegblokkja (a bíráló: „alig olvasható”, „Elkészült! — mi készült
 *  el?”) a dobozon kívül marad. A képgyártó és a kép változatlan; a vágás a felületé. Élesben ellenőrizendő (a képgyártó helyben nem fut).
 *  Kirakás-zár javítás (10-02, Csilla: jóváhagyva; a bíráló a csíkos képet feltöltő-helynek nézte: „Hová kell fotót tennem?”):
 *  a bal felső sarokban halk „Minta” jel (r15.kozos.minta_jel, 0144) — mint a [MINTA] a gépi szövegekben. Nem gomb, nem feltöltő. */
export function MunkaMinta({ osztaly, fotoResz }: { osztaly: string; fotoResz?: boolean }) {
  const { t } = useFeliratok();
  const [hiba, setHiba] = useState(false);
  const alt = t("r15.kozos.kep_minta_alt");
  const jel = <span className="r15-minta-jel" aria-hidden="true">{t("r15.kozos.minta_jel")}</span>;
  if (hiba) return fotoResz ? <span className={`${osztaly} r15-minta-ures r15-minta-foto`} role="img" aria-label={alt}>{jel}</span> : <span className={`${osztaly} r15-minta-ures`} role="img" aria-label={alt} />;
  if (fotoResz) {
    return (
      <span className={`${osztaly} r15-minta-foto`} role="img" aria-label={alt}>
        <img src={MUNKA_MINTA_CIM} alt="" onError={() => setHiba(true)} />
        {jel}
      </span>
    );
  }
  return <img className={osztaly} src={MUNKA_MINTA_CIM} alt={alt} onError={() => setHiba(true)} />;
}
