// packages/news-monitor-core/src/folyamat.ts — RÉSZLET (importok, a gyűjtés ciklusa, a futás vége)
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
import { futasAtmenet, indithato, kovetkezoFutas, utolsoSikeres } from "./futas";
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

// … (kihagyva) …
}

/** A figyelés futtatása: a spec 1)–10) pontjai szerint. */
export async function figyelesFuttat(
  k: Kornyezet,
  ktx: HostKontextus,
  { proba, hatarido }: { proba: boolean; hatarido?: Date },
): Promise<Eredmeny<{ futas: Futas; ujTalalatok: Talalat[]; minta: Minta | null }>> {
  const jog = jogEllenoriz(ktx, "futtat");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;

  // 1) Aktív verzió kell
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return { ok: false, hiba: "NINCS_BEALLITAS" };

  // 2) Dupla indítás tiltva
  const futasok = await k.tar.futasok(szervezetId);
  const aktivFutas = futasok.find((f) => f.allapot === "indul" || f.allapot === "fut") ?? null;
  if (!indithato(aktivFutas)) return { ok: false, hiba: "FUT_MAR" };

  // 3) Futás indul → fut
  const futasId = k.idAdo();
  const most = k.most();
  let futas: Futas = {
    id: futasId,
    szervezet_id: szervezetId,
    szabaly_verzio: aktiv.verzio,
    kezdet: most.toISOString(),
    veg: null,
    allapot: "indul",
    uj_talalatok: 0,
    hibas_forrasok: [],
    proba,
  };
  futas = futasAtmenet(futas, { fajta: "kezd" }, most);
  await k.tar.futasMent(szervezetId, futas);
  k.esemeny?.({ fajta: "futas_indult", szervezet_id: szervezetId, futas_id: futasId });

  // 4) Források letöltése
  const forrasok = await k.tar.forrasok(szervezetId);
  // A futás a használható és a korlátozott forrásokat dolgozza fel, ÉS újra megpróbálja a korábban hibásakat (visszajöhetett);
  // kihagyja a nem támogatottat és az ellenőrizetlent (AI-javaslat ellenőrzés előtt nem forrás).
  const hasznalhatoForrasok = forrasok.filter((f) => f.allapot === "hasznalhato" || f.allapot === "korlatozott" || f.allapot === "hibas");
  const ujKivonatok: Kivonat[] = [];
  let aiHibaVolt = false;
  let keretKimerult = false;
  let felbeszakadt = false; // időkorlát vagy pár-korlát miatt nem kérdeztünk meg mindent
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
// … (kihagyva) …

  // 10) Vége
  // uj_talalatok = az ÚJ KÁRTYÁK száma (események, a prototípus „{n} új találat” sávja); a cikkenkénti találatok az ujTalalatok listában
  const ujKartyak = sorolas.ujEsemenyek.length;
  futas = futasAtmenet(futas, { fajta: "vege", uj_talalatok: ujKartyak, osszesForras: hasznalhatoForrasok.length, felbeszakadt }, k.most()); // a vég ideje a valódi vég
  await k.tar.futasMent(szervezetId, futas);
  if (futas.allapot === "hiba") {
    k.esemeny?.({ fajta: "futas_hiba", szervezet_id: szervezetId, futas_id: futasId, reszlet: "minden_forras_hibas" });
  } else {
    k.esemeny?.({ fajta: "futas_kesz", szervezet_id: szervezetId, futas_id: futasId, uj_talalatok: ujKartyak });
  }

  return { ok: true, futas, ujTalalatok, minta };
}

