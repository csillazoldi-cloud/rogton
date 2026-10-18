// F9-A1: az AI-válaszok szelídítése — csak ALAKOT igazít, tartalmat nem talál ki.
// Az ellenőrzés (aiValaszEllenoriz) előtt fut a nyers (unknown) válaszon.
// Szándékosan NEM importál az ./ai-ból (körkörös import elkerülése): a feladatnevet stringként veszi át.

/** Hosszú szöveg rövidítése: legfeljebb `max` karakter; ha vágni kell, az utolsó mondatvégnél (". " / "! " / "? "),
 *  annak híján az utolsó szóköznél, és a végére „…” kerül (a „…” beleszámít a max-ba). */
export function szovegRovidit(szoveg: string, max: number): string {
  if (typeof szoveg !== "string") return szoveg;
  if (max <= 0) return "";
  if (szoveg.length <= max) return szoveg;
  // A „…” 1 karakter (U+2026), beleszámít a max-ba.
  const vagasHely = max - 1;
  if (vagasHely <= 0) return "…";
  const resz = szoveg.slice(0, vagasHely);
  // Utolsó mondatvég: ". " / "! " / "? " — a mondatvégi írásjelet is megtartjuk.
  let vagas = -1;
  for (const jel of [". ", "! ", "? "]) {
    const i = resz.lastIndexOf(jel);
    if (i > vagas) vagas = i + 1; // az írásjel is benne marad
  }
  if (vagas > 0) return resz.slice(0, vagas).trimEnd() + "…";
  // Nincs mondatvég: utolsó szóköz.
  const szokoz = resz.lastIndexOf(" ");
  if (szokoz > 0) return resz.slice(0, szokoz).trimEnd() + "…";
  return resz.trimEnd() + "…";
}

/** Egy kizárás-tétel feldarabolása: ha 120 karakternél hosszabb, `;` és `,` mentén darabol, trimmel, üreseket eldob;
 *  ami még mindig hosszabb, azt szovegRovidit(…, 120). */
export function kizarasDarabol(tetel: string): string[] {
  if (typeof tetel !== "string") return [];
  const t = tetel.trim();
  if (t.length === 0) return [];
  if (t.length <= 120) return [t];
  const darabok = t
    .split(/[;,]/)
    .map((d) => d.trim())
    .filter((d) => d.length > 0);
  const ki: string[] = [];
  for (const d of darabok) {
    if (d.length <= 120) ki.push(d);
    else ki.push(szovegRovidit(d, 120));
  }
  return ki;
}

/** Nyelv-kód: kisbetűs, két betű; a „magyar/hungarian”→hu, „román/romana/română/romanian”→ro, „angol/english”→en
 *  nevek átváltása; ami nem két betű a végén, kimarad. */
export function nyelvKod(ertek: unknown): string | null {
  if (typeof ertek !== "string") return null;
  const t = ertek.trim().toLowerCase();
  if (t.length === 0) return null;
  const nevek: Record<string, string> = {
    magyar: "hu",
    hungarian: "hu",
    román: "ro",
    romana: "ro",
    "română": "ro",
    romanian: "ro",
    angol: "en",
    english: "en",
  };
  if (nevek[t]) return nevek[t];
  if (/^[a-z]{2}$/.test(t)) return t;
  return null;
}

/** Segéd: csak akkor adja vissza az objektumot, ha az valóban objektum (nem null, nem tömb). */
function objektumE(ertek: unknown): ertek is Record<string, unknown> {
  return typeof ertek === "object" && ertek !== null && !Array.isArray(ertek);
}

/** Segéd: string trim, ha string; egyébként az eredeti érték. */
function trimHaString(ertek: unknown): unknown {
  return typeof ertek === "string" ? ertek.trim() : ertek;
}

