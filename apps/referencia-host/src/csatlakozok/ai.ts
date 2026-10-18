// A HOST AI-csatlakozója. A mag csak FELADATOT kér (`AiHivo`), modellt soha: melyik modell válaszol, az a hosté.
// Két mód: „teszt” (determinisztikus, hálózat nélkül) és „ollama” (a helyi modell a közös @km/ai-adapters-en át).
import { AiHiba, ollamaSzolgaltato, type Szolgaltato } from "@km/ai-adapters";
import { promptAdatBlokk, type AiHivo, type HfFeladat } from "@km/news-monitor-core";
import { prompt, type Nyelv } from "@km/news-monitor-promptok";

type Kivonatszeru = { cim?: string; szoveg?: string; csonkolt?: boolean };
type Temaszeru = { nev?: string };

function szovegE(x: unknown): Kivonatszeru {
  return (x ?? {}) as Kivonatszeru;
}

/** Szóhatáron vágott részlet — a teszt-csatlakozó összefoglalójához. */
function roviditve(szoveg: string, hossz: number): string {
  const tiszta = szoveg.replace(/\s+/g, " ").trim();
  if (tiszta.length <= hossz) return tiszta;
  const vagott = tiszta.slice(0, hossz);
  const szokoz = vagott.lastIndexOf(" ");
  return (szokoz > 40 ? vagott.slice(0, szokoz) : vagott) + "…";
}

/** Teszt-AI: determinisztikus válaszok, hálózat nélkül — a váz és a próbák ezzel futnak. */
export const tesztAi: AiHivo = async (feladat, bemenet) => {
  switch (feladat) {
    case "hf_relevancia": {
      const b = bemenet as { beallitas: unknown; kivonat: unknown };
      const kivonat = szovegE(b.kivonat);
      const temak = ((b.beallitas as { temak?: Temaszeru[] } | null)?.temak ?? []).map((t) => t.nev ?? "").filter(Boolean);
      const szoveg = `${kivonat.cim ?? ""} ${kivonat.szoveg ?? ""}`.toLowerCase();
      const fontos = temak.some((t) => szoveg.includes(t.toLowerCase()));
      return {
        ok: true,
        valasz: {
          fontossag: fontos ? "fontos" : "hatter",
          temacimke: fontos ? "sajat_megjelenes" : "szakmai",
          miert: fontos ? "A beállított témák egyike szerepel a cikkben." : "Csak háttérinformáció.",
          indoklas: "Teszt-csatlakozó determinisztikus válasza.",
          // A cikk szövegének eleje szóhatáron — így a teszt-csatlakozó válasza is ÖSSZEFOGLALÓ, nem a cím megismétlése.
          osszefoglalo: roviditve(kivonat.szoveg ?? kivonat.cim ?? "", 200),
        },
        becsult_usd: 0,
      };
    }
    case "hf_ugyanaz_az_esemeny": {
      const b = bemenet as { a: unknown; b: unknown };
      const elso = (szovegE(b.a).cim ?? "").toLowerCase().split(" ").slice(0, 3).join(" ");
      const masodik = (szovegE(b.b).cim ?? "").toLowerCase().split(" ").slice(0, 3).join(" ");
      return { ok: true, valasz: { ugyanaz: elso === masodik, indok: "Az első három szó egyezik." }, becsult_usd: 0 };
    }
    case "hf_szabaly_javaslat": {
      const b = bemenet as { beallitas: unknown; visszajelzesek: unknown[] };
      const alap = b.beallitas as { kizarasok?: string[] };
      const elso = (b.visszajelzesek[0] ?? {}) as { id?: string; sajat_indok?: string };
      const ujKizaras = (elso.sajat_indok ?? "").trim();
      return {
        ok: true,
        valasz: {
          javasolt: { ...(alap as object), kizarasok: ujKizaras ? [...(alap.kizarasok ?? []), ujKizaras] : (alap.kizarasok ?? []) },
          indoklas: "A visszajelzés alapján új kizárás javasolt.",
          varhato_hatas: "Kevesebb nem releváns találat.",
          profil_erintett: false,
          mi_alapjan: [elso.id ?? "ismeretlen"],
        },
        becsult_usd: 0,
      };
    }
    case "hf_osszkep": {
      const b = bemenet as { talalatok: unknown[] };
      const idk = b.talalatok.map((t) => ((t ?? {}) as { id?: string }).id ?? "").filter(Boolean);
      return {
        ok: true,
        valasz: { szoveg: `Összkép: ${b.talalatok.length} találat.`, hivatkozott_talalatok: idk.slice(0, 2), bizonytalan: false },
        becsult_usd: 0,
      };
    }
    // v11 előszűrő: üres szólista (nincs szó-szűrés), a címszűrés mindent megtart
    case "hf_szolista":
      return { ok: true, valasz: { hely: null, temak: [], nevek: [] }, becsult_usd: 0 };
    case "hf_cim_szures": {
      const b = bemenet as { cimek: { sorszam: number }[] };
      return { ok: true, valasz: { megtart: b.cimek.map((c) => c.sorszam) }, becsult_usd: 0 };
    }
    case "hf_tartalomotlet": {
      const b = bemenet as { talalat: unknown };
      return { ok: true, valasz: { szoveg: `Bejegyzés-ötlet: ${szovegE(b.talalat).cim ?? ""}`, nyelv: "hu" }, becsult_usd: 0 };
    }
    case "hf_beallitas_javaslat": {
      const b = bemenet as { profil: unknown };
      const nev = ((b.profil ?? {}) as { nev?: string }).nev ?? "A szervezet";
      return {
        ok: true,
        valasz: {
          beallitas: {
            celok: ["sajat_marka"],
            temak: [{ nev, nevvaltozatok: [], megkulonboztetes: "" }],
            foldrajzi_fokusz: "",
            nyelvek: ["hu"],
            kizarasok: [],
            idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
            szabad_szoveg: "",
          },
        },
        becsult_usd: 0,
      };
    }
  }
};

