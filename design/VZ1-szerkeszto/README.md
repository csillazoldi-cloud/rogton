# VZ-1 · Notice editor („Szöveges képek”, earlier working name „Közlemények”) — Tibor-rule redraw (2026-10-06)

**Approved** by Csilla 2026-10-06 17:32 with every ★ default; built into code the same day (docs/decisions/2026-10-06-vz1-kozlemenyek.md). Replaces the 09-23 drawing in `design/vz1/` (pre-R-15) for the screens the transport package opens from Képek.
Pattern = the working Képek flow: pick what to show → the machine fills it and makes the image → Tibor may edit (not required) → one button: Letöltés.

| File | What it is |
|---|---|
| `rajz/VZ1-szerkeszto.dc.html` + `support.js` | 6 views × desktop 1440 / phone 390 = 12 marked screens: V1 choose · V2 editor pre-filled (Forgalmi változás) · V3 Számokban (bars + source) · V4 Egy mondat — does not fit, Románul is on · V5 done, downloaded · V6 image maker not answering |
| `feliratok.json` | 45 `vz1r.*` keys, hu · ro · en (one new migration) |
| `gepezet.md` | every control → existing endpoint or NEW (post → fields extraction, notice-number counter, per-package „Hol?” label) |
| `kerdesek.md` | 8 questions with ★ defaults |
| `tokenek.md` | no new tokens |

Probe: `python3 tools/tibor-proba/rajz_proba.py design/VZ1-szerkeszto/rajz/VZ1-szerkeszto.dc.html --ki <out>` → 12/12 green (2026-10-06).
The Sonnet judge and `zar.py --rajz` run on Csilla's Mac (API key / Ollama).
Data: Kovács Burkolat Kft., Marosvásárhely (street-work closure on Bolyai utca, a customer-survey bar chart, one brand sentence). Images are sketches.
