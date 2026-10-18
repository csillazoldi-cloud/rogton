import { describe, expect, it } from "vitest";
import {
  memoriaTar,
  forrasHozzaad,
  forrasCimModosit,
  forrasTorol,
  type Kornyezet,
  type HostKontextus,
  type Letolto,
  type AiHivo,
  type Forras,
} from "../src/index";

const SZERVEZET_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const TULAJDONOS_ID = "11111111-2222-3333-4444-555555555555";
const NEZO_ID = "66666666-7777-8888-9999-000000000000";

const MOST = new Date("2026-09-13T10:00:00Z");

function tulajdonosKtx(): HostKontextus {
  return { fiok_id: TULAJDONOS_ID, szervezet_id: SZERVEZET_ID, szerep: "tulajdonos" };
}

function nezoKtx(): HostKontextus {
  return { fiok_id: NEZO_ID, szervezet_id: SZERVEZET_ID, szerep: "nezo" };
}

let idSzamlalo = 0;
function ujId(): string {
  idSzamlalo++;
  return `id-${idSzamlalo.toString().padStart(4, "0")}`;
}

const nemHivottLetolto: Letolto = async () => {
  throw new Error("letolto nem hivhato ebben a probaban");
};

const nemHivottAi: AiHivo = async () => {
  throw new Error("ai nem hivhato ebben a probaban");
};

function keszKornyezet(): Kornyezet {
  return {
    tar: memoriaTar(),
    letolto: nemHivottLetolto,
    ai: nemHivottAi,
    profil: null,
    idAdo: ujId,
    most: () => new Date(MOST.getTime()),
  };
}

async function forrasLetrehoz(k: Kornyezet, ktx: HostKontextus, cim: string): Promise<Forras> {
  const r = await forrasHozzaad(k, ktx, cim, "kezi");
  if (!r.ok) throw new Error("a forras letrehozasa nem sikerult");
  return r.forras;
}

describe("forrasTorol", () => {
  it("(1) törlés után a forrasok() nem adja vissza", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const f = await forrasLetrehoz(k, ktx, "https://pelda.hu/feed.xml");

    const torles = await forrasTorol(k, ktx, f.id);
    expect(torles.ok).toBe(true);
    if (torles.ok) expect(torles.forras.id).toBe(f.id);

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    expect(forrasok.find((x) => x.id === f.id)).toBeUndefined();
    expect(forrasok.length).toBe(0);
  });

  it("(2) ismeretlen id → ERVENYTELEN_ADAT / nincs_forras", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const eredmeny = await forrasTorol(k, ktx, "nem-letezo-id");
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hiba).toBe("ERVENYTELEN_ADAT");
      expect(eredmeny.reszlet).toBe("nincs_forras");
    }
  });

  it("(3) néző szerep → NINCS_JOG és a tár változatlan", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const f = await forrasLetrehoz(k, ktx, "https://pelda.hu/feed.xml");

    const eredmeny = await forrasTorol(k, nezoKtx(), f.id);
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hiba).toBe("NINCS_JOG");

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    expect(forrasok.length).toBe(1);
    expect(forrasok[0]!.id).toBe(f.id);
  });
});

describe("forrasCimModosit", () => {
  it("(4) érvényes RSS-címre módosítás → ellenorzott false, utolso_sikeres null, id és eredet változatlan, allapot ellenorzes_alatt", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const f = await forrasLetrehoz(k, ktx, "https://pelda.hu/oldal");

    const eredmeny = await forrasCimModosit(k, ktx, f.id, "https://pelda.hu/feed.xml");
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    expect(eredmeny.forras.id).toBe(f.id);
    expect(eredmeny.forras.eredet).toBe(f.eredet);
    expect(eredmeny.forras.ellenorzott).toBe(false);
    expect(eredmeny.forras.utolso_sikeres).toBeNull();
    expect(eredmeny.forras.allapot).toBe("ellenorzes_alatt");
    expect(eredmeny.forras.tipus).toBe("rss");

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    const mentett = forrasok.find((x) => x.id === f.id);
    expect(mentett).toBeDefined();
    expect(mentett!.cim).toBe("https://pelda.hu/feed.xml");
  });

  it("(5) érvénytelen cím → ERVENYTELEN_ADAT / ervenytelen és a forrás változatlan a tárban", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const f = await forrasLetrehoz(k, ktx, "https://pelda.hu/feed.xml");

    const eredmeny = await forrasCimModosit(k, ktx, f.id, "valami amit beirt");
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hiba).toBe("ERVENYTELEN_ADAT");
      expect(eredmeny.reszlet).toBe("ervenytelen");
    }

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    const mentett = forrasok.find((x) => x.id === f.id);
    expect(mentett).toBeDefined();
    expect(mentett!.cim).toBe("https://pelda.hu/feed.xml");
    expect(mentett!.allapot).toBe(f.allapot);
  });

  it("(6) facebook-cím → nem_tamogatott állapot, a forrás megmarad", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const f = await forrasLetrehoz(k, ktx, "https://pelda.hu/feed.xml");

    const eredmeny = await forrasCimModosit(k, ktx, f.id, "https://facebook.com/oldal");
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    expect(eredmeny.forras.allapot).toBe("nem_tamogatott");
    expect(eredmeny.forras.id).toBe(f.id);

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    const mentett = forrasok.find((x) => x.id === f.id);
    expect(mentett).toBeDefined();
    expect(mentett!.allapot).toBe("nem_tamogatott");
  });
});
