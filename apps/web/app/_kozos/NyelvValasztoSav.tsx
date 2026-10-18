"use client";
// R-17 D1 (17-ny1; Kati 10-02 „a nyitólap nyelve”): az első látogatáskor, HA a nyelv nem dönthető el (nincs választott nyelv, és a böngésző
// nyelve nem magyar, román vagy angol), a fejléc alatt egy háromnyelvű sáv: „Nyelv · Limba · Language” és a három gomb, mindegyik a saját
// nyelvén. Egy koppintás → POST /api/nyelv (a km_nyelv süti egy évre) → a lap az új nyelven frissül; a sáv ezután nem jön elő.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { VAN_NYELVVALASZTAS } from "@rogton/design-system";
import { apiHivas } from "./hibaszoveg";

export function NyelvValasztoSav({ cimek, gombok }: { cimek: string[]; gombok: { nyelv: string; nev: string }[] }) {
  const router = useRouter();
  const [fut, setFut] = useState(false);
  if (!VAN_NYELVVALASZTAS) return null; // G3 (Rögtön): csak magyar felület — nincs mit választani
  async function valaszt(nyelv: string) {
    setFut(true);
    await apiHivas("/api/nyelv", { nyelv });
    router.refresh();
    setFut(false);
  }
  return (
    <div className="km-ny-nyelvsav" role="region" aria-label={cimek.join(" · ")}>
      <div className="km-ny-kozep km-ny-nyelvsav-belso">
        <span className="km-ny-nyelvsav-cim">
          {cimek.map((c, i) => <span key={c + i}>{i > 0 ? <span className="km-ny-nyelvsav-pont" aria-hidden="true"> · </span> : null}{c}</span>)}
        </span>
        <span className="km-ny-nyelvsav-gombok">
          {gombok.map((g) => (
            <button key={g.nyelv} type="button" lang={g.nyelv} className="km-ny-nyelvsav-gomb" onClick={() => void valaszt(g.nyelv)} disabled={fut}>{g.nev}</button>
          ))}
        </span>
      </div>
    </div>
  );
}
