"use client";
// R-9: a Visszajelzés modul helye a lapon. G8: a VISSZAJELZES_GOMB kapcsoló (VisszajelzesKapcsolo.tsx) dönt —
// kikapcsolva semmi sem kerül a lapra, és a modul kódja (a képernyőkép-készítővel együtt) be sem töltődik.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useVisszajelzesGomb } from "./VisszajelzesKapcsolo";

export { VISSZAJELZES_INDIT } from "./visszajelzes-esemeny";

const ModulHely = dynamic(() => import("./VisszajelzesModulHely"), { ssr: false });

export function Visszajelzes() {
  const be = useVisszajelzesGomb();
  // V5 (Csilla 14.): a modul a <body> végére kerül, nem a fejlécbe — a fejléc saját rétege (z-index 50)
  // a Hírek felugrója (55) ALÁ szorította a gombot, ezért a kattintás a felugró hátterét találta el és bezárta.
  const [kesz, setKesz] = useState(false);
  useEffect(() => setKesz(true), []);
  if (!be || !kesz) return null;
  return <ModulHely />;
}
