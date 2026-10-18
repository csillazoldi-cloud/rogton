-- 0108: a nyitólap árazás-sora (hu/ro/en). Vilmos döntése 2026-09-19: amíg nincs ár,
-- a lap azt mondja, ami igaz — a próbaidőszak ingyenes, az ár később dől el.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('nyitolap.arazas', 'hu', 'Árazás: a próbaidőszak alatt ingyenes. Az ár később dől el, és előre szólunk, mielőtt bármi fizetőssé válna.'),
  ('nyitolap.arazas', 'ro', 'Prețuri: în perioada de probă este gratuit. Prețul se stabilește mai târziu, și te anunțăm înainte ca ceva să devină cu plată.'),
  ('nyitolap.arazas', 'en', 'Pricing: free during the trial period. The price will be set later, and we tell you before anything becomes paid.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
