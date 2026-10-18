// Próba-segédek: memória-tár, rögzített óra, sorszámozott azonosító, gyűjtő csatorna, egyszerű feliratozó.
import type {
  Csatorna,
  Esemeny,
  EsemenyFajta,
  ErtesitesBeallitas,
  ErtesitesTar,
  EsemenyTar,
  Feliratozo,
  KimenoCsatorna,
  KimenoUzenet,
  Kornyezet,
  Ora,
  Azonosito,
} from "../src/index";

export function memoriaTar(): EsemenyTar & { _osszes: Esemeny[] } {
  const osszes: Esemeny[] = [];
  return {
    _osszes: osszes,
    async ir(e: Esemeny) {
      osszes.push(e);
    },
    async lista(szervezet_id: string, szuro?: { fajta?: EsemenyFajta; limit?: number }) {
      let szurt = osszes.filter((e) => e.szervezet_id === szervezet_id);
      if (szuro?.fajta) szurt = szurt.filter((e) => e.fajta === szuro.fajta);
      const limit = szuro?.limit ?? 100;
      return szurt.slice().reverse().slice(0, limit);
    },
    async rendszerLista(szuro?: { limit?: number }) {
      const szurt = osszes.filter((e) => e.szervezet_id === null);
      const limit = szuro?.limit ?? 100;
      return szurt.slice().reverse().slice(0, limit);
    },
  };
}

export function memoriaErtesites(): ErtesitesTar & { _kozos: ErtesitesBeallitas; _szervezeti: Map<string, ErtesitesBeallitas> } {
  const kozos: ErtesitesBeallitas = {};
  const szervezeti = new Map<string, ErtesitesBeallitas>();
  return {
    _kozos: kozos,
    _szervezeti: szervezeti,
    async kozos() {
      return { ...kozos };
    },
    async kozosMent(b: ErtesitesBeallitas) {
      for (const kulcs of Object.keys(kozos) as EsemenyFajta[]) delete kozos[kulcs];
      Object.assign(kozos, b);
    },
    async szervezeti(id: string) {
      return { ...(szervezeti.get(id) ?? {}) };
    },
    async szervezetiMent(id: string, b: ErtesitesBeallitas) {
      szervezeti.set(id, { ...b });
    },
  };
}

export function rogzitettOra(kezdet = "2026-09-12T10:00:00.000Z"): Ora {
  let most = kezdet;
  return {
    most() {
      return most;
    },
  };
}

export function sorszamAzonosito(prefix = "e"): Azonosito {
  let n = 0;
  return {
    uj() {
      n += 1;
      return `${prefix}-${n}`;
    },
  };
}

export function gyujtoCsatorna(): KimenoCsatorna & { _kuldott: KimenoUzenet[]; _hiba: string | null } {
  const kuldott: KimenoUzenet[] = [];
  const allapot = { _kuldott: kuldott, _hiba: null as string | null };
  return {
    get _kuldott() {
      return kuldott;
    },
    get _hiba() {
      return allapot._hiba;
    },
    set _hiba(v: string | null) {
      allapot._hiba = v;
    },
    async kuld(u: KimenoUzenet) {
      if (allapot._hiba !== null) {
        return { ok: false as const, hiba: allapot._hiba };
      }
      kuldott.push(u);
      return { ok: true as const };
    },
  };
}

export function egyszeruFeliratozo(szotar: Record<string, string> = {}): Feliratozo {
  return (kulcs: string, ertekek?: Record<string, string | number>) => {
    const nyers = szotar[kulcs];
    if (nyers === undefined) return kulcs;
    if (!ertekek) return nyers;
    return nyers.replace(/\{(\w+)\}/g, (teljes, nev: string) => {
      const ertek = ertekek[nev];
      return ertek === undefined ? teljes : String(ertek);
    });
  };
}

export function kornyezet(over: Partial<Kornyezet> = {}): Kornyezet {
  return {
    tar: over.tar ?? memoriaTar(),
    ertesites: over.ertesites ?? memoriaErtesites(),
    ora: over.ora ?? rogzitettOra(),
    azonosito: over.azonosito ?? sorszamAzonosito(),
    csatorna: over.csatorna ?? gyujtoCsatorna(),
    felirat: over.felirat ?? egyszeruFeliratozo(),
  };
}

export function ktx(szerep: "tulajdonos" | "szerkeszto" | "nezo" = "tulajdonos"): {
  fiok_id: string;
  szervezet_id: string;
  szerep: "tulajdonos" | "szerkeszto" | "nezo";
} {
  return { fiok_id: "f-1", szervezet_id: "sz-1", szerep };
}

export type { Csatorna };
