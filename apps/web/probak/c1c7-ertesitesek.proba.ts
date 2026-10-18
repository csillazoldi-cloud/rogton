// c1 + c7 (docs/decisions/2026-10-09-c1-c7-telegram.md), az adatbázissal (DATABASE_URL), hálózat NÉLKÜL: a fetch-et a próba fogja el.
//  - a 0154 `kesz_ido`: „kész”-re tételkor kitöltődik, újabb „kész” nem írja át, visszalépéskor törlődik;
//  - hiányzó környezet → semmi: nincs hívás, nincs jelző;
//  - 2026-10-09 08:13 (Csilla): KÉT személyre szóló üzenet (rule 10: ezért változtak az elvárások, az ok itt áll) —
//    08:00 után EGY reggeli üzenet a tesztelőnek (a javított tételek, „jelezte: …” ha nem ő), 19:00 után EGY esti a fejlesztőnek
//    (az előző esti üzenet óta beérkezett tételek); külön napi jelzővel (ertesites.telegram / ertesites.telegram_este);
//    A kikapcsolt hub-küldő próbája marad: ha a HUB_* változók be vannak állítva, a küldő még ugyanúgy működik (02:00 után EGY bejegyzés);
//    a következő percben (újraindulás után is) nem megy újra — a jelző a rendszer_beallitas-ban;
//  - nincs kész tétel → nincs üzenet; küldési hiba → a jelző nem lép.
// A „most” egy 2030-as nap, hogy a többi próba (valós idejű) sorai ne essenek az ablakba.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { lezar, sql } from "./segedek";
import { allapotValt, ertesitesekTick } from "../visszajelzes";

const MOST = new Date("2030-01-15T07:00:00Z"); // 09:00 Bukarestben (télen +2) — mindkét célóra elmúlt
const NAP = "2030-01-15";
const TOKEN = "123456:proba-token-nem-valodi";
const ENV = {
  TELEGRAM_BOT_TOKEN: TOKEN,
  TELEGRAM_CHAT_ID: "-5557911968",
  HUB_FEEDBACK_URL: "https://hub.proba.example/feedback",
  HUB_WRITE_KEY: "proba-hub-kulcs",
};

type Hivas = { url: string; torzs: Record<string, unknown>; fej: Record<string, string> };
let hivasok: Hivas[] = [];
let valasz: () => Response = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

const ids: string[] = [];
let eredetiJelzok: { kulcs: string; ertek: unknown }[] = [];

async function ujVj(szoveg: string, lap: string, lapCim: string, letrehozva: Date): Promise<string> {
  const [s] = await sql<{ id: string }>(
    `INSERT INTO visszajelzes (szervezet_id, fiok_id, fiok_nev, nevtelen, lap, lap_cim, szoveg, nyelv, ablak, letrehozva)
     VALUES (NULL, NULL, $1, false, $2, $3, $4, 'hu', '{"w":390,"h":844}', $5) RETURNING id`,
    ["Kovács Katalin", lap, lapCim, szoveg, letrehozva.toISOString()],
  );
  ids.push(s!.id);
  return s!.id;
}

