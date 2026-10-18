"use client";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlapTokenek,
  SzervezetTemaAllapot,
  egyesit,
  szinRgb,
  teljesTokenek,
} from "@km/design-system";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { ElonezetPanel, type ElonezetAllapot } from "./ElonezetPanel";
import { SemaValaszto } from "./SemaValaszto";
import "./sema-valaszto.css";

type Betumeret = "kicsi" | "kozepes" | "nagy";
type Uzenet = { ok: boolean; szoveg: string } | null;

const BETUMERET_PX: Record<Betumeret, string> = {
  kicsi: "15px",
  kozepes: "16px",
  nagy: "18px",
};

// 2026-09-21: a cím és a lapcím a betűmérettel együtt nő (Közepesnél a mai 17 / 34 px) — különben
// Nagy betűnél a cím (17) kisebb lett volna a szövegnél (18). Arány: 1,0625 és 2,125.
function betumeretTokenek(b: Betumeret): { "--fs-base": string; "--fs-title": string; "--fs-h1": string } {
  const alap = parseInt(BETUMERET_PX[b], 10);
  return {
    "--fs-base": BETUMERET_PX[b],
    "--fs-title": `${Math.round(alap * 1.0625)}px`,
    "--fs-h1": `${Math.round(alap * 2.125)}px`,
  };
}

const FO_SZIN_MINTAK = ["#4f5fd6", "#2f7d5a", "#b5532b", "#6b3fa0"] as const; // tokenőr: ok — a fő szín választójának mintái (adat, nem stílus; a rajz 06 négy mintája)

// a primary világosabb változata: a hex csatornái 30%-kal a fehér felé
function vilagosabb(hex: string): string {
  const rgb = szinRgb(hex);
  if (!rgb) return hex;
  const kevert = rgb.map((c) => Math.round(c + (255 - c) * 0.3));
  return "#" + kevert.map((x) => x.toString(16).padStart(2, "0")).join("");
}

function hexSzin(v: string | undefined): string {
  const rgb = szinRgb(v);
  if (!rgb) return "#4f5fd6"; // tokenőr: ok — a színválasztó technikai tartaléka, nem festett érték
  return "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");
}

function betumeretBol(ertek: string | undefined): Betumeret {
  if (ertek === BETUMERET_PX.kicsi) return "kicsi";
  if (ertek === BETUMERET_PX.nagy) return "nagy";
  return "kozepes";
}

