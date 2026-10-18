// c1 + c7: a szövegépítők, az időzítés, a „ma már elment” őr és a hiányzó környezet. Hálózat és adatbázis nélkül.
import { describe, it, expect } from "vitest";
import {
  ablakKezdete,
  egySorba,
  ertesitesLepes,
  esedekes,
  helyiIdo,
  hubBeallitas,
  hubOsszesito,
  HUB_MAX_TETEL,
  jelzoBeolvas,
  rovidit,
  telegramBeallitas,
  telegramUzenet,
  reggeliUzenet,
  estiUzenet,
  keresztnev,
  cimzettek,
  TG_HATAR,
  TG_MAX_TETEL,
  TG_SZOVEG_MAX,
  type Jelzo,
  type TelegramFeliratok,
  type Visszajelzes,
} from "../src/index";

function vj(resz: Partial<Visszajelzes> & { id: string }): Visszajelzes {
  return {
    id: resz.id,
    szervezet_id: resz.szervezet_id ?? "sz-1",
    szervezet_nev: resz.szervezet_nev ?? "Térkő Kft.",
    fiok_id: resz.fiok_id ?? "f-1",
    fiok_nev: resz.fiok_nev ?? "Kovács Katalin",
    nevtelen: resz.nevtelen ?? false,
    lap: resz.lap ?? "/kepek",
    lap_cim: resz.lap_cim ?? "",
    elem: null,
    kijelolt_szoveg: "",
    szoveg: resz.szoveg ?? "Nem működik.",
    nyelv: "hu",
    kep: null,
    ablak: { w: 390, h: 844 },
    allapot: resz.allapot ?? "uj",
    letrehozva: "2026-10-08T10:00:00.000Z",
    csomag_id: null,
  };
}

const F: TelegramFeliratok = {
  cim: "Tegnap javítva",
  tobb: (n) => `…és még ${n}`,
  link: (u) => `Részletek: ${u}`,
};
const URL = "https://saas.mediapartizan.ro/visszajelzes";

describe("idő: Europe/Bucharest", () => {
  it("nyári időben 23:30 UTC már a következő nap 02:30-a", () => {
    expect(helyiIdo(new Date("2026-10-08T23:30:00Z"))).toEqual({ nap: "2026-10-09", ora: 2 });
  });
  it("téli időben 00:30 UTC = 02:30 helyi", () => {
    expect(helyiIdo(new Date("2026-12-10T00:30:00Z"))).toEqual({ nap: "2026-12-10", ora: 2 });
  });
  it("esedékes: a célóra előtt nem, utána igen, ugyanazon a napon másodszor nem", () => {
    const elotte = new Date("2026-10-08T22:59:00Z"); // 01:59 helyi
    const utana = new Date("2026-10-08T23:01:00Z"); // 02:01 helyi
    expect(esedekes(elotte, 2, null)).toBe(false);
    expect(esedekes(utana, 2, null)).toBe(true);
    expect(esedekes(utana, 2, { nap: "2026-10-09", ig: utana.toISOString() })).toBe(false);
    expect(esedekes(utana, 2, { nap: "2026-10-08", ig: "2026-10-07T23:00:00Z" })).toBe(true);
  });
  it("újraindulás után később a nap folyamán pótol (de csak egyszer)", () => {
    expect(esedekes(new Date("2026-10-09T12:00:00Z"), 8, { nap: "2026-10-08", ig: "x" })).toBe(true);
  });
  it("ablak: a jelzőtől, jelző nélkül 24 órával korábbról", () => {
    const most = new Date("2026-10-09T05:00:00Z");
    expect(ablakKezdete(most, null).toISOString()).toBe("2026-10-08T05:00:00.000Z");
    expect(ablakKezdete(most, { nap: "2026-10-08", ig: "2026-10-08T05:00:03.000Z" }).toISOString()).toBe("2026-10-08T05:00:03.000Z");
    expect(ablakKezdete(most, { nap: "2026-10-08", ig: "szemét" }).toISOString()).toBe("2026-10-08T05:00:00.000Z");
  });
  it("jelző beolvasása: rossz alak → null", () => {
    expect(jelzoBeolvas(null)).toBeNull();
    expect(jelzoBeolvas({ nap: 5 })).toBeNull();
    expect(jelzoBeolvas({ nap: "tegnap", ig: "x" })).toBeNull();
    expect(jelzoBeolvas({ nap: "2026-10-09", ig: "2026-10-09T05:00:00Z" })).toEqual({ nap: "2026-10-09", ig: "2026-10-09T05:00:00Z" });
  });
});

