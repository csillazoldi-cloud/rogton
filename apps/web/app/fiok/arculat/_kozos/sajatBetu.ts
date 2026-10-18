"use client";
// R-16 K5 (TERV 1.5, §2-K5) — a munkatér saját betűje a felületen: a „Saját: <név>” sor (12e) és a 12c „Betűk” sora a nevet a SAJÁT
// betűjével írja. A fájl a GET /api/arculat/fajl/<id>-ről jön (a munkatér tagjának), a böngésző FontFace API-jával töltjük be.
// A családnév „KMS <id>”: nem ütközhet a felület és a képgyártó betűivel. Amíg tölt (vagy ha nem tölthető), a felület betűje áll ott.
import { useEffect, useState } from "react";

const betoltott = new Map<string, Promise<boolean>>();

export function sajatCsalad(id: string): string {
  return `KMS ${id}`;
}

/** A saját betű betöltése egyszer oldalanként; a visszaadott `font-family` érték csak akkor, ha a betű már betöltött. */
export function useSajatBetu(id: string | null | undefined): string | undefined {
  const [kesz, setKesz] = useState(false);
  useEffect(() => {
    if (!id || typeof FontFace === "undefined") return;
    let el = true;
    let p = betoltott.get(id);
    if (!p) {
      const ff = new FontFace(sajatCsalad(id), `url(/api/arculat/fajl/${id})`);
      p = ff.load().then((f) => { document.fonts.add(f); return true; }).catch(() => false);
      betoltott.set(id, p);
    }
    void p.then((ok) => { if (el) setKesz(ok); });
    return () => { el = false; };
  }, [id]);
  return id && kesz ? `'${sajatCsalad(id)}', 'KB Public Sans', sans-serif` : undefined;
}
