import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import http from "node:http";
import { sorKeszit, utemezo, type Sor, type SorTetel } from "../src/csatlakozok/utemezo.js";
import { napiEsedekes } from "../src/csatlakozok/napi.js";
import { kiszolgalo, indit } from "../src/kiszolgalo.js";
import { memoriaTar, type Beallitas, type HirfigyeloTar, type HostKontextus, type Kornyezet } from "@km/news-monitor-core";

/** Egy tár, amelyben az aktív beállítás a megadott időzítést használja. */
async function tarIdozitessel(idozites: Beallitas["idozites"]): Promise<HirfigyeloTar> {
  const tar = memoriaTar();
  const beallitas: Beallitas = { celok: ["sajat_marka"], temak: [], foldrajzi_fokusz: "", nyelvek: ["hu"], kizarasok: [], idozites, szabad_szoveg: "" };
  await tar.verziokMent("sz1", [{ verzio: 1, beallitas, letrehozva: "2026-01-01T00:00:00.000Z", eredet: "kezi", allapot: "aktiv" }]);
  return tar;
}

// Segédfüggvények
let db: DatabaseSync;
let sor: Sor;
let idSzamlalo = 0;
const idAdo = () => `id_${++idSzamlalo}`;
const most = () => new Date("2025-01-15T10:00:00Z");

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  sor = sorKeszit(db, idAdo, most);
});

afterEach(() => {
  db.close();
});

describe("sor", () => {
  it("sorbaTesz kétszer ugyanannak a szervezetnek → a második FUT_MAR", () => {
    const elso = sor.sorbaTesz("sz1", "futas", {});
    expect(elso.ok).toBe(true);
    const masodik = sor.sorbaTesz("sz1", "futas", {});
    expect(masodik.ok).toBe(false);
    if (!masodik.ok) {
      expect(masodik.hiba).toBe("FUT_MAR");
    }
  });

  it("a tétel kesz után újra lehet sorba tenni", () => {
    const elso = sor.sorbaTesz("sz1", "futas", {});
    if (!elso.ok) throw new Error("Első besorolás sikertelen");
    sor.kesz(elso.sor.id, {});
    const masodik = sor.sorbaTesz("sz1", "futas", {});
    expect(masodik.ok).toBe(true);
  });

  it("kovetkezoKivesz a legrégebbit adja, fut állapotba teszi", () => {
    sor.sorbaTesz("sz1", "futas", {});
    sor.sorbaTesz("sz1", "napi", {});
    // A második FUT_MAR lesz, mert az első még var
    const tetel = sor.kovetkezoKivesz();
    expect(tetel).not.toBeNull();
    if (tetel) {
      expect(tetel.allapot).toBe("fut");
      expect(tetel.kezdve).not.toBeNull();
    }
    const ures = sor.kovetkezoKivesz();
    expect(ures).toBeNull();
  });

  it("üres sorra null", () => {
    const tetel = sor.kovetkezoKivesz();
    expect(tetel).toBeNull();
  });
});

describe("utemezo", () => {
  it("egyKor: futas tétel + hamis futtat → kesz, eredmeny", async () => {
    const sorbaTett = sor.sorbaTesz("sz1", "futas", {});
    if (!sorbaTett.ok) throw new Error("Besorolás sikertelen");
    const futtat = async (t: SorTetel) => ({ eredmeny: "sikeres" });
    const napiEsedekesFv = async () => [];
    const u = utemezo({ sor, futtat, napiEsedekes: napiEsedekesFv, most });
    await u.egyKor();
    const tetel = sor.tetel(sorbaTett.sor.id);
    expect(tetel).not.toBeNull();
    if (tetel) {
      expect(tetel.allapot).toBe("kesz");
      expect(tetel.eredmeny).toEqual({ eredmeny: "sikeres" });
    }
  });

  it("egyKor hibával: futtat kivételt dob → hiba, egyKor nem dob", async () => {
    const sorbaTett = sor.sorbaTesz("sz1", "futas", {});
    if (!sorbaTett.ok) throw new Error("Besorolás sikertelen");
    const futtat = async () => {
      throw new Error("Futtatási hiba");
    };
    const napiEsedekesFv = async () => [];
    const u = utemezo({ sor, futtat, napiEsedekes: napiEsedekesFv, most });
    await expect(u.egyKor()).resolves.toBeUndefined();
    const tetel = sor.tetel(sorbaTett.sor.id);
    expect(tetel).not.toBeNull();
    if (tetel) {
      expect(tetel.allapot).toBe("hiba");
      expect(tetel.hiba_ok).toBe("Futtatási hiba");
    }
  });
});

