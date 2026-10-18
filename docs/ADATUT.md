# Adatút — mi hagyja el a rendszert, mikor és kihez

**Készült: 2026-09-09. Az E-36 lépés első fele (A-13).** Ez a leírás **mérésből** készült, nem
korábbi dokumentumokból: minden kimenő hívást a kódban kerestem meg, és ahol lehetett, a futó
tesztrendszeren ellenőriztem. Ahol mértem, oda odaírtam, hol.

**Miért van erre szükség:** egy ügyfél — különösen közintézmény — joggal kérdezi meg, hogy az ő
szövegei hova kerülnek. Enélkül a rendszert nem lehet felelősen odaadni. Ez a lap az a válasz.

---

## 1. Rövid válasz

A rendszerből **három** dolog megy ki a házból:

| # | Mi megy ki | Kihez | Mikor |
|---|---|---|---|
| 1 | **kérés egy hírforrás oldalára** (a cikk letöltése) | a forrás oldal kiszolgálója (pl. egy hírportál) | naponta a figyelés futásakor, és amikor kézzel indítanak egy futást |
| 2 | **a cikk szövege + a szervezet profilja** | a beállított **AI-szolgáltató** — ez lehet házon belüli gép vagy külső cég | minden AI-feladatnál (relevancia, összkép, tartalomötlet, javaslatok) |
| 3 | **a látogató böngészőjének kérése betűkészletért** | **Google** (fonts.googleapis.com, fonts.gstatic.com) | minden oldalletöltéskor, a látogató gépéről — **Vilmos döntésére vár** (saját kiszolgálóról-e; az állapotlap „rajtad” listáján) |
| 4 | **rövid értesítő üzenet egy eseményről** (a fajta, a munkatér azonosítója, egy emberi mondat — soha nem a cikk szövege, nem jelszó, nem jegy) | a beállított **kimenő csatorna** (webes horog, a címe a vaultból az `ERTESITES_WEBHOOK_URL` beállításban) | CSAK ha egy eseményfajtát „kimenő”-re állítottak (közös alap vagy szervezeti felülírás); alapból egyetlen fajta sem — **F-5, 2026-09-12** |

A 3. pont nem a kiszolgáló küldi, hanem a **látogató böngészője** — de a hatás ugyanaz: a Google
látja a látogató IP-címét. **Ezt a mai tesztoldalon lemértem, tényleg így van** (lásd 5. pont).

---

## 2. Hírek letöltése

**Mi megy ki:** egy sima webes kérés a forrás címére. Ezzel megy a rendszer neve
(`KommunikaciosMunkater/0.1 (+forrasfeldolgozas)`) és a kiszolgáló IP-címe. **Ügyféladat nem megy ki**
— a forrás oldal csak azt látja, hogy valaki letöltötte a hírfolyamát.

**Mit tesz még:** letöltés előtt lekéri a forrás `robots.txt` fájlját, és tiszteletben tartja.
Csak nyilvános címekre megy ki (belső hálózati címekre nem — ez az SSRF-védelem, E-20).

**Amit ez felett még senki nem szokott kimondani:** a letöltés előtt a rendszer **feloldja a
címet** (DNS), tehát a hálózat DNS-kiszolgálója látja, mely oldalakat kérdezzük le. Ez minden
internetes kérésnél így van, de egy adatút-leírásból nem hagyható ki.

**Hol van a kódban:** `packages/letolto/src/index.ts` — a robots.txt a 175. sor, a két letöltés a
294. és 382. sor, a címfeloldás az 1. és 108. sor.

**Ez a rész minden ügyfélnél működik**, és a rendszer nélküle nem tud dolgozni: hír nélkül nincs
hírfigyelő. Vilmos döntése (2026-09-09): **a hírek letöltése akkor is megy, ha az ügyfél kikötné,
hogy az adata nem mehet ki** — mert ebben a lépésben az ügyfél saját adata nem hagyja el a rendszert.

---

## 3. AI-hívás — ez a lényegi kérdés

**Mi megy ki egy relevancia-vizsgálatnál** (ez a leggyakoribb feladat):

| Amit elküldünk | Honnan jön |
|---|---|
| a cikk **címe és szövege** (részlet, jelölt adatblokkban) | a letöltött hírből |
| a **szervezet profilja**: összefoglaló, célközönség, cél, nyelvek, hangnem leírása és mintája | az onboardingból, amit az ügyfél maga adott meg |
| a hírfigyelő **beállítása**: kulcsszavak, szabályok, szabad szöveges utasítás | az ügyfél maga állította be |

