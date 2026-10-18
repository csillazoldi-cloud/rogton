// c30 F11 (FESZTIVAL-ES-NYELVI-MOD-TERV §1.2, §10 F11): a fesztivál „Kész munka” mintaképén a rendezvény fotója áll (színpad, közönség),
// nem a gép által a példaszövegekhez választott szakma fotója. A cég mintafotója változatlan. A fotó a többi kategória-fotó útján készült:
// ≤ 1600 px, JPEG 82, sRGB, metaadat nélkül (apps/kepgyar/minta/kesz-minta-rendezveny.jpg; Csilla adta, licenc megerősítve 10-17).
//  · tiszta: fotoKategoria — fesztivál → rendezveny (bármit választott az AI), cég → a saját kategóriája, típus nélkül → mint eddig;
//  · a fájl: JPEG, a hosszabbik oldala 1600, nincs EXIF és ICC, kicsi (adat-URL < 600 kB, mint a c15-ös fotóké);
//  · élő (adatbázis): egy jóváhagyott fesztivál peldakFrissen-je fotoKategoria = rendezveny, a `kategoria` (a példáké) nem változik;
//    egy jóváhagyott cégé = a kategóriája. A példák ujjlenyomata nem változik (nincs újraírás, nincs AI-költség).
import { readFileSync } from "node:fs";
import { kepMeret } from "@km/fajl-core";
import { OnboardingPiszkozat } from "@km/contracts";
import { afterAll, describe, expect, it } from "vitest";
import { MINTA_FOTO_KATEGORIAK, fotoKategoria } from "../vizual/minta-kategoria";
import { peldakFrissen } from "../vizual/peldak";
import { keres, lezar, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const FOTO = new URL("../../kepgyar/minta/kesz-minta-rendezveny.jpg", import.meta.url);

describe("c30 F11 — a fesztivál mintafotója", () => {
  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("fotoKategoria: fesztivál → rendezveny; cég és típus nélküli → a saját kategóriája (változatlan)", () => {
    expect(fotoKategoria("fesztival", "vendeglatas")).toBe("rendezveny");
    expect(fotoKategoria("fesztival", "semleges")).toBe("rendezveny");
    expect(fotoKategoria("ceg", "epites")).toBe("epites");
    expect(fotoKategoria(undefined, "kert")).toBe("kert");
    expect(fotoKategoria("Fesztival", "bolt")).toBe("bolt"); // ismeretlen típus = cég (D13)
    expect(MINTA_FOTO_KATEGORIAK).toContain("rendezveny");
  });

  it("a fájl: JPEG, 1600 px a hosszabbik oldal, metaadat (EXIF, ICC) nélkül, kicsi", () => {
    const b = new Uint8Array(readFileSync(FOTO));
    expect([b[0], b[1]]).toEqual([0xff, 0xd8]);
    const m = kepMeret(b);
    expect(m && Math.max(m.szel, m.mag)).toBe(1600);
    expect(m).toEqual({ szel: 1600, mag: 914 });
    const szoveg = Buffer.from(b).toString("latin1");
    expect(szoveg.includes("Exif\0")).toBe(false);
    expect(szoveg.includes("ICC_PROFILE")).toBe(false);
    expect(Buffer.from(b).toString("base64").length).toBeLessThan(600_000);
  });

  async function jovahagyott(nev: string, osszefoglalo: string, tipus: "ceg" | "fesztival", kategoria: string): Promise<string> {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Moldovan-Szabó Réka", email, jelszo: "ProbaJelszo123!" } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo: "ProbaJelszo123!" } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev }, sutik: s });
    expect(sz.statusz).toBe(201);
    const p = OnboardingPiszkozat.parse({
      bemutatkozas: { nev, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo, szervezet_tipus: tipus, kategoria, tipus_biztos: true },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
    });
    expect((await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: p })).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", sutik: s, torzs: {} })).statusz).toBe(200);
    return sz.torzs.id;
  }

  it("élő: a fesztivál a rendezvény-fotót kapja, a cég a szakmájáét", async () => {
    const fesz = await jovahagyott("Zilele Târgumureșene 2026", "Marosvásárhelyi Napok: koncertek a Győzelem téren, borutca, kézművesvásár.", "fesztival", "semleges");
    const ceg = await jovahagyott("Kovács Térkő Kft.", "Térkövezés, díszburkolat Marosvásárhelyen.", "ceg", "epites");
    const f = await peldakFrissen(fesz);
    expect(f.fotoKategoria).toBe("rendezveny");
    expect(f.kategoria).toBe("semleges"); // a példák kategóriája (nincs még megírva) nem mozdul
    const c = await peldakFrissen(ceg);
    expect(c.fotoKategoria).toBe(c.kategoria);
  });
});
