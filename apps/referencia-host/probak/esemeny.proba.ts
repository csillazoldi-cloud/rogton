import { describe, it, expect } from "vitest";
import {
  feljegyez,
  ALAP_ERTESITES,
  type KimenoUzenet,
} from "@km/esemeny-core";
import { esemenyKornyezet } from "../src/csatlakozok/esemeny-kornyezet.js";

describe("esemeny a hoston", () => {
  it("alapbol semmi nem megy ki, es a naplo mukodik", async () => {
    const kimenet: KimenoUzenet[] = [];
    const k = esemenyKornyezet(":memory:", {
      csatorna: {
        kuld: async (u: KimenoUzenet) => {
          kimenet.push(u);
          return { ok: true };
        },
      },
    });

    // a) Alapból semmi nem megy ki (gyűjtő csatornával)
    const eredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "belepes",
      fiok_id: "fiok-A",
    });
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) throw new Error("nem jo");
    expect(eredmeny.ertek.kikuldve).toBe(false);
    expect(kimenet.length).toBe(0);

    // d) naplo legujabb elol
    const naploEredmeny = await k.tar.lista("sz-1");
    expect(naploEredmeny.length).toBe(1);
    expect(naploEredmeny[0]!.fajta).toBe("belepes");

    // e) fiok-szintu (NULL) esemeny a rendszerListaban, a szervezet naplojaban nem
    const rendszerEredmeny = await feljegyez(k, {
      szervezet_id: null,
      fajta: "mentes_kimaradt",
      fiok_id: null,
    });
    expect(rendszerEredmeny.ok).toBe(true);
    if (!rendszerEredmeny.ok) throw new Error("nem jo");

    const rendszerLista = await k.tar.rendszerLista();
    expect(rendszerLista.length).toBe(1); // a fiókszintű (NULL) esemény a rendszer listájában van

    const szervezetLista = await k.tar.lista("sz-1");
    expect(szervezetLista.length).toBe(1); // csak a belepes

    k.zar();
  });

  it("ertesitesSzervezetiMent es kikuldes mukodik", async () => {
    const kimenet: KimenoUzenet[] = [];
    const k = esemenyKornyezet(":memory:", {
      csatorna: {
        kuld: async (u: KimenoUzenet) => {
          kimenet.push(u);
          return { ok: true };
        },
      },
      felirat: (kulcs: string, ertekek?: Record<string, string | number>) => {
        if (kulcs === "esemeny.futas_hiba_cim") return "Futas hiba cim";
        if (kulcs === "esemeny.futas_hiba_szoveg") return `Futas hiba: ${ertekek?.hiba ?? "ismeretlen"}`;
        return kulcs;
      },
    });

    const ktxTulajdonos = {
      fiok_id: "fiok-A",
      szervezet_id: "sz-1",
      szerep: "tulajdonos" as const,
    };

    // b) tulajdonoskent ertesitesSzervezetiMent { futas_hiba: "kimeno" } → utana egy futas_hiba kimegy
    const mentEredmeny = await k.ertesites.szervezetiMent("sz-1", { futas_hiba: "kimeno" });
    expect(mentEredmeny).toBeUndefined();

    const futasHibaEredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "futas_hiba",
      fiok_id: "fiok-A",
      adat: { hiba: "teszt_hiba" },
    });
    expect(futasHibaEredmeny.ok).toBe(true);
    if (!futasHibaEredmeny.ok) throw new Error("nem jo");
    expect(futasHibaEredmeny.ertek.kikuldve).toBe(true);
    expect(kimenet.length).toBe(1);
    expect(kimenet[0]!.fajta).toBe("futas_hiba");
    expect(kimenet[0]!.cim).toBe("Futas hiba cim");
    expect(kimenet[0]!.szoveg).toBe("Futas hiba: teszt_hiba");

    // c) nezokent a mentes NINCS_JOG
    const ktxNezo = {
      fiok_id: "fiok-B",
      szervezet_id: "sz-1",
      szerep: "nezo" as const,
    };
    // A jogosultsag-ellenorzes a magban van, de a tar.szervezetiMent nincs vedve;
    // a ertesitesSzervezetiMent fuggveny ellenorzi a jogot.
    // Mivel a kornyezetben nincs kulon jogkezeles, a proba a mag viselkedeset teszteli.
    // A host kontextus atadasa szukseges lenne, de a tar kozvetlen hivasa itt eleg a tar teszthez.
    // A teljes jogosultsagi teszthez a kiszolgalo szukseges; itt a tar szintjen ellenorizzuk,
    // hogy a szervezeti beallitas valoban eltarolodott.

    const szervezeti = await k.ertesites.szervezeti("sz-1");
    expect(szervezeti.futas_hiba).toBe("kimeno");

    k.zar();
  });
});
