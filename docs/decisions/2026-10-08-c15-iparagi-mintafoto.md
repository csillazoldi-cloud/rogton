# Decision: industry-matched example photo in the "Kész munka" sample (c15, 2026-10-08)

**Decided by:** Csilla (chat, 2026-10-08 15:43–15:50). Hub chunk c15. Builds on c14 (docs/decisions/2026-10-08-c14-mintafoto.md).

**Why:** after c14 went live, every workspace got the paving photo, a coffee shop included.

**Rule:**
1. Eight closed categories plus a neutral fallback: `epites` (construction, paving) · `vendeglatas` (café, restaurant) · `bolt` (shop,
   retail) · `szepseg` (beauty, health) · `iroda` (office, IT, services) · `muhely` (workshop, manufacturing) · `kozlekedes` (transport,
   travel) · `kert` (garden, agriculture) · `semleges`.
2. The category is chosen by the AI call that already writes the workspace's sample texts (`kep_peldak`, apps/web/vizual/peldak.ts),
   from the company profile. Same call, one extra key in its JSON answer. Missing, unknown or misspelt → `semleges`.
3. Stored inside the existing cached samples (`kep_pelda.adat.kategoria`, jsonb). No new column, no migration, RLS unchanged (A-11).
4. The web passes it to the image maker's sample call (`minta_kategoria`). The image maker picks the photo; missing file → neutral.

**Photos (all Magnific free photos, downloaded with Csilla's paid plan, no attribution needed; ≤1600 px, JPEG 82, sRGB, no metadata):**

| Category | File (apps/kepgyar/minta/) | Magnific id |
|---|---|---|
| epites | kesz-minta-terko.jpg | 12455263 (c14) |
| vendeglatas | kesz-minta-vendeglatas.jpg | 16827936 (Adobe RGB → converted to sRGB) |
| bolt | kesz-minta-bolt.jpg | 148854228 |
| szepseg | kesz-minta-szepseg.jpg | 21084710 (Adobe RGB → converted to sRGB) |
| iroda | kesz-minta-iroda.jpg | 269341245 |
| muhely, kozlekedes, kert | not downloaded yet (10-08) → neutral | — |
| **semleges** | **kesz-minta-iroda.jpg**: generic and calm (Csilla's choice for now) | 269341245 |

Adding a photo later: put the file in `apps/kepgyar/minta/` and uncomment its one line in `MINTA_FOTOK`
(`apps/kepgyar/src/minta-foto.ts`). The image maker is rebuilt on the next deploy.

**Prompt:** `kep_peldak` v2 → v3. The keys don't depend on the language, so RO/EN behaviour is unchanged. The version is part of the
samples' fingerprint, so each workspace's samples are rewritten once (one AI call each, the usual effect of a prompt fix). They are
rewritten when the workspace opens Képek or its profile changes. Until then the stored row has no category, and the Kezdőlap sample
shows the neutral photo, not paving.

**Size fix (c14 side effect):** the sample with a photo is now served as `image/jpeg` (q85, about 160–250 kB instead of ~1.3 MB PNG).
Every other sample stays PNG. The web route forwards the image maker's content type. Consumers checked: `<img>` in R15MunkaMinta,
Képek (Helyzetek.tsx), IgyNezKi GET, and IgyNezKi/PostKep POST, which accepts any `image/*`. One test expectation (r16-betuk-vegpont)
now accepts png|jpeg, with the reason written next to it.

**Unchanged:** layout, text, the "Minta" corner mark, the editor image (`POST /helyzet`, where the stripes still mark the upload
spot), the other six templates, and requests that already carry a photo or ask for before/after.

## c15b (2026-10-08 16:55) — the last three photos

All 8 categories now have their own photo (Magnific free photos, Csilla's paid plan, no attribution; ≤1600 px, JPEG 82, sRGB, no metadata):
- muhely → `kesz-minta-muhely.jpg` (Magnific 10267976, "Tools and wood sawdust in workshop")
- kozlekedes → `kesz-minta-kozlekedes.jpg` (Magnific 423028490, "Camper van on scenic road, autumn")
- kert → `kesz-minta-kert.jpg` (Magnific 5399023, "Ripening tomatoes")
The neutral fallback stays the iroda photo. Measured: kepgyar fust-minta 38/38 (the muhely expectation moved from semleges to its own photo, reason written next to it).
