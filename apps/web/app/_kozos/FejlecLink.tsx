"use client";
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";

/** Fejléc-link: „Van már fiókod? Belépés" alakú — a két szöveg kulcsa a feliratokból. */
export function FejlecLink({ href, szovegKulcs, linkKulcs }: { href: string; szovegKulcs: string; linkKulcs: string }) {
  const { t } = useFeliratok();
  return (
    <Link className="km-fejlec-link" href={href}>
      {t(szovegKulcs)} <span>{t(linkKulcs)}</span>
    </Link>
  );
}
