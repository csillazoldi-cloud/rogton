import { describe, expect, it, vi } from "vitest";
import {
  memoriaTar,
  jogosult,
  beallitasMent,
  tervezetMent,
  forrasHozzaad,
  forrasEllenoriz,
  figyelesFuttat,
  ertekelesUjra,
  talalatMegtekint,
  talalatJelol,
  visszajelzesRogzit,
  javaslatKer,
  javaslatKiprobal,
  javaslatDont,
  attekintes,
  osszkep,
  cikkKulcs,
  ujjlenyomat,
  kivonatKeszit,
  esemenybeSorol,
  gyanusPar,
  cimNormalizal,
  kanonikusUrl,
  forrasCimOsztalyoz,
  forrasEllenorzesEredmeny,
  futasAtmenet,
  indithato,
  utolsoSikeres,
  mintaKeszit,
  mintaLejart,
  osszehasonlithato,
  osszehasonlitas,
  aiValaszEllenoriz,
  promptAdatBlokk,
  aktivVerzio,
  ujVerzio,
  visszaallit,
  beallitasEllenoriz,
  beallitasNormalizal,
  beallitasAzonos,
  megtekint,
  jelol,
  szuro,
  javaslatAlkalmazhato,
  javaslatDontes,
  kovetkezoFutas,
  lejartKivonatokTorol,
  type Kornyezet,
  type HostKontextus,
  type Letolto,
  type AiHivo,
  type HirfigyeloEsemeny,
  type Forras,
  type Futas,
  type Talalat,
  type Esemeny,
  type Kivonat,
  type Minta,
  type Visszajelzes,
  type SzabalyJavaslat,
  type Beallitas,
  type BeallitasVerzio,
  type Hiba,
} from "../src/index";

// --- Segédfüggvények és tesztadatok ---

const SZERVEZET_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const TULAJDONOS_ID = "11111111-2222-3333-4444-555555555555";
const NEZO_ID = "66666666-7777-8888-9999-000000000000";

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

let mostDatum = new Date("2026-01-15T10:00:00.000Z");
function most(): Date {
  return new Date(mostDatum.getTime());
}

function mostLep(nap: number): void {
  mostDatum = new Date(mostDatum.getTime() + nap * 24 * 60 * 60 * 1000);
}

// Rögzített cikkek: 4 cikk, 2 ugyanarról más címmel (azonos URL kanonikus alakja)
const JO_CIKKEK = [
  {
    cim: "Minta Műhely új terméke piacra került",
    url: "https://pelda.hu/hir1",
    megjelenes: "2026-01-14T08:00:00.000Z",
    szoveg: "A Minta Műhely bejelentette legújabb termékét. A sajtótájékoztatón elhangzott, hogy a fejlesztés több mint két évig tartott. A termék innovatív megoldásokat kínál a mindennapi életben.",
    nyelv: "hu",
  },
  {
    cim: "Minta Műhely: forradalmi újdonság a piacon",
    url: "https://pelda.hu/hir1-masik-lap", // MÁSIK cikk ugyanarról az eseményről (azonos szöveg → azonos ujjlenyomat → gyanús pár)
    megjelenes: "2026-01-14T09:00:00.000Z",
    szoveg: "A Minta Műhely bejelentette legújabb termékét. A sajtótájékoztatón elhangzott, hogy a fejlesztés több mint két évig tartott. A termék innovatív megoldásokat kínál a mindennapi életben.",
    nyelv: "hu",
  },
  {
    cim: "Versenytársak reagálnak a Minta Műhely lépésére",
    url: "https://pelda.hu/hir2",
    megjelenes: "2026-01-14T10:00:00.000Z",
    szoveg: "A piac más szereplői is megszólaltak a Minta Műhely bejelentését követően. Elemzők szerint ez átrendezheti az iparág erőviszonyait. A versenytársak saját fejlesztéseiket is előrehozhatják.",
    nyelv: "hu",
  },
  {
    cim: "Elemzés: mit hoz a jövő a szektorban?",
    url: "https://pelda.hu/hir3",
    megjelenes: "2026-01-14T11:00:00.000Z",
    szoveg: "Szakértők szerint a Minta Műhely lépése jelzi a szektor átalakulását. A digitalizáció és a fenntarthatóság egyre nagyobb szerepet kap. A következő években várhatóan további hasonló fejlesztések jönnek.",
    nyelv: "hu",
  },
];

/** F9-A7: a 48 órás szűrő miatt a rögzített cikkek megjelenése a próba „mostjához” képest 1–4 órával korábbi (a próbák a mostLep-pel napokat lépnek). */
function frissCikkek(): typeof JO_CIKKEK {
  return JO_CIKKEK.map((c, i) => ({ ...c, megjelenes: new Date(most().getTime() - (i + 1) * 60 * 60 * 1000).toISOString() }));
}

function tesztLetolto(hibasForrasId: string | null = null): Letolto {
  return async (f: Forras) => {
    if (f.id === hibasForrasId) {
      return { ok: false, hibaOk: "Kapcsolódási hiba: timeout" };
    }
    // A jó forrás visszaadja a 4 cikket
    return {
      ok: true,
      tipus: "rss" as const,
      szovegOlvashato: true,
      cikkek: frissCikkek(), // F9-A7: a rögzített cikkek dátuma a próba órájához képest friss (48 órás szűrő)
    };
  };
}

// AI hívó állapot
let aiAllapot = {
  keretKimerult: false,
  hibazik: false,
  hivasSzamlalo: 0,
};

