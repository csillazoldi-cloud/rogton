// E-34: belépési védelem — sebességkorlát, jelszó-visszaállítás, takarítás.
// ÉLŐ próbák: a futó alkalmazás és az adatbázis ellen mennek.
//
// Minden próba SAJÁT `x-forwarded-for` címet használ, hogy a próbák ne fogyasszák egymás keretét.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail, DATABASE_URL } from "./segedek";

const JELSZO = "ProbaJelszo123!";
const VAN_ADATBAZIS = DATABASE_URL !== "";

/** Egyedi álcím próbánként — így a cím szerinti számláló nem keveredik. */
function alcim(cimke: string): string {
  return `203.0.113.${Math.floor(Math.random() * 200) + 1}-${cimke}`;
}

async function regisztral(email: string, cim: string) {
  return keres<{ id?: string; hiba?: string }>("/api/fiok/regisztracio", {
    modszer: "POST",
    torzs: { nev: "E34 Próba", email, jelszo: JELSZO },
    fejlecek: { "x-forwarded-for": cim },
  });
}

async function belep(email: string, jelszo: string, cim: string) {
  return keres<{ id?: string; hiba?: string; mezok?: Record<string, string> }>("/api/fiok/belepes", {
    modszer: "POST",
    torzs: { email, jelszo },
    fejlecek: { "x-forwarded-for": cim },
  });
}

// A pg-kliens megosztott: CSAK a fájl végén zárjuk, különben a második blokk már nem érné el.
afterAll(async () => {
  if (!VAN_ADATBAZIS) return;
  await sql("DELETE FROM belepesi_kiserlet WHERE cim LIKE '203.0.113.%'");
  await takaritas();
  await lezar();
});

