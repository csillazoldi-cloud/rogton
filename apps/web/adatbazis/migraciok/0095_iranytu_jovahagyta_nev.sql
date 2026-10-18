-- 0095: a jóváhagyó neve a soron. A fiók később törölhető (jovahagyta -> NULL), a név attól
-- még olvasható marad a lapon és a verziótörténetben.
ALTER TABLE "szervezet_iranytu" ADD COLUMN "jovahagyta_nev" text DEFAULT '' NOT NULL;