function tesztAiHivo(): AiHivo {
  return async <F extends "hf_relevancia" | "hf_ugyanaz_az_esemeny" | "hf_szabaly_javaslat" | "hf_osszkep" | "hf_beallitas_javaslat" | "hf_tartalomotlet" | "hf_szolista" | "hf_cim_szures">(
    feladat: F,
    bemenet: unknown,
  ) => {
    // v11 előszűrő: a régi próbák üres szólistát és mindent megtartó címszűrést kapnak (nem számítanak a hívásszámlálóba)
    if (feladat === "hf_szolista") return { ok: true, valasz: { hely: null, temak: [], nevek: [] }, becsult_usd: 0 };
    if (feladat === "hf_cim_szures") {
      const { cimek } = bemenet as { cimek: { sorszam: number }[] };
      return { ok: true, valasz: { megtart: cimek.map((c) => c.sorszam) }, becsult_usd: 0 };
    }
    aiAllapot.hivasSzamlalo++;

    if (aiAllapot.keretKimerult) {
      return { ok: false, kod: "AI_KERET_KIMERULT" as const };
    }
    if (aiAllapot.hibazik) {
      return { ok: false, kod: "AI_NEM_ELERHETO" as const };
    }

    if (feladat === "hf_relevancia") {
      // Váltakozva fontos és háttér, hogy legyen változatosság
      const fontossag = aiAllapot.hivasSzamlalo % 2 === 1 ? "fontos" : "hatter";
      return {
        ok: true,
        valasz: {
          fontossag,
          temacimke: "sajat_megjelenes",
          miert: "A cikk közvetlenül említi a Minta Műhelyt.",
          indoklas: "Ez releváns a saját márka figyeléséhez.",
        },
        becsult_usd: 0.01,
      };
    }

    if (feladat === "hf_ugyanaz_az_esemeny") {
      const { a, b } = bemenet as { a: Kivonat; b: Kivonat };
      // Ugyanaz az esemény: azonos ujjlenyomat (a próba két cikke azonos szöveggel, más címmel és más címen)
      const ugyanaz = a.ujjlenyomat === b.ujjlenyomat;
      return {
        ok: true,
        valasz: { ugyanaz, indok: ugyanaz ? "Azonos tartalom." : "Más tartalom." },
        becsult_usd: 0.005,
      };
    }

    if (feladat === "hf_szabaly_javaslat") {
      const { beallitas } = bemenet as { beallitas: Beallitas; visszajelzesek: unknown[] };
      return {
        ok: true,
        valasz: {
          javasolt: {
            ...beallitas,
            temak: [...beallitas.temak, { nev: "Kiegészítő téma", nevvaltozatok: [], megkulonboztetes: "" }],
          },
          indoklas: "A visszajelzések alapján kiegészítő téma javasolt.",
          varhato_hatas: "Pontosabb szűrés.",
          profil_erintett: false,
          mi_alapjan: ["visszajelzes_1"],
        },
        becsult_usd: 0.05,
      };
    }

    if (feladat === "hf_osszkep") {
      const { talalatok } = bemenet as { talalatok: unknown[] };
      return {
        ok: true,
        valasz: {
          szoveg: "Összefoglaló a találatokról.",
          hivatkozott_talalatok: (talalatok as Array<{ id: string }>).map((t) => t.id),
          bizonytalan: false,
        },
        becsult_usd: 0.03,
      };
    }

    // SPEC-KÉRDÉS: a hf_beallitas_javaslat és hf_tartalomotlet nincs részletezve a próbában,
    // a spec 2.9 szerint érvényes válaszokat kell adni — itt minimális implementáció.
    if (feladat === "hf_beallitas_javaslat") {
      const { profil, szabad_szoveg } = bemenet as { profil: unknown; szabad_szoveg: string };
      return {
        ok: true,
        valasz: {
          beallitas: {
            celok: ["sajat_marka"],
            temak: [{ nev: "Generált téma", nevvaltozatok: [], megkulonboztetes: "" }],
            foldrajzi_fokusz: "",
            nyelvek: [],
            kizarasok: [],
            idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
            szabad_szoveg: "",
          },
        },
        becsult_usd: 0.05,
      };
    }

    if (feladat === "hf_tartalomotlet") {
      return {
        ok: true,
        valasz: { szoveg: "Tartalomötlet a találat alapján.", nyelv: "hu" },
        becsult_usd: 0.02,
      };
    }

    // SPEC-KÉRDÉS: a TypeScript nem engedi elérni ide, de a fordító miatt kell
    throw new Error(`Ismeretlen feladat: ${feladat}`);
  };
}

function keszKornyezet(hibasForrasId: string | null = null): Kornyezet {
  return {
    tar: memoriaTar(),
    letolto: tesztLetolto(hibasForrasId),
    ai: tesztAiHivo(),
    profil: { nev: "Minta Műhely" },
    idAdo: ujId,
    most,
    esemeny: undefined,
  };
}

function joBeallitas(): Beallitas {
  return {
    celok: ["sajat_marka"],
    temak: [{ nev: "Minta Műhely", nevvaltozatok: ["MintaMűhely", "Minta Muhely"], megkulonboztetes: "" }],
    foldrajzi_fokusz: "",
    nyelvek: ["hu"],
    kizarasok: [],
    idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
    szabad_szoveg: "",
  };
}

function ervenytelenBeallitas(): unknown {
  return {
    celok: ["sajat_marka"],
    temak: [], // üres — required hiba
    idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
  };
}

// --- Próbák ---

describe("1. beallitasMent", () => {
  it("néző → NINCS_JOG", async () => {
    const k = keszKornyezet();
    const eredmeny = await beallitasMent(k, nezoKtx(), joBeallitas(), "kezi");
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hiba).toBe("NINCS_JOG");
  });

  it("tulajdonos érvénytelen (üres témák) → ERVENYTELEN_ADAT", async () => {
    const k = keszKornyezet();
    const eredmeny = await beallitasMent(k, tulajdonosKtx(), ervenytelenBeallitas(), "kezi");
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hiba).toBe("ERVENYTELEN_ADAT");
  });

  it("jó → verzió 1 aktív", async () => {
    const k = keszKornyezet();
    const eredmeny = await beallitasMent(k, tulajdonosKtx(), joBeallitas(), "keji");
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.uj).not.toBeNull();
      expect(eredmeny.uj!.verzio).toBe(1);
      expect(eredmeny.uj!.allapot).toBe("aktiv");
      expect(eredmeny.verziok.length).toBe(1);
    }
  });

  it("ugyanaz újra → uj: null, továbbra is 1 verzió", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const b = joBeallitas();
    const r1 = await beallitasMent(k, ktx, b, "kezi");
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.uj).not.toBeNull();

    const r2 = await beallitasMent(k, ktx, b, "kezi");
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.uj).toBeNull();
      expect(r2.verziok.length).toBe(1);
    }
  });

  it("módosítva → 2", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const b1 = joBeallitas();
    const r1 = await beallitasMent(k, ktx, b1, "kezi");
    expect(r1.ok).toBe(true);

    const b2 = { ...b1, szabad_szoveg: "módosított" };
    const r2 = await beallitasMent(k, ktx, b2, "kezi");
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.uj).not.toBeNull();
      expect(r2.uj!.verzio).toBe(2);
      expect(r2.verziok.length).toBe(2);
      expect(r2.verziok[0].allapot).toBe("korabbi");
      expect(r2.verziok[1].allapot).toBe("aktiv");
    }
  });
});

describe("2. tervezetMent", () => {
  it("nem hoz létre verziót, tar.tervezet visszaadja", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const b = joBeallitas();

    // Először legyen aktív verzió
    await beallitasMent(k, ktx, b, "kezi");

    const tervezet = { ...b, szabad_szoveg: "tervezet" };
    await tervezetMent(k, ktx, tervezet);

    const eltarolt = await k.tar.tervezet(SZERVEZET_ID, TULAJDONOS_ID);
    expect(eltarolt).toEqual(tervezet);

    const verziok = await k.tar.verziok(SZERVEZET_ID);
    expect(verziok.length).toBe(1); // nem változott
  });
});

