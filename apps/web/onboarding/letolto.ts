// A csomag (@rogton/letolto) HOST-SEMLEGES, ezért nincs benne `server-only`; a webalkalmazásban ez a bejárat őrzi,
// hogy a letöltő ne kerülhessen böngészőbe (E-29).
import "server-only";
export { weboldalSzoveg, LetoltesHiba, cimNormalizal, nyilvanosCim, type LetoltesHibaKod } from "@rogton/letolto";
// R-16 K7 (TERV §2-K7, gepezet 10): a bájt-letöltő — a honlapon talált logó (onboarding/honlap-logo.ts)
export { nyersBajtok } from "@rogton/letolto";
