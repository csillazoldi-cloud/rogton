# Feladat — ÉPÍTŐ C (E-24/E-25): az AI beállítás-javaslat folyamata + útvonala, a fiókprofil „Modulok” sora, a képernyők élő próbái

Két másik építő ezzel párhuzamosan a két képernyőt készíti (Áttekintés `/hirfigyelo`, Beállítás `/hirfigyelo/beallitas`); te a mögöttes gépezet hiányzó darabját és az élő próbákat.
Mellékelve: `folyamat-beallitas.reszlet.ts` (a mag `beallitasMent`/`tervezetMent` folyamatai — a minta), `folyamat-tartalomotlet.reszlet.ts` (egy AI-hívó folyamat mintája:
jog, `k.ai`, `aiValaszEllenoriz`, hibakódok), `ai-ellenoriz.reszlet.ts` (`aiValaszEllenoriz` — a `hf_beallitas_javaslat` sémája `{ beallitas: Beallitas }`), `tervezet-route.ts` + `_kozos.ts`
(egy API-útvonal mintája és az `eredmenyValasz` képezése), `API-LAP.md`, `Fiok.tsx.oldalsav.reszlet` (a fiókprofil oldalsávja), `segedek.ts` + `profil-letrehozas.proba.reszlet`
(az élő próbák segédei és egy jóváhagyott profil létrehozása), `hf-feliratok-hu.json` (a modul feliratai, `hf.<kulcs>`; az oldalsáv kulcsai: `fiok.modulok`, `fiok.hirfigyelo_link`,
`fiok.hirfigyelo_link_sugo`).

Készítsd el (add vissza minden fájlt teljes egészében; a `folyamat.ts`-ből és a `Fiok.tsx`-ből CSAK a módosított/új részt add vissza „=== RÉSZLET: <fájl> ===” blokkban):

1. **A mag (`packages/news-monitor-core/src/folyamat.ts`) új folyamata** — RÉSZLET:
   `export async function beallitasJavaslatKer(k: Kornyezet, ktx: HostKontextus, szabadSzoveg: string): Promise<Eredmeny<{ tervezet: Beallitas }>>`:
   jog `beallit`; `k.ai("hf_beallitas_javaslat", { profil: k.profil, szabad_szoveg: szabadSzoveg })`; hibánál `AI_NEM_ELERHETO` | `AI_KERET_KIMERULT` | `AI_ROSSZ_VALASZ` (mint a
   `tartalomotletKer`); `aiValaszEllenoriz("hf_beallitas_javaslat", …)` → `{ beallitas }`; a javasolt beállítást `beallitasNormalizal`-lal rendezd (ha van ilyen exportált függvény a
   `beallitas.ts`-ben — a mellékelt részletből látszik, hogyan hívja a `beallitasMent`), és ha VAN aktív verzió, az `idozites`-t az aktívból vedd át (a javaslat ne állítsa át az
   ütemezést); a szabad szöveg kerüljön a `szabad_szoveg` mezőbe (ha az AI üresen hagyta); mentsd TERVEZETKÉNT: `k.tar.tervezetMent(ktx.szervezet_id, ktx.fiok_id, beallitas)`;
   válasz `{ ok: true, tervezet: beallitas }`. Soha nem ír aktív verziót.
   Próba: `packages/news-monitor-core/probak/beallitas-javaslat.proba.ts` (vitest, memóriatár + ál-AI): néző → NINCS_JOG; siker → tervezet mentve, aktív verzió NEM keletkezett;
   aktív verzió mellett az időzítés az aktívé marad; AI-hiba → AI_NEM_ELERHETO; rossz válasz (hiányzó `celok`) → AI_ROSSZ_VALASZ és nincs tervezet.
2. **Útvonal `apps/web/app/api/hirfigyelo/beallitas/javaslat/route.ts`**: `POST` body `{ szabad_szoveg?: string }` (zod, max 2000) → `beallitasJavaslatKer(k, ktx, szabad_szoveg ?? "")` →
   `eredmenyValasz` (a képezés már ismeri az AI-kódokat: 429/502; `NINCS_JOG` 403).
3. **Fiókprofil oldalsáv** (`apps/web/app/fiok/Fiok.tsx` — RÉSZLET): a „Beállítások” szakasz UTÁN egy új `km-fp-szakasz`: címke `fiok.modulok`, link `/hirfigyelo` (`km-fp-link`,
   `fiok.hirfigyelo_link` + „ →”), alatta `km-fp-megj` a `fiok.hirfigyelo_link_sugo` szöveggel — ugyanúgy, ahogy a Theme és a Feliratok linkje.
4. **Élő próbák `apps/web/probak/hirfigyelo-felulet.proba.ts`** (vitest, a `segedek.ts` `keres`-ével; a lapok HTML-jét a `keres` `torzs`-e szövegként adja, ha nem JSON — ha nem,
   használj `fetch`-et közvetlenül a `PROBA_CIM`-mel és a sütivel; a `keres` nem követi az átirányítást: nézd meg a `segedek.ts`-t — ha `redirect: "follow"` az alap, akkor a végső
   URL-t/tartalmat ellenőrizd):
   - belépés nélkül `GET /hirfigyelo` és `/hirfigyelo/beallitas` → átirányítás a `/belepes`-re;
   - belépve, szervezettel, DE profil nélkül → átirányítás az `/onboarding/1`-re;
   - jóváhagyott profillal (a mellékelt részlet szerint létrehozva) `GET /hirfigyelo` → 200, a HTML tartalmazza a `data-screen-label="HF-I Áttekintés"` szöveget és a magyar
     `Hírfigyelő` címet; `km_nyelv=ro` sütivel a román (`Monitorizare știri`), `km_nyelv=en`-nel az angol (`News monitor`) fejléccímet; első használatkor az `ovFirstTitle` magyar
     szövegét („Még nincs aktív figyelés.”);
   - `GET /hirfigyelo/beallitas` → 200, `data-screen-label="HF-II Figyelés beállítása"`;
   - `POST /api/hirfigyelo/beallitas/javaslat { szabad_szoveg: "helyi közlekedés" }` → 200 `tervezet.celok` nem üres, `tervezet.temak[0].nev` a profil neve (a teszt-csatlakozó a
     profil nevéből csinál témát), utána `GET beallitas` → `tervezet` ≠ null, `aktiv` null; néző (másik fiók, meghívva nézőként — ha a `segedek`-ben/`hirfigyelo.proba.ts`-ben van rá
     minta, azt kövesd; ha nincs, hagyd ki és írd meg egy megjegyzésben) → 403;
   - `GET /fiok` → a HTML tartalmazza a `/hirfigyelo` linket.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), zod 4, Next 16 (`params` Promise); magyar nevek és megjegyzések; nincs új npm-függőség; a mag csak
`@km/contracts`-ot és `zod`-ot importálhat.