describe("környezet", () => {
  it("hiányzó Telegram-változó → null", () => {
    expect(telegramBeallitas({})).toBeNull();
    expect(telegramBeallitas({ TELEGRAM_BOT_TOKEN: "x" })).toBeNull();
    expect(telegramBeallitas({ TELEGRAM_BOT_TOKEN: "  ", TELEGRAM_CHAT_ID: "-5557911968" })).toBeNull();
    expect(telegramBeallitas({ TELEGRAM_BOT_TOKEN: "1:abc", TELEGRAM_CHAT_ID: "-5557911968" })).toEqual({ token: "1:abc", chat: "-5557911968" });
  });
  it("hub: cím + kulcs kell, a cím http(s)", () => {
    expect(hubBeallitas({ HUB_FEEDBACK_URL: "https://hub.example/x" })).toBeNull();
    expect(hubBeallitas({ HUB_FEEDBACK_URL: "ftp://x", HUB_WRITE_KEY: "k" })).toBeNull();
    expect(hubBeallitas({ HUB_FEEDBACK_URL: "https://hub.example/x", HUB_WRITE_KEY: "k" })).toEqual({ url: "https://hub.example/x", kulcs: "k", slug: "kommunikacios-munkater" });
  });
});

describe("c1 hub-összesítő", () => {
  it("üres nap → null", () => {
    expect(hubOsszesito([], "2026-10-08")).toBeNull();
  });
  it("ékezetek, idézés szó szerint, lap és szerző egy sorban", () => {
    const sz = hubOsszesito(
      [
        vj({ id: "1", szoveg: "A „Letöltés” gomb nem működik, árvíztűrő tükörfúrógép!", lap: "/kepek", lap_cim: "Képek", fiok_nev: "Kovács Katalin" }),
        vj({ id: "2", szoveg: "Butonul nu merge — țară, șir", lap: "/belepes", nevtelen: true, fiok_nev: "" }),
      ],
      "2026-10-08",
    )!;
    const sorok = sz.split("\n");
    expect(sorok).toHaveLength(3);
    expect(sorok[0]).toContain("2026-10-08");
    expect(sorok[0]).toContain("2 új tétel");
    expect(sorok[1]).toBe("- „A „Letöltés” gomb nem működik, árvíztűrő tükörfúrógép!” — Képek (/kepek) — Kovács Katalin");
    expect(sorok[2]).toBe("- „Butonul nu merge — țară, șir” — /belepes — névtelen");
  });
  it("többsoros tesztelői szöveg egy sorba, a szavak nem változnak, nem rövidül", () => {
    const hosszu = "Első sor.\n\nMásodik   sor, " + "nagyon hosszú ".repeat(150);
    const sz = hubOsszesito([vj({ id: "1", szoveg: hosszu })], "2026-10-08")!;
    expect(sz.split("\n")).toHaveLength(2);
    expect(sz).toContain("Első sor. / Második sor, nagyon hosszú");
    expect(sz).not.toContain("…");
  });
  it("sok tétel: legfeljebb HUB_MAX_TETEL sor + egy „és még” sor", () => {
    const sok = Array.from({ length: HUB_MAX_TETEL + 7 }, (_, i) => vj({ id: String(i), szoveg: `Hiba ${i}` }));
    const sorok = hubOsszesito(sok, "2026-10-08")!.split("\n");
    expect(sorok).toHaveLength(1 + HUB_MAX_TETEL + 1);
    expect(sorok.at(-1)).toContain("és még 7 tétel");
    expect(sorok[0]).toContain(`${HUB_MAX_TETEL + 7} új tétel`);
  });
});