describe("3. forrasHozzaad és forrasEllenoriz", () => {
  it("facebook-cím → nem_tamogatott/belepes_mogott, de mentve", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const eredmeny = await forrasHozzaad(k, ktx, "https://facebook.com/oldal", "kezi");
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.forras.allapot).toBe("nem_tamogatott");
      // SPEC-KÉRDÉS: a spec 2.2 szerint a forrasCimOsztalyoz visszaadja az ok-ot,
      // de a Forras séma nem tartalmaz külön mezőt az osztályozás okára.
      // A hiba_ok csak ellenőrzés után töltődik. Itt az allapot ellenőrzése elegendő.
    }

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    expect(forrasok.length).toBe(1);
  });

  it("jó cím → ellenorzes_alatt", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const eredmeny = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.forras.allapot).toBe("ellenorzes_alatt");
    }
  });

  it("forrasEllenoriz jóra → hasznalhato", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const hozzaad = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "keji");
    expect(hozzaad.ok).toBe(true);
    if (!hozzaad.ok) return;

    await forrasEllenoriz(k, ktx, hozzaad.forras.id);

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    const frissitett = forrasok.find((f) => f.id === hozzaad.forras.id);
    expect(frissitett).toBeDefined();
    expect(frissitett!.allapot).toBe("hasznalhato");
    expect(frissitett!.ellenorzott).toBe(true);
  });

  it("forrasEllenoriz hibásra → hibas + hiba_ok", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const hozzaad = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    expect(hozzaad.ok).toBe(true);
    if (!hozzaad.ok) return;

    // Hibás forrás: a letöltő hibát ad vissza ehhez az ID-hoz
    const hibasId = hozzaad.forras.id;
    k.letolto = tesztLetolto(hibasId);

    await forrasEllenoriz(k, ktx, hibasId);

    const forrasok = await k.tar.forrasok(SZERVEZET_ID);
    const frissitett = forrasok.find((f) => f.id === hibasId);
    expect(frissitett).toBeDefined();
    expect(frissitett!.allapot).toBe("hibas");
    expect(frissitett!.hiba_ok).not.toBeNull();
    expect(frissitett!.ellenorzott).toBe(true);
  });
});

describe("4. figyelesFuttat jogosultság és előfeltétel", () => {
  it("beállítás nélkül → NINCS_BEALLITAS", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const eredmeny = await figyelesFuttat(k, ktx, { proba: false });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hiba).toBe("NINCS_BEALLITAS");
  });

  it("néző → NINCS_JOG", async () => {
    const k = keszKornyezet();
    await beallitasMent(k, tulajdonosKtx(), joBeallitas(), "kezi");
    const eredmeny = await figyelesFuttat(k, nezoKtx(), { proba: false });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hiba).toBe("NINCS_JOG");
  });
});

describe("5. figyelesFuttat (proba: true) — első futás", () => {
  it("részleges, 3 új találat (4 cikk, 2 ugyanaz), események, minta", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    // Beállítás és források
    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    // Jó forrás
    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    expect(joForras.ok).toBe(true);
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    // Hibás forrás
    const rosszForras = await forrasHozzaad(k, ktx, "https://rossz.hu/feed.xml", "kezi");
    expect(rosszForras.ok).toBe(true);
    if (!rosszForras.ok) return;
    k.letolto = tesztLetolto(rosszForras.forras.id);
    await forrasEllenoriz(k, ktx, rosszForras.forras.id);

    // Események gyűjtése
    const esemenyek: HirfigyeloEsemeny[] = [];
    k.esemeny = (e) => esemenyek.push(e);

    // Futás
    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const eredmeny = await figyelesFuttat(k, ktx, { proba: true });

    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    const { futas, ujTalalatok, minta } = eredmeny;

    // Futás állapot
    expect(futas.allapot).toBe("reszleges");
    expect(futas.hibas_forrasok.length).toBe(1);
    expect(futas.uj_talalatok).toBe(3); // 3 esemény = 3 új találat-csoport

    // Találatok: 4 cikk, de 2 ugyanaz → 3 esemény, 4 találat
    // SPEC-KÉRDÉS: a spec 2.12 szerint "uj találatok 3 (4 cikk, 2 ugyanarról → 3 esemény…
    // figyelem: a találat CIKKENKÉNT van, az esemény csoport — tehát 4 találat, 3 esemény)"
    const osszesTalalat = await k.tar.talalatok(SZERVEZET_ID);
    expect(osszesTalalat.length).toBe(4);

    // Események száma
    const osszesEsemeny = await k.tar.esemenyek(SZERVEZET_ID);
    expect(osszesEsemeny.length).toBe(3);

    // Minden találat uj
    expect(osszesTalalat.every((t) => t.megtekintes === "uj")).toBe(true);

    // Értékelés állapot
    expect(osszesTalalat.every((t) => t.ertekeles_allapot === "kesz")).toBe(true);

    // Fontosság/háttér a tesztAI szerint (váltakozó)
    const fontosak = osszesTalalat.filter((t) => t.ertekeles?.fontossag === "fontos");
    const hatterek = osszesTalalat.filter((t) => t.ertekeles?.fontossag === "hatter");
    expect(fontosak.length).toBeGreaterThanOrEqual(1);
    expect(hatterek.length).toBeGreaterThanOrEqual(1);

    // Minta
    expect(minta).not.toBeNull();
    expect(minta!.talalat_ids.length).toBe(4);

    // Események megérkeztek
    const indultEsemeny = esemenyek.find((e) => e.fajta === "futas_indult");
    const keszEsemeny = esemenyek.find((e) => e.fajta === "futas_kesz");
    expect(indultEsemeny).toBeDefined();
    expect(keszEsemeny).toBeDefined();
    expect(keszEsemeny!.uj_talalatok).toBe(3);
  });
});

describe("6. A-10: duplikáció és párhuzamos futás", () => {
  it("ugyanaz a futás még egyszer → 0 új találat, 4 találat marad, 3 esemény", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    const rosszForras = await forrasHozzaad(k, ktx, "https://rossz.hu/feed.xml", "kezi");
    if (!rosszForras.ok) return;
    k.letolto = tesztLetolto(rosszForras.forras.id);
    await forrasEllenoriz(k, ktx, rosszForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };

    // Első futás
    const r1 = await figyelesFuttat(k, ktx, { proba: true });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    // Második futás — ugyanazok a cikkek már léteznek
    aiAllapot.hivasSzamlalo = 0;
    const r2 = await figyelesFuttat(k, ktx, { proba: true });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;

    expect(r2.futas.uj_talalatok).toBe(0);
    expect(r2.ujTalalatok.length).toBe(0);

    const osszesTalalat = await k.tar.talalatok(SZERVEZET_ID);
    expect(osszesTalalat.length).toBe(4);

    const osszesEsemeny = await k.tar.esemenyek(SZERVEZET_ID);
    expect(osszesEsemeny.length).toBe(3);
  });

  it("két egyidejű hívás → FUT_MAR", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    // Lassú letöltő, hogy a futás közben tudjunk másikat indítani
    let elsoFutasIndul = false;
    k.letolto = async (f: Forras) => {
      elsoFutasIndul = true;
      // Várunk, hogy a futás "fut" állapotba kerüljön
      await new Promise((r) => setTimeout(r, 50));
      return {
        ok: true,
        tipus: "rss" as const,
        szovegOlvashato: true,
        cikkek: frissCikkek(),
      };
    };

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };

    // Első futás indítása (nem várunk meg)
    const futas1 = figyelesFuttat(k, ktx, { proba: true });

    // Várunk, amíg az első elindul
    while (!elsoFutasIndul) {
      await new Promise((r) => setTimeout(r, 10));
    }

    // Második futás — még fut az első
    const futas2 = await figyelesFuttat(k, ktx, { proba: true });

    expect(futas2.ok).toBe(false);
    if (!futas2.ok) expect(futas2.hiba).toBe("FUT_MAR");

    // Első befejezése
    const r1 = await futas1;
    expect(r1.ok).toBe(true);
  });
});