describe.skipIf(!VAN_ADATBAZIS)("E-34 sebességkorlát", () => {
  it("1. sikeres belépés nem korlátozódik: ötnél többször is be lehet lépni", async () => {
    const cim = alcim("sok-sikeres");
    const email = veletlenEmail();
    expect((await regisztral(email, alcim("reg1"))).statusz).toBe(201);
    for (let i = 0; i < 7; i++) {
      const v = await belep(email, JELSZO, cim);
      expect(v.statusz, `${i}. belépés`).toBe(200);
    }
  });

  it("2. öt rossz jelszó után a HATODIK 429-et kap — és a JÓ jelszó sem megy át", async () => {
    const cim = alcim("rossz-jelszo");
    const email = veletlenEmail();
    expect((await regisztral(email, alcim("reg2"))).statusz).toBe(201);

    for (let i = 0; i < 5; i++) {
      const v = await belep(email, "RosszJelszo999!", cim);
      expect(v.statusz, `${i}. rossz próba`).toBe(401);
      expect(v.torzs.hiba).toBe("ROSSZ_BELEPES");
    }
    const hatodik = await belep(email, "RosszJelszo999!", cim);
    expect(hatodik.statusz).toBe(429);
    expect(hatodik.torzs.hiba).toBe("TUL_SOK_KISERLET");
    expect(hatodik.fejlecek.get("retry-after")).toBe("900");

    // A lényeg: a HELYES jelszó sem enged be, amíg a zár tart — különben a korlát nem korlát.
    const joJelszoval = await belep(email, JELSZO, cim);
    expect(joJelszoval.statusz).toBe(429);
  });

  it("3. a zár a FIÓKHOZ tapad: másik címről is zárva marad", async () => {
    const email = veletlenEmail();
    expect((await regisztral(email, alcim("reg3"))).statusz).toBe(201);
    const elsoCim = alcim("fiokzar-a");
    for (let i = 0; i < 5; i++) await belep(email, "RosszJelszo999!", elsoCim);

    const masikCim = alcim("fiokzar-b");
    const v = await belep(email, JELSZO, masikCim);
    expect(v.statusz).toBe(429);
  });

  it("4. a zár NEM terjed át másik fiókra ugyanarról a címről", async () => {
    const cim = alcim("keresztzar");
    const aEmail = veletlenEmail();
    const bEmail = veletlenEmail();
    expect((await regisztral(aEmail, alcim("reg4a"))).statusz).toBe(201);
    expect((await regisztral(bEmail, alcim("reg4b"))).statusz).toBe(201);

    for (let i = 0; i < 5; i++) await belep(aEmail, "RosszJelszo999!", cim);
    expect((await belep(aEmail, JELSZO, cim)).statusz).toBe(429);
    // A másik fiók ugyanarról a címről még bejut (a cím szerinti korlát 20, csak 5 rossz volt).
    expect((await belep(bEmail, JELSZO, cim)).statusz).toBe(200);
  });

  it("5. sikeres belépés nullázza a fiók számlálóját — DE a naplósorok megmaradnak", async () => {
    const cim = alcim("torles");
    const email = veletlenEmail();
    expect((await regisztral(email, alcim("reg5"))).statusz).toBe(201);

    for (let i = 0; i < 4; i++) await belep(email, "RosszJelszo999!", cim); // 4 — még nem zár
    expect((await belep(email, JELSZO, cim)).statusz).toBe(200); // sikeres → a számláló nullázódik
    for (let i = 0; i < 4; i++) {
      const v = await belep(email, "RosszJelszo999!", cim);
      expect(v.statusz, `${i}. rossz a siker után`).toBe(401); // ha nem nullázódna, itt már 429 lenne
    }

    // ÉS A LÉNYEG: a napló SÉRTETLEN — a 8 sikertelen kísérlet mind ott van.
    // (Egy hozzáférésnaplót nem törölhet az, akiről szól.)
    const sikertelenek = await sql<{ db: number }>(
      "SELECT count(*)::int AS db FROM belepesi_kiserlet WHERE email = $1 AND fajta = 'belepes' AND sikeres = false",
      [email],
    );
    expect(sikertelenek[0]?.db).toBe(8);
  });

  it("6. cím szerinti korlát: 20 rossz kísérlet után ismeretlen fiókkal is 429", async () => {
    const cim = alcim("cimzar");
    for (let i = 0; i < 20; i++) {
      await belep(veletlenEmail(), "RosszJelszo999!", cim); // mind más fiók → fiókzár nem lép be
    }
    const v = await belep(veletlenEmail(), "RosszJelszo999!", cim);
    expect(v.statusz).toBe(429);
    expect(v.torzs.hiba).toBe("TUL_SOK_KISERLET");
  });

  it("7. regisztráció: a huszonegyedik fiók 429 (a SIKERES is beleszámít)", async () => {
    const cim = alcim("regzar");
    for (let i = 0; i < 20; i++) {
      const v = await regisztral(veletlenEmail(), cim);
      expect(v.statusz, `${i}. regisztráció`).toBe(201);
    }
    const huszonegyedik = await regisztral(veletlenEmail(), cim);
    expect(huszonegyedik.statusz).toBe(429);
    expect(huszonegyedik.torzs.hiba).toBe("TUL_SOK_KISERLET");
  });

  it("8. a hibás törzs is kísérletnek számít (a korlát nem kerülhető meg szeméttel)", async () => {
    const cim = alcim("szemet");
    for (let i = 0; i < 20; i++) {
      await keres("/api/fiok/belepes", {
        modszer: "POST",
        torzs: { nincs: "email" },
        fejlecek: { "x-forwarded-for": cim },
      });
    }
    const v = await belep(veletlenEmail(), JELSZO, cim);
    expect(v.statusz).toBe(429);
  });

  it("9. a napló hozzáférésnaplóként is olvasható: a sikeres belépés IGAZ értékkel szerepel", async () => {
    const cim = alcim("naplo");
    const email = veletlenEmail();
    await regisztral(email, cim);
    await belep(email, "RosszJelszo999!", cim);
    await belep(email, JELSZO, cim);

    const sorok = await sql<{ fajta: string; sikeres: boolean; cim: string }>(
      "SELECT fajta, sikeres, cim FROM belepesi_kiserlet WHERE email = $1 ORDER BY ido",
      [email],
    );
    // A napló MINDEN kísérletet megőriz: a sikertelen belépés is ott van a sikeres mellett.
    expect(sorok.some((s) => s.fajta === "belepes" && !s.sikeres)).toBe(true);
    const regisztracio = sorok.filter((s) => s.fajta === "regisztracio");
    expect(regisztracio.length).toBe(1);
    expect(regisztracio[0]?.sikeres).toBe(true); // NEM hazudik: a sikeres regisztráció igaz értékkel áll
    expect(sorok.some((s) => s.fajta === "belepes" && s.sikeres)).toBe(true);
    expect(sorok.every((s) => s.cim === cim)).toBe(true);
  });
});

