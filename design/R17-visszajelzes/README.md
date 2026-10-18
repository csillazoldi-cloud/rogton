# R-17 · Tester feedback round — drawings (2026-10-06)

Drawing package for the items Csilla decided on 2026-10-06 from the feedback triage (Kati, Erika). **Approved** by Csilla 2026-10-06 14:18 (every ★ default in kerdesek.md);
built in code 2026-10-06 (HANDOFF „R-17 build”). Same structure as `design/R13/`.

| File | What it is |
|---|---|
| `rajz/R17-lapok.dc.html` + `support.js` | The drawing: 17 sections, 29 marked screens (desktop 1440 × 900, phone 390 × 844) + 1 admin view (Tibor-exempt, unmarked) + 1 phone "scrolled" frame (unmarked). Opens in a browser with `support.js` next to it; fonts come from `tools/vizual/referencia/betuk-munkater` (offline). |
| `feliratok.json` | 32 new label keys `r17.*`, hu · ro · en → one NEW migration. Reused keys are named in `gepezet.md`. |
| `gepezet.md` | Every new control → existing endpoint or NEW machinery. |
| `kerdesek.md` | Open questions for Csilla, each with a ★ default the drawing follows. |
| `tokenek.md` | No new tokens; the scoped R-7d values for the landing-page screens. |

## What is drawn
- **A · Arculat sub-pages (R-16):** „‹ Logó, színek, betűk” back link on Logók / Színek / Más szín / Betűk / Névlogó; „Kész” on Logók once a logo is up (#13 #14 #15);
  „Pontos kódom van” + code field on Más szín (#10, H3); tapping a filled logo slot switches the preview, square → profile picture (#11);
  phone: font names next to „Aa” (12a) and every uploaded logo as a tile (12b) (H2).
- **B · Paid logo design (#5):** quiet „Tervezzünk neked logót — 79 €” on the Névlogó page, the 5-question form, the thank-you state, the admin price row.
- **C · Posztszöveg „Blog / honlap” (#20):** the fourth tab, the editor with title line + longer article + soft counter, the website-article preview, phone.
- **D · Landing page language (Kati 10-02):** the first-visit chooser (only when the browser language is not HU/RO/EN) and the normal state with a quiet switcher.

## How it was built and checked
- Existing screens are **copied verbatim** from the approved drawings (`R16-arculat.dc.html`, `R15/rajz/08b-elonezet.resz.html`, `r7-audit-javitas/…/R7d-nyitolap.dc.html`)
  and changed by exact string replacements; new screens reuse the same header/footer shells. The generator lived in the agent's workspace; the drawing is static.
- Proof that nothing else moved: a visible-text diff of every changed screen against its approved original (see the review page) + side-by-side images.
- Probe: `python3 tools/tibor-proba/rajz_proba.py design/R17-visszajelzes/rajz/R17-lapok.dc.html --ki <out>` — results in the review page and the hand-off.
- The Sonnet judge (`tools/tibor-biro`) and `zar.py --rajz` need the API key / Ollama: run on Csilla's Mac:
  `python3 tools/tibor-biro/tibor_biro.py --ki <out> --max 3` then `python3 tools/tibor-proba/zar.py --ki <out> --rajz`.

## Levelezés (e-mail a logókérésről) — optional, to be filled in later (Csilla 10-06)
The app had no e-mail sending before R-17. A logo request is ALWAYS stored (`logoterv_keres`, migration 0150) and listed for the admin
(Beállítások → Rendszer → Logókérések, `/gephaz/logoterv`). An e-mail is sent only when BOTH are set:
- the SMTP settings in the NAS `.env` (passed through `nas/docker-compose.yml`, empty by default):
  `SMTP_HOST` (required) · `SMTP_FROM` (required, e.g. `Kommunikációs munkatér <noreply@example.ro>`) · `SMTP_PORT` (default 587; 465 = TLS) ·
  `SMTP_USER` / `SMTP_PASS` (AUTH LOGIN, only if the server needs it) · `SMTP_BIZTONSAG` (`starttls` default, `tls` for 465, `nincs` only for tests);
- the recipient address, set by the admin in Beállítások → Rendszer → „Logókérések címzettje” (empty by default; stored in `rendszer_beallitas`).
With nothing configured: no error, no dead control; each request shows „nincs beállítva” in the list. The password never goes into the repo.
Hub: no hub-posting mechanism exists in the code, so none was added.