describe("7. AI-keret és hiba kezelés", () => {
  it("keretKimerult → keret_kimerult állapot, futás lezárul", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: true, hibazik: false, hivasSzamlalo: 0 };

    const esemenyek: HirfigyeloEsemeny[] = [];
    k.esemeny = (e) => esemenyek.push(e);

    const eredmeny = await figyelesFuttat(k, ktx, { proba: true });
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    // A futás lezárult
    expect(["kesz", "reszleges"]).toContain(eredmeny.futas.allapot); // egy jó forrás → kesz; a lényeg: lezárul
    // SPEC-KÉRDÉS: a spec 2.12 szerint "a futás mégis lezárul" — a keret_kimerült esetén
    // az értékelés kihagyva, de a futás végig megy. A futasAtmenet "vege" átmenetét kapja.

    // Találatok keret_kimerult állapotban
    const talalatok = eredmeny.ujTalalatok;
    expect(talalatok.length).toBeGreaterThan(0);
    expect(talalatok.every((t) => t.ertekeles_allapot === "keret_kimerult")).toBe(true);

    // Esemény
    const keretEsemeny = esemenyek.find((e) => e.fajta === "keret_kimerult");
    expect(keretEsemeny).toBeDefined();
  });

  it("AI-hiba → fuggoben + ai_fuggoben futás", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: true, hivasSzamlalo: 0 };

    const eredmeny = await figyelesFuttat(k, ktx, { proba: true });
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    expect(eredmeny.futas.allapot).toBe("ai_fuggoben");

    const talalatok = eredmeny.ujTalalatok;
    expect(talalatok.length).toBeGreaterThan(0);
    expect(talalatok.every((t) => t.ertekeles_allapot === "fuggoben")).toBe(true);
  });

  it("ertekelesUjra (kapcsoló ki) → mind kesz, letöltés nélkül", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    // Első futás AI-hibával
    aiAllapot = { keretKimerult: false, hibazik: true, hivasSzamlalo: 0 };
    const r1 = await figyelesFuttat(k, ktx, { proba: true });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const letoltoHivasokElotte = 0; // nem tudjuk közvetlenül számolni, de a letöltőt lecseréljük
    let letoltoHivva = false;
    k.letolto = async () => {
      letoltoHivva = true;
      return { ok: true, tipus: "rss", szovegOlvashato: true, cikkek: [] };
    };

    // AI helyreáll
    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };

    // Újraértékelés
    const ujra = await ertekelesUjra(k, ktx);
    expect(ujra.ok).toBe(true);

    // Letöltő nem hívódott
    expect(letoltoHivva).toBe(false);

    // Minden találat kesz
    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const fuggobenTalalatok = talalatok.filter((t) => t.ertekeles_allapot === "fuggoben");
    expect(fuggobenTalalatok.length).toBe(0);
    expect(talalatok.every((t) => t.ertekeles_allapot === "kesz")).toBe(true);
  });
});

describe("8. talalatMegtekint és talalatJelol", () => {
  it("megtekint → megtekintett", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    const eredmeny = await talalatMegtekint(k, ktx, elso.id);
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    expect(eredmeny.talalat.megtekintes).toBe("megtekintett");

    // Verziók nem változtak
    const verziok = await k.tar.verziok(SZERVEZET_ID);
    expect(verziok.length).toBe(1);
  });

  it("jelol elrejtett → elrejtett, verziók változatlan", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    const eredmeny = await talalatJelol(k, ktx, elso.id, "elrejtett");
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;

    expect(eredmeny.talalat.jeloles).toBe("elrejtett");
    expect(eredmeny.talalat.megtekintes).toBe("megtekintett"); // jelölés megtekintetté is tesz

    // Verziók nem változtak
    const verziok = await k.tar.verziok(SZERVEZET_ID);
    expect(verziok.length).toBe(1);
  });
});

describe("9. visszajelzes, javaslat, döntés", () => {
  it("visszajelzesRogzit + javaslatKer → fuggo javaslat", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    // Visszajelzés
    const visszajelzes: Visszajelzes = {
      id: ujId(),
      talalat_id: elso.id,
      fajta: "nem_relevans",
      okok: ["nem_ez_a_tema"],
      sajat_indok: "",
      letrehozva: most().toISOString(),
    };
    await visszajelzesRogzit(k, ktx, visszajelzes);

    // Javaslat kérés
    const javaslat = await javaslatKer(k, ktx);
    expect(javaslat.ok).toBe(true);
    if (!javaslat.ok) return;

    expect(javaslat.javaslat.allapot).toBe("fuggo");
    expect(javaslat.javaslat.szabaly_verzio).toBe(1); // aktív verzióra épül
  });

  it("javaslatKiprobal → összehasonlítás 4 sorral", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    const visszajelzes: Visszajelzes = {
      id: ujId(),
      talalat_id: elso.id,
      fajta: "nem_relevans",
      okok: ["nem_ez_a_tema"],
      sajat_indok: "",
      letrehozva: most().toISOString(),
    };
    await visszajelzesRogzit(k, ktx, visszajelzes);

    const javaslat = await javaslatKer(k, ktx);
    expect(javaslat.ok).toBe(true);
    if (!javaslat.ok) return;

    // Kipróbálás
    const kiprobal = await javaslatKiprobal(k, ktx, javaslat.javaslat.id);
    expect(kiprobal.ok).toBe(true);
    if (!kiprobal.ok) return;

    // 4 találat volt, 4 sor az összehasonlításban
    expect(kiprobal.osszehasonlitas.length).toBe(4);
  });

  it("minta lejárat 31 nap → MINTA_LEJART", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    const visszajelzes: Visszajelzes = {
      id: ujId(),
      talalat_id: elso.id,
      fajta: "nem_relevans",
      okok: ["nem_ez_a_tema"],
      sajat_indok: "",
      letrehozva: most().toISOString(),
    };
    await visszajelzesRogzit(k, ktx, visszajelzes);

    const javaslat = await javaslatKer(k, ktx);
    expect(javaslat.ok).toBe(true);
    if (!javaslat.ok) return;

    // 31 nap léptetés
    mostLep(31);

    const kiprobal = await javaslatKiprobal(k, ktx, javaslat.javaslat.id);
    expect(kiprobal.ok).toBe(false);
    if (!kiprobal.ok) expect(kiprobal.hiba).toBe("MINTA_LEJART");
  });

  it("javaslatDont elfogad → új verzió, eredet: ai_javaslat", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    const visszajelzes: Visszajelzes = {
      id: ujId(),
      talalat_id: elso.id,
      fajta: "nem_relevans",
      okok: ["nem_ez_a_tema"],
      sajat_indok: "",
      letrehozva: most().toISOString(),
    };
    await visszajelzesRogzit(k, ktx, visszajelzes);

    const javaslat = await javaslatKer(k, ktx);
    expect(javaslat.ok).toBe(true);
    if (!javaslat.ok) return;

    const dontes = await javaslatDont(k, ktx, javaslat.javaslat.id, "elfogad");
    expect(dontes.ok).toBe(true);
    if (!dontes.ok) return;

    // Új verzió
    const verziok = await k.tar.verziok(SZERVEZET_ID);
    expect(verziok.length).toBe(2);
    expect(verziok[1].verzio).toBe(2);
    expect(verziok[1].eredet).toBe("ai_javaslat");

    // Javaslat állapota
    const javaslatok = await k.tar.javaslatok(SZERVEZET_ID);
    const frissitett = javaslatok.find((j) => j.id === javaslat.javaslat.id);
    expect(frissitett?.allapot).toBe("elfogadva");
  });

  it("másik javaslat elvet → elvetve, visszajelzések megmaradnak", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    const elso = talalatok[0];

    const visszajelzes: Visszajelzes = {
      id: ujId(),
      talalat_id: elso.id,
      fajta: "nem_relevans",
      okok: ["nem_ez_a_tema"],
      sajat_indok: "",
      letrehozva: most().toISOString(),
    };
    await visszajelzesRogzit(k, ktx, visszajelzes);

    const javaslat = await javaslatKer(k, ktx);
    expect(javaslat.ok).toBe(true);
    if (!javaslat.ok) return;

    const dontes = await javaslatDont(k, ktx, javaslat.javaslat.id, "elvet");
    expect(dontes.ok).toBe(true);
    if (!dontes.ok) return;

    const javaslatok = await k.tar.javaslatok(SZERVEZET_ID);
    const frissitett = javaslatok.find((j) => j.id === javaslat.javaslat.id);
    expect(frissitett?.allapot).toBe("elvetve");

    // Visszajelzések megmaradtak
    const visszajelzesek = await k.tar.visszajelzesek(SZERVEZET_ID);
    expect(visszajelzesek.length).toBe(1);
  });
});

