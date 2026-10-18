// A tár-interfész és a memóriabeli megvalósítás.
import type { Beallitas, BeallitasVerzio } from "./beallitas";
import type { Forras } from "./forras";
import type { Kivonat } from "./kivonat";
import type { Talalat, Esemeny } from "./talalat";
import type { Visszajelzes, SzabalyJavaslat } from "./visszajelzes";
import type { Minta } from "./minta";
import type { Futas } from "./futas";
import { cikkKulcs } from "./talalat";

export interface HirfigyeloTar {
  verziok(szervezetId: string): Promise<BeallitasVerzio[]>;
  verziokMent(szervezetId: string, verziok: BeallitasVerzio[]): Promise<void>;
  tervezet(szervezetId: string, fiokId: string): Promise<Beallitas | null>;
  tervezetMent(szervezetId: string, fiokId: string, b: Beallitas | null): Promise<void>;
  forrasok(szervezetId: string): Promise<Forras[]>;
  forrasMent(szervezetId: string, f: Forras): Promise<void>;
  forrasTorol(szervezetId: string, forrasId: string): Promise<void>;
  futasok(szervezetId: string): Promise<Futas[]>;
  futasMent(szervezetId: string, f: Futas): Promise<void>;
  kivonatMent(szervezetId: string, k: Kivonat): Promise<"uj" | "letezik">;
  kivonatok(szervezetId: string, ids: string[]): Promise<Kivonat[]>;
  talalatok(szervezetId: string): Promise<Talalat[]>;
  talalatMent(szervezetId: string, t: Talalat): Promise<void>;
  esemenyek(szervezetId: string): Promise<Esemeny[]>;
  esemenyMent(szervezetId: string, e: Esemeny): Promise<void>;
  visszajelzesek(szervezetId: string): Promise<Visszajelzes[]>;
  visszajelzesMent(szervezetId: string, v: Visszajelzes): Promise<void>;
  javaslatok(szervezetId: string): Promise<SzabalyJavaslat[]>;
  javaslatMent(szervezetId: string, j: SzabalyJavaslat): Promise<void>;
  mintak(szervezetId: string): Promise<Minta[]>;
  mintaMent(szervezetId: string, m: Minta): Promise<void>;
  lejartKivonatokTorol(szervezetId: string, most: Date): Promise<number>;
}

/** Memóriabeli tár a próbákhoz és a tesztalkalmazáshoz. */
export function memoriaTar(): HirfigyeloTar {
  const verziokMap = new Map<string, BeallitasVerzio[]>();
  const tervezetMap = new Map<string, Beallitas | null>();
  const forrasMap = new Map<string, Forras[]>();
  const futasMap = new Map<string, Futas[]>();
  const kivonatMap = new Map<string, Map<string, Kivonat>>(); // szervezet -> kulcs -> kivonat
  const talalatMap = new Map<string, Talalat[]>();
  const esemenyMap = new Map<string, Esemeny[]>();
  const visszajelzesMap = new Map<string, Visszajelzes[]>();
  const javaslatMap = new Map<string, SzabalyJavaslat[]>();
  const mintaMap = new Map<string, Minta[]>();

  return {
    async verziok(szervezetId) { return verziokMap.get(szervezetId) ?? []; },
    async verziokMent(szervezetId, verziok) { verziokMap.set(szervezetId, verziok); },
    async tervezet(szervezetId, fiokId) { return tervezetMap.get(`${szervezetId}|${fiokId}`) ?? null; },
    async tervezetMent(szervezetId, fiokId, b) { tervezetMap.set(`${szervezetId}|${fiokId}`, b); },
    async forrasok(szervezetId) { return forrasMap.get(szervezetId) ?? []; },
    async forrasMent(szervezetId, f) {
      const lista = forrasMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === f.id);
      if (idx >= 0) lista[idx] = f; else lista.push(f);
      forrasMap.set(szervezetId, lista);
    },
    async forrasTorol(szervezetId, forrasId) {
      const lista = forrasMap.get(szervezetId);
      if (!lista) return;
      const idx = lista.findIndex((x) => x.id === forrasId);
      if (idx >= 0) lista.splice(idx, 1);
      forrasMap.set(szervezetId, lista);
    },
    async futasok(szervezetId) { return futasMap.get(szervezetId) ?? []; },
    async futasMent(szervezetId, f) {
      const lista = futasMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === f.id);
      if (idx >= 0) lista[idx] = f; else lista.push(f);
      futasMap.set(szervezetId, lista);
    },
    async kivonatMent(szervezetId, k) {
      let szervezet = kivonatMap.get(szervezetId);
      if (!szervezet) { szervezet = new Map(); kivonatMap.set(szervezetId, szervezet); }
      const kulcs = cikkKulcs(szervezetId, k.kanonikus_url);
      if (szervezet.has(kulcs)) return "letezik";
      szervezet.set(kulcs, k);
      return "uj";
    },
    async kivonatok(szervezetId, ids) {
      const szervezet = kivonatMap.get(szervezetId);
      if (!szervezet) return [];
      return [...szervezet.values()].filter((k) => ids.includes(k.id));
    },
    async talalatok(szervezetId) { return talalatMap.get(szervezetId) ?? []; },
    async talalatMent(szervezetId, t) {
      const lista = talalatMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === t.id);
      if (idx >= 0) lista[idx] = t; else lista.push(t);
      talalatMap.set(szervezetId, lista);
    },
    async esemenyek(szervezetId) { return esemenyMap.get(szervezetId) ?? []; },
    async esemenyMent(szervezetId, e) {
      const lista = esemenyMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === e.id);
      if (idx >= 0) lista[idx] = e; else lista.push(e);
      esemenyMap.set(szervezetId, lista);
    },
    async visszajelzesek(szervezetId) { return visszajelzesMap.get(szervezetId) ?? []; },
    async visszajelzesMent(szervezetId, v) {
      const lista = visszajelzesMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === v.id);
      if (idx >= 0) lista[idx] = v; else lista.push(v);
      visszajelzesMap.set(szervezetId, lista);
    },
    async javaslatok(szervezetId) { return javaslatMap.get(szervezetId) ?? []; },
    async javaslatMent(szervezetId, j) {
      const lista = javaslatMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === j.id);
      if (idx >= 0) lista[idx] = j; else lista.push(j);
      javaslatMap.set(szervezetId, lista);
    },
    async mintak(szervezetId) { return mintaMap.get(szervezetId) ?? []; },
    async mintaMent(szervezetId, m) {
      const lista = mintaMap.get(szervezetId) ?? [];
      const idx = lista.findIndex((x) => x.id === m.id);
      if (idx >= 0) lista[idx] = m; else lista.push(m);
      mintaMap.set(szervezetId, lista);
    },
    async lejartKivonatokTorol(szervezetId, most) {
      const szervezet = kivonatMap.get(szervezetId);
      if (!szervezet) return 0;
      let torolve = 0;
      for (const [kulcs, k] of szervezet) {
        if (new Date(k.lejar) <= most) { szervezet.delete(kulcs); torolve++; }
      }
      return torolve;
    },
  };
}
