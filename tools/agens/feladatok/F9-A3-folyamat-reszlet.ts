// packages/news-monitor-core/src/folyamat.ts — RÉSZLET
// A modul folyamatai: a mag vezérli, a host csak a csatlakozókat adja.
import type { Beallitas, BeallitasVerzio } from "./beallitas";
import { aktivVerzio, beallitasNormalizal, ujVerzio, visszaallit } from "./beallitas";
import type { Forras } from "./forras";
import { forrasCimOsztalyoz, forrasEllenorzesEredmeny } from "./forras";
import type { Kivonat } from "./kivonat";
import { kivonatKeszit } from "./kivonat";
import type { Talalat, Esemeny, Fontossag } from "./talalat";
import { jelol, megtekint } from "./talalat";
import { esemenybeSorol, gyanusPar } from "./dedup";
import type { Futas } from "./futas";
import { cikkFrissesseg, futasAtmenet, indithato, kovetkezoFutas, utolsoSikeres } from "./futas";
import type { Minta } from "./minta";
import { mintaKeszit, mintaLejart, osszehasonlithato, osszehasonlitas, type ErtekelesSor } from "./minta";
import type { SzabalyJavaslat, Visszajelzes } from "./visszajelzes";
import { javaslatAlkalmazhato, javaslatDontes } from "./visszajelzes";
import { aiValaszEllenoriz, promptAdatBlokk, type HfFeladat, type RelevanciaValasz, type SzabalyJavaslatValasz, type UgyanazValasz, type TartalomotletValasz } from "./ai";
import type { AiHivo, HirfigyeloEsemeny, HostKontextus } from "./host";
import { jogosult } from "./host";
import type { HirfigyeloTar } from "./tar";
import type { ForrasTipus } from "./forras";
import { kartyakEpit, type Kartya } from "./kartya";

/** Napi cikk-korlát: legfeljebb ennyi új cikk értékelése futásonként. */
export const HF_NAPI_CIKK = 60;

/**
 * Biztonsági fék: legfeljebb ennyi AI-összehasonlítás egy futásban.
 * A gyanús párok száma a cikkszám NÉGYZETÉVEL nőhet, és egy rossz forrás (üres cikkek → azonos ujjlenyomat)
 * minden párt gyanússá tesz. Mérve 2026-09-08: 32 üres cikk = 496 AI-hívás, 27 perc.
 * A korlát fölötti párokra nem kérdezünk: külön esemény marad — inkább két kártya, mint elszabadult futás.
 */
export const HF_PAR_KORLAT = 60;

export type Letolto = (f: Forras) => Promise<
  | {
      ok: true;
      tipus: ForrasTipus;
      szovegOlvashato: boolean;
      cikkek: { cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null }[];
      /** A ténylegesen letöltött cím, ha nem az eredeti (átirányítás vagy megtalált hírfolyam). */
      felfedezettCim?: string;
    }
  | { ok: false; hibaOk: string }
>;

export type Kornyezet = {
  tar: HirfigyeloTar;
  letolto: Letolto;
  ai: AiHivo;
  /** A szervezet KÖZÖS profilja — a host adja (csak olvasásra, az AI-feladatok bemenete); a modul nem tud a tárolásáról. */
  profil: unknown;
  idAdo: () => string;
  most: () => Date;
  esemeny?: (e: HirfigyeloEsemeny) => void;
};

