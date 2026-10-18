# Feladat — ÉPÍTŐ (F10-M1b): a F10-M1 feladat HIÁNYZÓ darabjai (az előző menet a 8. pontnál megszakadt)

Ugyanazok a szabályok, mint a mellékelt `F10-M1-epito.md`-ben (TypeScript 7 strict, zod 4.5, vitest; `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===`; RÉSZLET-fájl CSERE-blokkokkal, a RÉGI szó szerint). Az 1–7. pont MÁR KÉSZ (talalat.ts, ai.ts, kartya.ts, folyamat, szelidit, prompt, web ai) — azokat NE add vissza. CSAK ezt a hármat írd meg, a mellékelt feladatlap 8. és 9. pontja szerint:

1. RÉSZLET: `_RESZLET-kezdolap.md` (a mellékelt `kezdolap-index-reszlet.ts` és `kezdolap-tipusok-reszlet.ts` alapján, két CSERE) — a 8. pont pontosan.
2. TELJES: `packages/news-monitor-core/probak/ai.proba.ts` (mellékelve) + a 9. pont két új esete a `9.1 aiValaszEllenoriz hf_relevancia` describe-ba.
3. TELJES: `packages/news-monitor-core/probak/kartya.proba.ts` (mellékelve) + a 9. pont egy új esete.

A mag új mezői (már megvannak): `Ertekeles.cim_forditott?/cegednek?/vevoidnek?` (optional), `RelevanciaValasz` ugyanezek `.default("")`, `Kartya.cim_forditott/cegednek/vevoidnek: string`.