/** A feladat szövegblokkja — ugyanaz a szerkezet, mint a webalkalmazásban (jelölt ADAT-blokkok, idegen szövegként). */
function feladatSzoveg(feladat: HfFeladat, bemenet: unknown): string {
  const b = bemenet as Record<string, unknown>;
  switch (feladat) {
    case "hf_relevancia": {
      const k = szovegE(b["kivonat"]);
      return `<<ADAT profil>>\n${JSON.stringify(b["profil"])}\n<<ADAT VÉGE>>\n\n<<ADAT beallitas>>\n${JSON.stringify(b["beallitas"])}\n<<ADAT VÉGE>>\n\nCikk címe: ${k.cim ?? ""}\n${promptAdatBlokk("cikk", k.szoveg ?? "", k.csonkolt === true)}`;
    }
    case "hf_ugyanaz_az_esemeny": {
      const a = szovegE(b["a"]);
      const m = szovegE(b["b"]);
      return `<<ADAT cim_a>>\n${a.cim ?? ""}\n<<ADAT VÉGE>>\n${promptAdatBlokk("cikk_a", a.szoveg ?? "", a.csonkolt === true)}\n\n<<ADAT cim_b>>\n${m.cim ?? ""}\n<<ADAT VÉGE>>\n${promptAdatBlokk("cikk_b", m.szoveg ?? "", m.csonkolt === true)}`;
    }
    default:
      return `<<ADAT bemenet>>\n${JSON.stringify(bemenet)}\n<<ADAT VÉGE>>`;
  }
}

const MAX_KI_TOKEN: Record<HfFeladat, number> = {
  hf_relevancia: 700,
  hf_ugyanaz_az_esemeny: 200,
  hf_osszkep: 600,
  hf_szabaly_javaslat: 800,
  hf_tartalomotlet: 500,
  hf_beallitas_javaslat: 800,
  hf_szolista: 3000,
  hf_cim_szures: 1000,
};

/**
 * Valódi AI-csatlakozó a helyi modellhez. A rendszerutasítás E-31 óta a KÖZÖS `@km/news-monitor-promptok`
 * csomagból jön — UGYANAZ, amit a webalkalmazás küld. A `nyelv` a válasz nyelve.
 */
export function ollamaAi(nyelv: Nyelv = "hu", szolgaltato: Szolgaltato = ollamaSzolgaltato): AiHivo {
  return async (feladat, bemenet) => {
    const rendszer = prompt(feladat, nyelv);
    try {
      const v = await szolgaltato.hiv({
        feladat,
        rendszer,
        szoveg: feladatSzoveg(feladat, bemenet),
        nyelv,
        maxKiToken: MAX_KI_TOKEN[feladat],
        idokorlatMs: 180_000, // a helyi modell hidegindítása mérve ~30 mp
      });
      const nyers = v.szoveg.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
      return { ok: true, valasz: JSON.parse(nyers) as unknown, becsult_usd: v.meres.becsult_usd };
    } catch (hiba) {
      if (hiba instanceof AiHiba) return { ok: false, kod: hiba.kod };
      return { ok: false, kod: "AI_ROSSZ_VALASZ" };
    }
  };
}