describe("10. attekintes és osszkep", () => {
  it("attekintes: utolsoSikeres, ujDb, forrasHibak", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    const rosszForras = await forrasHozzaad(k, ktx, "https://rossz.hu/feed.xml", "kezi");
    if (!rosszForras.ok) return;
    k.letolto = tesztLetolto(rosszForras.forras.id);
    await forrasEllenoriz(k, ktx, rosszForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    // Egy találatot megtekintünk
    const talalatok = await k.tar.talalatok(SZERVEZET_ID);
    await talalatMegtekint(k, ktx, talalatok[0].id);

    const attekint = await attekintes(k, ktx);
    expect(attekint.ok).toBe(true);
    if (!attekint.ok) return;

    expect(attekint.utolsoSikeres).not.toBeNull();
    expect(attekint.utolsoSikeres!.allapot).toBe("reszleges"); // részleges = sikeres futás

    // ujDb: nem megtekintettek — 2026-09-22: a kiszűrt (háttér) hír nem számít újnak
    const friss = await k.tar.talalatok(SZERVEZET_ID);
    const nemMegtekintettek = friss.filter((t) => t.megtekintes === "uj" && !(t.ertekeles_allapot === "kesz" && t.ertekeles?.fontossag === "hatter")).length;
    // A megtekintett már nem "uj", de az attekintes lekérdezéskor friss adat kell
    // SPEC-KÉRDÉS: az attekintes ujDb számítása a pillanatnyi állapotot tükrözi
    expect(attekint.ujDb).toBe(nemMegtekintettek);

    expect(attekint.forrasHibak.length).toBe(1);
  });

  it("osszkep: hivatkozások létező találatokra, nem létező kiesik", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();

    await beallitasMent(k, ktx, joBeallitas(), "kezi");

    const joForras = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!joForras.ok) return;
    await forrasEllenoriz(k, ktx, joForras.forras.id);

    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const futas = await figyelesFuttat(k, ktx, { proba: true });
    expect(futas.ok).toBe(true);
    if (!futas.ok) return;

    // AI hívó felülírása, hogy nem létező ID-t is hivatkozzon
    const eredetiAi = k.ai;
    k.ai = async (feladat, bemenet) => {
      if (feladat === "hf_osszkep") {
        const { talalatok } = bemenet as { talalatok: Array<{ id: string }> };
        return {
          ok: true,
          valasz: {
            szoveg: "Összefoglaló.",
            // Első létező + egy nem létező
            hivatkozott_talalatok: [talalatok[0]?.id, "nem-letezo-id-123"].filter(Boolean),
            bizonytalan: false,
          },
          becsult_usd: 0.03,
        };
      }
      return eredetiAi(feladat, bemenet);
    };

    const ossz = await osszkep(k, ktx);
    expect(ossz.ok).toBe(true);
    if (!ossz.ok) return;

    // A nem létező kiesett, csak a létező maradt
    // SPEC-KÉRDÉS: a spec 2.9 szerint "ami nem, kiesik; ha egy sem, hiba" —
    // itt van legalább egy érvényes, tehát ok.
    expect(ossz.osszkep.hivatkozott_talalatok.length).toBe(1);
    expect(ossz.osszkep.hivatkozott_talalatok[0]).not.toBe("nem-letezo-id-123");
  });
});

// ——— E-42: a forrás hozzáadása nem technikai feladat ———
describe("forrasHozzaad — a begépelt cím kiegészítése és a szemét elutasítása (E-42)", () => {
  it("„zi-de-zi.ro” → a mentett cím https://zi-de-zi.ro/", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const eredmeny = await forrasHozzaad(k, ktx, "zi-de-zi.ro", "kezi");
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.forras.cim).toBe("https://zi-de-zi.ro/");
      expect(eredmeny.forras.allapot).toBe("ellenorzes_alatt");
    }
  });

  it("amiből nem lesz cím, azt nem tesszük el (nincs takarítanivaló a listában)", async () => {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    const eredmeny = await forrasHozzaad(k, ktx, "valami amit beirt", "kezi");
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hiba).toBe("ERVENYTELEN_ADAT");
    expect((await k.tar.forrasok(SZERVEZET_ID)).length).toBe(0);
  });

  it("a letöltő által megtalált hírfolyam címe mentődik a forrásra", async () => {
    const k: Kornyezet = {
      ...keszKornyezet(),
      letolto: async () => ({
        ok: true,
        tipus: "rss",
        szovegOlvashato: true,
        cikkek: [{ cim: "Hír", url: "https://zi-de-zi.ro/1", megjelenes: null, szoveg: "x".repeat(300), nyelv: "ro" }],
        felfedezettCim: "https://zi-de-zi.ro/feed/",
      }),
    };
    const ktx = tulajdonosKtx();
    const hozzaad = await forrasHozzaad(k, ktx, "zi-de-zi.ro", "kezi");
    expect(hozzaad.ok).toBe(true);
    if (!hozzaad.ok) return;
    const ell = await forrasEllenoriz(k, ktx, hozzaad.forras.id);
    expect(ell.ok).toBe(true);
    if (!ell.ok) return;
    expect(ell.forras.cim).toBe("https://zi-de-zi.ro/feed/");
    expect(ell.forras.tipus).toBe("rss");
    expect(ell.forras.allapot).toBe("hasznalhato");
  });
});

