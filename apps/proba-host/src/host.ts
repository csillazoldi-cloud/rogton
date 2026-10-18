// A HOST csatlakozói: rögzített profil, kontextus, letöltő, teszt-AI, idő- és azonosító-adó.
import { SzervezetProfil } from "@rogton/contracts";
import type { AiHivo, HostKontextus } from "@rogton/news-monitor-core";
import type { Forras } from "@rogton/news-monitor-core";
import type { Letolto } from "@rogton/news-monitor-core";

/** Rögzített profil a @rogton/contracts sémája szerint: „Minta Műhely” bútorműhely, hu+ro nyelvek, jóváhagyott arculat.
 *  A hostnak ez a KÖZÖS profilja — a modul csak olvassa (a Kornyezet.profil-ban kapja). */
export const rogzitettProfil: SzervezetProfil = SzervezetProfil.parse({
  nev: "Minta Műhely",
  osszefoglalo: "Kézműves bútorműhely Marosvásárhelyen: egyedi tölgyfa bútorok lakásokba és üzletekbe, tervezéstől a beépítésig.",
  osszefoglalo_forras: "ai",
  celkozonseg: "Lakástulajdonosok és kisebb üzletek vezetői, akik egyedi bútort keresnek.",
  celkozonseg_forras: "ai",
  cel: "A munkák bemutatása és több érdeklődő megkeresés.",
  cel_forras: "sajat",
  nyelvek: ["hu", "ro"],
  nyelvek_forras: "sajat",
  hangnem_leiras: "Közvetlen, szakmai, érthető",
  hangnem_minta: "Minden bútorunk egyedi tervek alapján készül.",
  hangnem_nyelv: "hu",
  hangnem_forras: "ai",
  arculat: {
    allapot: "jovahagyott",
    tervezet: /* tokenőr: ok — ügyfél-arculat mintaadata (a proba-host rögzített profilja), nem a felület színe */ { elsodleges: "#2f5d4e", masodlagos: "#d9a441", hatter: "#f5f1e8", betu_cim: "'Archivo',sans-serif", betu_szoveg: "'Public Sans',sans-serif", kepvilag: "Természetes fényű műhelyfotók.", kovetendo: "anyagközeli fotók", kerulendo: "stockfotó-hangulat", lekerekites: 8, nyelv: "hu", eredet: "ai", modositva: false },
    verzio: 1,
    jovahagyott_verzio: 1,
    verziok: /* tokenőr: ok — ügyfél-arculat mintaadata */ { "1": { verzio: 1, jovahagyva: "2026-09-01T10:00:00Z", elsodleges: "#2f5d4e", masodlagos: "#d9a441", hatter: "#f5f1e8", betu_cim: "'Archivo',sans-serif", betu_szoveg: "'Public Sans',sans-serif", kepvilag: "Természetes fényű műhelyfotók.", kovetendo: "anyagközeli fotók", kerulendo: "stockfotó-hangulat", lekerekites: 8, nyelv: "hu", eredet: "ai", modositva: false } },
  },
  kesobbre: [],
  jovahagyva: "2026-09-01T10:00:00Z",
  jovahagyta: "22222222-2222-4222-8222-222222222222",
});

/** Rögzített kontextus: tulajdonos, rögzített uuid-k. */
export const kontextus: HostKontextus = {
  fiok_id: "22222222-2222-4222-8222-222222222222",
  szervezet_id: "33333333-3333-4333-8333-333333333333",
  szerep: "tulajdonos",
};

/** A cikk dátuma a próba órájához képest (a 48 órás frissességi szűrő miatt — F9-A7; a rögzített szeptemberi dátumok azóta kiestek). */
function oraval(ora: number): string {
  return new Date(most().getTime() + ora * 3600_000).toISOString();
}

/** Rögzített letöltő: két beépített forrás, minden más ismeretlen hiba. */
export const rogzitettLetolto: Letolto = async (f: Forras) => {
  if (f.cim === "https://pelda.hu/feed") {
    return {
      ok: true,
      tipus: "rss",
      szovegOlvashato: true,
      cikkek: [
        {
          cim: "Új kézműves bútor kollekció a Minta Műhelytől",
          url: "https://pelda.hu/cikk/1",
          megjelenes: oraval(-30),
          szoveg: "A Minta Műhely bemutatta új kézműves bútor kollekcióját, amely tölgyfából készült.",
          nyelv: "hu",
        },
        {
          cim: "Új kézműves bútor kollekció érkezett a Minta Műhelytől",
          url: "https://pelda.hu/cikk/2",
          megjelenes: oraval(-29),
          szoveg: "A Minta Műhely új kollekciója tölgyfa bútorokkal bővült, kézműves technikával.",
          nyelv: "hu",
        },
        {
          cim: "Asztalos műhely látogatóknak",
          url: "https://pelda.hu/cikk/3",
          megjelenes: oraval(-20),
          szoveg: "A Minta Műhely asztalos műhelye látogatható, ahol a bútorok készítését lehet megtekinteni.",
          nyelv: "hu",
        },
        {
          cim: "Fenntartható faanyag a bútoriparban",
          url: "https://pelda.hu/cikk/4",
          megjelenes: oraval(-6),
          szoveg: "A fenntartható faanyag egyre fontosabb a bútoriparban, a Minta Műhely is ezt használja.",
          nyelv: "hu",
        },
      ],
    };
  }
  if (f.cim === "https://hibas.pelda.hu/") {
    return { ok: false, hibaOk: "időtúllépés" };
  }
  return { ok: false, hibaOk: "ismeretlen" };
};

