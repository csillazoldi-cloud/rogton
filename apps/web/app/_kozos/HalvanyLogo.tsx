"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// R-18 (IRANYOK.md „Faded aitmetica logo”): a halvány „aitmetica” felirat minden lap alján. Díszítés: aria-hidden, nem kattintható.
// Sötét módban a szürke, világosban a tinta változat (13 % / 14 %).
// R-18 7. kör (koordinátor 10-12, kor7-video-sotet-390: a felirat a forgatókönyv sorára rajzolódott): a felirat SOHA nem fed tartalmat —
// a lap végére kerül (a body végére, a tartalom után, a lap folyásában), mint a Visszajelzés gomb (r18.css §12). Telefonon az alsó
// gombsávos keretben a Visszajelzés sávjában áll (a tartalom ott a sáv fölött véget ér), a gombtól balra.
export function HalvanyLogo() {
  const [kesz, setKesz] = useState(false);
  useEffect(() => setKesz(true), []);
  if (!kesz) return null;
  return createPortal(
    <div className="r18-halvany-logo" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- díszkép a public/r18 mappából */}
      <img className="r18-hl-sotet" src="/r18/aitmetica-szurke.png" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="r18-hl-vilagos" src="/r18/aitmetica-tinta.png" alt="" />
    </div>,
    document.getElementById("km-lap-vege") ?? document.body, // a lap vége (layout.tsx), a tartalom után — kliensoldali lapváltás után is
  );
}