describe("napiEsedekes", () => {
  it("mod: kezi → üres", async () => {
    const tar = await tarIdozitessel({ mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" });
    const eredmeny = await napiEsedekes(tar, "sz1", most, () => null);
    expect(eredmeny).toEqual([]);
  });

  it("mod: napi, 07:00 Europe/Bucharest, most 08:00 helyi, utolsó tegnap → esedékes", async () => {
    const tar = await tarIdozitessel({ mod: "napi", ora: 7, perc: 0, idozona: "Europe/Bucharest" });
    // 2025-01-15T08:00:00+02:00 = 2025-01-15T06:00:00Z
    const mostHelyi = () => new Date("2025-01-15T06:00:00Z");
    const utolso = "2025-01-14T07:30:00+02:00";
    const eredmeny = await napiEsedekes(tar, "sz1", mostHelyi, () => utolso);
    expect(eredmeny).toEqual(["sz1"]);
  });

  it("ugyanez ma reggel 07:30-as utolsó futással → NEM esedékes", async () => {
    const tar = await tarIdozitessel({ mod: "napi", ora: 7, perc: 0, idozona: "Europe/Bucharest" });
    const mostHelyi = () => new Date("2025-01-15T06:00:00Z");
    const utolso = "2025-01-15T07:30:00+02:00";
    const eredmeny = await napiEsedekes(tar, "sz1", mostHelyi, () => utolso);
    expect(eredmeny).toEqual([]);
  });
});

describe("kiszolgalo", () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    const k = {
      most: () => new Date("2025-01-15T10:00:00Z"),
    } as unknown as Kornyezet;
    const ktx = { szervezet_id: "sz1" } as HostKontextus;
    server = kiszolgalo({ k, ktx, sor });
    await indit(server, 0);
    const cim = server.address();
    if (typeof cim === "object" && cim !== null) {
      port = cim.port;
    } else {
      throw new Error("Nem sikerült portot kapni");
    }
  });

  afterEach(() => {
    server.close();
  });

  it("GET /allapot 200", async () => {
    const valasz = await fetch(`http://localhost:${port}/allapot`);
    expect(valasz.status).toBe(200);
    const test = await valasz.json() as { allapot: string };
    expect(test.allapot).toBe("ok");
  });

  it("ismeretlen útvonal 404 NINCS_ILYEN_UTVONAL", async () => {
    const valasz = await fetch(`http://localhost:${port}/ismeretlen`);
    expect(valasz.status).toBe(404);
    const test = await valasz.json() as { hiba: string };
    expect(test.hiba).toBe("NINCS_ILYEN_UTVONAL");
  });

  it("POST /futtat 202 és a válaszban a sor tétele — CSAK írható bemutatóban", async () => {
    // A bemutató alapból csak olvasható (K-02): a valódi munkát indító pontok kikapcsolva.
    process.env["KM_REF_IRAS"] = "1";
    const valasz = await fetch(`http://localhost:${port}/futtat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proba: false }),
    });
    expect(valasz.status).toBe(202);
    const test = await valasz.json() as { sor: SorTetel };
    expect(test.sor.szervezet_id).toBe("sz1");
    expect(test.sor.fajta).toBe("futas");
    delete process.env["KM_REF_IRAS"];
  });

  it("POST /futtat alapból 403 CSAK_OLVASHATO — névtelenül nem indítható munka", async () => {
    delete process.env["KM_REF_IRAS"];
    const valasz = await fetch(`http://localhost:${port}/futtat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proba: false }),
    });
    expect(valasz.status).toBe(403);
    const test = await valasz.json() as { hiba: string };
    expect(test.hiba).toBe("CSAK_OLVASHATO");
  });

  it("POST /inditas alapból 403 CSAK_OLVASHATO", async () => {
    delete process.env["KM_REF_IRAS"];
    const valasz = await fetch(`http://localhost:${port}/inditas`, { method: "POST" });
    expect(valasz.status).toBe(403);
  });
});

// A fordított ellenőrzés nyomán (E-28): a beragadt tételek és az éjfél körüli időzítés.
describe("kiesés utáni helyreállás és éjfél (fordított ellenőrzésből)", () => {
  it("a folyamat leállásakor „fut” állapotban maradt tétel újranyitáskor visszakerül a sorba", () => {
    const sajatDb = new DatabaseSync(":memory:");
    const elso = sorKeszit(sajatDb, idAdo, most);
    const be = elso.sorbaTesz("sz1", "futas", {});
    expect(be.ok).toBe(true);
    expect(elso.kovetkezoKivesz()?.allapot).toBe("fut"); // itt „áll le” a folyamat

    const masodik = sorKeszit(sajatDb, idAdo, most); // újranyitás ugyanazon az adatbázison
    const tetel = masodik.kovetkezoKivesz();
    expect(tetel).not.toBeNull();
    expect(tetel?.fajta).toBe("futas");
    sajatDb.close();
  });

  it("éjfél után egy perccel is helyes a napi esedékesség (nem az előző nap)", async () => {
    const tar = await tarIdozitessel({ mod: "napi", ora: 0, perc: 0, idozona: "Europe/Bucharest" });
    // 2026-01-15T00:01 Bukarestben = 2026-01-14T22:01Z
    const mostEjfelUtan = () => new Date("2026-01-14T22:01:00.000Z");
    expect(await napiEsedekes(tar, "sz1", mostEjfelUtan, () => null)).toEqual(["sz1"]);
    // ugyanaznap 00:00:30-kor már futott → nem esedékes újra
    expect(await napiEsedekes(tar, "sz1", mostEjfelUtan, () => "2026-01-14T22:00:30.000Z")).toEqual([]);
  });
});
