// Memóriabeli tár és környezet a próbákhoz — adatbázis nélkül.
import type {
  Azonosito,
  HozzaferesEsemeny,
  Kornyezet,
  Meghivo,
  MeghivoTar,
  Ora,
  Szerep,
  Tag,
  TagsagTar,
} from "../src/index";

export type MemoriaKornyezet = Kornyezet & {
  esemenyek: HozzaferesEsemeny[];
  tagokTar: Map<string, Tag[]>;
  meghivokTar: Map<string, Meghivo>;
  oraBeallit(iso: string): void;
};

export function memoriaKornyezet(most: string): MemoriaKornyezet {
  let aktualisIdo = most;
  let sorszam = 0;
  let jegySorszam = 0;

  const tagokTar = new Map<string, Tag[]>();
  const meghivokTar = new Map<string, Meghivo>();
  const esemenyek: HozzaferesEsemeny[] = [];

  const ora: Ora = {
    most: () => aktualisIdo,
  };

  const azonosito: Azonosito = {
    uj: () => {
      sorszam += 1;
      return `id-${sorszam}`;
    },
    jegy: () => {
      jegySorszam += 1;
      return `jegy-${jegySorszam}`;
    },
    lenyomat: (j) => `ln:${j}`,
  };

  const tagsag: TagsagTar = {
    async tagok(szervezet_id) {
      return tagokTar.get(szervezet_id) ?? [];
    },
    async felvesz(szervezet_id, fiok_id, szerep, mikor) {
      const lista = tagokTar.get(szervezet_id) ?? [];
      lista.push({ fiok_id, szerep, csatlakozott: mikor });
      tagokTar.set(szervezet_id, lista);
    },
    async szerepAllit(szervezet_id, fiok_id, szerep) {
      const lista = tagokTar.get(szervezet_id) ?? [];
      const t = lista.find((x) => x.fiok_id === fiok_id);
      if (t) t.szerep = szerep;
      tagokTar.set(szervezet_id, lista);
    },
    async eltavolit(szervezet_id, fiok_id) {
      const lista = tagokTar.get(szervezet_id) ?? [];
      tagokTar.set(
        szervezet_id,
        lista.filter((x) => x.fiok_id !== fiok_id),
      );
    },
  };

  const meghivo: MeghivoTar = {
    async ment(m) {
      meghivokTar.set(m.id, m);
    },
    async frissit(m) {
      meghivokTar.set(m.id, m);
    },
    async azonositoSzerint(szervezet_id, id) {
      const m = meghivokTar.get(id);
      if (!m) return null;
      if (m.szervezet_id !== szervezet_id) return null;
      return m;
    },
    async lenyomatSzerint(lenyomat) {
      for (const m of meghivokTar.values()) {
        if (m.lenyomat === lenyomat) return m;
      }
      return null;
    },
    async lista(szervezet_id) {
      return [...meghivokTar.values()].filter(
        (m) => m.szervezet_id === szervezet_id,
      );
    },
  };

  const esemeny = (e: HozzaferesEsemeny) => {
    esemenyek.push(e);
  };

  return {
    tagsag,
    meghivo,
    ora,
    azonosito,
    esemeny,
    esemenyek,
    tagokTar,
    meghivokTar,
    oraBeallit(iso: string) {
      aktualisIdo = iso;
    },
  };
}

export function tagBeir(
  k: MemoriaKornyezet,
  szervezet_id: string,
  fiok_id: string,
  szerep: Szerep,
  csatlakozott = "2026-01-01T00:00:00.000Z",
): void {
  const lista = k.tagokTar.get(szervezet_id) ?? [];
  lista.push({ fiok_id, szerep, csatlakozott });
  k.tagokTar.set(szervezet_id, lista);
}
