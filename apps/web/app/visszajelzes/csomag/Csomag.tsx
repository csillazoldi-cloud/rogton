"use client";
// R-9 (9. lap): a Napi javítócsomag — a legutóbbi csomag elöl, a korábbiak összecsukva. A készítés (POST) és a
// tétel-állapot (PATCH) csak rendszergazdának; a tulajdonos csak olvas.

import { useCallback, useEffect, useState } from "react";
import { useFeliratok } from "../../../nyelv/kliens";

type Sulyossag = "kicsi" | "kozepes" | "nagy";
type TetelAllapot = "javasolt" | "elfogadva" | "kesobb" | "nem";

type Tetel = {
  id: string;
  cim: string;
  javaslat: string;
  sulyossag: Sulyossag;
  lapok: string[];
  visszajelzes_ids: string[];
  allapot: TetelAllapot;
};

type JavitoCsomag = {
  id: string;
  nap: string;
  osszefoglalo: string;
  tetelek: Tetel[];
  visszajelzes_db: number;
  letrehozva: string;
};

export function Csomag({ rendszergazda }: { rendszergazda: boolean }) {
  const { t } = useFeliratok();
  const [csomagok, setCsomagok] = useState<JavitoCsomag[]>([]);
  const [tolt, setTolt] = useState(true);
  const [keszul, setKeszul] = useState(false);
  const [uzenet, setUzenet] = useState<string | null>(null);

  const betolt = useCallback(async () => {
    setTolt(true);
    try {
      const valasz = await fetch("/api/visszajelzes/csomag", { credentials: "same-origin" });
      if (!valasz.ok) return;
      const adat = (await valasz.json()) as { visszajelzes: { csomagok: JavitoCsomag[] } };
      setCsomagok(adat.visszajelzes.csomagok);
    } finally {
      setTolt(false);
    }
  }, []);

  useEffect(() => {
    void betolt();
  }, [betolt]);

  async function csomagKeszit() {
    setKeszul(true);
    setUzenet(null);
    try {
      const valasz = await fetch("/api/visszajelzes/csomag", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (valasz.status === 503) {
        setUzenet(t("hf.ujra"));
        return;
      }
      if (!valasz.ok) return;
      const adat = (await valasz.json()) as { visszajelzes: { csomag: JavitoCsomag | null } };
      if (adat.visszajelzes.csomag === null) {
        setUzenet(t("vj.csomag_ures"));
        return;
      }
      await betolt();
    } finally {
      setKeszul(false);
    }
  }

  async function tetelAllapot(csomagId: string, tetelId: string, uj: TetelAllapot) {
    const regi = csomagok;
    setCsomagok((lista) =>
      lista.map((c) =>
        c.id === csomagId
          ? { ...c, tetelek: c.tetelek.map((tt) => (tt.id === tetelId ? { ...tt, allapot: uj } : tt)) }
          : c,
      ),
    );
    try {
      const valasz = await fetch(`/api/visszajelzes/csomag/${csomagId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tetel_id: tetelId, allapot: uj }),
      });
      if (!valasz.ok) setCsomagok(regi);
    } catch {
      setCsomagok(regi);
    }
  }

  const [legfrissebb, ...korabbiak] = csomagok;

  return (
    <>
      <div className="km-vj-fej">
        <h1 className="km-vj-cim">{t("vj.csomag_cim")}</h1>
        {rendszergazda && (
          <button type="button" className="km-vj-csomag-gomb" disabled={keszul} onClick={() => void csomagKeszit()}>
            {keszul ? t("vj.csomag_keszul") : t("vj.csomag_keszit")}
          </button>
        )}
      </div>

      {uzenet && <p className="km-vj-uzenet">{uzenet}</p>}

      {tolt ? null : csomagok.length === 0 ? (
        <p className="km-vj-ures">{t("vj.csomag_nincs")}</p>
      ) : (
        <>
          {legfrissebb && (
            <section className="km-vj-csomag" data-friss="true">
              <div className="km-vj-csomag-fej">
                <span className="km-orb-sm" aria-hidden="true" />
                <span className="km-vj-csomag-nap">{legfrissebb.nap}</span>
                <span className="km-vj-csomag-db">{t("vj.visszajelzes_db", { n: legfrissebb.visszajelzes_db })}</span>
                <span className="km-vj-ai-jelveny">{t("vj.ai_jelveny")}</span>
              </div>
              <p className="km-vj-osszefoglalo">{legfrissebb.osszefoglalo}</p>
              {legfrissebb.tetelek.map((tt) => (
                <TetelSor
                  key={tt.id}
                  tetel={tt}
                  rendszergazda={rendszergazda}
                  onValt={(uj) => void tetelAllapot(legfrissebb.id, tt.id, uj)}
                />
              ))}
            </section>
          )}

          {korabbiak.map((c) => (
            <details key={c.id} className="km-vj-korabbi">
              <summary className="km-vj-korabbi-fej">
                {c.nap} · {t("vj.visszajelzes_db", { n: c.visszajelzes_db })}
              </summary>
              <p className="km-vj-osszefoglalo">{c.osszefoglalo}</p>
              {c.tetelek.map((tt) => (
                <TetelSor
                  key={tt.id}
                  tetel={tt}
                  rendszergazda={rendszergazda}
                  onValt={(uj) => void tetelAllapot(c.id, tt.id, uj)}
                />
              ))}
            </details>
          ))}
        </>
      )}
    </>
  );
}

function TetelSor({
  tetel,
  rendszergazda,
  onValt,
}: {
  tetel: Tetel;
  rendszergazda: boolean;
  onValt: (uj: TetelAllapot) => void;
}) {
  const { t } = useFeliratok();
  return (
    <article className="km-vj-tetel" data-allapot={tetel.allapot}>
      <span className="km-vj-sulyossag" data-sulyossag={tetel.sulyossag}>
        {t(`vj.sulyossag_${tetel.sulyossag}`)}
      </span>
      <div className="km-vj-tetel-torzs">
        <h3 className="km-vj-tetel-cim">{tetel.cim}</h3>
        <p className="km-vj-tetel-javaslat">{tetel.javaslat}</p>
        <span className="km-vj-tetel-lapok">{tetel.lapok.join(" · ")}</span>
      </div>
      {rendszergazda && (
        <div className="km-vj-tetel-gombok">
          <button
            type="button"
            className="km-vj-tetel-gomb"
            data-valasztott={tetel.allapot === "elfogadva"}
            onClick={() => onValt("elfogadva")}
          >
            {t("vj.tetel_elfogadom")}
          </button>
          <button
            type="button"
            className="km-vj-tetel-gomb"
            data-valasztott={tetel.allapot === "kesobb"}
            onClick={() => onValt("kesobb")}
          >
            {t("vj.tetel_kesobb")}
          </button>
          <button
            type="button"
            className="km-vj-tetel-gomb"
            data-valasztott={tetel.allapot === "nem"}
            onClick={() => onValt("nem")}
          >
            {t("vj.tetel_nem")}
          </button>
        </div>
      )}
    </article>
  );
}
