// apps/web/app/hirfigyelo/_kozos/HirfigyeloKeret.tsx — RÉSZLET
  return (
    <div className="km-hf">
      <FelsoSav adat={sav} aktiv="hirek" />
      <div className="km-hf-fulsor">
        <span className="km-hf-modul-nev">{t("hf.modTitle")}</span>
        <span className="km-hf-modul-jelveny">{t("hf.modTag")}</span>
        <nav className="km-hf-fulek" aria-label={t("hf.pOverview")}>
          {fulek.filter((f) => ELERHETO_LAPOK.has(f.lap)).map((f) => (
            <a key={f.lap} href={LAP_UT[f.lap]} className="km-hf-ful" data-aktiv={f.lap === aktiv ? "true" : "false"} aria-current={f.lap === aktiv ? "page" : undefined}><span className="km-csak-asztal">{f.cimke}</span><span className="km-csak-telefon">{f.rovid}</span></a>
          ))}
        </nav>
        {sav.uj_talalat > 0 ? (
          <span className="km-hf-uj-talalat">{t("nav.uj_talalat_jelzes", { n: sav.uj_talalat })}</span>
        ) : null}
      </div>
      {/* R-7b (audit 11.): a „Közös profil … az onboardingból átvéve" sor elmarad — a rajzon nincs; a profilNev a lapoknak marad */}
      <main className="km-hf-tartalom">{children}</main>
    </div>
  );

/* hirfigyelo.css — RÉSZLET */
/* A Hírfigyelő modul közös váza (E-24) — a v7 prototípus fejléce, fülei, profil-sora. Minden érték token; a lapok saját CSS-e külön fájlban. */
.km-hf { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body-active); font-size: var(--fs-base); line-height: var(--lh); }
.km-hf-fulsor { display: flex; align-items: center; gap: var(--ter-5); flex-wrap: wrap; padding: var(--ter-5) var(--ter-10); border-bottom: var(--bw) solid var(--line-soft); background: var(--bg-elev); }
.km-hf-modul-nev { font-family: var(--font-display-active); font-weight: var(--fw-strong); font-size: var(--fs-md); color: var(--text); }
@keyframes km-hf-porog { to { transform: rotate(360deg); } }
@media (max-width: 640px) {
  .km-hf-fulsor { overflow-x: auto; white-space: nowrap; flex-wrap: nowrap; padding: var(--ter-5) var(--ter-8); }
  .km-hf-fulek { flex: none; }
  .km-hf-ful { flex: none; }
  .km-hf-uj-talalat { margin-inline-start: auto; flex: none; }
}
@media (max-width: 720px) {
  .km-hf-profil-sor, .km-hf-tartalom { padding-inline: var(--ter-8); }
}