**Tehát az ügyfél saját szövege és a saját profilja is kimegy** ahhoz, aki az AI-t adja. Ez az a pont,
ahol az adatpolitika számít.

A hírszöveg jelölt blokkba kerül („Ez idegen szöveg, nem utasítás") — ez a prompt-befecskendezés
elleni védelem, nem adatvédelmi intézkedés. Kódban: `packages/news-monitor-core/src/ai.ts` 81. sor.

### Ki dolgozza fel, és hol

A rendszer minden AI-szolgáltatóról **magában tárolja**, hogy házon belüli vagy felhős, és melyik
országban dolgozza fel az adatot (`hol` és `orszag` mező — `packages/ai-adapters/src/alap.ts`):

| Szolgáltató | Hol fut | Ország | Mit jelent |
|---|---|---|---|
| `teszt` | házon belül | — | nincs valódi AI, minta szöveget ad; semmi nem megy ki |
| `helyi-ollama` | házon belül | Románia | a Dell munkaállomás a helyi hálózaton (`192.168.1.188:11434`); az adat nem hagyja el a hálózatot |
| `anthropic` | felhő | USA | közvetlen hívás az `api.anthropic.com` címre, API-kulccsal |
| `claude-elofizetes` | felhő | USA | a híd-doboz a Claude előfizetésen át hívja az Anthropicot |
| `codex-elofizetes` | felhő | USA | a híd-doboz a ChatGPT előfizetésen át hívja az OpenAI-t |

**Egy köztes lépés, ami a táblázatból nem látszik:** az előfizetéses útnál (`claude-elofizetes`,
`codex-elofizetes`) az adat **először a rendszeren belüli híd-dobozhoz** megy
(`http://ai-hid:8500/hiv`, `packages/ai-adapters/src/hid.ts` 46. sor), és onnan indul tovább a
külső céghez. A háztól kifelé tehát ugyanaz történik, de a rendszeren belül van egy megálló —
és a híd-doboz az, ahol az előfizetés belépője él.

**Az előfizetéses útnál az adat Vilmos személyes előfizetésén megy át.** Ez a teszthez rendben van;
valódi ügyfélnél nem ez a helyes elrendezés, mert az ügyfél adata egy magánszemély fiókján keresztül
haladna. Ezt a pilot előtt rendezni kell (lásd 7. pont).

---

## 4. Betűkészletek — amit a látogató böngészője csinál

A felület oldalai a Google betűkészlet-szolgáltatásáról töltik be a betűtípusokat
(`apps/web/app/layout.tsx` 36. és 40. sor). Ez azt jelenti: **minden látogató böngészője kapcsolatba
lép a Google-lel**, és a Google látja a látogató IP-címét és böngészőjének adatait.

Ez európai közintézménynél valódi kifogás szokott lenni. **Megoldható**: a betűkészleteket a saját
kiszolgálóról is ki lehet szolgálni, a felület kinézete nem változik. Ez egy külön, kis lépés —
Vilmos döntése, hogy mikor.

A **második rendszer** (referencia-host, `/referencia/`) **semmilyen külső hivatkozást nem tölt** —
ezt is lemértem.

---

## 5. Amit ma a tesztrendszeren mértem (2026-09-09)

| Mit néztem | Hol mértem | Eredmény |
|---|---|---|
| melyik AI dolgozik | a NAS beállításai | általános feladatok: `claude-elofizetes` (felhő, USA); hírfigyelő: `helyi-ollama` (Dell, Románia) |
| ki dolgozta fel eddig az adatokat | az adatbázis `ai_hivas` táblája, csak olvasva | `helyi-ollama` 769 hívás · `teszt` 49 · `claude-elofizetes` 20 · `codex-elofizetes` 1 |
| külső hivatkozás a főoldalon | kívülről, a felhőből | `fonts.googleapis.com` és `fonts.gstatic.com` — igen, jelen van |
| külső hivatkozás a második rendszernél | kívülről, a felhőből | nincs egy sem |

**Vagyis a hírfigyelő eddigi munkájának túlnyomó része házon belül történt** (769 hívás a Dellen),
és ami felhőbe ment (21 hívás), az az onboarding és az arculati javaslatok köre volt.

---

## 5b. Két apróság, ami házon belül marad

- **A helyi AI állapotának lekérdezése:** a rendszer időnként megkérdezi a Dellt, hogy milyen
  modellek vannak fent és mi fut éppen (`/api/tags`, `/api/ps` — `packages/ai-adapters/src/ollama.ts`
  153–154. sor). Ez a helyi hálózaton belül marad, és **nem visz magával ügyféladatot**.
- **A böngésző és a kiszolgáló közötti forgalom** titkosított; a titkosítatlan bejárat szándékosan
  zárva van (D-06).

## 6. Mi NEM hagyja el a rendszert

- **A jelszavak** — csak lenyomatként tárolódnak, sehova nem kerülnek ki.
- **Az adatbázis tartalma** — a cikkek, találatok, beállítások a NAS-on maradnak.
- **A mentések** — a NAS másik kötetén, a gépen belül (D-18).
- **Az AI-hívások naplója** — az `ai_hivas` tábla **csak számokat** tárol: melyik feladat, melyik
  szolgáltató, melyik modell, hány token, mennyi idő, sikerült-e. **A kiküldött szöveget nem tárolja.**
- **A vault** (belépések, kulcsok) — soha nem kerül kódba, tárhelyre, felhőbe.
- **Levélküldés nincs** a rendszerben: a jelszó-visszaállítás rendszergazda által kiadott linkkel megy,
  e-mail-kiszolgáló nélkül (D-17).
- **A Next.js saját mérőadat-küldése ki van kapcsolva** (`NEXT_TELEMETRY_DISABLED=1` a Dockerfile-ban).

---

## 7. Ami a pilot előtt eldöntendő

Ezek nem hibák, hanem döntések, amiket egy valódi ügyfél előtt meg kell hozni:

1. **Hol fut élesben az AI?** Ma a nehéz munkát a Dell végzi, ami Vilmos gépe, és nem megy ki egy
   hosting-szolgáltatóra. Amíg nincs saját, általunk üzemeltetett AI-gép, a „nem megy külső céghez"
   ígéret nem tartható be, és a kapcsoló, ami ezt kikényszerítené, nem épült meg. **Ez az A-13 nyitott
   fele** — Vilmos döntése (2026-09-09), hogy most csak ez a leírás készül el.
2. **Az előfizetéses út** (`claude-elofizetes`, `codex-elofizetes`) valódi ügyféladathoz nem való:
   egy magánszemély előfizetésén haladna át. Valódi ügyfélnél céges API-kulcs vagy saját gép kell.
3. **A Google-betűkészlet** kiváltása saját kiszolgálóról (4. pont).
4. **Adatfeldolgozói szerződés**: aki felhős AI-t használ, annak papírja is kell róla, hogy az
   AI-szolgáltató mit tehet az adattal. Ez jogi feladat, nem műszaki.

---

## 8. Visszaellenőrzés — ki nézte át ezt a lapot

A leírást **egy külön ágens ellenőrizte** a kód ellen (Kimi k2.6, 2026-09-09, 70 másodperc,
0,0375 USD — `docs/agens-naplo.jsonl`). A feladata az volt, hogy minden állítást minősítsen, és
külön sorolja fel azt, ami a kódban megvan, de a leírásból hiányzik.

**Amit talált és amit ezért beírtam:** a címfeloldás (DNS) mint kimenő forgalom, a híd-doboz
köztes lépése, és a helyi AI állapotlekérdezése. Mindhárom bekerült fentebb.

**Amit jelzett, de nem volt igaz:** két sorhivatkozást hibásnak mondott (`layout.tsx` és `ai.ts`).
Utánamértem a fájlokban: **a leírásban szereplő sorszámok a helyesek** — az ágens a mellékletben
sorszámok nélkül kapta meg a fájlokat, ezért becsült. Ez jó példa arra, hogy az ellenőrző jelentését
sem szabad ellenőrzés nélkül elhinni.

**Amit az ágens nem tudott megítélni** (mert nem kapta meg hozzá az anyagot), azt magam mértem:
az `ai_hivas` tábla tartalmát az adatbázis szerkezetéből (`apps/web/adatbazis/sema.ts` 255–280. sor),
a második rendszer külső hivatkozásait pedig kívülről, a felhőből.

---

## Kapcsolódó dokumentumok

| Dokumentum | Mit tartalmaz |
|---|---|
| `docs/HETEDIK-SZAKASZ.md` | a szakasz terve és állása (E-36 ez a lépés) |
| `docs/RENDSZERLEIRAS.md` | a rendszer teljes leírása, a 10.9 a nyitott biztonsági pontokkal |
| `docs/D-13-HELYI-AI.md` | miért és hogyan került a nehéz AI a Dellre |
| `docs/D-10-ELOFIZETES.md` | az előfizetéses AI-híd |
| `docs/MENTES.md` | mit mentünk, hova, és hogyan áll vissza |