/** Teszt-AI: determinisztikus válaszok a feladatokra. */
export const tesztAi: AiHivo = async (feladat, bemenet) => {
  switch (feladat) {
    case "hf_relevancia": {
      const k = bemenet as { kivonat: { cim: string; szoveg: string } };
      const szoveg = k.kivonat.cim + " " + k.kivonat.szoveg;
      const temak = ["Minta Műhely", "bútor", "asztalos"];
      const fontos = temak.some((t) => szoveg.toLowerCase().includes(t.toLowerCase()));
      return {
        ok: true,
        valasz: {
          fontossag: fontos ? "fontos" : "hatter",
          temacimke: fontos ? "sajat_megjelenes" : "szakmai",
          miert: fontos ? "A témában érintett." : "Csak háttérinformáció.",
          indoklas: "Teszt-AI determinisztikus válasza.",
        },
        becsult_usd: 0.001,
      };
    }
    case "hf_ugyanaz_az_esemeny": {
      const b = bemenet as { a: { cim: string }; b: { cim: string } };
      const aSzo = b.a.cim.toLowerCase().split(" ").slice(0, 3).join(" ");
      const bSzo = b.b.cim.toLowerCase().split(" ").slice(0, 3).join(" ");
      return {
        ok: true,
        valasz: { ugyanaz: aSzo === bSzo, indok: "Az első három szó egyezik." },
        becsult_usd: 0.001,
      };
    }
    case "hf_szabaly_javaslat": {
      const b = bemenet as { beallitas: { temak: { nev: string }[]; kizarasok: string[] }; visszajelzesek: { sajat_indok: string }[] };
      const ujKizaras = b.visszajelzesek[0]?.sajat_indok;
      return {
        ok: true,
        valasz: {
          javasolt: {
            ...b.beallitas,
            kizarasok: ujKizaras ? [...b.beallitas.kizarasok, ujKizaras] : b.beallitas.kizarasok,
          },
          indoklas: "A visszajelzés alapján új kizárás javasolt.",
          varhato_hatas: "Kevesebb nem releváns találat.",
          profil_erintett: false,
          mi_alapjan: ["visszajelzes-1"],
        },
        becsult_usd: 0.001,
      };
    }
    case "hf_osszkep": {
      const b = bemenet as { talalatok: { id: string }[] };
      return {
        ok: true,
        valasz: {
          szoveg: `Összkép: ${b.talalatok.length} találat, a legfontosabbak kiemelve.`,
          hivatkozott_talalatok: b.talalatok.slice(0, 2).map((t) => t.id),
          bizonytalan: false,
        },
        becsult_usd: 0.001,
      };
    }
    case "hf_beallitas_javaslat": {
      const b = bemenet as { profil: { nev: string } };
      return {
        ok: true,
        valasz: {
          beallitas: {
            celok: ["sajat_marka"],
            temak: [{ nev: b.profil.nev, nevvaltozatok: [], megkulonboztetes: "" }],
            foldrajzi_fokusz: "",
            nyelvek: ["hu"],
            kizarasok: [],
            idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
            szabad_szoveg: "",
          },
        },
        becsult_usd: 0.001,
      };
    }
    case "hf_tartalomotlet": {
      return {
        ok: true,
        valasz: { szoveg: "Írj egy bejegyzést a Minta Műhely új kollekciójáról.", nyelv: "hu" },
        becsult_usd: 0.001,
      };
    }
    // v11 előszűrő: üres szólista (nincs szó-szűrés), a címszűrés mindent megtart
    case "hf_szolista":
      return { ok: true, valasz: { hely: null, temak: [], nevek: [] }, becsult_usd: 0 };
    case "hf_cim_szures": {
      const b = bemenet as { cimek: { sorszam: number }[] };
      return { ok: true, valasz: { megtart: b.cimek.map((c) => c.sorszam) }, becsult_usd: 0 };
    }
  }
};

/** Azonosító-adó: számláló. */
export function idAdo(): string {
  idAdo.szamlalo = (idAdo.szamlalo ?? 0) + 1;
  return `id-${idAdo.szamlalo}`;
}
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace idAdo {
  export let szamlalo = 0;
}

/** Rögzített, léptethető idő. */
export function most(): Date {
  return most.aktualis;
}
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace most {
  export let aktualis = new Date("2026-09-07T08:00:00Z");
  export function leptet(ms: number): void {
    aktualis = new Date(aktualis.getTime() + ms);
  }
}