/** A Beallitas alakú nyers objektum szelídítése (a `Beallitas` séma korlátaihoz igazítva, kitalálás nélkül). */
export function beallitasSzelidit(nyers: unknown): unknown {
  if (!objektumE(nyers)) return nyers;
  const ki: Record<string, unknown> = { ...nyers };

  // celok: csak az engedélyezett értékek maradnak (egyedien); ha nem tömb, érintetlen.
  if (Array.isArray(ki.celok)) {
    const engedelyezett = new Set(["sajat_marka", "szakmai", "tartalomotlet"]);
    const celok: string[] = [];
    for (const c of ki.celok) {
      if (typeof c === "string" && engedelyezett.has(c) && !celok.includes(c)) celok.push(c);
    }
    ki.celok = celok;
  }

  // temak: tömb elemei objektumok; nev → ≤120; nevvaltozatok → nem üres stringek, egyenként ≤120, ≤20, egyedien;
  // megkulonboztetes → szovegRovidit 500; nem objektum elem kimarad; legfeljebb 30 téma.
  if (Array.isArray(ki.temak)) {
    const temak: Record<string, unknown>[] = [];
    for (const t of ki.temak) {
      if (!objektumE(t)) continue;
      const tema: Record<string, unknown> = { ...t };
      if (typeof tema.nev === "string") tema.nev = szovegRovidit(tema.nev.trim(), 120);
      if (Array.isArray(tema.nevvaltozatok)) {
        const nv: string[] = [];
        for (const n of tema.nevvaltozatok) {
          if (typeof n !== "string") continue;
          const tr = n.trim();
          if (tr.length === 0) continue;
          const rovid = tr.length <= 120 ? tr : szovegRovidit(tr, 120);
          if (!nv.includes(rovid)) nv.push(rovid);
          if (nv.length >= 20) break;
        }
        tema.nevvaltozatok = nv;
      }
      if (typeof tema.megkulonboztetes === "string") tema.megkulonboztetes = szovegRovidit(tema.megkulonboztetes.trim(), 500);
      temak.push(tema);
      if (temak.length >= 30) break;
    }
    ki.temak = temak;
  }

  // foldrajzi_fokusz → szovegRovidit 300; szabad_szoveg → szovegRovidit 2000.
  if (typeof ki.foldrajzi_fokusz === "string") ki.foldrajzi_fokusz = szovegRovidit(ki.foldrajzi_fokusz.trim(), 300);
  if (typeof ki.szabad_szoveg === "string") ki.szabad_szoveg = szovegRovidit(ki.szabad_szoveg.trim(), 2000);

  // nyelvek → nyelvKod, null kimarad, egyedien, ≤10; ha string (pl. "hu"), egyelemű tömbbé.
  if (typeof ki.nyelvek === "string") ki.nyelvek = [ki.nyelvek];
  if (Array.isArray(ki.nyelvek)) {
    const nyelvek: string[] = [];
    for (const n of ki.nyelvek) {
      const kod = nyelvKod(n);
      if (kod === null) continue;
      if (!nyelvek.includes(kod)) nyelvek.push(kod);
      if (nyelvek.length >= 10) break;
    }
    ki.nyelvek = nyelvek;
  }

  // kizarasok → minden elem kizarasDarabol, összefűzve, egyedien, ≤50; ha string, egyelemű tömbként kezelve.
  if (typeof ki.kizarasok === "string") ki.kizarasok = [ki.kizarasok];
  if (Array.isArray(ki.kizarasok)) {
    const kizarasok: string[] = [];
    for (const k of ki.kizarasok) {
      if (typeof k !== "string") continue;
      for (const d of kizarasDarabol(k)) {
        if (!kizarasok.includes(d)) kizarasok.push(d);
        if (kizarasok.length >= 50) break;
      }
      if (kizarasok.length >= 50) break;
    }
    ki.kizarasok = kizarasok;
  }

  // idozites: ha objektum és ora/perc numerikus STRING ("7"), számmá; mod kisbetűs; más nem változik.
  if (objektumE(ki.idozites)) {
    const idozites: Record<string, unknown> = { ...ki.idozites };
    if (typeof idozites.ora === "string" && /^-?\d+$/.test(idozites.ora.trim())) idozites.ora = Number(idozites.ora.trim());
    if (typeof idozites.perc === "string" && /^-?\d+$/.test(idozites.perc.trim())) idozites.perc = Number(idozites.perc.trim());
    if (typeof idozites.mod === "string") idozites.mod = idozites.mod.toLowerCase();
    ki.idozites = idozites;
  }

  return ki;
}