describe.skipIf(!VAN_ADATBAZIS)("E-34 jelszó-visszaállítás", () => {
  let rendszergazdaSuti = "";
  let celEmail = "";

  beforeAll(async () => {
    celEmail = veletlenEmail();
    await regisztral(celEmail, alcim("va-reg"));

    // Rendszergazda: SQL-lel jelöljük (a RENDSZERGAZDA_EMAIL a NAS-on más címre szól).
    const gazdaEmail = veletlenEmail();
    await regisztral(gazdaEmail, alcim("va-gazda"));
    await sql("UPDATE fiok SET rendszergazda = true WHERE email = $1", [gazdaEmail]);
    const be = await belep(gazdaEmail, JELSZO, alcim("va-belep"));
    rendszergazdaSuti = sutiKinyer(be.sutik, "km_munkamenet") ?? "";
    expect(rendszergazdaSuti).not.toBe("");
  });

  it("1. jegyet csak rendszergazda kérhet", async () => {
    const belepesNelkul = await keres<{ hiba?: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email: celEmail },
    });
    expect(belepesNelkul.statusz).toBe(401);

    const sima = veletlenEmail();
    await regisztral(sima, alcim("va-sima"));
    const simaBe = await belep(sima, JELSZO, alcim("va-sima-be"));
    const simaSuti = sutiKinyer(simaBe.sutik, "km_munkamenet") ?? "";
    const simaval = await keres<{ hiba?: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email: celEmail },
      sutik: `km_munkamenet=${simaSuti}`,
    });
    expect(simaval.statusz).toBe(403);
    expect(simaval.torzs.hiba).toBe("NINCS_JOG");
  });

  it("2. nem létező e-mailre is 200 jön, de jegy nélkül (nem térképezhető fel, ki létezik)", async () => {
    const v = await keres<{ jegy: string | null; utvonal: string | null }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email: "nincs-ilyen-e34@proba.example" },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    expect(v.statusz).toBe(200);
    expect(v.torzs.jegy).toBeNull();
    expect(v.torzs.utvonal).toBeNull();
  });

  it("3. a teljes kör: jegy → új jelszó → a RÉGI jelszó már nem jó, az ÚJ igen", async () => {
    const jegyValasz = await keres<{ jegy: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email: celEmail },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    expect(jegyValasz.statusz).toBe(200);
    const jegy = jegyValasz.torzs.jegy;
    expect(typeof jegy).toBe("string");

    const ujJelszo = "MasikJelszo456!";
    const atallitas = await keres<{ ok?: boolean }>("/api/fiok/jelszo-visszaallitas", {
      modszer: "POST",
      torzs: { jegy, jelszo: ujJelszo },
      fejlecek: { "x-forwarded-for": alcim("va-kor") },
    });
    expect(atallitas.statusz).toBe(200);

    expect((await belep(celEmail, JELSZO, alcim("va-regi"))).statusz).toBe(401);
    expect((await belep(celEmail, ujJelszo, alcim("va-uj"))).statusz).toBe(200);
  });

  it("4. a jegy EGYSZER használható", async () => {
    const email = veletlenEmail();
    await regisztral(email, alcim("va-egyszer-reg"));
    const jegyValasz = await keres<{ jegy: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    const jegy = jegyValasz.torzs.jegy;

    const cim = alcim("va-egyszer");
    expect((await keres("/api/fiok/jelszo-visszaallitas", { modszer: "POST", torzs: { jegy, jelszo: "ElsoJelszo111!" }, fejlecek: { "x-forwarded-for": cim } })).statusz).toBe(200);
    const masodszor = await keres<{ hiba?: string }>("/api/fiok/jelszo-visszaallitas", {
      modszer: "POST",
      torzs: { jegy, jelszo: "MasodikJelszo222!" },
      fejlecek: { "x-forwarded-for": cim },
    });
    expect(masodszor.statusz).toBe(400);
    expect(masodszor.torzs.hiba).toBe("ERVENYTELEN_JEGY");
    // és a jelszó tényleg az ELSŐ maradt
    expect((await belep(email, "ElsoJelszo111!", alcim("va-egyszer-be"))).statusz).toBe(200);
  });

  it("4b. EGYSZERRE érkező két kérésből is csak az egyik állít jelszót", async () => {
    // A 4. próba a sorban érkező második kérést fogja meg (azt már az olvasás kiszűri).
    // Ez itt a VERSENYHELYZET: két kérés egyszerre, mindkettő még szabadnak látja a jegyet.
    // Az őr az UPDATE `felhasznalva IS NULL` feltétele — enélkül MINDKETTŐ átírná a jelszót.
    const email = veletlenEmail();
    await regisztral(email, alcim("va-verseny-reg"));
    const jegyValasz = await keres<{ jegy: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    const jegy = jegyValasz.torzs.jegy;
    const cim = alcim("va-verseny");

    const [a, b] = await Promise.all([
      keres<{ hiba?: string }>("/api/fiok/jelszo-visszaallitas", { modszer: "POST", torzs: { jegy, jelszo: "VersenyEgy111!" }, fejlecek: { "x-forwarded-for": cim } }),
      keres<{ hiba?: string }>("/api/fiok/jelszo-visszaallitas", { modszer: "POST", torzs: { jegy, jelszo: "VersenyKetto222!" }, fejlecek: { "x-forwarded-for": cim } }),
    ]);
    const sikeresek = [a, b].filter((v) => v.statusz === 200);
    expect(sikeresek.length, "pontosan EGY kérés járhat sikerrel").toBe(1);

    // És tényleg a nyertes jelszava érvényes — nem keveredett össze a kettő.
    const nyertes = a.statusz === 200 ? "VersenyEgy111!" : "VersenyKetto222!";
    expect((await belep(email, nyertes, alcim("va-verseny-be"))).statusz).toBe(200);
  });

  it("5. a jelszó átállítása KILÉPTET minden korábbi munkamenetből", async () => {
    const email = veletlenEmail();
    await regisztral(email, alcim("va-kilep-reg"));
    const be = await belep(email, JELSZO, alcim("va-kilep-be"));
    const regiSuti = sutiKinyer(be.sutik, "km_munkamenet") ?? "";
    expect((await keres("/api/fiok/en", { sutik: `km_munkamenet=${regiSuti}` })).statusz).toBe(200);

    const jegyValasz = await keres<{ jegy: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    await keres("/api/fiok/jelszo-visszaallitas", {
      modszer: "POST",
      torzs: { jegy: jegyValasz.torzs.jegy, jelszo: "UjJelszoIde789!" },
      fejlecek: { "x-forwarded-for": alcim("va-kilep") },
    });

    // A régi süti innentől nem ér semmit.
    expect((await keres("/api/fiok/en", { sutik: `km_munkamenet=${regiSuti}` })).statusz).toBe(401);
  });

  it("6. rövid jelszót nem fogad el, és a jegy ilyenkor ÉLVE marad", async () => {
    const email = veletlenEmail();
    await regisztral(email, alcim("va-rovid-reg"));
    const jegyValasz = await keres<{ jegy: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    const jegy = jegyValasz.torzs.jegy;
    const cim = alcim("va-rovid");

    const rovid = await keres<{ hiba?: string }>("/api/fiok/jelszo-visszaallitas", {
      modszer: "POST",
      torzs: { jegy, jelszo: "rovid123" },
      fejlecek: { "x-forwarded-for": cim },
    });
    expect(rovid.statusz).toBe(400);
    expect(rovid.torzs.hiba).toBe("GYENGE_JELSZO");

    // A jegy nem égett el egy elgépelés miatt.
    expect((await keres("/api/fiok/jelszo-visszaallitas", { modszer: "POST", torzs: { jegy, jelszo: "RendesJelszo999!" }, fejlecek: { "x-forwarded-for": cim } })).statusz).toBe(200);
  });

  it("7. találgatott jegy nem működik", async () => {
    const v = await keres<{ hiba?: string }>("/api/fiok/jelszo-visszaallitas", {
      modszer: "POST",
      torzs: { jegy: "kitalalt-jegy-ami-nem-letezik", jelszo: "AkarmiJelszo111!" },
      fejlecek: { "x-forwarded-for": alcim("va-talalgat") },
    });
    expect(v.statusz).toBe(400);
    expect(v.torzs.hiba).toBe("ERVENYTELEN_JEGY");
  });

  it("8. az adatbázisban a jegy csak LENYOMATKÉNT van", async () => {
    const email = veletlenEmail();
    await regisztral(email, alcim("va-lenyomat-reg"));
    const jegyValasz = await keres<{ jegy: string }>("/api/fiok/jelszo-jegy", {
      modszer: "POST",
      torzs: { email },
      sutik: `km_munkamenet=${rendszergazdaSuti}`,
    });
    const jegy = jegyValasz.torzs.jegy;
    const talalat = await sql<{ db: number }>(
      "SELECT count(*)::int AS db FROM jelszo_visszaallitas WHERE jegy_lenyomat = $1",
      [jegy],
    );
    expect(talalat[0]?.db).toBe(0); // a nyers jegy SEHOL nem szerepel
    const lenyomatok = await sql<{ db: number }>(
      "SELECT count(*)::int AS db FROM jelszo_visszaallitas WHERE length(jegy_lenyomat) = 64",
    );
    expect((lenyomatok[0]?.db ?? 0)).toBeGreaterThan(0); // SHA-256 hex = 64 karakter
  });
});
