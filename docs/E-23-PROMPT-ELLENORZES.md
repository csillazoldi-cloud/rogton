# E-23 — Hírfigyelő promptok felülvizsgálata

## hf_relevancia

**Követelmény (spec 3b/3c, átadó):** relevancia Fontos/Érdekes/Háttér rövid indoklással, nincs pontszám; „Miért fontos neked?” a felhasználó nyelvén; témacímke; csonkolt kivonat = RÉSZLET, ne következtessen; ADAT-blokk; ne idézzen utasítást.

**A prompt tartalmazza:** kategóriák, `miert`, `indoklas`, `temacimke`, csonkolt figyelmeztetés, ADAT-blokk. **HIÁNY:** nincs `osszefoglalo` kulcs (az építő B ezt várja). A „Miért fontos neked?” megfogalmazás a felhasználó nyelvén — a prompt magyarul kér, ez a felület nyelvétől független; jelezve a „nyelv” szakaszban.

**ELTÉRÉS:** nincs `osszefoglalo` (1–2 mondat, max 400 kar.). **RENDBEN:** kategóriák, csonkolt, ADAT.

## hf_osszkep

**Követelmény:** forrásokra hivatkozva; bizonytalan/ellentmondó forrásnál NEM von le biztos következtetést; nem talál ki találatot.

**A prompt tartalmazza:** `hivatkozott_talalatok` csak bemeneti azonosító; `bizonytalan` jelzés; „Ne találj ki találatot”. **RENDBEN.** Apró: a `bizonytalan` definíciója „kevés találat, ellentmondó hírek” — jó.

## hf_ugyanaz_az_esemeny

**Követelmény:** csak gyanús párra; konzervatív döntés (kétségnél NEM ugyanaz).

**A prompt:** „ugyanaz: true, ha ugyanarról az eseményről…; ha csak hasonló témájúak, false”. **HIÁNY:** nincs explicit konzervatív szabály („kétségnél false”). **RENDBEN:** egyébként.

## hf_tartalomotlet

**Követelmény:** csak kérésre, a szervezet hangnemében, AI-javaslatként elkülönítve.

**A prompt:** „tartalomötletet készítesz… a találat alapján” — a hangnem megadva. **HIÁNY:** nincs explicit „AI-javaslatként elkülönítve” jelölés a szövegben (a felület különíti el, de a prompt ne írjon úgy, mintha a szervezet sajátja lenne). **RENDBEN:** egyébként.

## hf_szabaly_javaslat

**Követelmény:** javaslat a visszajelzésekből, indokolt, várható hatással, jelzi ha a közös profilt érinti.

**A prompt:** `indoklas`, `varhato_hatas`, `profil_erintett`, `mi_alapjan`. **RENDBEN.**

## hf_beallitas_javaslat

**Követelmény:** első beállítás javaslata a profilból; ne találjon ki számokat.

**A prompt:** profil + szabad szöveg → beállítás. **RENDBEN.**

---

## Javasolt szövegmódosítások

### hf_relevancia — `osszefoglalo` kulcs felvétele
A séma-kulcsok és értékek nem változnak, de az építő B `osszefoglalo`-t vár; a kulcsot felvesszük (a séma nem tiltja, a zod-séma a `RelevanciaValasz`-t használja, de a webes hívásnál a `osszefoglalo` külön mezőként megy — lásd az építő B-t). A prompt JSON-kulcsai közé:
```json
{"osszefoglalo": "…", "fontossag": "fontos" | "erdekes" | "hatter", "temacimke": "sajat_megjelenes" | "szakmai" | "tartalomotlet", "miert": "…", "indoklas": "…"}
```
Szabályok közé:
- `"osszefoglalo"`: 1–2 mondat, max 400 karakter, miről szól a cikk (a felhasználó nyelvén).

### hf_ugyanaz_az_esemeny — konzervatív szabály
A „Szabályok” közé:
- Ha kétséges, hogy ugyanaz-e az esemény, `"ugyanaz": false` — két külön kártya jobb, mint egy hamis összevonás.

### hf_tartalomotlet — AI-javaslat elkülönítése
A „Szabályok” közé:
- A `"szoveg"` AI-javaslatként fogalmazódjon meg (pl. „Javaslat: …”), ne a szervezet saját hangján készült kész szövegként.

---

## Nyelv

A rendszer alapnyelve angol, a felület magyar/román. A promptok magyarul kérik a választ (a `miert`, `indoklas`, `osszefoglalo`, `szoveg` stb. magyarul jön). **Gond:** román felhasználónál a „Miért fontos neked?” és az összkép magyarul jelenik meg — a felület nyelvétől függetlenül. A promptokban a nyelvet nem változtatjuk (a feladat szerint), de a hívásnál (`hirfigyelo/ai.ts`) a `nyelv: "hu"` fix — ha a felület román, a válasz akkor is magyar lesz. Ezt a felületi rétegnek kell kezelnie (fordítás vagy a prompt nyelvének átadása), nem a promptnak. A `hf_tartalomotlet` `nyelv` mezője a tartalom nyelvét adja, de a prompt maga magyarul írja le az ötletet — román kérésnél a `nyelv: "ro"` ellenére magyar szöveg jön. **Javaslat:** a hívásnál a felület nyelvét átadni a promptnak (pl. `nyelv` paraméter), de ez a kód módosítása, nem a prompté — itt csak jelezzük.