describe("c7 Telegram-üzenet", () => {
  it("nincs kész tétel → null (nincs üzenet)", () => {
    expect(telegramUzenet([], F, URL)).toBeNull();
  });
  it("cím, tételenként egy sor (szöveg — lap), a végén a link", () => {
    const u = telegramUzenet(
      [
        { szoveg: "A jelszó mutatása gomb halott", lap: "/regisztracio", lap_cim: "Regisztráció" },
        { szoveg: "Túlcsordul a „Mutasd be a szervezetet”", lap: "/onboarding", lap_cim: "" },
      ],
      F,
      URL,
    )!;
    expect(u.split("\n")).toEqual([
      "Tegnap javítva",
      "",
      "• A jelszó mutatása gomb halott — Regisztráció",
      "• Túlcsordul a „Mutasd be a szervezetet” — /onboarding",
      "",
      `Részletek: ${URL}`,
    ]);
  });
  it("hosszú tesztelői szöveg rövidül, szóhatáron, „…”-val", () => {
    const hosszu = "Amikor a telefonon megnyitom a képeket és rányomok a letöltésre, akkor először semmi nem történik, aztán kétszer tölti le ugyanazt a képet.";
    const u = telegramUzenet([{ szoveg: hosszu, lap: "/kepek", lap_cim: "Képek" }], F, URL)!;
    const sor = u.split("\n")[2]!;
    const szoveg = sor.slice(2, sor.lastIndexOf(" — "));
    expect([...szoveg].length).toBeLessThanOrEqual(TG_SZOVEG_MAX);
    expect(szoveg.endsWith("…")).toBe(true);
    expect(hosszu.startsWith(szoveg.slice(0, -1))).toBe(true);
  });
  it("sok tétel: legfeljebb TG_MAX_TETEL sor + „és még”, és a Telegram határa alatt", () => {
    const sok = Array.from({ length: 45 }, (_, i) => ({ szoveg: "ő".repeat(300) + i, lap: "/x", lap_cim: "Hosszú lapcím ".repeat(30) }));
    const u = telegramUzenet(sok, F, URL)!;
    expect(u.split("\n").filter((s) => s.startsWith("• "))).toHaveLength(TG_MAX_TETEL);
    expect(u).toContain(`…és még ${45 - TG_MAX_TETEL}`);
    expect([...u].length).toBeLessThanOrEqual(TG_HATAR);
  });
  it("rovidit: rövid szöveg változatlan, ékezet egy karakter", () => {
    expect(rovidit("Árvíztűrő", 9)).toBe("Árvíztűrő");
    expect(egySorba("  a \n\n b  ")).toBe("a / b");
  });
});

describe("ertesitesLepes: őr, hiányzó környezet, hiba", () => {
  function lepes(o: { most: string; jelzo: Jelzo | null; beallitva?: boolean; tetelek?: string[]; kuldHiba?: boolean }) {
    const irt: Jelzo[] = [];
    let olvasott = 0;
    const kuldott: string[] = [];
    const lekert: [Date, Date][] = [];
    const p = ertesitesLepes<string>({
      most: new Date(o.most),
      celOra: 8,
      beallitva: o.beallitva ?? true,
      jelzoOlvas: async () => { olvasott++; return o.jelzo; },
      jelzoIr: async (j) => { irt.push(j); },
      tetelek: async (tol, ig) => { lekert.push([tol, ig]); return o.tetelek ?? []; },
      szoveg: (t) => (t.length ? `Tegnap javítva\n${t.join("\n")}` : null),
      kuld: async (s) => { if (o.kuldHiba) throw new Error("HTTP 502"); kuldott.push(s); },
      naplo: () => {},
    });
    return { p, irt, kuldott, lekert, olvasott: () => olvasott };
  }
  const REGGEL = "2026-10-09T05:00:02Z"; // 08:00 helyi

  it("küld, majd a jelzőt mára állítja", async () => {
    const t = lepes({ most: REGGEL, jelzo: { nap: "2026-10-08", ig: "2026-10-08T05:00:01Z" }, tetelek: ["a", "b"] });
    expect(await t.p).toEqual({ tortent: "elkuldve", db: 2 });
    expect(t.kuldott).toHaveLength(1);
    expect(t.irt).toEqual([{ nap: "2026-10-09", ig: "2026-10-09T05:00:02.000Z" }]);
    expect(t.lekert[0]![0].toISOString()).toBe("2026-10-08T05:00:01.000Z");
  });
  it("ma már elment (újraindulás után) → nem küld, nem kérdez le", async () => {
    const t = lepes({ most: "2026-10-09T05:30:00Z", jelzo: { nap: "2026-10-09", ig: REGGEL }, tetelek: ["a"] });
    expect(await t.p).toEqual({ tortent: "nem_esedekes" });
    expect(t.kuldott).toHaveLength(0);
    expect(t.lekert).toHaveLength(0);
    expect(t.irt).toHaveLength(0);
  });
  it("hiányzó környezet → semmi: nincs lekérdezés, nincs küldés, a jelző nem lép", async () => {
    const t = lepes({ most: REGGEL, jelzo: null, beallitva: false, tetelek: ["a"] });
    expect(await t.p).toEqual({ tortent: "nincs_beallitva" });
    expect(t.olvasott()).toBe(0); // az adatbázishoz sem nyúl
    expect(t.lekert).toHaveLength(0);
    expect(t.kuldott).toHaveLength(0);
    expect(t.irt).toHaveLength(0);
  });
  it("nincs mit küldeni → nincs üzenet, de a jelző lép (ma ne kérdezzen újra)", async () => {
    const t = lepes({ most: REGGEL, jelzo: null, tetelek: [] });
    expect(await t.p).toEqual({ tortent: "nincs_mit", db: 0 });
    expect(t.kuldott).toHaveLength(0);
    expect(t.irt).toHaveLength(1);
  });
  it("küldési hiba → a jelző NEM lép (a következő próba ugyanazt viszi)", async () => {
    const t = lepes({ most: REGGEL, jelzo: null, tetelek: ["a"], kuldHiba: true });
    expect(await t.p).toEqual({ tortent: "hiba", uzenet: "HTTP 502" });
    expect(t.irt).toHaveLength(0);
  });
  it("a célóra előtt → nem esedékes", async () => {
    const t = lepes({ most: "2026-10-09T04:59:00Z", jelzo: null, tetelek: ["a"] });
    expect(await t.p).toEqual({ tortent: "nem_esedekes" });
  });
});