/** Az összkép nyers válaszának szelídítése. */
export function osszkepSzelidit(nyers: unknown): unknown {
  if (!objektumE(nyers)) return nyers;
  const ki: Record<string, unknown> = { ...nyers };

  // szoveg → szovegRovidit 1500.
  if (typeof ki.szoveg === "string") ki.szoveg = szovegRovidit(ki.szoveg, 1500);

  // hivatkozott_talalatok → csak stringek, trim, a `talalat_` előtag (kis/nagybetűtől függetlenül) levágva, egyedien;
  // ha string, egyelemű tömb.
  if (typeof ki.hivatkozott_talalatok === "string") ki.hivatkozott_talalatok = [ki.hivatkozott_talalatok];
  if (Array.isArray(ki.hivatkozott_talalatok)) {
    const lista: string[] = [];
    for (const h of ki.hivatkozott_talalatok) {
      if (typeof h !== "string") continue;
      let t = h.trim();
      if (t.toLowerCase().startsWith("talalat_")) t = t.slice("talalat_".length);
      if (t.length === 0) continue;
      if (!lista.includes(t)) lista.push(t);
    }
    ki.hivatkozott_talalatok = lista;
  }

  // bizonytalan: a "true"/"false" string → boolean; szám 0/1 → boolean.
  if (typeof ki.bizonytalan === "string") {
    const t = ki.bizonytalan.trim().toLowerCase();
    if (t === "true") ki.bizonytalan = true;
    else if (t === "false") ki.bizonytalan = false;
  } else if (typeof ki.bizonytalan === "number") {
    if (ki.bizonytalan === 0) ki.bizonytalan = false;
    else if (ki.bizonytalan === 1) ki.bizonytalan = true;
  }

  return ki;
}

/** A szabály-javaslat nyers válaszának szelídítése. */
export function szabalyJavaslatSzelidit(nyers: unknown): unknown {
  if (!objektumE(nyers)) return nyers;
  const ki: Record<string, unknown> = { ...nyers };

  // javasolt → beallitasSzelidit.
  if ("javasolt" in ki) ki.javasolt = beallitasSzelidit(ki.javasolt);

  // indoklas → szovegRovidit 800; varhato_hatas → szovegRovidit 400.
  if (typeof ki.indoklas === "string") ki.indoklas = szovegRovidit(ki.indoklas.trim(), 800);
  if (typeof ki.varhato_hatas === "string") ki.varhato_hatas = szovegRovidit(ki.varhato_hatas.trim(), 400);

  // profil_erintett mint a bizonytalan.
  if (typeof ki.profil_erintett === "string") {
    const t = ki.profil_erintett.trim().toLowerCase();
    if (t === "true") ki.profil_erintett = true;
    else if (t === "false") ki.profil_erintett = false;
  } else if (typeof ki.profil_erintett === "number") {
    if (ki.profil_erintett === 0) ki.profil_erintett = false;
    else if (ki.profil_erintett === 1) ki.profil_erintett = true;
  }

  // mi_alapjan: ha string → egyelemű tömb, csak stringek maradnak.
  if (typeof ki.mi_alapjan === "string") ki.mi_alapjan = [ki.mi_alapjan];
  if (Array.isArray(ki.mi_alapjan)) {
    ki.mi_alapjan = ki.mi_alapjan.filter((m): m is string => typeof m === "string");
  }

  return ki;
}

