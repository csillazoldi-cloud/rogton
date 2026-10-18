# R-16 K1 + K2 összekötve — mintaképek (2026-09-30, helyben: Postgres 16 + next start + a képgyártó Chromium 1194-gyel)

A Kövesi-szett (zöld #2f5d50 · homok #c9a86a · krém #f1ede4), jóváhagyott arculat, „Kész munka”, GET `/api/vizual/helyzet-minta/kesz?valtozat=…`.
A logók a 12f lapon (`/fiok/arculat/logok`) mentek fel, a böngésző elemzésével (x-logo-elemzes) — a képgyártó a `kepArculat`
`logok` térképét kapja (`hasznaltLogok` + `elemzes.atlatszo` / `vilagossag`).

- `1-csak-vilagos-vilagos.png` — csak egy sötét, kétszínű, átlátszó PNG (a gép a Világos helyre tette; elemzés: atlatszo true, vilagossag 0,207) → világos kép: a logó eredeti színeiben.
- `1-csak-vilagos-szines.png` — ugyanaz a színes (zöld) képen → fehérre színezve (nincs sötét logó, a világos átlátszó).
- `2-vilagos-es-feher-sotet-szines.png` — a „Sötét háttérre” helyre feltöltve egy fehér logó („FEHÉR SÖTÉTRE”, kör) → a színes képen a fehér logó áll.
- `12f-asztali-kepekkel.png` — a 12f a két feltöltés után, az „Így néz ki egy képed” képeivel.

A tesztlogók gépi rajzok (nem valódi Kövesi-logó).
