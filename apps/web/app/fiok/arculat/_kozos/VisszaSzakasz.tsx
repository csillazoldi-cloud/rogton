"use client";
// R-17 A1–A7, B1, B2 (design/R17-visszajelzes/rajz/R17-lapok.dc.html; gepezet A; Kati #13 #14 #15): a Logók, Színek, Más szín, Betűk,
// Névlogó és a logótervezés kérdőív lapján a cím FÖLÖTT halk „‹ Logó, színek, betűk” — vissza a szakaszra (/fiok/arculat).
// A felirat a meglévő r16.arculat.szakasz kulcs. Csak navigáció, mentés nincs.
import Link from "next/link";
import { useFeliratok } from "../../../../nyelv/kliens";

export function VisszaSzakasz() {
  const { t } = useFeliratok();
  return (
    <Link href="/fiok/arculat" className="r17-vissza" data-r15="vissza">
      <span aria-hidden="true">‹</span>
      <span>{t("r16.arculat.szakasz")}</span>
    </Link>
  );
}
