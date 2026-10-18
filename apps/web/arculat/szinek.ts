import "server-only";
// R-16 K4 (TERV §2-K4, gepezet 6 · 6b) — a 12d „Színek — javaslatok” és a 12d2 „Más színt” adata.
// A mostani színek ugyanonnan jönnek, mint a 12a–12c soraié (`arculatNezet`: jóváhagyott pillanatkép ?? tervezet ?? alapszett),
// a javaslatok sorrendje az arculat-core tiszta `szinJavaslatok`-ja. A logó színei a képeken használt logók tárolt elemzéséből
// (`arculat_fajl.elemzes.szinek`, K1). A K1 ELŐTT feltöltött logónak nincs elemzése — ezeknek az azonosítóját a lap megkapja
// (`elemzesNelkul`), és a böngésző ugyanazzal a tiszta függvénnyel (canvas → `logoElemzes`) megnézi; a kiszolgálón nincs canvas,
// és a régi sort nem írjuk át (TERV 1.7 R5: csak beszúrás). A profilt a `profil/tar`-ból olvassuk, nem a `profil` bejáratából (TERV §3).
import type { SzervezetProfil } from "@rogton/contracts";
import { kepreAlkalmasLogo, LOGO_VALTOZATOK, type FajlMeta } from "@rogton/fajl-core";
import { GYURU, LogoElemzes, logoSzinSor, szinJavaslatok, type JavaslatBemenet, type SzinHarmas, type SzinJavaslat } from "@rogton/arculat-core";
import { profilTar } from "../profil/tar";
import { fajlTar } from "../fajl/tar";
import { arculatNezet, jovahagyottKep, type Szerep } from "./allapot";
import { alapTervezet, szakmaSzoveg } from "./alap";

export type SzinekAdat = {
  szerkesztheto: boolean;
  /** a munkatér mostani három színe (a 12d2 innen indul) */
  jelenlegi: SzinHarmas;
  /** a 12d négy kártyája, az első a mostani (✓) */
  javaslatok: SzinJavaslat[];
  /** a javaslatok bemenete — a böngésző ezzel számol újra, ha egy régi logó színeit maga nézte meg */
  bemenet: JavaslatBemenet;
  /** a 12d2 „A logódból:” sora (≤ 5) */
  logoSzinek: string[];
  /** a képeken használt, elemzés nélküli (K1 előtti) logók azonosítója — a böngésző elemzi */
  elemzesNelkul: string[];
  /** a rögzített 12 színű gyűrű */
  gyuru: readonly string[];
};

export type SzinBemenet = {
  profil: Pick<SzervezetProfil, "nev" | "osszefoglalo" | "arculat" | "nyelvek">;
  fajlok: readonly FajlMeta[] | null;
  szerep: Szerep;
};

/** Tiszta: a profil + a fájlok → a két lap adata. */
export function szinNezet({ profil, fajlok, szerep }: SzinBemenet): SzinekAdat {
  const n = arculatNezet({ profil, fajlok, szerep, jovahagyoNev: "" });
  const jelenlegi: SzinHarmas = { fo: n.szinek.fo.toLowerCase(), masodik: n.szinek.masodik.toLowerCase(), hatter: n.szinek.hatter.toLowerCase() };
  const a = profil.arculat;
  const forrasTervezet = jovahagyottKep(a) ?? a.tervezet ?? alapTervezet(profil.nev, profil.osszefoglalo, profil.nyelvek?.[0]);
  // a képeken használt logók (helyenként, a 12c sorrendjében) — az ő tárolt színeik; akinek nincs elemzése, a böngészőre marad
  const logoFajlok = LOGO_VALTOZATOK.map((h) => n.logok[h]).filter((id): id is string => id !== null)
    .map((id) => (fajlok ?? []).find((f) => f.id === id)).filter((f): f is FajlMeta => f !== undefined);
  const tarolt: string[] = [];
  const elemzesNelkul: string[] = [];
  for (const f of logoFajlok) {
    const e = LogoElemzes.safeParse(f.elemzes);
    if (e.success) tarolt.push(...e.data.szinek);
    else if (kepreAlkalmasLogo(f) && !elemzesNelkul.includes(f.id)) elemzesNelkul.push(f.id);
  }
  const logoSzinek = logoSzinSor(tarolt);
  const bemenet: JavaslatBemenet = {
    jelenlegi,
    szinForras: forrasTervezet.szin_forras,
    szinSzett: forrasTervezet.szin_szett,
    vanLogo: n.vanLogo,
    logoSzinek,
    honlapSzinek: forrasTervezet.szin_jeloltek,
    szakma: szakmaSzoveg(profil.nev, profil.osszefoglalo),
  };
  return { szerkesztheto: n.szerkesztheto, jelenlegi, javaslatok: szinJavaslatok(bemenet), bemenet, logoSzinek, elemzesNelkul, gyuru: GYURU };
}

/** A két lap adata a munkatérhez; null, ha még nincs jóváhagyott profil (akkor az onboarding jön). */
export async function szinAdat(szervezetId: string, szerep: Szerep): Promise<SzinekAdat | null> {
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return null;
  const fajlok = await fajlTar.lista(szervezetId, "logo").catch(() => null); // olvashatatlan lista: a logók a pillanatkép tartalékából, színek nélkül
  return szinNezet({ profil, fajlok, szerep });
}
