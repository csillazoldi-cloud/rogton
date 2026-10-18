// A bejárat: feljegyzés, napló, értesítés-lekérdezés és -mentés.
import {
  EsemenyFajta,
  ErtesitesBeallitasSema,
  type Csatorna,
  type Esemeny,
  type EsemenyHibaKod,
  type ErtesitesBeallitas,
  type HostKontextus,
  type Kornyezet,
  type Sulyossag,
} from "./host";
import { ALAP_SULYOSSAG, hatasosErtesites, kimenoUzenet } from "./szabalyok";

export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: EsemenyHibaKod };

export async function feljegyez(
  k: Kornyezet,
  e: {
    szervezet_id: string | null;
    fajta: EsemenyFajta;
    fiok_id?: string | null;
    adat?: Esemeny["adat"];
    sulyossag?: Sulyossag;
  },
): Promise<Eredmeny<{ esemeny: Esemeny; kikuldve: boolean; kuldesHiba: string | null }>> {
  const fajtaEllenorzes = EsemenyFajta.safeParse(e.fajta);
  if (!fajtaEllenorzes.success) {
    return { ok: false, hiba: "ISMERETLEN_FAJTA" };
  }
  const fajta = fajtaEllenorzes.data;

  const esemeny: Esemeny = {
    id: k.azonosito.uj(),
    szervezet_id: e.szervezet_id,
    fajta,
    sulyossag: e.sulyossag ?? ALAP_SULYOSSAG[fajta],
    fiok_id: e.fiok_id ?? null,
    ido: k.ora.most(),
    adat: e.adat ?? {},
  };

  await k.tar.ir(esemeny);

  const kozos = await k.ertesites.kozos();
  const szervezeti = e.szervezet_id !== null ? await k.ertesites.szervezeti(e.szervezet_id) : {};
  const hatasos = hatasosErtesites(kozos, szervezeti);

  if (hatasos[fajta] !== "kimeno") {
    return { ok: true, ertek: { esemeny, kikuldve: false, kuldesHiba: null } };
  }

  const uzenet = kimenoUzenet(esemeny, k.felirat);
  try {
    const valasz = await k.csatorna.kuld(uzenet);
    if (valasz.ok) {
      return { ok: true, ertek: { esemeny, kikuldve: true, kuldesHiba: null } };
    }
    return { ok: true, ertek: { esemeny, kikuldve: false, kuldesHiba: valasz.hiba } };
  } catch (hiba) {
    const szoveg = hiba instanceof Error ? hiba.message : String(hiba);
    return { ok: true, ertek: { esemeny, kikuldve: false, kuldesHiba: szoveg } };
  }
}

export async function naplo(
  k: Kornyezet,
  ktx: HostKontextus,
  szuro?: { fajta?: EsemenyFajta; limit?: number },
): Promise<Eredmeny<Esemeny[]>> {
  const lista = await k.tar.lista(ktx.szervezet_id, szuro);
  return { ok: true, ertek: lista };
}

export async function ertesitesLekerdez(
  k: Kornyezet,
  ktx: HostKontextus,
): Promise<Eredmeny<{ kozos: ErtesitesBeallitas; szervezeti: ErtesitesBeallitas; hatasos: Record<EsemenyFajta, Csatorna> }>> {
  const kozos = await k.ertesites.kozos();
  const szervezeti = await k.ertesites.szervezeti(ktx.szervezet_id);
  const hatasos = hatasosErtesites(kozos, szervezeti);
  return { ok: true, ertek: { kozos, szervezeti, hatasos } };
}

export async function ertesitesSzervezetiMent(
  k: Kornyezet,
  ktx: HostKontextus,
  b: unknown,
): Promise<Eredmeny<ErtesitesBeallitas>> {
  if (ktx.szerep !== "tulajdonos") {
    return { ok: false, hiba: "NINCS_JOG" };
  }
  const ellenorzes = ErtesitesBeallitasSema.safeParse(b);
  if (!ellenorzes.success) {
    return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  }
  const beallitas = ellenorzes.data as ErtesitesBeallitas;
  await k.ertesites.szervezetiMent(ktx.szervezet_id, beallitas);
  return { ok: true, ertek: beallitas };
}

export async function ertesitesKozosMent(
  k: Kornyezet,
  b: unknown,
): Promise<Eredmeny<ErtesitesBeallitas>> {
  const ellenorzes = ErtesitesBeallitasSema.safeParse(b);
  if (!ellenorzes.success) {
    return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  }
  const beallitas = ellenorzes.data as ErtesitesBeallitas;
  await k.ertesites.kozosMent(beallitas);
  return { ok: true, ertek: beallitas };
}