export type Hiba = {
  ok: false;
  hiba: "NINCS_JOG" | "NINCS_BEALLITAS" | "FUT_MAR" | "ERVENYTELEN_ADAT" | "NINCS_ILYEN_VERZIO" | "NINCS_ILYEN_JAVASLAT" | "MINTA_LEJART" | "NINCS_ILYEN_TALALAT" | "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_ROSSZ_VALASZ";
// … (kihagyva) …
  // 4) Források letöltése
  const forrasok = await k.tar.forrasok(szervezetId);
  // A futás a használható és a korlátozott forrásokat dolgozza fel, ÉS újra megpróbálja a korábban hibásakat (visszajöhetett);
  // kihagyja a nem támogatottat és az ellenőrizetlent (AI-javaslat ellenőrzés előtt nem forrás).
  const hasznalhatoForrasok = forrasok.filter((f) => f.allapot === "hasznalhato" || f.allapot === "korlatozott" || f.allapot === "hibas");
  const ujKivonatok: Kivonat[] = [];
  let aiHibaVolt = false;
  let keretKimerult = false;
  let felbeszakadt = false; // időkorlát vagy pár-korlát miatt nem kérdeztünk meg mindent
  let regiKihagyva = 0; // F9-A7: 48 óránál régebbi cikkek, kihagyva
  let datumNelkul = 0; // F9-A7: dátum nélküli cikkek — bekerülnek, de a napló jelzi
  /** Lejárt-e a host által adott határidő? A hosszú futás így MAGÁTÓL áll le, nem gazdátlanul fut tovább. */
  const lejart = (): boolean => hatarido !== undefined && k.most() >= hatarido;

  for (const f of hasznalhatoForrasok) {
    if (lejart()) { felbeszakadt = true; break; } // a letöltés is hosszú lehet: a határidőt itt is nézzük
    const letoltes = await k.letolto(f);
    if (!letoltes.ok) {
      futas = futasAtmenet(futas, { fajta: "forras_hiba", forras_id: f.id, ok: letoltes.hibaOk }, most);
      if (f.allapot !== "hibas") await k.tar.forrasMent(szervezetId, { ...f, allapot: "hibas", hiba_ok: letoltes.hibaOk });
      continue;
    }
    if (f.allapot === "hibas") await k.tar.forrasMent(szervezetId, { ...f, allapot: letoltes.szovegOlvashato ? "hasznalhato" : "korlatozott", hiba_ok: null, utolso_sikeres: most.toISOString() });
    // 5) Cikkenként kivonat, duplikátum kihagyva
    for (const cikk of letoltes.cikkek) {
      if (!cikk.cim.trim()) continue; // cím nélkül nem cikk (a forrás hibásan adja) — nem tároljuk
      const frissesseg = cikkFrissesseg(cikk.megjelenes, most);
      if (frissesseg === "regi") { regiKihagyva += 1; continue; } // F9-A7: a 48 óránál régebbi cikket nem tároljuk és nem értékeljük
      if (frissesseg === "datum_nelkul") datumNelkul += 1;
      const kivonat = kivonatKeszit(
        { id: k.idAdo(), forras_id: f.id, cim: cikk.cim, url: cikk.url, megjelenes: cikk.megjelenes, szoveg: cikk.szoveg, nyelv: cikk.nyelv },
        most,
      );
      const mentes = await k.tar.kivonatMent(szervezetId, kivonat);
      if (mentes === "letezik") continue;
      ujKivonatok.push(kivonat);
    }
  }

  // 6) Eseménybe sorolás: előbb a gyanús párok, majd AI-kérdések, majd szinkron ugyanaz
  const meglevoEsemenyek = await k.tar.esemenyek(szervezetId);
  const meglevoKivonatok = await k.tar.kivonatok(szervezetId, meglevoEsemenyek.flatMap((e) => e.talalat_ids));
  const meglevoCsoportok = meglevoEsemenyek.map((e) => ({
    esemeny: e,
    kivonatok: meglevoKivonatok.filter((kv) => e.talalat_ids.includes(kv.id)),
  }));
// … (kihagyva) …
    ujTalalatok.push(talalat);
    await k.tar.talalatMent(szervezetId, talalat);
  }

  // 8) Értékelés: hf_relevancia egyenként
  const ertekelesSzam = Math.min(ujTalalatok.length, HF_NAPI_CIKK);
  for (let i = 0; i < ertekelesSzam; i++) {
    if (keretKimerult) break;
    if (lejart()) { felbeszakadt = true; break; }
    const talalat = ujTalalatok[i]!;
    const kivonat = ujKivonatok.find((kv) => kv.id === talalat.kivonat_id);
    if (!kivonat) continue;
    const valasz = await k.ai("hf_relevancia", {
      profil: k.profil,
      beallitas: aktiv.beallitas,
      kivonat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt, nyelv: kivonat.nyelv },
    });
    if (valasz.ok) {
      const ell = aiValaszEllenoriz("hf_relevancia", valasz.valasz, { talalat_ids: [] });
      if (ell.ok) {
        const r = ell.ertek as RelevanciaValasz;
        talalat.ertekeles = {
          fontossag: r.fontossag,
          temacimke: r.temacimke,
          miert: r.miert,
          indoklas: r.indoklas,
          osszefoglalo: r.osszefoglalo,
          szabaly_verzio: aktiv.verzio,
          ertekelve: most.toISOString(),
          csonkolt_alapjan: kivonat.csonkolt,
        };
        talalat.ertekeles_allapot = "kesz";
      } else {
        aiHibaVolt = true;
        futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
      }
    } else if (valasz.kod === "AI_KERET_KIMERULT") {
      keretKimerult = true;
      talalat.ertekeles_allapot = "keret_kimerult";
    } else {
      aiHibaVolt = true;
      futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
    }
    await k.tar.talalatMent(szervezetId, talalat);
  }
  // A korlát feletti találatok fuggoben maradnak; ha a keret fogyott el, MINDEN még nem értékelt találat ezt mutatja
  // (D-12: a keret elfogyása érthetően látszik, nem „függőben”-ként).
  if (keretKimerult) {
    for (const t of ujTalalatok) {
      if (t.ertekeles_allapot === "fuggoben") { t.ertekeles_allapot = "keret_kimerult"; await k.tar.talalatMent(szervezetId, t); }
    }
    k.esemeny?.({ fajta: "keret_kimerult", szervezet_id: szervezetId, futas_id: futasId }); // egyszer, akárhol fogyott el
  }

  // 9) Próba esetén minta
  let minta: Minta | null = null;
  if (proba && ujTalalatok.length > 0) {
    minta = mintaKeszit(