// 2026-09-22 (Vilmos: „a szűrő egy kalap szar”): a szigorú szűrő bevezetésekor a régi értékelések újraszűrésre várnak.
import { SZURO_VERZIO, szuroElavult, kiszurt } from "../src/talalat";
describe("szigorú szűrő: változat és kiszűrt hír", () => {
  it("a változat nélküli (régi) értékelés elavult, a mai nem", () => {
    expect(szuroElavult({})).toBe(true);
    expect(szuroElavult({ szuro_verzio: SZURO_VERZIO - 1 })).toBe(true);
    expect(szuroElavult({ szuro_verzio: SZURO_VERZIO })).toBe(false);
    expect(szuroElavult(null)).toBe(true);
  });
  it("csak a kész háttér-értékelés kiszűrt", () => {
    expect(kiszurt({ ertekeles_allapot: "kesz", ertekeles: { fontossag: "hatter" } })).toBe(true);
    expect(kiszurt({ ertekeles_allapot: "kesz", ertekeles: { fontossag: "erdekes" } })).toBe(false);
    expect(kiszurt({ ertekeles_allapot: "fuggoben", ertekeles: null })).toBe(false);
  });
});

// 2026-09-22 (v9): a modell ellenőrző válaszai alapján a kód is kiszűr — mérve: a v8-as szöveges szabályt
// a 4 átengedett hírből kettőnél megszegte („Marosvásárhely nem szerepel”, mégis „érdekes”).
import { relevanciaSzigorit, aiValaszEllenoriz as aiEll } from "../src/ai";
import { relevanciabolErtekeles } from "../src/folyamat";
describe("szigorú szűrő: a kód zára (v9)", () => {
  const alap = { temacimke: "szakmai" as const, miert: "Írhattok róla.", indoklas: "", osszefoglalo: "", cim_forditott: "", cegednek: "c", vevoidnek: "v" };
  it("nem a helyen történt → háttér (akkor is, ha a modell érdekesnek mondta)", () => {
    const e = relevanciaSzigorit({ ...alap, fontossag: "erdekes", rola_szol: false, fo_tema: "iskola", helyszin: "nem" });
    expect(e.kiszurve).toBe("hely");
    expect(e.valasz.fontossag).toBe("hatter");
    expect(e.valasz.cegednek).toBe("");
  });
  it("nincs fő téma → háttér; a „fontos” sem kivétel", () => {
    const e = relevanciaSzigorit({ ...alap, fontossag: "fontos", rola_szol: false, fo_tema: "", helyszin: "egyezik" });
    expect(e.kiszurve).toBe("tema");
    expect(e.valasz.fontossag).toBe("hatter");
  });
  it("a helyen történt, fő témája van → marad", () => {
    const e = relevanciaSzigorit({ ...alap, fontossag: "erdekes", rola_szol: false, fo_tema: "oktatás", helyszin: "egyezik" });
    expect(e.kiszurve).toBeNull();
    expect(e.valasz.fontossag).toBe("erdekes");
  });
  it("a szervezetről / a névről szóló hír helytől függetlenül marad", () => {
    const e = relevanciaSzigorit({ ...alap, fontossag: "fontos", rola_szol: true, fo_tema: "", helyszin: "nem" });
    expect(e.kiszurve).toBeNull();
    expect(e.valasz.fontossag).toBe("fontos");
  });
  it("ellenőrző mezők nélkül (régi válasz, minta) nincs mit ellenőrizni", () => {
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes" }).kiszurve).toBeNull();
  });
  it("a szelídítő a szöveges/igen-nem alakot is érti, az ismeretlen hely „nem”", () => {
    const ell = aiEll("hf_relevancia", { ...alap, fontossag: "erdekes", rola_szol: "false", fo_tema: null, helyszin: "talán" }, { talalat_ids: [] });
    expect(ell.ok).toBe(true);
    if (!ell.ok) return;
    const r = ell.ertek as { rola_szol?: boolean; fo_tema?: string; helyszin?: string };
    expect(r.rola_szol).toBe(false);
    expect(r.fo_tema).toBe("");
    expect(r.helyszin).toBe("nem");
  });
  it("a tárolt értékelés (v12) a legengedékenyebb fokozaté; a hely a tényekben (hely_ok) — a néző fokozata dönt", () => {
    const e = relevanciabolErtekeles(
      { ...alap, fontossag: "erdekes", rola_szol: false, fo_tema: "iskola", helyszin: "nem" },
      { cim: "Egyenruha", szoveg: "A szenátus elfogadta.", nyelv: "hu", csonkolt: false }, "hu", 3, new Date("2026-09-22T08:00:00Z"),
    );
    expect(e.fontossag).toBe("erdekes");
    expect(e.hely_ok).toBe(false);
    expect(fokozatSzerintP(e, "nagyon_szigoru")).toBe("hatter");
    expect(fokozatSzerintP(e, "kozepes")).toBe("erdekes");
    expect(e.helyszin).toBe("nem");
    expect(e.fo_tema).toBe("iskola");
    expect(e.szuro_verzio).toBe(SZURO_VERZIO);
    expect(e.cim_forditott).toBe("Egyenruha");
  });
});

