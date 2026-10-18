// A referencia-host indítója: `figyel` (egy figyelés a parancssorból) és `kiszolgal` (ütemező + HTTP).
import { attekintes, beallitasMent, ertekelesUjra, figyelesFuttat, forrasEllenoriz, forrasHozzaad, aktivVerzio } from "@km/news-monitor-core";
import { napiEsedekes } from "./csatlakozok/napi.js";
import { sorKeszit, utemezo, type SorTetel } from "./csatlakozok/utemezo.js";
import { indit as kiszolgaloIndit, kiszolgalo } from "./kiszolgalo.js";
import { kornyezetKeszit, type HostAllas } from "./kornyezet.js";
import { hozzaferesKornyezet } from "./csatlakozok/hozzaferes-kornyezet.js";
import { esemenyKornyezet } from "./csatlakozok/esemeny-kornyezet.js";
import { fajlKornyezet } from "./csatlakozok/fajl-kornyezet.js";

/** A használt beállításfájl: alapból `profil.json`; bemutatóhoz `KM_REF_PROFIL=profil.demo.json`
 *  — így a közös (determinisztikus) alapértelmezést nem kell átírni. */
function profilUtvonal(): string | undefined {
  return process.env["KM_REF_PROFIL"];
}

function ir(uzenet: string): void {
  process.stdout.write(uzenet + "\n");
}

/** Első indulás: ha nincs aktív beállítás, a `profil.json` kezdő beállítása lesz az; a felsorolt források bekerülnek és ellenőrződnek. */
async function elokeszit(allas: HostAllas): Promise<void> {
  const { k, ktx, beallitasok } = allas;
  if (!aktivVerzio(await k.tar.verziok(ktx.szervezet_id))) {
    const mentes = await beallitasMent(k, ktx, beallitasok.kezdo_beallitas, "kezi");
    if (!mentes.ok) throw new Error(`A kezdő beállítás nem menthető: ${mentes.hiba}`);
    ir(`Kezdő beállítás mentve (verzió ${mentes.uj?.verzio ?? "?"}).`);
  }
  const meglevo = new Set((await k.tar.forrasok(ktx.szervezet_id)).map((f) => f.cim));
  for (const cim of beallitasok.forrasok) {
    if (meglevo.has(cim)) continue;
    const uj = await forrasHozzaad(k, ktx, cim, "kezi");
    if (!uj.ok) {
      ir(`Forrás nem adható hozzá (${cim}): ${uj.hiba}`);
      continue;
    }
    const ell = await forrasEllenoriz(k, ktx, uj.forras.id);
    ir(`Forrás: ${cim} → ${ell.ok ? ell.forras.allapot : ell.hiba}`);
  }
}

async function figyel(): Promise<void> {
  const ut = profilUtvonal();
  const allas = kornyezetKeszit(ut ? { profilUt: ut } : {});
  try {
    await elokeszit(allas);
    const futas = await figyelesFuttat(allas.k, allas.ktx, { proba: false });
    if (!futas.ok) {
      ir(`A figyelés nem futott le: ${futas.hiba}`);
      process.exitCode = 1;
      return;
    }
    ir(`Futás: ${futas.futas.allapot}, új esemény: ${futas.futas.uj_talalatok}, új találat: ${futas.ujTalalatok.length}`);
    const attek = await attekintes(allas.k, allas.ktx);
    if (attek.ok) ir(`Összesen: ${attek.talalatok.length} találat, ${attek.kartyak.length} kártya. Tárolva: ${allas.beallitasok.adatbazis}`);
  } finally {
    allas.zar();
  }
}

async function kiszolgal(): Promise<void> {
  const ut = profilUtvonal();
  const allas = kornyezetKeszit(ut ? { profilUt: ut, naplo: ir } : { naplo: ir });
  await elokeszit(allas);
  const sor = sorKeszit(allas.tar.db, allas.k.idAdo, allas.k.most);

  /** A sor egy tételének elvégzése — a fajta dönti el, melyik magbeli műveletet hívjuk. */
  const futtat = async (t: SorTetel): Promise<Record<string, unknown>> => {
    if (t.fajta === "ertekeles_ujra") {
      const e = await ertekelesUjra(allas.k, allas.ktx);
      if (!e.ok) throw new Error(e.hiba);
      return { ujraErtekelt: e.ujraErtekelt };
    }
    // Határidő: a futás magától fejezze be és mentse, amit elért (nem fut gazdátlanul tovább).
    const e = await figyelesFuttat(allas.k, allas.ktx, { proba: t.adat["proba"] === true, hatarido: new Date(allas.k.most().getTime() + 14 * 60 * 1000) });
    if (!e.ok) throw new Error(e.hiba);
    return { futas_id: e.futas.id, allapot: e.futas.allapot, uj_talalatok: e.futas.uj_talalatok };
  };

  /** A legutóbbi BEFEJEZŐDÖTT napi futás ideje a sorból — ebből tudjuk, futott-e ma.
   *  A hibára futott napi tétel is „megvolt”: különben az ütemező körönként újrapróbálná egész nap. */
  const utolsoNapiFutas = (sz: string): string | null => {
    const tetel = sor.tetelek(sz).find((t) => t.fajta === "napi" && (t.allapot === "kesz" || t.allapot === "hiba"));
    return tetel?.vege ?? null;
  };

  const utem = utemezo(
    {
      sor,
      futtat,
      napiEsedekes: () => napiEsedekes(allas.tar, allas.ktx.szervezet_id, allas.k.most, utolsoNapiFutas),
      most: allas.k.most,
      naplo: ir,
    },
    { intervallumMs: allas.beallitasok.utemezo_ms },
  );
  utem.indit();

  const hozzaferes = hozzaferesKornyezet(
    allas.beallitasok.adatbazis.replace(/\.sqlite$/, "-hozzaferes.sqlite")
  );

  const esemeny = esemenyKornyezet(
    allas.beallitasok.adatbazis.replace(/\.sqlite$/, "-esemeny.sqlite")
  );

  const fajl = fajlKornyezet(
    allas.beallitasok.adatbazis.replace(/\.sqlite$/, "-fajl.sqlite")
  );

  const kiszolg = kiszolgalo({
    k: allas.k,
    ktx: allas.ktx,
    sor,
    alapUt: allas.beallitasok.alap_ut,
    hozzaferes,
    esemeny,
    fajl,
  });
  await kiszolgaloIndit(kiszolg, allas.beallitasok.port);
  ir(`A referencia-host figyel a ${allas.beallitasok.port} porton${allas.beallitasok.alap_ut ? ` (útvonal-előtag: ${allas.beallitasok.alap_ut})` : ""}. Adatbázis: ${allas.beallitasok.adatbazis}`);

  const leall = (): void => {
    utem.leallit();
    kiszolg.close();
    hozzaferes.zar();
    esemeny.zar();
    fajl.zar();
    allas.zar();
    process.exit(0);
  };
  process.on("SIGINT", leall);
  process.on("SIGTERM", leall);
}

const parancs = process.argv[2] ?? "figyel";
const futtatando = parancs === "kiszolgal" ? kiszolgal : figyel;
futtatando().catch((hiba: unknown) => {
  process.stderr.write(`${hiba instanceof Error ? hiba.stack ?? hiba.message : String(hiba)}\n`);
  process.exit(1);
});
