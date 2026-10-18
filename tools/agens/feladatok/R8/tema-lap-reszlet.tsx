const KOD_BETUK = [{ v: "'IBM Plex Mono',monospace", n: "IBM Plex Mono" }, { v: "monospace", n: "monospace (rendszer)" }, { v: "'Courier New',monospace", n: "Courier New" }];
const ARAB_CIM = [{ v: "'Cairo','Archivo',sans-serif", n: "Cairo" }, { v: "'Tajawal',sans-serif", n: "Tajawal" }];
const ARAB_SZOVEG = [{ v: "'Tajawal','Public Sans',sans-serif", n: "Tajawal" }, { v: "'Cairo',sans-serif", n: "Cairo" }];
const SZIN_MEZOK: (keyof AlapTokenek)[] = ["--bg", "--bg-elev", "--text", "--text-mut", "--primary", "--primary-2", "--on-primary", "--accent", "--accent-text", "--ok", "--err", "--focus", "--keszul", "--olvasatlan"];

const TER_KULCSOK = Object.keys(TOKEN_SZABALYOK).filter((k) => k.startsWith("--ter-")) as (keyof AlapTokenek)[];

              ) : null}

              {aktivFul === "meret" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("ter.cs_meret")}</h2>
                  {csuszka("--fs-h1", t("tema.fs_h1"), 20, 56)}
                  {csuszka("--fs-base", t("tema.fs_base"), 12, 20)}
                  {csuszka("--fs-metric", t("tema.fs_metric"), 18, 48)}
                  {csuszka("--fs-hero", t("tema.fs_hero"), 24, 80)}
                  {csuszka("--fs-hero-sm", t("tema.fs_hero_sm"), 20, 48)}
                  {csuszka("--fs-szekcio", t("tema.fs_szekcio"), 16, 40)}
              {aktivFul === "szin" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("tema.colors")}</h2>
                  <div className="km-tema-szinek">
                    {SZIN_MEZOK.map((k) => (
                      <label key={k} className="km-tema-szin">{szinCimke(k)}
                        <span className="km-tema-szin-sor">
                          <input type="color" className="km-tema-szin-bemenet" value={hexSzin(tokenek[k])} onChange={setSzin(k)} aria-label={szinCimke(k)} disabled={!szerkesztheto} />
                          <code className="km-tema-kod">{k}</code>
                        </span>
                      </label>
                    ))}
                  </div>
