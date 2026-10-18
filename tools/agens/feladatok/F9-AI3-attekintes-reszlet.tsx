// apps/web/app/hirfigyelo/Attekintes.tsx — RÉSZLET (a részletpanel ötlet-gombja)
        : null;

  const vanOtlet = kartya.tartalomotlet !== null && kartya.tartalomotlet !== undefined;

  return (
    <aside
      data-screen-label="HF-Részletpanel"
// … (kihagyva) …
          </div>
        ))}
      </div>
      {!vanOtlet && szerep !== "nezo" && (
        <>
          <button className="km-hf-at-panel-otlet-gomb" onClick={onOtlet} disabled={otletFut}>
            {otletFut ? t("hf.detIdeaWorking") : "✦ " + t("hf.detIdeaBtn")}
          </button>
          {otletHiba && <div className="km-hf-at-panel-otlet-hiba">{otletHiba}</div>}
        </>
      )}
      {vanOtlet && kartya.tartalomotlet && (
        <div className="km-hf-at-otlet">