// v10 (2026-09-22): a v9 után a 7 átengedett hírből kettő országos volt („egyezik”-kel) — hatókör és szó szerinti idézet.
import { idezetACikkben } from "../src/ai";
describe("szigorú szűrő: hatókör és helyet megnevező idézet (v10)", () => {
  const alap = { temacimke: "szakmai" as const, miert: "Írhattok róla.", indoklas: "", osszefoglalo: "", cim_forditott: "", cegednek: "c", vevoidnek: "v", rola_szol: false, fo_tema: "oktatás" };
  const cikk = { cim: "Mureş: kisebbségi nyelvismeret az igazgatóknál", szoveg: "A Târgu Mureș-i iskolák igazgatói pályázatán..." };
  it("országos hír helyfeltétel mellett kiesik, akkor is, ha a modell „egyezik”-et mond", () => {
    const e = relevanciaSzigorit({ ...alap, fontossag: "erdekes", hely_feltetel: "Marosvásárhely", helyszin: "egyezik", hatokor: "orszagos", hely_idezet: "Târgu Mureș" }, cikk);
    expect(e.kiszurve).toBe("hely");
  });
  it("a cikkben nem szereplő idézet kiesik; a szereplő (ékezet- és ragváltozattal) marad", () => {
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes", hely_feltetel: "Marosvásárhely", helyszin: "egyezik", hatokor: "helyi", hely_idezet: "Marosvásárhely" }, cikk).kiszurve).toBe("hely");
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes", hely_feltetel: "Marosvásárhely", helyszin: "egyezik", hatokor: "megyei", hely_idezet: "Mureș" }, cikk).kiszurve).toBeNull();
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes", hely_feltetel: "Marosvásárhely", helyszin: "egyezik", hatokor: "helyi", hely_idezet: "Targu Mures" }, cikk).kiszurve).toBeNull();
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes", hely_feltetel: "Marosvásárhely", helyszin: "egyezik", hatokor: "helyi", hely_idezet: "" }, cikk).kiszurve).toBe("hely");
  });
  it("ellentmondás: van helyfeltétel, de a modell „nincs_feltetel”-t mond → kiesik", () => {
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes", hely_feltetel: "Marosvásárhely", helyszin: "nincs_feltetel", hatokor: "orszagos", hely_idezet: "" }, cikk).kiszurve).toBe("hely");
  });
  it("helyfeltétel nélkül az országos hír is maradhat", () => {
    expect(relevanciaSzigorit({ ...alap, fontossag: "erdekes", fo_tema: "AI", hely_feltetel: "", helyszin: "nincs_feltetel", hatokor: "nemzetkozi", hely_idezet: "" }, cikk).kiszurve).toBeNull();
  });
  it("az idézet szó elején kezdődik (a „mures” nem talál bele a „kimuresz”-be)", () => {
    expect(idezetACikkben("mures", { cim: "kimuresz", szoveg: "" })).toBe(false);
    expect(idezetACikkben("Marosvásárhely", { cim: "", szoveg: "A marosvásárhelyi színház" })).toBe(true);
  });
  it("a szelídítő a hatókör magyar alakját is érti, az ismeretlent „országos”-nak veszi", () => {
    const a = aiEll("hf_relevancia", { ...alap, fontossag: "erdekes", hatokor: "Országos", hely_feltetel: null }, { talalat_ids: [] });
    const b = aiEll("hf_relevancia", { ...alap, fontossag: "erdekes", hatokor: "világ" }, { talalat_ids: [] });
    expect(a.ok && (a.ertek as { hatokor?: string }).hatokor).toBe("orszagos");
    expect(a.ok && (a.ertek as { hely_feltetel?: string }).hely_feltetel).toBe("");
    expect(b.ok && (b.ertek as { hatokor?: string }).hatokor).toBe("orszagos");
  });
});

// v11 (2026-09-22, Vilmos: „ne is nézzen olyan cikket, ami nem a témába vagy iránytűbe vág”): előszűrő — szólista + címek.
import { szoSzerepel, szolistaDont, eloszur } from "../src/eloszuro";
describe("előszűrő (v11): a szólista keresése AI nélkül", () => {
  const n = (s: string) => ` ${osszevetoAlakP(s)} `;
  it("szó eleje, ékezet nélkül is; a legfeljebb 3 betűs szó csak egészként", () => {
    expect(szoSzerepel("iskola", n("A marosvásárhelyi iskolában új tanév kezdődött"))).toBe(true);
    expect(szoSzerepel("școal", n("Școala Gimnazială nr. 2"))).toBe(true);
    expect(szoSzerepel("şcoal", n("Scoala Gimnaziala nr. 2"))).toBe(true); // cédilles ş is
    expect(szoSzerepel("Târgu Mureș", n("Accident la Targu-Mures ieri"))).toBe(true);
    expect(szoSzerepel("AI", n("vakáció után"))).toBe(false);
    expect(szoSzerepel("AI", n("az AI-alapú eszközök"))).toBe(true);
    expect(szoSzerepel("a", n("a város"))).toBe(false); // egybetűs szó nem keresőszó
  });
  const lista = {
    hely: { nev: "Marosvásárhely", szavak: ["marosvásárhely", "Târgu Mureș", "Mureș"] },
    temak: [{ nev: "iskola", szavak: ["iskola", "școal", "elev"] }],
    nevek: ["Portik Vilmos"],
  };
  it("hely ÉS téma kell; a név mindig átenged", () => {
    expect(szolistaDont(lista, { cim: "Új iskola épül Marosvásárhelyen", szoveg: "" })).toBe("atmegy");
    expect(szolistaDont(lista, { cim: "Elevii din Târgu Mureș", szoveg: "Școala a început." })).toBe("atmegy");
    expect(szolistaDont(lista, { cim: "Új iskola épül Kolozsváron", szoveg: "" })).toBe("hely");
    expect(szolistaDont(lista, { cim: "Baleset Marosvásárhelyen", szoveg: "Két autó ütközött." })).toBe("tema");
    expect(szolistaDont(lista, { cim: "Portik Vilmos előadást tart Kolozsváron", szoveg: "" })).toBe("atmegy");
  });
  it("helyfeltétel nélkül csak a téma számít; üres témalistánál minden átmegy", () => {
    expect(szolistaDont({ ...lista, hely: null }, { cim: "Új iskola épül Kolozsváron", szoveg: "" })).toBe("atmegy");
    expect(szolistaDont({ hely: null, temak: [], nevek: [] }, { cim: "Bármi", szoveg: "" })).toBe("atmegy");
  });
});

