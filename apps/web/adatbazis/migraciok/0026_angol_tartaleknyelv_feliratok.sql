-- Kézzel írt migráció, K-1 (D-11, 2026-09-07): az angol az alap- és tartaléknyelv — a feliratok-szerkesztő magyarázó szövegei
-- ehhez igazítva három nyelven (a csomag alapja frissül; a szervezeti/közös felülírásokat nem érinti).
UPDATE "felirat" SET "szoveg" = 'Az angol az eredeti. Amit átírsz, csak a te szervezetednél változik; a többi szervezet a közöset látja. Ahol nincs magyar vagy román szöveg, az angol jelenik meg (tartaléknyelv).' WHERE "kulcs" = 'feliratok.magyarazat' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'Az angol az eredeti. Amit itt átírsz, minden szervezetnél megváltozik, amelyik nem írta felül a sajátjával.' WHERE "kulcs" = 'feliratok.magyarazat_kozos' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'Magyar' WHERE "kulcs" = 'feliratok.nyelv_hu' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'English (eredeti)' WHERE "kulcs" = 'feliratok.nyelv_en' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'tartalék: az angol szöveg látszik, amíg nincs fordítás' WHERE "kulcs" = 'feliratok.tartalek' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'Engleza este originalul. Ceea ce modifici se schimbă doar la organizația ta; celelalte organizații văd textul comun. Unde nu există text în maghiară sau română, apare engleza (limbă de rezervă).' WHERE "kulcs" = 'feliratok.magyarazat' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Engleza este originalul. Ceea ce modifici aici se schimbă la toate organizațiile care nu și-au suprascris propriul text.' WHERE "kulcs" = 'feliratok.magyarazat_kozos' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Magyar' WHERE "kulcs" = 'feliratok.nyelv_hu' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'English (original)' WHERE "kulcs" = 'feliratok.nyelv_en' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'rezervă: apare textul englez până când există traducere' WHERE "kulcs" = 'feliratok.tartalek' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'English is the original. What you edit only changes at your organisation; other organisations see the common text. Where there is no Hungarian or Romanian text, English appears (fallback language).' WHERE "kulcs" = 'feliratok.magyarazat' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'English is the original. What you edit here changes at all organisations that have not overridden it with their own.' WHERE "kulcs" = 'feliratok.magyarazat_kozos' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'Magyar' WHERE "kulcs" = 'feliratok.nyelv_hu' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'English (original)' WHERE "kulcs" = 'feliratok.nyelv_en' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'fallback: English text shows until a translation exists' WHERE "kulcs" = 'feliratok.tartalek' AND "nyelv" = 'en';