// F9-AI1 (MÉRVE 2026-09-15): a modell 3/3 menetben a fontosság mezőbe a témacímkét írta egy cikknél — determinisztikus megfeleltetés, a prompt saját meghatározása szerint
/** A relevancia-válasz szelídítése: a `fontossag` és a `temacimke` mezők keveredésének javítása, valamint a szöveges mezők rövidítése. */
/** Kulcsszó-összevetéshez: kisbetű, ékezet nélkül ("országos" → "orszagos"). */
function osszevetoKulcs(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function relevanciaSzelidit(nyers: unknown): unknown {
  if (!objektumE(nyers)) return nyers;
  const ki: Record<string, unknown> = { ...nyers };

  // fontossag: ha nem az engedélyezett értékek egyike, de a témacímke értékét tartalmazza → megfeleltetés.
  if (typeof ki.fontossag === "string") {
    const f = ki.fontossag;
    if (f !== "fontos" && f !== "erdekes" && f !== "hatter") {
      if (f === "sajat_megjelenes") ki.fontossag = "fontos";
      else if (f === "szakmai" || f === "tartalomotlet") ki.fontossag = "erdekes";
    }
  }

  // temacimke: ha nem az engedélyezett értékek egyike, de a fontosság értékét tartalmazza → fordított megfeleltetés.
  if (typeof ki.temacimke === "string") {
    const t = ki.temacimke;
    if (t !== "sajat_megjelenes" && t !== "szakmai" && t !== "tartalomotlet") {
      if (t === "fontos") ki.temacimke = "sajat_megjelenes";
      else if (t === "erdekes") ki.temacimke = "szakmai";
      else if (t === "hatter") ki.temacimke = "tartalomotlet";
    }
  }

  // Szöveges mezők: trim + szovegRovidit a séma szerint.
  if (typeof ki.osszefoglalo === "string") ki.osszefoglalo = szovegRovidit(ki.osszefoglalo.trim(), 400);
  if (typeof ki.miert === "string") ki.miert = szovegRovidit(ki.miert.trim(), 300);
  if (typeof ki.indoklas === "string") ki.indoklas = szovegRovidit(ki.indoklas.trim(), 800);
  // F10-M1
  if (typeof ki.cim_forditott === "string") ki.cim_forditott = szovegRovidit(ki.cim_forditott.trim(), 200);
  if (typeof ki.cegednek === "string") ki.cegednek = szovegRovidit(ki.cegednek.trim(), 300);
  if (typeof ki.vevoidnek === "string") ki.vevoidnek = szovegRovidit(ki.vevoidnek.trim(), 300);

  // v9 ellenőrző mezők (2026-09-22): a modell néha szövegként vagy igen/nemként adja őket.
  if (ki.rola_szol === "true" || ki.rola_szol === "igen") ki.rola_szol = true;
  else if (ki.rola_szol === "false" || ki.rola_szol === "nem") ki.rola_szol = false;
  else if (ki.rola_szol !== undefined && typeof ki.rola_szol !== "boolean") delete ki.rola_szol;
  for (const mezo of ["fo_tema", "erintett_tema"] as const) {
    if (ki[mezo] === null) ki[mezo] = "";
    if (typeof ki[mezo] === "string") ki[mezo] = szovegRovidit((ki[mezo] as string).trim(), 200);
    else if (ki[mezo] !== undefined) delete ki[mezo];
  }
  if (ki.helyszin === true || ki.helyszin === "igen") ki.helyszin = "egyezik";
  else if (ki.helyszin === false) ki.helyszin = "nem";
  else if (ki.helyszin !== undefined && ki.helyszin !== "egyezik" && ki.helyszin !== "nem" && ki.helyszin !== "nincs_feltetel") ki.helyszin = "nem"; // ismeretlen érték: szigorúan „nem”
  // v10
  for (const mezo of ["hely_feltetel", "hely_idezet"] as const) {
    if (ki[mezo] === null) ki[mezo] = "";
    if (typeof ki[mezo] === "string") ki[mezo] = szovegRovidit((ki[mezo] as string).trim(), 200);
    else if (ki[mezo] !== undefined) delete ki[mezo];
  }
  if (typeof ki.hatokor === "string") {
    const h = osszevetoKulcs(ki.hatokor);
    ki.hatokor = h === "helyi" || h === "varosi" ? "helyi" : h === "megyei" || h === "regionalis" ? "megyei" : h === "orszagos" ? "orszagos" : h === "nemzetkozi" ? "nemzetkozi" : "orszagos"; // ismeretlen: szigorúan „országos”
  } else if (ki.hatokor !== undefined) delete ki.hatokor;

  return ki;
}

/** Szavak listája: csak nem üres szöveg, trim, legfeljebb `max` karakter és `db` darab, egyedien. */
function szoLista(x: unknown, max: number, db: number): string[] {
  if (!Array.isArray(x)) return [];
  const ki: string[] = [];
  for (const s of x) {
    if (typeof s !== "string") continue;
    const t = s.trim().slice(0, max);
    if (t && !ki.includes(t)) ki.push(t);
    if (ki.length >= db) break;
  }
  return ki;
}

/** v11: a szólista alakja (üres hely → null, a listák a séma határára vágva). */
export function szolistaSzelidit(nyers: unknown): unknown {
  if (!objektumE(nyers)) return nyers;
  const ki: Record<string, unknown> = { ...nyers };
  const h = ki.hely;
  if (!objektumE(h) || typeof h.nev !== "string" || !h.nev.trim()) ki.hely = null;
  else ki.hely = { nev: h.nev.trim().slice(0, 200), szavak: szoLista(h.szavak, 80, 60) };
  ki.temak = Array.isArray(ki.temak)
    ? ki.temak.filter((t) => objektumE(t) && typeof t.nev === "string" && t.nev.trim()).slice(0, 60)
        .map((t) => { const o = t as Record<string, unknown>; return { nev: String(o.nev).trim().slice(0, 200), szavak: szoLista(o.szavak, 80, 80) }; })
    : [];
  ki.nevek = szoLista(ki.nevek, 120, 30);
  return ki;
}

/** v11: a címszűrés válasza — a sorszám jöhet szövegként is; ami nem szám, kimarad. */
export function cimSzuresSzelidit(nyers: unknown): unknown {
  if (Array.isArray(nyers)) return { megtart: nyers.filter((x) => /^\d+$/.test(String(x).trim())).map((x) => Number(String(x).trim())) };
  if (!objektumE(nyers)) return nyers;
  const szamok = (m: unknown): number[] => (Array.isArray(m) ? m.filter((x) => /^\d+$/.test(String(x).trim())).map((x) => Number(String(x).trim())).filter((x) => x > 0) : []);
  return { ...nyers, megtart: szamok(nyers.megtart), erinti: szamok(nyers.erinti) };
}

/** A feladat szerinti szelídítő; a többi feladatnál (hf_ugyanaz_az_esemeny, hf_tartalomotlet) a válasz változatlan. */
export function aiValaszSzelidit(feladat: string, valasz: unknown): unknown {
  switch (feladat) {
    case "hf_beallitas_javaslat":
      if (objektumE(valasz) && "beallitas" in valasz) {
        return { ...valasz, beallitas: beallitasSzelidit(valasz.beallitas) };
      }
      return valasz;
    case "hf_osszkep":
      return osszkepSzelidit(valasz);
    case "hf_szabaly_javaslat":
      return szabalyJavaslatSzelidit(valasz);
    case "hf_relevancia":
      return relevanciaSzelidit(valasz);
    case "hf_szolista":
      return szolistaSzelidit(valasz);
    case "hf_cim_szures":
      return cimSzuresSzelidit(valasz);
    default:
      return valasz;
  }
}
