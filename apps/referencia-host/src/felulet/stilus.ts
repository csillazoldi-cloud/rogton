export const STILUS: string = `
.verzio-jel { display: inline-block; padding: var(--pad-field-y) var(--pad-field-x); border-radius: var(--r-badge);
  background: var(--panel-soft); color: var(--text); font-weight: var(--fw-strong); }

:root {
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: var(--fs-base);
  line-height: var(--lh);
}

a {
  color: var(--accent-link);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.lap {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--pad-block);
}

.fejlec {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--gap);
  padding: var(--pad-card);
  background: var(--header-bg);
  border: var(--bw) solid var(--line);
  border-radius: var(--r-card);
  margin-bottom: var(--gap);
}

.fejlec-cim {
  font-family: var(--font-display);
  font-size: var(--fs-h1);
  font-weight: var(--fw-head);
  margin: 0;
}

.fejlec-tag {
  font-size: var(--fs-sm);
  color: var(--text-mut);
  background: var(--panel-soft);
  border-radius: var(--r-badge);
  padding: calc(var(--pad-field-y) * 0.5) var(--pad-field-x);
}

.nav {
  display: flex;
  gap: var(--gap);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--gap);
}

.nav-links {
  display: flex;
  gap: calc(var(--gap) * 0.5);
}

.nav-link {
  padding: var(--btn-pad-y) var(--btn-pad-x);
  border-radius: var(--r-btn);
  border: var(--bw) solid var(--btn-ghost-border);
  background: var(--btn-ghost-bg);
  color: var(--btn-ghost-text);
  font-weight: var(--fw-strong);
}

.nav-link.aktiv {
  background: var(--primary);
  color: var(--on-primary);
  border-color: var(--primary);
}

.nyelv-valaszto {
  display: flex;
  gap: calc(var(--gap) * 0.5);
  margin-left: auto;
}

.nyelv-link {
  padding: calc(var(--btn-pad-y) * 0.5) var(--btn-pad-x);
  border-radius: var(--r-btn);
  border: var(--bw) solid var(--field-border);
  background: var(--field-bg);
  color: var(--text);
  font-size: var(--fs-sm);
}

.nyelv-link.aktiv {
  background: var(--primary);
  color: var(--on-primary);
  border-color: var(--primary);
}

.allapot-sor {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
  align-items: center;
  padding: var(--pad-card);
  background: var(--panel-soft);
  border: var(--bw) solid var(--line-soft);
  border-radius: var(--r-card);
  margin-bottom: var(--gap);
}

.allapot-uzem {
  font-weight: var(--fw-strong);
}

.uj-jelzo {
  background: var(--accent-tint);
  color: var(--accent-text);
  border: var(--bw) solid var(--accent-border);
  border-radius: var(--r-badge);
  padding: calc(var(--pad-field-y) * 0.5) var(--pad-field-x);
  font-size: var(--fs-sm);
  font-weight: var(--fw-strong);
}

.uj-jelzo-ures {
  color: var(--text-dim);
  font-size: var(--fs-sm);
}

.inditas-form {
  margin-bottom: var(--gap);
}

.inditas-gomb {
  padding: var(--btn-pad-y) var(--btn-pad-x);
  border-radius: var(--r-btn);
  border: var(--bw) solid var(--primary);
  background: var(--primary);
  color: var(--on-primary);
  font-weight: var(--fw-strong);
  cursor: pointer;
  font-size: var(--fs-base);
}

.inditas-gomb:disabled {
  background: var(--btn-disabled-bg);
  border-color: var(--line);
  color: var(--text-dim);
  cursor: not-allowed;
}

.figyelmeztetes {
  padding: var(--pad-card);
  background: var(--warn-bg);
  border: var(--bw) solid var(--warn-border);
  border-radius: var(--r-card);
  color: var(--warn);
  margin-bottom: var(--gap);
}

.kartyak {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.kartya {
  padding: var(--pad-card);
  background: var(--bg-elev);
  border: var(--bw) solid var(--line);
  border-radius: var(--r-card);
}

.kartya-fej {
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 0.5);
  margin-bottom: calc(var(--gap) * 0.5);
}

.jelveny {
  display: inline-block;
  padding: calc(var(--pad-field-y) * 0.5) var(--pad-field-x);
  border-radius: var(--r-badge);
  font-size: var(--fs-xs);
  font-weight: var(--fw-strong);
  white-space: nowrap;
}

.jelveny-fontos {
  background: var(--src-ai-bg);
  color: var(--src-ai);
}

.jelveny-erdekes {
  background: var(--src-web-bg);
  color: var(--src-web);
}

.jelveny-hatter {
  background: var(--src-empty-bg);
  color: var(--src-empty);
}

.jelveny-uj {
  background: var(--accent-tint);
  color: var(--accent-text);
  border: var(--bw) solid var(--accent-border);
}

.kartya-cim {
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-weight: var(--fw-head);
  margin: 0;
}

.kartya-osszefoglalo {
  margin: calc(var(--gap) * 0.5) 0;
}

.kartya-miert {
  margin: calc(var(--gap) * 0.5) 0;
  font-size: var(--fs-sm);
  color: var(--text-mut);
}

.kartya-miert-cimke {
  font-weight: var(--fw-strong);
  color: var(--text);
}

.kartya-labsor {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--gap) * 0.5);
  font-size: var(--fs-sm);
  color: var(--text-dim);
  border-top: var(--bw) solid var(--line-soft);
  padding-top: calc(var(--gap) * 0.5);
  margin-top: calc(var(--gap) * 0.5);
}

.nincs-kartya {
  padding: var(--pad-card);
  background: var(--panel-soft);
  border: var(--bw) solid var(--line-soft);
  border-radius: var(--r-card);
  text-align: center;
}

.nincs-kartya-cim {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: var(--fw-head);
  margin: 0 0 calc(var(--gap) * 0.5);
}

.nincs-kartya-szoveg {
  color: var(--text-mut);
  margin: 0;
}

.szakasz {
  padding: var(--pad-card);
  background: var(--bg-elev);
  border: var(--bw) solid var(--line);
  border-radius: var(--r-card);
  margin-bottom: var(--gap);
}

.szakasz-cim {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: var(--fw-head);
  margin: 0 0 var(--gap);
}

.szakasz-tartalom {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.5);
}

.sor {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--gap) * 0.5);
  align-items: baseline;
}

.sor-cimke {
  font-weight: var(--fw-strong);
  min-width: 120px;
}

.sor-ertek {
  color: var(--text);
}

.sor-ertek-dim {
  color: var(--text-dim);
}

.forras-allapot {
  font-size: var(--fs-sm);
  padding: calc(var(--pad-field-y) * 0.5) var(--pad-field-x);
  border-radius: var(--r-badge);
  font-weight: var(--fw-strong);
}

.forras-allapot-ok {
  background: var(--ok-bg);
  color: var(--ok-strong);
}

.forras-allapot-korlatozott {
  background: var(--warn-bg);
  color: var(--warn);
}

.forras-allapot-hibas {
  background: var(--err-bg);
  color: var(--err-strong);
}

.forras-allapot-ellenorzes {
  background: var(--panel-soft);
  color: var(--text-mut);
}

.verzio {
  font-size: var(--fs-sm);
  color: var(--text-mut);
  margin-bottom: var(--gap);
}

.lablec {
  margin-top: calc(var(--gap) * 2);
  padding-top: var(--gap);
  border-top: var(--bw) solid var(--line-soft);
  font-size: var(--fs-sm);
  color: var(--text-faint);
  text-align: center;
}

@media (max-width: 600px) {
  .fejlec {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav {
    flex-direction: column;
    align-items: stretch;
  }

  .nyelv-valaszto {
    margin-left: 0;
  }

  .allapot-sor {
    flex-direction: column;
    align-items: flex-start;
  }

  .sor {
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--gap) * 0.25);
  }

  .sor-cimke {
    min-width: 0;
  }
}
`;
