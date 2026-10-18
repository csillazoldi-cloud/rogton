import "server-only";
import { NYELV_SUTI, type Nyelv } from "@rogton/design-system";
import { profilBetolt } from "../profil";

/**
 * V1: a fiók hatásos felületi nyelve — a fiók saját választása, ha van; különben a munkatér első
 * tartalomnyelve; különben null.
 *
 * A fiók `nyelv` mezője NULL, ha még nem váltott nyelvet (Saját fiók lap). Ilyenkor a munkatér
 * tartalomnyelvének első eleme (a fő nyelv) az irányadó — a profil `nyelvek` mezőjéből.
 */
export async function hatasosNyelv(fiok: { nyelv: string | null }, szervezetId: string | null): Promise<Nyelv | null> {
  if (fiok.nyelv === "hu" || fiok.nyelv === "ro" || fiok.nyelv === "en") {
    return fiok.nyelv;
  }
  if (!szervezetId) return null;
  const profil = await profilBetolt(szervezetId);
  const elso = profil?.nyelvek?.[0];
  if (elso === "hu" || elso === "ro" || elso === "en") {
    return elso;
  }
  return null;
}

/** A nyelv-süti Set-Cookie fejléce (ugyanaz a forma, mint a belépésnél). */
export function nyelvSutiFejlec(nyelv: Nyelv): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${NYELV_SUTI}=${nyelv}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`;
}