export function TemaEgyszeru({
  kezdo,
  szervezetNev,
  tulajdonos,
}: {
  kezdo: SzervezetTemaAllapot;
  szervezetNev: string;
  tulajdonos: boolean;
}) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();

  const alap = kezdo.alap;
  const alkalmazott = kezdo.hatasos;
  const kezdoTokenek = useMemo(
    () => (kezdo.tervezet ? egyesit(alap, kezdo.tervezet.felulirasok) : alkalmazott),
    [alap, alkalmazott, kezdo.tervezet],
  );

  const [foSzin, setFoSzin] = useState<string>(() => hexSzin(kezdoTokenek["--primary"]));
  const [betumeret, setBetumeret] = useState<Betumeret>(() => betumeretBol(kezdoTokenek["--fs-base"]));
  const [allapotNezet, setAllapotNezet] = useState<ElonezetAllapot>("normal");
  const [fut, setFut] = useState(false);
  const [uzenet, setUzenet] = useState<Uzenet>(null);
  // R-18 8. kör (Kati 10-13: „a Megjelenés telefonon zsúfolt”): telefonon a fő szín, a betűméret és az élő előnézet a „Részletek” mögött
  // (asztalon minden látszik, mint eddig) — semmi nem tűnt el, egy koppintásra előjön; a séma-választás marad elöl.
  const [tobb, setTobb] = useState(false);

  // 2026-09-21: sémaváltás után a lap újratölti a kezdő tokeneket — az előnézet és a mentés a
  // friss fő színt és betűméretet használja, ne a lap megnyitásakor beolvasottat.
  useEffect(() => {
    setFoSzin(hexSzin(kezdoTokenek["--primary"]));
    setBetumeret(betumeretBol(kezdoTokenek["--fs-base"]));
  }, [kezdoTokenek]);

  const tokenek = useMemo<AlapTokenek>(() => {
    return {
      ...kezdoTokenek,
      "--primary": foSzin,
      // a fő szín párja csak akkor számolt, ha a tulajdonos másik színt választott — a séma saját párja marad
      "--primary-2": foSzin.toLowerCase() === hexSzin(kezdoTokenek["--primary"]).toLowerCase() ? kezdoTokenek["--primary-2"] : vilagosabb(foSzin),
      ...betumeretTokenek(betumeret),
    };
  }, [kezdoTokenek, foSzin, betumeret]);

  const teljes = useMemo(() => teljesTokenek(tokenek), [tokenek]);

  function szinValt(e: ChangeEvent<HTMLInputElement>) {
    setFoSzin(e.target.value);
    setUzenet(null);
  }
  function mintaValt(ertek: string) {
    setFoSzin(ertek);
    setUzenet(null);
  }
  function betumeretValt(ertek: Betumeret) {
    setBetumeret(ertek);
    setUzenet(null);
  }

  async function mentes() {
    if (!tulajdonos) return;
    setFut(true);
    const mentve = await hivas("/api/tema", "PUT", { $schema: "km-theme/2", tokens: tokenek });
    const r = mentve.statusz === 200 ? await hivas("/api/tema/alkalmaz", "POST", {}) : mentve;
    setFut(false);
    if (r.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (r.statusz !== 200) {
      setUzenet({ ok: false, szoveg: t("tema.notice_apply_err") });
      return;
    }
    setUzenet({ ok: true, szoveg: t("tema.notice_applied") });
    router.refresh();
  }

  return (
    <main className="km-lap-keret km-tema-egyszeru">{/* F9-K1: a keret az egész lapot fogja (fej, üzenet, mezők, mentés) */}
      <header className="km-tema-egyszeru-fej">
        <div className="km-tema-egyszeru-cim">{t("tema.cim")}</div>
        <div className="km-tema-egyszeru-alkcim">{szervezetNev}</div>
      </header>

      {!tulajdonos ? (
        <div className="km-tema-egyszeru-uzenet" data-fajta="figyelem">
          {t("tema.csak_tulajdonos")}
        </div>
      ) : null}

      {tulajdonos ? (
        <SemaValaszto aktivKod={kezdo.sema_kod ?? null} nyelv={nyelv} kozos={false} onValtva={() => router.refresh()} />
      ) : null}
      {uzenet ? (
        <div className="km-tema-egyszeru-uzenet" data-fajta={uzenet.ok ? "ok" : "hiba"} aria-live="polite">
          {uzenet.szoveg}
        </div>
      ) : null}

      <button type="button" className="km-tema-egyszeru-tobb" aria-expanded={tobb} onClick={() => setTobb((x) => !x)}>
        {t("r15.kozos.reszletek")} <span aria-hidden="true">{tobb ? "▴" : "▾"}</span>
      </button>
      <div className="km-tema-egyszeru-fo" data-tel-nyitva={tobb ? "true" : "false"}>
        <section className="km-tema-egyszeru-szekcio">
          <h2 className="km-tema-egyszeru-szekcio-cim">{t("tema.fo_szin")}</h2>
          <div className="km-tema-egyszeru-szinek">
            {FO_SZIN_MINTAK.map((m) => (
              <button
                key={m}
                type="button"
                className="km-tema-egyszeru-minta"
                data-be={foSzin.toLowerCase() === m ? "true" : "false"}
                style={{ background: m }}
                onClick={() => mintaValt(m)}
                disabled={!tulajdonos || fut}
                aria-label={m}
              />
            ))}
            <input
              type="color"
              className="km-tema-egyszeru-szin-bemenet"
              value={foSzin}
              onChange={szinValt}
              disabled={!tulajdonos || fut}
              aria-label={t("tema.fo_szin")}
            />
          </div>
        </section>

        <section className="km-tema-egyszeru-szekcio">
          <h2 className="km-tema-egyszeru-szekcio-cim">{t("tema.betumeret")}</h2>
          <div className="km-tema-egyszeru-betuk">
            <button
              type="button"
              className="km-tema-egyszeru-betu-gomb"
              data-be={betumeret === "kicsi" ? "true" : "false"}
              onClick={() => betumeretValt("kicsi")}
              disabled={!tulajdonos || fut}
            >
              {t("tema.betumeret_kicsi")}
            </button>
            <button
              type="button"
              className="km-tema-egyszeru-betu-gomb"
              data-be={betumeret === "kozepes" ? "true" : "false"}
              onClick={() => betumeretValt("kozepes")}
              disabled={!tulajdonos || fut}
            >
              {t("tema.betumeret_kozepes")}
            </button>
            <button
              type="button"
              className="km-tema-egyszeru-betu-gomb"
              data-be={betumeret === "nagy" ? "true" : "false"}
              onClick={() => betumeretValt("nagy")}
              disabled={!tulajdonos || fut}
            >
              {t("tema.betumeret_nagy")}
            </button>
          </div>
        </section>

        <section className="km-tema-egyszeru-szekcio">
          <h2 className="km-tema-egyszeru-szekcio-cim">{t("tema.elonezet")}</h2>
          <div className="km-tema-egyszeru-elonezet-keret">
            <ElonezetPanel teljes={teljes} allapot={allapotNezet} mobil={false} t={t} />
          </div>
        </section>
      </div>

      <div className="km-tema-egyszeru-sav" data-tel-nyitva={tobb ? "true" : "false"}>
        <button
          type="button"
          className="km-tema-egyszeru-mentes"
          onClick={() => void mentes()}
          disabled={!tulajdonos || fut}
        >
          {t("tema.mentes")}
        </button>
        <a className="km-tema-egyszeru-halado" href="/tema?halado=1">
          {t("tema.halado")}
        </a>
      </div>
    </main>
  );
}
