import http from "node:http";
// A HOST kiszolgálója: sima node:http, se Next, se React — a webalkalmazás Next-útvonalainak a párja.
// E-30 óta két HTML-oldalt is kiszolgál (`/` és `/beallitas`); a JSON-válaszok útvonalai változatlanok.
// F-3: a hozzáférés-modul három útvonala is itt van; a `hozzaferes` opcionális — ha nincs, 404.
// F-5 + F-6: az eseménynapló- és fájl-modul útvonalai; a `esemeny` és `fajl` opcionális — ha nincs, 404.
import { cssValtozok, AlapTokenek } from "@km/design-system";
import { feliratKitolt, NYELVEK, type Nyelv } from "@km/news-monitor-feliratok";
import { aktivVerzio, attekintes, type HostKontextus as HirfigyeloHostKontextus, type Kornyezet as HirfigyeloKornyezet } from "@km/news-monitor-core";
import {
  tagokLista,
  meghiv,
  meghivoElfogad,
  type HostKontextus as HozzaferesHostKontextus,
  type Kornyezet as HozzaferesKornyezet,
  type Szerep,
} from "@km/hozzaferes-core";
import {
  naplo,
  ertesitesLekerdez,
  ertesitesSzervezetiMent,
  type HostKontextus as EsemenyHostKontextus,
  type Kornyezet as EsemenyKornyezet,
} from "@km/esemeny-core";
import {
  feltolt,
  fajlLista,
  fajlOlvas,
  type HostKontextus as FajlHostKontextus,
  type Kornyezet as FajlKornyezet,
  type FajlCel,
  MIME,
} from "@km/fajl-core";
import temaAlap from "@km/design-system/tema-alap.json" with { type: "json" };
import type { Sor } from "./csatlakozok/utemezo.js";
import { beallitasOldal } from "./felulet/beallitas.js";
import { lap } from "./felulet/lap.js";
import { talalatokOldal } from "./felulet/talalatok.js";

const TOKENEK_CSS = cssValtozok(AlapTokenek.parse((temaAlap as { tokens: unknown }).tokens));

/**
 * Írható-e a bemutató. ALAPÉRTELMEZÉSBEN NEM (biztonsági felülvizsgálat, 2026-09-10, K-02):
 * a referencia-host nyilvánosan elérhető, és az indítás VALÓDI munkát tesz sorba a gépen — a NAS-on
 * ez a másik négy projekt oldalait is viheti magával. Kívülről nem kapcsolható be: csak a doboz
 * környezeti változójával (KM_REF_IRAS=1), amit a nyilvános kirakáson nem állítunk be.
 * A NAPI ütemezett futás ettől független, az belülről indul — a bemutató friss marad.
 */
function irhatoBemutato(): boolean {
  return process.env["KM_REF_IRAS"] === "1";
}

/** A kért nyelv: `?nyelv=` → a nyelv-süti → a böngésző nyelve → magyar. */
function nyelvKeresbol(url: URL, req: http.IncomingMessage): Nyelv {
  const kert = url.searchParams.get("nyelv");
  if (kert && (NYELVEK as readonly string[]).includes(kert)) return kert as Nyelv;
  const suti = (req.headers.cookie ?? "").split(";").map((r) => r.trim()).find((r) => r.startsWith("km_nyelv="))?.slice(9);
  if (suti && (NYELVEK as readonly string[]).includes(suti)) return suti as Nyelv;
  const bongeszo = (req.headers["accept-language"] ?? "").split(",").map((r) => (r.split(";")[0] ?? "").trim().split("-")[0] ?? "");
  for (const ny of bongeszo) if ((NYELVEK as readonly string[]).includes(ny)) return ny as Nyelv;
  return "hu";
}