// 2026-10-09 08:13 (Csilla): az összevont reggeli üzenet helyett két személyre szóló üzenet — a 07:53-as összevont üzenet próbái
// ezért kerültek ki (a builder sincs már meg; rule 10: az ok itt áll).
describe("c1 + c7: két személyre szóló üzenet (2026-10-09 08:13)", () => {
  const FR = {
    fej: (nev: string, n: number) => `${nev}, tegnap ${n} dolgot javítottunk — kérlek, nézd meg újra:`,
    tobb: (n: number) => `…és még ${n}`,
    link: (u: string) => `Mind egy helyen: ${u}`,
    jelezte: (nev: string) => `jelezte: ${nev}`,
    hub: "Nézd meg a hub kártyát is — lehet új tesztfeladat.",
  };
  const HUB = FR.hub;
  const FE = { ...FR, fej: (nev: string, n: number) => `${nev}, ma ${n} új visszajelzés jött:` };
  const t = (szoveg: string, lap: string, fiok_nev: string, lap_cim = "", nevtelen = false) => ({ szoveg, lap, lap_cim, fiok_nev, nevtelen });

  it("címzettek: környezetből, alapérték Kati és Csilla", () => {
    expect(cimzettek({})).toEqual({ tesztelo: "Kati", fejleszto: "Csilla" });
    expect(cimzettek({ TELEGRAM_TESZTELO_NEV: " Kamilla ", TELEGRAM_FEJLESZTO_NEV: "Vilmos" })).toEqual({ tesztelo: "Kamilla", fejleszto: "Vilmos" });
  });
  it("N = 0 → egyik üzenet sem megy", () => {
    expect(reggeliUzenet([], "Kati", FR, URL)).toBeNull();
    expect(estiUzenet([], "Csilla", FE, URL)).toBeNull();
  });
  // 2026-10-09: a „jelezte” mindig ott van (Kati fiókjai „Szente Katalin”, „Szente”, „Bruno Mars” — névösszevetés nem működhet; rule 10)
  it("reggel N = 1: a tesztelő neve (környezetből), a darabszám, a tétel „jelezte: <keresztnév>”-vel, a link", () => {
    expect(reggeliUzenet([t("A jelszó mutatása gomb halott", "/regisztracio", "Szente Katalin", "Regisztráció")], "Kati", FR, URL)!.split("\n")).toEqual([
      "Kati, tegnap 1 dolgot javítottunk — kérlek, nézd meg újra:",
      "• A jelszó mutatása gomb halott — Regisztráció — jelezte: Katalin",
      "",
      `Mind egy helyen: ${URL}`,
      HUB, // Csilla 2026-10-10 21:55: a reggeli üzenet záró sora a link alatt (rule 10: ezért nőtt a várt sorlista)
    ]);
  });
  it("reggel: minden sorban „jelezte”, egyszavas névnél az az egy szó, névtelennél „névtelen”", () => {
    const u = reggeliUzenet([t("Túlcsordul a gomb", "/onboarding", "Bruno Mars"), t("Nem tudok belépni, țară", "/belepes", "", "", true), t("Saját", "/x", "Szente")], "Kati", FR, URL)!;
    const sorok = u.split("\n");
    expect(sorok[0]).toBe("Kati, tegnap 3 dolgot javítottunk — kérlek, nézd meg újra:");
    expect(sorok[1]).toBe("• Túlcsordul a gomb — /onboarding — jelezte: Mars");
    expect(sorok[2]).toBe("• Nem tudok belépni, țară — /belepes — jelezte: névtelen");
    expect(sorok[3]).toBe("• Saját — /x — jelezte: Szente");
  });
  it("este N = 1: a fejlesztő neve, darabszám, szavak — lap — keresztnév", () => {
    expect(estiUzenet([t("A „Letöltés” kétszer tölt le", "/kepek", "Kovács Katalin", "Képek")], "Csilla", FE, URL)!.split("\n")).toEqual([
      "Csilla, ma 1 új visszajelzés jött:",
      "• A „Letöltés” kétszer tölt le — Képek — Katalin",
      "",
      `Mind egy helyen: ${URL}`,
    ]);
  });
  it("sok tétel: legfeljebb TG_MAX_TETEL sor + „…és még N”, a fejben a teljes darabszám", () => {
    const sok = Array.from({ length: 33 }, (_, i) => t(`Hiba ${i}`, "/x", "Anna"));
    const u = estiUzenet(sok, "Csilla", FE, URL)!;
    expect(u.split("\n")[0]).toBe("Csilla, ma 33 új visszajelzés jött:");
    expect(u.split("\n").filter((x) => x.startsWith("• "))).toHaveLength(TG_MAX_TETEL);
    expect(u).toContain(`…és még ${33 - TG_MAX_TETEL}`);
  });
  it("csonkolás: hosszú sorokkal is 4096 alatt, a „…és még N” és a link megmarad (mindkét üzenet)", () => {
    const hosszu = Array.from({ length: 20 }, (_, i) => t("ő".repeat(400) + i, "/" + "y".repeat(300), "Szabó-Nagy Éva Ágnes", "Hosszú lapcím ".repeat(30)));
    // Csilla 2026-10-10 21:55: a reggeli üzenet utolsó sora a hub-sor, előtte a link; az estié a link (rule 10: ezért két elvárás)
    for (const [u, vege] of [[reggeliUzenet(hosszu, "Kati", FR, URL)!, [`Mind egy helyen: ${URL}`, HUB]], [estiUzenet(hosszu, "Csilla", FE, URL)!, [`Mind egy helyen: ${URL}`]]] as const) {
      expect([...u].length).toBeLessThanOrEqual(TG_HATAR);
      const db = u.split("\n").filter((x) => x.startsWith("• ")).length;
      expect(db).toBe(20); // a rövidítés miatt 20 sor elfér
      expect(u.split("\n").slice(-vege.length)).toEqual([...vege]);
    }
    const nagyonSok = Array.from({ length: 20 }, () => t("x", "/x", "Anna"));
    const szuk = estiUzenet(nagyonSok, "Csilla", { ...FE, fej: () => "F".repeat(4000) }, URL)!;
    expect([...szuk].length).toBeLessThanOrEqual(TG_HATAR);
    expect(szuk).toMatch(/…és még \d+/);
    expect(szuk.split("\n").at(-1)).toBe(`Mind egy helyen: ${URL}`);
    // a reggeli üzenet szűk helyen is megtartja a linket ÉS a hub-sort (a tételek fogynak, nem a záró sorok)
    const szukR = reggeliUzenet(nagyonSok, "Kati", { ...FR, fej: () => "F".repeat(3950) }, URL)!;
    expect([...szukR].length).toBeLessThanOrEqual(TG_HATAR);
    expect(szukR).toMatch(/…és még \d+/);
    expect(szukR.split("\n").slice(-2)).toEqual([`Mind egy helyen: ${URL}`, HUB]);
  });
  it("reggel: sorrend fej · tételek · …és még N · üres sor · link · hub-sor; az esti üzenetben nincs hub-sor", () => {
    const sok = Array.from({ length: TG_MAX_TETEL + 2 }, (_, i) => t(`Hiba ${i}`, "/x", "Anna"));
    const s = reggeliUzenet(sok, "Kati", FR, URL)!.split("\n");
    expect(s[0]).toBe(`Kati, tegnap ${TG_MAX_TETEL + 2} dolgot javítottunk — kérlek, nézd meg újra:`);
    expect(s.slice(1, 1 + TG_MAX_TETEL).every((x) => x.startsWith("• "))).toBe(true);
    expect(s.slice(1 + TG_MAX_TETEL)).toEqual(["…és még 2", "", `Mind egy helyen: ${URL}`, HUB]);
    expect(estiUzenet(sok, "Csilla", FE, URL)).not.toContain(HUB);
  });
  it("keresztnév: a név utolsó szava; üres → névtelen", () => {
    expect(keresztnev({ fiok_nev: "Kovács Katalin", nevtelen: false })).toBe("Katalin");
    expect(keresztnev({ fiok_nev: "  ", nevtelen: false })).toBe("névtelen");
  });
});
