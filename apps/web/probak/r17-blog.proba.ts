// R-17 C · Posztszöveg „Blog / honlap” (Erika #20, Csilla 10-06; kerdesek 6): a negyedik felület.
// Tiszta rész: a felület a szerződésben, a puha határ (2 500) és a cím (≤ 90), a gép bemenete, a cikk-prompt szabályai, az előnézet vágása.
// Élő rész (PROBA_CIM + DATABASE_URL; teszt AI-szolgáltató): a blog cellán a gép címet ír, hashtag nincs; a kézi cím ment; a fordítás a címet is hozza.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PosztFelulet, type PosztMunka } from "@km/contracts";
import { BLOG_CIM_MAX, BLOG_HATAR, KARAKTERHATAR, atirasBemenet, forditasBemenet } from "../poszt/bemenet";
import { elonezetVag } from "../r15/szamol";
import { keres, lezar, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const prompt = (f: string) => readFileSync(new URL(`../prompts/${f}`, import.meta.url), "utf8");

describe("Blog / honlap — a szabályok", () => {
  it("a negyedik felület a szerződésben; puha határ 2 500, cím ≤ 90", () => {
    expect(PosztFelulet.options).toEqual(["fb", "ig", "li", "blog"]);
    expect(BLOG_HATAR).toBe(2_500);
    expect(KARAKTERHATAR.blog).toBe(2_500);
    expect(BLOG_CIM_MAX).toBe(90);
  });
  it("a gép bemenete a blogon: cél hossz, cím, hashtag nélkül — a fordítás a címet is viszi", () => {
    const b = atirasBemenet([], "blog", "rovidebb", "", "Ősszel sokan döntenek úgy…");
    expect(b).toContain("Felület: blog (honlap-cikk)");
    expect(b).toMatch(/hashtag és emoji nincs/);
    expect(b).not.toContain("hírfolyamban");
    const f = forditasBemenet([], "blog", { nyelv: "hu", szoveg: "Ősszel sokan…", cim: "Díszburkolat vagy sima térkő?" }, "ro");
    expect(f).toContain("A cím:\nDíszburkolat vagy sima térkő?");
    expect(forditasBemenet([], "fb", { nyelv: "hu", szoveg: "x", cim: "nem kell" }, "ro")).not.toContain("A cím:");
  });
  it("a cikk-prompt: JSON címmel, 1500–2500 karakter, hashtag/emoji nincs, a v6 szabályai (helynév, nincs felajánlás) megvannak", () => {
    const p = prompt("poszt_cikk.hu.md");
    // R-18 8. kör (Kati 10-13): a cikk-prompt v2 lett (a felhívás szándék, nem szó szerint); a v1 szabályai változatlanok, a fejléc őrzi
    expect(p.split("\n")[0]).toMatch(/prompt: poszt-cikk · v2 · 2026-10-14 .*· v1: 2026-10-06/);
    expect(p).toContain('{"cim":"…","szoveg":"…","rovid_nev":"…","rovid_cim":"…","otlet":"…"}');
    expect(p).toMatch(/legfeljebb 90 karakter/);
    expect(p).toMatch(/1500–2500 karakter/);
    expect(p).toMatch(/Nincs hashtag, nincs emoji/);
    expect(p).toContain("Helynevek — a tartalomnyelv alakjában");
    expect(p).toContain("Felajánlás és vállalás");
    expect(p).toContain("{{tartalomnyelv}}");
    expect(prompt("poszt_forditas.hu.md")).toContain('{"cim":"…","szoveg":"…"}');
  });
  it("az előnézet a cikk első ~600 karakterét mutatja, szóhatáron", () => {
    const hosszu = Array.from({ length: 40 }, (_, i) => `A ${i + 1}. mondat a díszburkolatról, Marosvásárhelyen.`).join(" ");
    const v = elonezetVag(hosszu, "blog");
    expect(v.vagott).toBe(true);
    expect(v.latszo.length).toBeLessThanOrEqual(600);
    expect(v.tul).toBe(false); // a blog határa puha — „túl hosszú” baj nincs
  });
});

describe("Blog / honlap — élőben", () => {
  let sutik = "";
  let id = "";
  const jelszo = "ProbaJelszo123!";
  beforeAll(async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kovács Tibor", email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely" }, sutik });
    const p = await keres<{ munka?: { id: string } }>("/api/poszt", { modszer: "POST", sutik,
      torzs: { forras: { tipus: "sajat", azonosito: "", cim: "", url: "", szoveg: "" }, cim: "Díszburkolat vagy sima térkő? — Marosvásárhely", felulet: "fb", nyelv: "hu", uj: true } });
    id = p.torzs.munka?.id ?? "";
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("a gép a blog cellára címet ír, hashtag nélkül; a fb cella változatlanul hashtaggel", async () => {
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "blog", nyelv: "hu" } });
    expect(r.statusz).toBe(200);
    const c = r.torzs.munka.szovegek.find((x) => x.felulet === "blog" && x.nyelv === "hu")!;
    expect(c.cim).toBeTruthy();
    expect(c.hashtagek).toEqual([]);
    expect(c.szoveg).not.toMatch(/#minta/);
    const fb = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
    const fc = fb.torzs.munka.szovegek.find((x) => x.felulet === "fb" && x.nyelv === "hu")!;
    expect(fc.szoveg).toMatch(/#minta/);
    expect(fc.cim).toBeUndefined();
  });

  it("a kézi cím ment (≤ 90 karakter, egy sor), és csak a blogon", async () => {
    const cim = "Díszburkolat vagy sima térkő? Mire figyeljen, aki most újítja fel az udvarát Marosvásárhelyen, ősszel";
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}`, { modszer: "PUT", sutik, torzs: { felulet: "blog", nyelv: "hu", szoveg: "Ősszel sokan döntenek úgy, hogy tavaszig rendbe teszik az udvart.", cim: `${cim}\n` } });
    expect(r.statusz).toBe(200);
    const c = r.torzs.munka.szovegek.find((x) => x.felulet === "blog" && x.nyelv === "hu")!;
    expect(c.cim).toBe(cim.slice(0, 90));
    const fb = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}`, { modszer: "PUT", sutik, torzs: { felulet: "fb", nyelv: "hu", szoveg: "FB szöveg", cim: "nem kerül be" } });
    expect(fb.torzs.munka.szovegek.find((x) => x.felulet === "fb" && x.nyelv === "hu")!.cim).toBeUndefined();
  });

  it("a blog fordítása a címet is hozza (román cella címmel), hashtag nélkül", async () => {
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik, torzs: { felulet: "blog", nyelv: "ro" } });
    expect(r.statusz).toBe(200);
    const c = r.torzs.munka.szovegek.find((x) => x.felulet === "blog" && x.nyelv === "ro")!;
    expect(c.cim).toBeTruthy();
    expect(c.hashtagek).toEqual([]);
  });

  it("a Posztszöveg lap a negyedik fület mutatja", async () => {
    const lap = await keres<string>(`/poszt?munka=${id}`, { sutik });
    expect(String(lap.torzs)).toContain("Blog / honlap");
  });
});