export function hibaKod(hiba: string): number {
  switch (hiba) {
    case "NINCS_JOG":
    case "NAGYOBB_SZEREP":
      return 403;
    case "UTOLSO_TULAJDONOS":
    case "MAGAT_NEM":
    case "MAR_TAG":
      return 409;
    case "NINCS_ILYEN_TAG":
    case "NINCS_ILYEN_MEGHIVO":
      return 404;
    case "MEGHIVO_LEJART":
    case "MEGHIVO_FELHASZNALVA":
    case "MEGHIVO_VISSZAVONVA":
      return 410;
    case "ERVENYTELEN_ADAT":
      return 400;
    case "NINCS_BEALLITAS":
    case "FUT_MAR":
    case "MINTA_LEJART":
      return 409;
    case "NINCS_ILYEN_VERZIO":
    case "NINCS_ILYEN_JAVASLAT":
    case "NINCS_ILYEN_TALALAT":
      return 404;
    case "AI_KERET_KIMERULT":
      return 429;
    case "AI_NEM_ELERHETO":
    case "AI_ROSSZ_VALASZ":
      return 502;
    // F-5 + F-6 hibakódok
    case "SVG_NEM_ENGEDETT":
    case "TIPUS_NEM_ENGEDETT":
      return 415;
    case "TUL_NAGY":
      return 413;
    case "URES":
      return 400;
    case "NINCS_ILYEN_FAJL":
      return 404;
    case "ISMERETLEN_FAJTA":
      return 400;
    default:
      return 500;
  }
}

/** Útvonal-előtag levágása. `/referencia/beallitas` → `/beallitas`, `/referencia` → `/`.
 *  Ami nem az előtag alá esik, az `null` — arra 404 jár. Előtag nélkül minden változatlanul megy át. */
export function utvonalLevag(utvonal: string, alapUt: string): string | null {
  if (alapUt === "") return utvonal;
  if (utvonal === alapUt) return "/";
  if (!utvonal.startsWith(alapUt + "/")) return null;
  return utvonal.slice(alapUt.length);
}