describe("c1 + c7 értesítések (élő adatbázis, elfogott hálózat)", () => {
  beforeAll(async () => {
    eredetiJelzok = await sql("SELECT kulcs, ertek FROM rendszer_beallitas WHERE kulcs IN ('ertesites.hub', 'ertesites.telegram', 'ertesites.telegram_este')");
    await sql("DELETE FROM rendszer_beallitas WHERE kulcs IN ('ertesites.hub', 'ertesites.telegram', 'ertesites.telegram_este')");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (cim, opciok) => {
      const fej = Object.fromEntries(new Headers(opciok?.headers).entries());
      hivasok.push({ url: String(cim), torzs: JSON.parse(String(opciok?.body ?? "{}")) as Record<string, unknown>, fej });
      return valasz();
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    if (ids.length) await sql("DELETE FROM visszajelzes WHERE id = ANY($1::uuid[])", [ids]);
    await sql("DELETE FROM rendszer_beallitas WHERE kulcs IN ('ertesites.hub', 'ertesites.telegram', 'ertesites.telegram_este')");
    for (const e of eredetiJelzok) await sql("INSERT INTO rendszer_beallitas (kulcs, ertek) VALUES ($1, $2::jsonb)", [e.kulcs, JSON.stringify(e.ertek)]);
    await lezar();
  });

  it("0154: „kész”-re tételkor kitöltődik a kesz_ido, újabb „kész” nem írja át, visszalépéskor törlődik", async () => {
    const id = await ujVj("Próba: árvíztűrő tükörfúrógép", "/kepek", "Képek", new Date());
    expect(await allapotValt(id, "kesz", null)).toBe(true);
    const [a] = await sql<{ kesz_ido: Date | null }>("SELECT kesz_ido FROM visszajelzes WHERE id = $1", [id]);
    expect(a!.kesz_ido).not.toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    await allapotValt(id, "kesz", null);
    const [b] = await sql<{ kesz_ido: Date | null }>("SELECT kesz_ido FROM visszajelzes WHERE id = $1", [id]);
    expect(b!.kesz_ido!.getTime()).toBe(a!.kesz_ido!.getTime());
    await allapotValt(id, "uj", null);
    const [c] = await sql<{ kesz_ido: Date | null }>("SELECT kesz_ido FROM visszajelzes WHERE id = $1", [id]);
    expect(c!.kesz_ido).toBeNull();
  });

  it("hiányzó környezet → nincs hívás, nincs jelző, nincs hiba", async () => {
    hivasok = [];
    await ertesitesekTick(MOST, {});
    expect(hivasok).toHaveLength(0);
    expect(await sql("SELECT kulcs FROM rendszer_beallitas WHERE kulcs LIKE 'ertesites.%'")).toHaveLength(0);
  });

  it("09:00: EGY reggeli üzenet a tesztelőnek (az esti még nem esedékes); 19:30: EGY esti a fejlesztőnek; a következő percben semmi", async () => {
    const egyOraja = new Date(MOST.getTime() - 60 * 60_000);
    await ujVj("A „Letöltés” gomb kétszer tölti le a képet, árvíztűrő", "/kepek", "Képek", egyOraja);
    const kesz = await ujVj("Túlcsordul a „Mutasd be a szervezetet” — telefonon", "/onboarding", "", egyOraja);
    await allapotValt(kesz, "kesz", null);
    await sql("UPDATE visszajelzes SET kesz_ido = $2 WHERE id = $1", [kesz, egyOraja.toISOString()]);

    hivasok = [];
    await ertesitesekTick(MOST, ENV);
    const tg = hivasok.filter((h) => h.url.startsWith("https://api.telegram.org/"));
    const hub = hivasok.filter((h) => h.url === ENV.HUB_FEEDBACK_URL);
    expect(tg).toHaveLength(1);
    expect(tg[0]!.url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(tg[0]!.torzs["chat_id"]).toBe("-5557911968");
    const reggel = String(tg[0]!.torzs["text"]).split("\n");
    expect(reggel[0]).toBe("Kati, tegnap 1 dolgot javítottunk — kérlek, nézd meg újra:");
    expect(reggel[1]).toBe("• Túlcsordul a „Mutasd be a szervezetet” — telefonon — /onboarding — jelezte: Katalin");
    // Csilla 2026-10-10 21:55: a link alatt a hub-sor (vj.tg_hub, 0161) — ezért 4 → 5 sor (rule 10)
    expect(reggel).toHaveLength(5);
    expect(reggel[3]).toMatch(/\/visszajelzes$/);
    expect(reggel[4]).toBe("Nézd meg a hub kártyát is — lehet új tesztfeladat.");
    // a kikapcsolt hub-küldő: csak mert a próba beállítja a HUB_* változókat, megy ki (a NAS-on nincsenek beállítva)
    expect(hub).toHaveLength(1);
    expect(hub[0]!.fej["authorization"]).toBe("Bearer proba-hub-kulcs");
    expect(String(hub[0]!.torzs["text"])).toContain("2 új tétel");

    hivasok = [];
    const este = new Date("2030-01-15T17:30:00Z"); // 19:30 Bukarestben
    await ertesitesekTick(este, { ...ENV, TELEGRAM_FEJLESZTO_NEV: "Csilla" });
    expect(hivasok).toHaveLength(1);
    const esti = String(hivasok[0]!.torzs["text"]).split("\n");
    expect(esti[0]).toBe("Csilla, ma 2 új visszajelzés jött:");
    expect(esti[1]).toBe("• A „Letöltés” gomb kétszer tölti le a képet, árvíztűrő — Képek — Katalin");
    expect(esti[2]).toBe("• Túlcsordul a „Mutasd be a szervezetet” — telefonon — /onboarding — Katalin");

    const jelzok = await sql<{ kulcs: string; ertek: { nap: string } }>("SELECT kulcs, ertek FROM rendszer_beallitas WHERE kulcs LIKE 'ertesites.%' ORDER BY kulcs");
    expect(jelzok.map((j) => [j.kulcs, j.ertek.nap])).toEqual([["ertesites.hub", NAP], ["ertesites.telegram", NAP], ["ertesites.telegram_este", NAP]]);

    hivasok = [];
    await ertesitesekTick(new Date(este.getTime() + 60_000), ENV);
    expect(hivasok).toHaveLength(0);
  });

  it("másnap nincs se új, se kész tétel → se reggeli, se esti üzenet; mindkét jelző lép (az esti ablak az előző esti üzenettől indul)", async () => {
    const tgEnv = { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: "-5557911968" };
    hivasok = [];
    await ertesitesekTick(new Date(MOST.getTime() + 24 * 60 * 60_000), tgEnv);
    await ertesitesekTick(new Date("2030-01-16T17:30:00Z"), tgEnv);
    expect(hivasok).toHaveLength(0);
    const j = await sql<{ kulcs: string; ertek: { nap: string } }>("SELECT kulcs, ertek FROM rendszer_beallitas WHERE kulcs IN ('ertesites.telegram', 'ertesites.telegram_este') ORDER BY kulcs");
    expect(j.map((x) => x.ertek.nap)).toEqual(["2030-01-16", "2030-01-16"]);
  });

  it("küldési hiba → a jelző nem lép (utolsó próba: utána 10 percig nem próbál újra)", async () => {
    const harmadnap = new Date(MOST.getTime() + 48 * 60 * 60_000);
    const id = await ujVj("Hibás küldés próbája", "/kezdolap", "Kezdőlap", new Date(harmadnap.getTime() - 60_000));
    await allapotValt(id, "kesz", null);
    await sql("UPDATE visszajelzes SET kesz_ido = $2 WHERE id = $1", [id, new Date(harmadnap.getTime() - 60_000).toISOString()]);
    valasz = () => new Response(JSON.stringify({ ok: false, description: "Bad Gateway" }), { status: 502 });
    hivasok = [];
    await ertesitesekTick(harmadnap, { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: "-5557911968" });
    expect(hivasok).toHaveLength(1);
    const [j] = await sql<{ ertek: { nap: string } }>("SELECT ertek FROM rendszer_beallitas WHERE kulcs = 'ertesites.telegram'");
    expect(j!.ertek.nap).toBe("2030-01-16");
  });
});