describe("előszűrő (v11): a futásban", () => {
  async function futtatElo(ai: (feladat: string, bemenet: unknown) => Promise<unknown> | unknown) {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    await beallitasMent(k, ktx, joBeallitas(), "kezi");
    const jo = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!jo.ok) throw new Error("forrás");
    await forrasEllenoriz(k, ktx, jo.forras.id);
    const hivasok: string[] = [];
    const eredeti = k.ai;
    k.ai = (async (feladat: string, bemenet: unknown) => {
      hivasok.push(feladat);
      const sajat = await ai(feladat, bemenet);
      if (sajat !== undefined) return sajat;
      return eredeti(feladat as "hf_relevancia", bemenet as never);
    }) as typeof k.ai;
    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const r = await figyelesFuttat(k, ktx, { proba: false });
    if (!r.ok) throw new Error("futás");
    return { talalatok: await k.tar.talalatok(SZERVEZET_ID), hivasok, k, ktx };
  }
  const digitLista = { hely: null, temak: [{ nev: "digitalizáció", szavak: ["digitaliz", "fenntarthat"] }], nevek: [] };

  it("a szólistán elbukott cikket a gép nem olvassa el, és „ugyanaz?” kérdés sem megy rá", async () => {
    const { talalatok, hivasok } = await futtatElo((f, b) => {
      if (f === "hf_szolista") return { ok: true, valasz: digitLista, becsult_usd: 0 };
      if (f === "hf_cim_szures") return { ok: true, valasz: { megtart: (b as { cimek: { sorszam: number }[] }).cimek.map((c) => c.sorszam) }, becsult_usd: 0 };
      return undefined;
    });
    expect(talalatok.length).toBe(4);
    const kiszurtek = talalatok.filter((t) => t.ertekeles?.kiszurve === "szolista");
    expect(kiszurtek.length).toBe(3);
    expect(kiszurtek.every((t) => t.ertekeles_allapot === "kesz" && t.ertekeles?.fontossag === "hatter")).toBe(true);
    expect(hivasok.filter((h) => h === "hf_relevancia").length).toBe(1);
    expect(hivasok.filter((h) => h === "hf_ugyanaz_az_esemeny").length).toBe(0);
    expect(hivasok.filter((h) => h === "hf_szolista").length).toBe(1);
  });

  it("a címszűrőn elbukott cikket sem olvassa el", async () => {
    const { talalatok, hivasok } = await futtatElo((f) => {
      if (f === "hf_szolista") return { ok: true, valasz: digitLista, becsult_usd: 0 };
      if (f === "hf_cim_szures") return { ok: true, valasz: { megtart: [] }, becsult_usd: 0 };
      return undefined;
    });
    expect(talalatok.filter((t) => t.ertekeles?.kiszurve === "cim").length).toBe(1);
    expect(talalatok.every((t) => t.ertekeles_allapot === "kesz" && t.ertekeles?.fontossag === "hatter")).toBe(true);
    expect(hivasok.filter((h) => h === "hf_relevancia").length).toBe(0);
  });

  it("ha az előszűrő lépései nem sikerülnek, minden cikk a teljes olvasáshoz megy (nem vész el semmi)", async () => {
    const { talalatok, hivasok } = await futtatElo((f) => {
      if (f === "hf_szolista") throw new Error("hálózat");
      if (f === "hf_cim_szures") return { ok: false, kod: "AI_NEM_ELERHETO" };
      return undefined;
    });
    expect(talalatok.some((t) => t.ertekeles?.kiszurve === "szolista" || t.ertekeles?.kiszurve === "cim")).toBe(false);
    expect(hivasok.filter((h) => h === "hf_relevancia").length).toBe(4);
  });

  it("az újraszűrés is előszűr: a kiszűrtet nem olvassa el újra", async () => {
    const { k, ktx } = await futtatElo((f) => {
      if (f === "hf_szolista") throw new Error("hálózat");
      if (f === "hf_cim_szures") return { ok: false, kod: "AI_NEM_ELERHETO" };
      return undefined;
    });
    for (const t of await k.tar.talalatok(SZERVEZET_ID)) await k.tar.talalatMent(SZERVEZET_ID, { ...t, ertekeles: null, ertekeles_allapot: "fuggoben" });
    const hivasok: string[] = [];
    const eredeti = k.ai;
    k.ai = (async (feladat: string, bemenet: unknown) => {
      hivasok.push(feladat);
      if (feladat === "hf_szolista") return { ok: true, valasz: digitLista, becsult_usd: 0 };
      if (feladat === "hf_cim_szures") return { ok: true, valasz: { megtart: [1] }, becsult_usd: 0 };
      return eredeti(feladat as "hf_relevancia", bemenet as never);
    }) as typeof k.ai;
    const r = await ertekelesUjra(k, ktx);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ujraErtekelt).toBe(4);
    const t = await k.tar.talalatok(SZERVEZET_ID);
    expect(t.filter((x) => x.ertekeles?.kiszurve === "szolista").length).toBe(3);
    expect(hivasok.filter((h) => h === "hf_relevancia").length).toBe(1);
  });

  it("az eloszur üres listára nem hív AI-t", async () => {
    let hivas = 0;
    const r = await eloszur({ ai: (async () => { hivas++; return { ok: false, kod: "AI_NEM_ELERHETO" }; }) as never, profil: {} }, joBeallitas(), []);
    expect(r.kiszurt.size).toBe(0);
    expect(hivas).toBe(0);
  });
});
import { osszevetoAlak as osszevetoAlakP } from "../src/ai";

import { fokozatSzerint as fokozatSzerintP } from "../src/tag-szures";

// R-13 (2026-09-22): kredit a háttérmunkában — a sikeres AI-hívás kreditje azok között oszlik meg, akiknek kellett.
describe("kredit-terhelés a futásban (R-13)", () => {
  async function futtatKredittel(tagok: { fiok_id: string; fokozat: "nagyon_szigoru" | "kozepes" | "laza"; eloszures: boolean }[], lista: unknown) {
    const k = keszKornyezet();
    const ktx = tulajdonosKtx();
    await beallitasMent(k, ktx, joBeallitas(), "kezi");
    const jo = await forrasHozzaad(k, ktx, "https://pelda.hu/feed.xml", "kezi");
    if (!jo.ok) throw new Error("forrás");
    await forrasEllenoriz(k, ktx, jo.forras.id);
    const terhelesek: { fiokok: string[]; feladat: string }[] = [];
    const hivasok: string[] = [];
    const eredeti = k.ai;
    k.tagok = tagok;
    k.kreditTerhel = async (fiokok, feladat) => { terhelesek.push({ fiokok: [...fiokok].sort(), feladat }); };
    k.ai = (async (feladat: string, bemenet: unknown) => {
      hivasok.push(feladat);
      if (feladat === "hf_szolista") return { ok: true, valasz: lista, becsult_usd: 0 };
      if (feladat === "hf_cim_szures") return { ok: true, valasz: { megtart: (bemenet as { cimek: { sorszam: number }[] }).cimek.map((c) => c.sorszam), erinti: [] }, becsult_usd: 0 };
      return eredeti(feladat as "hf_relevancia", bemenet as never);
    }) as typeof k.ai;
    aiAllapot = { keretKimerult: false, hibazik: false, hivasSzamlalo: 0 };
    const r = await figyelesFuttat(k, ktx, { proba: false });
    if (!r.ok) throw new Error("futás");
    return { terhelesek, hivasok, talalatok: await k.tar.talalatok(SZERVEZET_ID) };
  }
  const lista = { hely: null, temak: [{ nev: "digitalizáció", szavak: ["digitaliz"] }], nevek: [] };

  it("az előszűrés a bekapcsolt előszűrésű tagoké, az olvasás azoké, akiknek átment", async () => {
    const { terhelesek } = await futtatKredittel(
      [{ fiok_id: "a", fokozat: "nagyon_szigoru", eloszures: true }, { fiok_id: "b", fokozat: "laza", eloszures: false }],
      lista,
    );
    expect(terhelesek.find((t) => t.feladat === "hf_szolista")?.fiokok).toEqual(["a"]);
    const olvasasok = terhelesek.filter((t) => t.feladat === "hf_relevancia");
    // „b”-nek nincs előszűrése: minden cikket neki is olvas; „a”-nak csak a digitalizációs cikk ment át
    expect(olvasasok.filter((t) => t.fiokok.includes("b")).length).toBe(olvasasok.length);
    expect(olvasasok.filter((t) => t.fiokok.includes("a")).length).toBe(1);
  });

  it("ha egyik tagnak sincs kreditje, a gép nem olvas: a találatok „keret kimerült”-ek, AI-hívás nélkül", async () => {
    const { hivasok, talalatok } = await futtatKredittel([], lista);
    expect(hivasok.length).toBe(0);
    expect(talalatok.every((t) => t.ertekeles_allapot === "keret_kimerult")).toBe(true);
  });
});