export function kiszolgalo(f: {
  k: HirfigyeloKornyezet;
  ktx: HirfigyeloHostKontextus;
  sor: Sor;
  alapUt?: string;
  hozzaferes?: HozzaferesKornyezet;
  esemeny?: EsemenyKornyezet;
  fajl?: FajlKornyezet;
}): http.Server {
  const { k, ktx, sor, hozzaferes, esemeny, fajl } = f;
  const alapUt = f.alapUt ?? "";

  const valaszJson = (res: http.ServerResponse, status: number, adat: unknown) => {
    const torzs = JSON.stringify(adat);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(torzs),
    });
    res.end(torzs);
  };

  const testBeolvas = (req: http.IncomingMessage): Promise<string> => {
    return new Promise((megold, elutasit) => {
      let adat = "";
      let meret = 0;
      req.on("data", (darab: Buffer) => {
        meret += darab.length;
        if (meret > 64 * 1024) {
          req.destroy(); // ne olvassunk tovább: a kapcsolatot itt zárjuk
          elutasit(new Error("TUL_NAGY_TORZS"));
          return;
        }
        adat += darab.toString("utf-8");
      });
      req.on("end", () => megold(adat));
      req.on("error", (hiba) => elutasit(hiba));
    });
  };

  const bajtokBeolvas = (req: http.IncomingMessage): Promise<Buffer> => {
    return new Promise((megold, elutasit) => {
      const darabok: Buffer[] = [];
      let meret = 0;
      req.on("data", (darab: Buffer) => {
        meret += darab.length;
        if (meret > 11 * 1024 * 1024) {
          req.destroy();
          elutasit(new Error("TUL_NAGY_TORZS"));
          return;
        }
        darabok.push(darab);
      });
      req.on("end", () => megold(Buffer.concat(darabok)));
      req.on("error", (hiba) => elutasit(hiba));
    });
  };

  const valaszHtml = (res: http.ServerResponse, status: number, html: string, nyelv?: Nyelv) => {
    const fejlecek: Record<string, string | string[]> = {
      "content-type": "text/html; charset=utf-8",
      "content-length": String(Buffer.byteLength(html)),
      // A lap saját maga állítja össze a HTML-t, nincs benne külső forrás és nincs kliensoldali script.
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
    };
    if (nyelv) fejlecek["set-cookie"] = `km_nyelv=${nyelv}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
    res.writeHead(status, fejlecek);
    res.end(html);
  };

  // A befogadó fordítása: a hírfigyelő kontextusából a hozzáférés-modul saját típusára.
  const hozzaferesKtx = (): HozzaferesHostKontextus => ({
    fiok_id: ktx.fiok_id,
    szervezet_id: ktx.szervezet_id,
    szerep: ktx.szerep,
  });

  // A befogadó fordítása: a hírfigyelő kontextusából az esemény-modul saját típusára.
  const esemenyKtx = (): EsemenyHostKontextus => ({
    fiok_id: ktx.fiok_id,
    szervezet_id: ktx.szervezet_id,
    szerep: ktx.szerep,
  });

  // A befogadó fordítása: a hírfigyelő kontextusából a fájl-modul saját típusára.
  const fajlKtx = (): FajlHostKontextus => ({
    fiok_id: ktx.fiok_id,
    szervezet_id: ktx.szervezet_id,
    szerep: ktx.szerep,
  });

  const utvonalKezeles = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const utvonal = utvonalLevag(url.pathname, alapUt);
      if (utvonal === null) {
        valaszJson(res, 404, { hiba: "NINCS_ILYEN_UTVONAL" });
        return;
      }
      const nyelv = nyelvKeresbol(url, req);
      const felirat = (kulcs: string, ertekek?: Record<string, string | number>): string =>
        feliratKitolt(nyelv, kulcs, ertekek ?? {});

      // --- HTML-oldalak (E-30) ---
      if (req.method === "GET" && (utvonal === "/" || utvonal === "/beallitas")) {
        const beallitasLap = utvonal === "/beallitas";
        const forrasok = await k.tar.forrasok(ktx.szervezet_id);
        let tartalom: string;
        if (beallitasLap) {
          tartalom = beallitasOldal({
            nyelv,
            aktiv: aktivVerzio(await k.tar.verziok(ktx.szervezet_id)),
            forrasok,
            feliratok: felirat,
          });
        } else {
          const at = await attekintes(k, ktx);
          if (!at.ok) {
            valaszHtml(res, hibaKod(at.hiba), lap({ cim: felirat("hf.modTitle"), nyelv, aktiv: "talalatok", tokenekCss: TOKENEK_CSS, feliratok: felirat, alapUt, tartalom: `<p class="uzenet">${felirat("hf.betoltes_hiba")}</p>` }), nyelv);
            return;
          }
          const cimek = new Map(forrasok.map((f) => [f.id, f.cim]));
          tartalom = talalatokOldal({
            nyelv,
            kartyak: at.kartyak,
            utolsoSikeres: at.utolsoSikeres,
            fut: sor.tetelek(ktx.szervezet_id).some((t) => t.allapot === "var" || t.allapot === "fut"),
            ujDb: at.ujDb,
            forrasHibak: at.forrasHibak,
            forrasCime: (id) => cimek.get(id) ?? id,
            feliratok: felirat,
            alapUt,
            irhato: irhatoBemutato(),
          });
        }
        valaszHtml(res, 200, lap({ cim: felirat("hf.modTitle"), nyelv, aktiv: beallitasLap ? "beallitas" : "talalatok", tartalom, tokenekCss: TOKENEK_CSS, feliratok: felirat, alapUt }), nyelv);
        return;
      }

      // A lap gombja: sorba teszi a figyelést, majd VISSZAKÜLD a listára (böngészőnek 303, nem JSON).
      if (req.method === "POST" && utvonal === "/inditas") {
        if (!irhatoBemutato()) {
          valaszJson(res, 403, { hiba: "CSAK_OLVASHATO" });
          return;
        }
        sor.sorbaTesz(ktx.szervezet_id, "futas", { proba: false });
        res.writeHead(303, { location: `${alapUt}/`, "cache-control": "no-store" });
        res.end();
        return;
      }

      if (req.method === "GET" && utvonal === "/allapot") {
        valaszJson(res, 200, {
          allapot: "ok",
          ido: k.most().toISOString(),
          szervezet_id: ktx.szervezet_id,
        });
        return;
      }

      if (req.method === "GET" && utvonal === "/attekintes") {
        const eredmeny = await attekintes(k, ktx);
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { attekintes: eredmeny });
        return;
      }

      if (req.method === "GET" && utvonal === "/talalatok") {
        const eredmeny = await attekintes(k, ktx);
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { talalatok: eredmeny.talalatok, kartyak: eredmeny.kartyak });
        return;
      }

      if (req.method === "POST" && utvonal === "/futtat") {
        if (!irhatoBemutato()) {
          valaszJson(res, 403, { hiba: "CSAK_OLVASHATO" });
          return;
        }
        const torzs = await testBeolvas(req);
        let test: { proba?: boolean };
        try {
          test = torzs.trim() === "" ? {} : (JSON.parse(torzs) as { proba?: boolean });
        } catch {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" });
          return;
        }
        const proba = test.proba ?? false;
        const eredmeny = sor.sorbaTesz(ktx.szervezet_id, "futas", { proba });
        if (!eredmeny.ok) {
          valaszJson(res, 409, { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 202, { sor: eredmeny.sor });
        return;
      }

      if (req.method === "GET" && utvonal === "/sor") {
        const tetelek = sor.tetelek(ktx.szervezet_id);
        valaszJson(res, 200, { sor: tetelek });
        return;
      }

      const sorIdEgyezes = utvonal.match(/^\/sor\/(.+)$/);
      if (req.method === "GET" && sorIdEgyezes) {
        let id: string;
        try {
          id = decodeURIComponent(sorIdEgyezes[1] ?? "");
        } catch {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" }); // rossz százalék-kódolás az útvonalban
          return;
        }
        const tetel = sor.tetel(id);
        if (!tetel) {
          valaszJson(res, 404, { hiba: "NINCS_ILYEN_SOR" });
          return;
        }
        valaszJson(res, 200, { sor: tetel });
        return;
      }

      // --- F-3: hozzáférés-modul útvonalai ---
      if (!hozzaferes) {
        valaszJson(res, 404, { hiba: "NINCS_ILYEN_UTVONAL" });
        return;
      }

      if (req.method === "GET" && utvonal === "/tagok") {
        const eredmeny = await tagokLista(hozzaferes, hozzaferesKtx());
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { tagok: eredmeny.ertek });
        return;
      }

      if (req.method === "POST" && utvonal === "/tagok/meghivo") {
        if (!irhatoBemutato()) {
          valaszJson(res, 403, { hiba: "CSAK_OLVASHATO" });
          return;
        }
        const torzs = await testBeolvas(req);
        let test: { szerep: string; email?: string | null };
        try {
          test = JSON.parse(torzs) as { szerep: string; email?: string | null };
        } catch {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" });
          return;
        }
        const szerep = test.szerep as Szerep;
        const eredmeny = await meghiv(hozzaferes, hozzaferesKtx(), {
          szerep,
          email: test.email ?? null,
        });
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 201, { meghivo: eredmeny.ertek.meghivo, jegy: eredmeny.ertek.jegy });
        return;
      }

      if (req.method === "POST" && utvonal === "/meghivo/elfogad") {
        if (!irhatoBemutato()) {
          valaszJson(res, 403, { hiba: "CSAK_OLVASHATO" });
          return;
        }
        const torzs = await testBeolvas(req);
        let test: { jegy: string; fiok_id: string };
        try {
          test = JSON.parse(torzs) as { jegy: string; fiok_id: string };
        } catch {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" });
          return;
        }
        const eredmeny = await meghivoElfogad(
          hozzaferes,
          { fiok_id: test.fiok_id },
          test.jegy
        );
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, {
          szervezet_id: eredmeny.ertek.szervezet_id,
          szerep: eredmeny.ertek.szerep,
        });
        return;
      }

      // --- F-5: eseménynapló-modul útvonalai ---
      if (!esemeny) {
        valaszJson(res, 404, { hiba: "NINCS_ILYEN_UTVONAL" });
        return;
      }

      if (req.method === "GET" && utvonal === "/esemenyek") {
        const eredmeny = await naplo(esemeny, esemenyKtx());
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { esemenyek: eredmeny.ertek });
        return;
      }

      if (req.method === "GET" && utvonal === "/ertesites") {
        const eredmeny = await ertesitesLekerdez(esemeny, esemenyKtx());
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { ertesites: eredmeny.ertek });
        return;
      }

      if (req.method === "PUT" && utvonal === "/ertesites") {
        if (!irhatoBemutato()) {
          valaszJson(res, 403, { hiba: "CSAK_OLVASHATO" });
          return;
        }
        const torzs = await testBeolvas(req);
        let test: unknown;
        try {
          test = torzs.trim() === "" ? {} : JSON.parse(torzs);
        } catch {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" });
          return;
        }
        const eredmeny = await ertesitesSzervezetiMent(esemeny, esemenyKtx(), test);
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { ertesites: eredmeny.ertek });
        return;
      }

      // --- F-6: fájl-modul útvonalai ---
      if (!fajl) {
        valaszJson(res, 404, { hiba: "NINCS_ILYEN_UTVONAL" });
        return;
      }

      if (req.method === "POST" && utvonal === "/fajl") {
        if (!irhatoBemutato()) {
          valaszJson(res, 403, { hiba: "CSAK_OLVASHATO" });
          return;
        }
        const nev = req.headers["x-fajl-nev"];
        const cel = req.headers["x-fajl-cel"];
        if (typeof nev !== "string" || typeof cel !== "string") {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" });
          return;
        }
        const bajtok = await bajtokBeolvas(req);
        const eredmeny = await feltolt(fajl, fajlKtx(), {
          nev,
          cel: cel as FajlCel,
          bajtok: new Uint8Array(bajtok),
        });
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 201, { fajl: eredmeny.ertek });
        return;
      }

      if (req.method === "GET" && utvonal === "/fajl") {
        const cel = url.searchParams.get("cel");
        const eredmeny = await fajlLista(fajl, fajlKtx(), (cel as FajlCel) ?? undefined);
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        valaszJson(res, 200, { fajlok: eredmeny.ertek });
        return;
      }

      const fajlIdEgyezes = utvonal.match(/^\/fajl\/(.+)$/);
      if (req.method === "GET" && fajlIdEgyezes) {
        let id: string;
        try {
          id = decodeURIComponent(fajlIdEgyezes[1] ?? "");
        } catch {
          valaszJson(res, 400, { hiba: "ERVENYTELEN_ADAT" });
          return;
        }
        const eredmeny = await fajlOlvas(fajl, fajlKtx(), id);
        if (!eredmeny.ok) {
          valaszJson(res, hibaKod(eredmeny.hiba), { hiba: eredmeny.hiba });
          return;
        }
        const meta = eredmeny.ertek.meta;
        const bajtok = eredmeny.ertek.bajtok;
        res.writeHead(200, {
          "content-type": MIME[meta.tipus],
          "content-length": bajtok.length,
        });
        res.end(Buffer.from(bajtok));
        return;
      }

      valaszJson(res, 404, { hiba: "NINCS_ILYEN_UTVONAL" });
    } catch (hiba) {
      // A részlet a naplóba, NEM a válaszba
      console.error(`Kiszolgáló hiba: ${hiba instanceof Error ? hiba.message : String(hiba)}`);
      valaszJson(res, 500, { hiba: "BELSO_HIBA" });
    }
  };

  const server = http.createServer((req, res) => {
    void utvonalKezeles(req, res);
  });

  return server;
}

export function indit(server: http.Server, port: number): Promise<void> {
  return new Promise((megold, elutasit) => {
    server.once("error", elutasit);
    server.listen(port, () => {
      server.removeListener("error", elutasit);
      megold();
    });
  });
}
