// @rogton/ai-adapters — szolgáltatók, hívások, hibák, költségmérés (ALAPTERV 5. pont).
// A hívó FELADATOT kér, nem konkrét modellt. Minden szolgáltató egy leírólapot ad magáról.
// A modell válasza JAVASLAT, nem jogosultság: a hívó program ellenőrzi, mielőtt bármit tenne vele.
// Helyi modell kiesésekor NINCS csendes átváltás felhőre.
import { z } from "zod";

/** Feladattípusok — szerződés feladatonként; az első: tevékenység-összefoglaló. */
export const FeladatTipus = z.enum(["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "hf_beallitas_javaslat", "hf_relevancia", "hf_osszkep", "hf_ugyanaz_az_esemeny", "hf_szabaly_javaslat", "hf_tartalomotlet", "hf_szolista", "hf_cim_szures", "javitocsomag", "iranytu_javaslat", "poszt_szoveg", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "ceg_kutatas", "kozlemeny_kitoltes", "kinalat_kiolvasas", "program_kiolvasas", "temak_terv", "poszt_tipus", "poszt_szokasok", "album_valogatas"]);
export type FeladatTipus = z.infer<typeof FeladatTipus>;

export const Hol = z.enum(["felho", "helyi"]);

/** Egy szolgáltató leírólapja: mit tud, milyen nyelven, mennyibe kerül, hol fut. */
export const SzolgaltatoLeirolap = z.object({
  azonosito: z.string(), // pl. "anthropic", "teszt", "helyi-qwen"
  nev: z.string(),
  hol: Hol,
  orszag: z.string(), // ahol az adat feldolgozódik — az adatpolitika alapja
  nyelvek: z.array(z.string()),
  modell: z.string(),
  ar_be_usd_1m: z.number().nonnegative(), // USD / 1 millió bemeneti token
  ar_ki_usd_1m: z.number().nonnegative(),
  feladatok: z.array(FeladatTipus),
});
export type SzolgaltatoLeirolap = z.infer<typeof SzolgaltatoLeirolap>;

export const AiHibaKod = z.enum([
  "AI_NEM_ELERHETO", // hálózat / szolgáltató hiba / időtúllépés
  "AI_KERET_KIMERULT", // a havi keret elfogyott — nem hívunk
  "AI_NINCS_KULCS", // nincs beállítva kulcs a szolgáltatóhoz
  "AI_ROSSZ_VALASZ", // a válasz nem felel meg a szerződésnek
]);
export type AiHibaKod = z.infer<typeof AiHibaKod>;

export class AiHiba extends Error {
  constructor(public readonly kod: AiHibaKod, uzenet?: string, public readonly ok?: unknown) {
    super(uzenet ?? kod);
    this.name = "AiHiba";
  }
}

/** Amit egy hívásról mérünk és tárolunk — a fejlesztési költség most, az ügyfélszámlázás alapja később. */
export interface HivasMeres {
  szolgaltato: string;
  modell: string;
  feladat: FeladatTipus;
  tokenek_be: number;
  tokenek_ki: number;
  becsult_usd: number;
  ido_ms: number;
  allapot: "ok" | "hiba";
  hiba_kod?: AiHibaKod;
}

export interface HivasKeres {
  feladat: FeladatTipus;
  rendszer: string; // a rendszerutasítás (a prompt fájlból)
  szoveg: string; // a felhasználói rész
  nyelv: string; // a válasz nyelve (hu/ro/en)
  maxKiToken?: number;
  idokorlatMs?: number;
  /** Gondolkodási erő a gondolkodó modelleknél (OpenAI gpt-5 család: reasoning_effort); hiányzik = "minimal". A többi csatlakozó nem használja. */
  gondolkodas?: "minimal" | "low" | "medium";
  /** A válasz nem próza (két nyelvű keresőszavak, sorszámok): a „válasz nyelve” záradék elmarad (2026-09-22, előszűrő). */
  nyelvSzabad?: boolean;
  jel?: AbortSignal;
}

export interface HivasValasz {
  szoveg: string;
  meres: HivasMeres;
}

/** Egy szolgáltató: leírólap + a hívás. Minden csatlakozó ezt valósítja meg. */
export interface Szolgaltato {
  leirolap: SzolgaltatoLeirolap;
  hiv(keres: HivasKeres): Promise<HivasValasz>;
}

export function koltseg(l: SzolgaltatoLeirolap, be: number, ki: number): number {
  return (be / 1e6) * l.ar_be_usd_1m + (ki / 1e6) * l.ar_ki_usd_1m;
}

/** Időkorlát + megszakítás egy ígéretre. */
export async function idokorlattal<T>(ms: number, kulso: AbortSignal | undefined, fut: (jel: AbortSignal) => Promise<T>): Promise<T> {
  const vezerlo = new AbortController();
  const idozito = setTimeout(() => vezerlo.abort(new AiHiba("AI_NEM_ELERHETO", `időtúllépés ${ms} ms`)), ms);
  const tovabbit = () => vezerlo.abort(kulso?.reason);
  kulso?.addEventListener("abort", tovabbit, { once: true });
  try {
    return await fut(vezerlo.signal);
  } finally {
    clearTimeout(idozito);
    kulso?.removeEventListener("abort", tovabbit);
  }
}

// ---- Teszt-csatlakozó: kulcs nélkül is végigpróbálható a folyamat (ELSO-EPITESI-EGYSEG 4.) ----
export const tesztSzolgaltato: Szolgaltato = {
  leirolap: {
    azonosito: "teszt", nev: "Teszt-csatlakozó (AI nélkül)", hol: "helyi", orszag: "—", nyelvek: ["hu", "ro", "en"],
    modell: "minta", ar_be_usd_1m: 0, ar_ki_usd_1m: 0, feladatok: ["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "hf_beallitas_javaslat", "hf_relevancia", "hf_osszkep", "hf_ugyanaz_az_esemeny", "hf_szabaly_javaslat", "hf_tartalomotlet", "hf_szolista", "hf_cim_szures", "iranytu_javaslat", "poszt_szoveg", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "kozlemeny_kitoltes", "kinalat_kiolvasas", "program_kiolvasas", "temak_terv", "poszt_tipus"],
  },
  async hiv(keres) {
    const t0 = Date.now();
    await new Promise((r) => setTimeout(r, keres.feladat.startsWith("hf_") ? 120 : 700)); // a hírfigyelő sok kis hívása gyorsan
    const reszlet = keres.szoveg.replace(/\s+/g, " ").trim().slice(0, 160);
    // a v6 prototípus minta-javaslatai (hu) — a teszt-csatlakozó JSON-t ad a kötött szerkezetű feladatokra
    let szoveg: string;
    switch (keres.feladat) {
      case "javaslatok": {
        // c30 F6: the test connector answers the type keys too — festival words → fesztival; an event-hosting text without festival
        // words („rendezvény”) → unsure (the D1 question); térkő / étterem → their category; everything else → ceg, semleges, sure
        const sz = keres.szoveg;
        const fesztival = /fesztivál|festival|zilele|városnap|\p{Lu}\p{L}*i Napok/u.test(sz);
        const kat = /térk|burkol|építő/i.test(sz) ? "epites" : /étterem|vendéglő|kávézó|pizz/i.test(sz) ? "vendeglatas" : "semleges";
        const tipusKulcsok = fesztival ? { szervezet_tipus: "fesztival", kategoria: "semleges", biztos: true }
          : /rendezvén/i.test(sz) ? { szervezet_tipus: "ceg", kategoria: kat, biztos: false }
          : { szervezet_tipus: "ceg", kategoria: kat, biztos: true };
        szoveg = JSON.stringify({ ...tipusKulcsok, ...(fesztival ? { rendezveny: { hely: { hu: "[MINTA] Marosvásárhely", ro: "[MINTA] Târgu Mureș" } } } : {}), celkozonseg: "Lakástulajdonosok és kisebb üzletek vezetői, akik egyedi bútort keresnek.", cel: "A munkák bemutatása és több érdeklődő megkeresés.", hangnem_leiras: "Közvetlen, szakmai, érthető", hangnem_minta: "Minden bútorunk egyedi tervek alapján készül. Ha lakásba vagy üzletbe keresel tartós, jól használható darabot, szívesen segítünk a tervezésben is.", nyelvek: ["hu", "ro"] });
        break;
      }
      case "hangnem_finomitas":
        szoveg = JSON.stringify({ hangnem_leiras: "Közvetlen, tárgyilagos, rövid", hangnem_minta: "[MINTA] Egyedi bútorokat tervezünk és gyártunk lakásokba és üzletekbe. Kérj ajánlatot, egy munkanapon belül válaszolunk." });
        break;
      case "arculat_javaslat":
        szoveg = /* tokenőr: ok — ügyfél-arculat mintaadata, nem a felület színe */ JSON.stringify({ elsodleges: "#2f5d4e", masodlagos: "#d9a441", hatter: "#f5f1e8", betu_iranymutatas: "kontrasztos serif címekhez, semleges sans szöveghez", kepvilag: "Természetes fényű műhely- és termékfotók, közeli anyagtextúrák.", kovetendo: "anyagközeli fotók, nyugodt kompozíció", kerulendo: "stockfotó-hangulat, harsány filterek", lekerekites: 8 });
        break;
      case "hf_relevancia": {
        // relevancia: ha a szövegben szerepel a <<TÉMÁK>> blokk bármelyik szava → fontos, különben hatter
        const temakBlokk = keres.szoveg.match(/<<TÉMÁK>>\n([\s\S]*?)\n<<TÉMÁK VÉGE>>/);
        const temak = temakBlokk?.[1]?.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) ?? [];
        const fontos = temak.some((tema) => keres.szoveg.includes(tema));
        // az ADAT-blokk első 2 mondata az összefoglalóhoz
        const adatBlokk = keres.szoveg.match(/<<ADAT cikk>>\n([\s\S]*?)\n<<ADAT VÉGE>>/);
        // az ADAT-blokk első sorai a figyelmeztetés („Ez idegen szöveg…”, „Részlet…”) — azok nem a cikk
        const adatSzoveg = (adatBlokk?.[1] ?? "").split("\n").filter((s) => s && !/^(Ez idegen szöveg|Részlet, nem a teljes)/.test(s)).join(" ");
        const mondatok = adatSzoveg.split(/(?<=[.!?])\s+/).filter(Boolean);
        const osszefoglalo = `[MINTA] ${mondatok.slice(0, 2).join(" ")}`.slice(0, 400);
        szoveg = JSON.stringify({
          fontossag: fontos ? "fontos" : "hatter",
          temacimke: "sajat_megjelenes",
          miert: "[MINTA] Rövid magyarázat a döntéshez.",
          indoklas: "[MINTA] Részletesebb indoklás a döntéshez.",
          osszefoglalo,
        });
        break;
      }
      case "hf_szolista":
        // az előszűrő szólistája: a teszt-csatlakozó üres listát ad → nincs szó-szűrés (minden cikk továbbmegy)
        szoveg = JSON.stringify({ hely: null, temak: [], nevek: [] });
        break;
      case "hf_cim_szures": {
        // a címszűrés: minden címet megtart
        const sorszamok = [...keres.szoveg.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
        szoveg = JSON.stringify({ megtart: sorszamok });
        break;
      }
      case "hf_ugyanaz_az_esemeny": {
        // ugyanaz: a két cím első 3 szava egyezik → true
        const cimek = [...keres.szoveg.matchAll(/<<ADAT cim_a>>\n[\s\S]*?\n([^\n]+)/g)].map((m) => m[1]?.trim() ?? "");
        const cimB = keres.szoveg.match(/<<ADAT cim_b>>\n[\s\S]*?\n([^\n]+)/)?.[1]?.trim() ?? "";
        const aSzavak = (cimek[0] ?? "").split(/\s+/).slice(0, 3);
        const bSzavak = cimB.split(/\s+/).slice(0, 3);
        const ugyanaz = aSzavak.length > 0 && aSzavak.join(" ") === bSzavak.join(" ");
        szoveg = JSON.stringify({ ugyanaz, indok: "[MINTA] A címek első szavai megegyeznek." });
        break;
      }
      case "hf_osszkep": {
        const azonositok = [...keres.szoveg.matchAll(/<<ADAT talalat_([a-zA-Z0-9_-]+)>>/g)].map((m) => m[1] ?? "");
        szoveg = JSON.stringify({
          szoveg: `[MINTA] Összkép a találatokról: ${azonositok.length} találat alapján.`,
          hivatkozott_talalatok: azonositok.slice(0, 3),
          bizonytalan: false,
        });
        break;
      }
      case "hf_szabaly_javaslat": {
        // szabaly_javaslat: az aktív beállítás + egy kizárás a visszajelzés sajat_indok-jából
        const beallitasBlokk = keres.szoveg.match(/<<ADAT beallitas>>\n([\s\S]*?)\n<<ADAT VÉGE>>/);
        let beallitas: Record<string, unknown> = {};
        try { beallitas = JSON.parse(beallitasBlokk?.[1] ?? "{}") as Record<string, unknown>; } catch { /* üres */ }
        // a visszajelzés saját indoka: JSON-ban („sajat_indok”) vagy a szöveges ADAT-blokkban („Saját indok: …”)
        const sajatIndok = (keres.szoveg.match(/"sajat_indok"\s*:\s*"([^"]*)"/)?.[1] ?? keres.szoveg.match(/Saját indok:\s*([^\n]+)/)?.[1] ?? "").trim();
        const kizarasok = Array.isArray(beallitas["kizarasok"]) ? [...(beallitas["kizarasok"] as string[])] : [];
        if (sajatIndok) kizarasok.push(sajatIndok);
        const javasolt = { ...beallitas, kizarasok };
        szoveg = JSON.stringify({
          javasolt,
          indoklas: "[MINTA] A visszajelzések alapján új kizárás javasolt.",
          varhato_hatas: "[MINTA] Kevesebb nem releváns találat.",
          profil_erintett: false,
          mi_alapjan: ["visszajelzes"],
        });
        break;
      }
      case "hf_beallitas_javaslat": {
        // beallitas_javaslat: a profil nevéből egy téma
        const profilBlokk = keres.szoveg.match(/<<ADAT profil>>\n([\s\S]*?)\n<<ADAT VÉGE>>/);
        let profil: Record<string, unknown> = {};
        try { profil = JSON.parse(profilBlokk?.[1] ?? "{}") as Record<string, unknown>; } catch { /* üres */ }
        const nev = typeof profil["nev"] === "string" ? profil["nev"] : "A szervezet";
        szoveg = JSON.stringify({
          beallitas: {
            celok: ["sajat_marka"],
            temak: [{ nev, nevvaltozatok: [], megkulonboztetes: "" }],
            foldrajzi_fokusz: "",
            nyelvek: [],
            kizarasok: [],
            idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
            szabad_szoveg: "",
          },
        });
        break;
      }
      case "hf_tartalomotlet": {
        // tartalomötlet: a címből egy minta-ötlet
        const cimBlokk = keres.szoveg.match(/Cím:\s*([^\n]+)/);
        const cim = cimBlokk?.[1]?.trim() ?? "a találat";
        szoveg = JSON.stringify({ szoveg: `[MINTA] Tartalomötlet: ${cim}`, nyelv: "hu" });
        break;
      }
      case "iranytu_javaslat":
        // R-11/B: minta-iránytű — a teszt-csatlakozó JSON-t ad, hogy a lap AI nélkül is végigpróbálható legyen.
        szoveg = JSON.stringify({
          celok: [{ nev: "[MINTA] Több helyi vásárló a reggeli órákban", miert: "A reggeli forgalom a legkiszámíthatóbb bevétel.", mikorra: "", mirol_tudod: "" }],
          vizio: "[MINTA] A környék legmegbízhatóbb kézműves műhelye akarunk lenni.",
          ertekek: [{ nev: "[MINTA] Környezetvédelem", magyarazat: "Csökkentjük az egyszer használatos csomagolást." }],
          idoszakok: [],
          tolni: [{ nev: "[MINTA] A legkeresettebb termék" }],
          tiltott_szavak: [],
          kerulendo_temak: [],
        });
        break;
      case "poszt_szoveg":
      case "poszt_atiras":
      case "poszt_forditas":
      case "poszt_nyelvre_szabas":
        // R-11/A: minta-posztszöveg — a lap AI nélkül is végigpróbálható.
        // R-17 C: a „cim” a honlap-cikké (blog felület) — a többi felület figyelmen kívül hagyja
        szoveg = JSON.stringify({ szoveg: `[MINTA] Posztszöveg a megadott forrásból: ${reszlet}…`, cim: "[MINTA] A cikk címe a megadott forrásból", hashtagek: ["minta"] });
        break;
      case "poszt_osszhang":
        // R-11/A: az összhangvizsgálat mintaválasza — a minta mindig zöld.
        szoveg = JSON.stringify({ allapot: "ok", mondat: keres.szoveg.includes("=== A FESZTIVÁL PROFILJA ===") ? "[MINTA] A szöveg nem megy szembe a fesztivál iránytűjével." : "[MINTA] A szöveg nem megy szembe a cég iránytűjével.", pont: "", pont_szoveg: "", szovegresz: "", teendok: [] }); // c30 F12
        break;
      case "kep_peldak":
        // VZ-2: a hét helyzet példaszövege — a teszt-csatlakozó általános mintát ad.
        // c30 F12: fesztiválnál (a bemenet „A FESZTIVÁL PROFILJA” blokkal kezdődik) a fesztivál mintája — ahogy a valódi gép is a fesztiválról írna
        if (keres.szoveg.includes("=== A FESZTIVÁL PROFILJA ===")) {
          szoveg = JSON.stringify({
            kesz: { cim: "[MINTA] Ilyen volt a tegnapi este", sor: "Köszönjük, hogy velünk voltatok!" },
            akcio: { szam: "−20%", cim: "[MINTA] a napijegyekre", sor: "a hét végéig" },
            uj: { cim: "[MINTA] Új fellépő a programban", sor: "Nézd meg, mikor lép színpadra!" },
            hir: { cim: "[MINTA] Változik a program", mikor: "szombattól", sor: "A kapuk 16 órakor nyílnak." },
            tudtad: { cim: "[MINTA] Egy jó tipp a fesztiválra.", sor: "Gyere korábban!" },
            esemeny: { cim: "[MINTA] Esti koncert", hol: "a nagyszínpadon", mikor: "szombat, 20 óra" },
            szam: { szam: "10 000+", cim: "[MINTA] látogató tavaly." },
          });
          break;
        }
        szoveg = JSON.stringify({
          kesz: { cim: "[MINTA] Elkészült a legújabb munkánk", sor: "Nézd meg, milyen lett!" },
          akcio: { szam: "−10%", cim: "[MINTA] minden termékre", sor: "a hónap végéig" },
          uj: { cim: "[MINTA] Új a kínálatunkban", sor: "Már kapható." },
          hir: { cim: "[MINTA] Változik a nyitvatartás", mikor: "jövő héttől", sor: "Hétköznap 8–17 óra." },
          tudtad: { cim: "[MINTA] Egy hasznos tipp.", sor: "Kérdezz tőlünk bátran." },
          esemeny: { cim: "[MINTA] Nyílt nap", hol: "a telephelyünkön", mikor: "szombat, 9–14" },
          szam: { szam: "100+", cim: "[MINTA] elégedett ügyfél." },
        });
        break;
      case "kozlemeny_kitoltes":
        // VZ-1 · Közlemények: a posztból kitöltés mintaválasza — mindhárom kép mezői (a hívó a sajátját veszi ki belőle). Itt NINCS „[MINTA]”
        // jelölés: a szöveg a képre kerül, és a csupa nagybetűs „[MINTA]” a képgyártó T5 szabályán (nincs csupa nagybetűs mondat) elbukna —
        // a lap így AI nélkül is végigpróbálható. Hogy minta, azt a teszt-csatlakozó neve mutatja (az ai_hivas sorban: szolgaltato = teszt).
        szoveg = JSON.stringify({
          zavar: { allapot: "zavar", hol: "Bolyai utca, Rózsák tere – Kossuth utca", nap: null, kezdet: "08:00", veg: "16:00", veg_kb: false, helyette: "Kerülő a Bernády téren át", frissites: "12:00" },
          allitas: { mondat: "Harminc éve burkolunk Marosvásárhelyen." },
          adatsavok: { cim: "Mit mondanak az ügyfeleink?", savok: [{ nev: "Időben elkészült", szam: 96 }, { nev: "Ajánlana minket", szam: 92 }, { nev: "Tiszta munkaterület", szam: 88 }], forras: "Saját kérdőív, 64 ügyfél, 2026 nyara" },
        });
        break;
      case "program_kiolvasas":
        // c30 F5: a rendezvény programjának tételei — a teszt-csatlakozó három [MINTA] tételt ad (egy idősávost, egy egész naposat, egy bizonytalant)
        szoveg = JSON.stringify({ tetelek: [
          { nap: "2026-06-26", kezdes: "20:00", vege: null, nev: { hu: "[MINTA] Esti koncert", ro: "[MINTA] Concert de seară" }, helyszin: { hu: "Főtér", ro: "Piața Centrală" }, leiras: {}, fajta: "koncert", fellepo: "[MINTA] Zenekar", bizonytalan: false },
          { nap: "2026-06-26", kezdes: null, vege: null, nev: { hu: "[MINTA] Kézművesvásár", ro: "[MINTA] Târgul meșteșugarilor" }, helyszin: {}, leiras: {}, fajta: "vasar", fellepo: "", bizonytalan: false },
          { nap: "2026-06-27", kezdes: "10:00", vege: null, nev: { hu: "[MINTA] Ünnepség", ro: "[MINTA] Ceremonie" }, helyszin: {}, leiras: {}, fajta: "unnepseg", fellepo: "", bizonytalan: true },
        ] });
        break;
      case "kinalat_kiolvasas":
        // R-18 7. kör: a honlap / étlap / árlista sorai — a teszt-csatlakozó egy térkövező minta-kínálatát adja (árral és ár nélkül)
        szoveg = JSON.stringify({ sorok: [
          { nev: "[MINTA] Díszburkolat, térkő lerakása", reszlet: "udvar, kocsibeálló, járda", ar: "85 lej/m²-től" },
          { nev: "[MINTA] Szegélyezés és vízelvezetés", reszlet: "", ar: "" },
          { nev: "[MINTA] Ingyenes helyszíni felmérés", reszlet: "Marosvásárhely és 40 km-es körzete", ar: "" },
        ] });
        break;
      case "temak_terv":
        // c30 F7: fesztiválnál („Típus: fesztivál”) a fesztivál témái a fajtával
        if (/Típus: fesztivál/.test(keres.szoveg)) {
          szoveg = JSON.stringify({ temak: [
            { tema: "[MINTA] Visszaszámlálás", tipus: "kartya", fajta: "visszaszamlalo" },
            { tema: "[MINTA] Holnapi program", tipus: "picmess", fajta: "holnapi_program" },
            { tema: "[MINTA] Fellépők bemutatása", tipus: "picmess", fajta: "fellepo" },
            { tema: "[MINTA] Tudnivalók", tipus: "kartya", fajta: "gyakorlati" },
            { tema: "[MINTA] Fotóalbum", tipus: "album", fajta: "album" },
          ] });
          break;
        }
        szoveg = JSON.stringify({ temak: [
          { tema: "[MINTA] Munkáink — kész udvarok, előtte–utána", tipus: "album" },
          { tema: "[MINTA] Szolgáltatásaink", tipus: "picmess" },
          { tema: "[MINTA] Tudtad? — szakmai tippek", tipus: "kartya" },
          { tema: "[MINTA] Egy nap a telepen", tipus: "video" },
          { tema: "[MINTA] Kérdezd meg a követőidet", tipus: "szavazas" },
        ] });
        break;
      case "poszt_tipus": {
        // R-18 7. kör: a kért fajta a bemenet „Poszt fajtája:” sorában; a minta a forrás elejét is visszaadja (mint a posztszöveg mintája)
        const tipus = /Poszt fajtája: (album|picmess|video|szavazas|kartya)/.exec(keres.szoveg)?.[1] ?? "kartya";
        const minta = `[MINTA] ${reszlet.slice(0, 80)}`;
        szoveg = JSON.stringify(
          tipus === "video" ? { sorok: [
            { ido: "0–3 mp", elmondod: "[MINTA] Ez az udvar négy nap alatt lett ilyen. Megmutatom, hogyan.", felirat: "4 NAP", kep: "Kész udvar, lassú ráközelítés" },
            { ido: "3–14 mp", elmondod: "[MINTA] Hétfő reggel még sár és repedt beton volt itt. Kiszedtük a régit, és rendesen tömörítettük az alapot.", felirat: "ELŐTTE", kep: "Régi beton, gép munka közben" },
            { ido: "14–25 mp", elmondod: "[MINTA] Utána antik szürke kockakövet raktunk, mert esőben sem csúszik.", felirat: "Antik kockakő", kep: "Kő közelről, kéz rakja" },
            { ido: "25–37 mp", elmondod: "[MINTA] A kocsi is befér, és a gyerekeknek is maradt hely játszani.", felirat: "120 m²", kep: "Autó és gyerekek az udvaron" },
            { ido: "37–45 mp", elmondod: "[MINTA] Ha nálatok is ilyen udvar kellene, kérjetek ingyenes felmérést.", felirat: "Ingyenes felmérés", kep: "A tulajdonos a kamerába beszél" },
          ], hookok: ["[MINTA] Négy nap. Ennyi kellett ehhez az udvarhoz.", "[MINTA] Mi a különbség egy olcsó és egy jó udvar között? Az alap."] }
          : tipus === "szavazas" ? { kerdes: "[MINTA] Melyik udvart választanád?", valaszok: ["Antik szürke kockakő", "Világos homokkő", "Füves rácskő"] }
          : tipus === "album" ? { szoveg: minta, kepek: ["előtte: a régi állapot", "munka közben", "részlet közelről", "kész munka messziről", "a csapat", "a megrendelő (ha engedi)"] }
          : { szoveg: minta, cim: "[MINTA] Kész a Fenyő utcai udvar", sor: "120 m², 4 nap alatt." },
        );
        break;
      }
      default:
        szoveg = `[MINTA] A megadott forrás alapján: ${reszlet}… (Ez minta-javaslat a teszt-csatlakozótól, nem AI-válasz.)`;
    }
    const be = Math.ceil((keres.rendszer.length + keres.szoveg.length) / 4), ki = Math.ceil(szoveg.length / 4);
    return { szoveg, meres: { szolgaltato: "teszt", modell: "minta", feladat: keres.feladat, tokenek_be: be, tokenek_ki: ki, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "ok" } };
  },
};
