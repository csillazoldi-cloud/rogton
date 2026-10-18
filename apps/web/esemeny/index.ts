import "server-only";
import { randomUUID } from "node:crypto";
import { ALAP_NYELV } from "@rogton/design-system";
import { feljegyez as magFeljegyez, type Esemeny, type EsemenyFajta, type KimenoCsatorna, type Kornyezet, type Sulyossag } from "@rogton/esemeny-core";
import { alapFeliratok, esemenyTar, ertesitesTar } from "./tar";
import { sablonKitolt } from "../nyelv/sablon"; // tiszta, import nélküli fájl — nem a nyelv modul bejárata, így nincs kör

// A `@rogton/esemeny-core` befogadója (F-5, R-4): a portok + a környezet. A kimenő csatorna egy webes horog, a címe a
// környezetből (`ERTESITES_WEBHOOK_URL` — a vaultból a NAS .env fájlján át); nincs cím → semmi nem megy ki, és ez nem hiba.
// Titok az esemény `adat`-ába NEM kerülhet — a hívó felel (jelszó, jegy, süti, kulcs soha).

export { naplo, ertesitesLekerdez, ertesitesSzervezetiMent, ertesitesKozosMent } from "@rogton/esemeny-core";

function csatorna(): KimenoCsatorna {
  const cim = process.env["ERTESITES_WEBHOOK_URL"]?.trim();
  if (!cim) return { kuld: async () => ({ ok: false, hiba: "NINCS_CSATORNA" }) };
  return {
    kuld: async (u) => {
      try {
        const v = await fetch(cim, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(u), signal: AbortSignal.timeout(5000) });
        return v.ok ? { ok: true } : { ok: false, hiba: `HTTP_${v.status}` };
      } catch (h) {
        return { ok: false, hiba: h instanceof Error ? h.name : "ISMERETLEN" }; // a cím nem kerül a hibába
      }
    },
  };
}

// A feliratozó: az ALAP feliratok az alapnyelven, közvetlenül a `felirat` táblából (nem a `nyelv` modulon át — az a feliratok
// szerkesztőjétől függ, az pedig ettől a naplótól: kör lenne). Az értesítés a rendszer nyelvén megy; a szervezet nyelve a rajz utáni kör.
let feliratGyorsitotar: { ido: number; f: Record<string, string> } | undefined;
async function feliratozo(): Promise<Kornyezet["felirat"]> {
  const most = Date.now();
  if (!feliratGyorsitotar || most - feliratGyorsitotar.ido > 60_000) feliratGyorsitotar = { ido: most, f: await alapFeliratok(ALAP_NYELV) };
  const f = feliratGyorsitotar.f;
  return (kulcs, ertekek) => {
    const sablon = f[kulcs];
    if (sablon === undefined) return kulcs;
    return sablonKitolt(sablon, ertekek); // R-18 3. kör: többes szám is (nyelv/sablon.ts)
  };
}

export async function esemenyKornyezet(): Promise<Kornyezet> {
  return {
    tar: esemenyTar,
    ertesites: ertesitesTar,
    ora: { most: () => new Date().toISOString() },
    azonosito: { uj: randomUUID },
    csatorna: csatorna(),
    felirat: await feliratozo(),
  };
}

export type Feljegyzes = { szervezet_id: string | null; fajta: EsemenyFajta; fiok_id?: string | null; adat?: Esemeny["adat"]; sulyossag?: Sulyossag };

/** A feljegyzés úgy, hogy egy naplóhiba SOHA ne állítsa meg az eredeti műveletet: a hibát csak a kiszolgáló naplója kapja. */
export async function feljegyezHatterben(k: Kornyezet, e: Feljegyzes): Promise<void> {
  try {
    const r = await magFeljegyez(k, e);
    if (!r.ok) console.error("[esemeny] feljegyzés sikertelen:", r.hiba, e.fajta);
  } catch (h) {
    console.error("[esemeny] feljegyzés kivétel:", e.fajta, h instanceof Error ? h.message : h);
  }
}
