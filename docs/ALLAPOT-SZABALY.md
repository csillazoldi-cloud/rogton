# ÁLLAPOT-SZABÁLY — minden munka látszik az állapotlapon

Kommunikációs munkatér · Aitmetica SRL · 2026-09-12
**Ez törvény, nem ajánlás.** Minden munkamenetre érvényes: emberre, Claude-ra, Kimire,
DeepSeekre, Qwenre — mindenre, ami ehhez a projekthez hozzányúl.

Vilmos módszertanából: *„Bármikor tudnia kell, hol tartunk. A teendők állása írásban él és
frissül; nem az emlékezetemben."* · *„Élő haladásjelentés kell: melyik rész, melyik ágens,
hol tart."*

A lap: **https://saas.mediapartizan.ro/allapot/**

---

## 1. A törvény

> **Ami nincs az állapotlapon, az nem történik meg.**
> Minden munka **a kezdésekor** kerül fel, nem a végén. Aki dolgozik, az látszik.

Három következmény, ami nem alku tárgya:

1. **Kezdéskor, nem befejezéskor.** Egy lépés akkor kerül a lapra, amikor **elkezdődik**
   (`folyamatban`). Különben ez nem haladásjelző, hanem változásnapló — és Vilmos nem azt
   kérte.
2. **Minden munka, nem csak a kód.** Rajzkör, ellenőrzés, mérés, döntés, elakadás, blokkolt
   tétel — mind. Ha egy nap a munka az volt, hogy nyolc dokumentum készült, akkor annak a
   lapon kell látszania.
3. **Elavult lap = hazudó lap.** Rosszabb, mint a semmi, mert Vilmos ez alapján tervez.

## 2. Mi számít munkának

| Fajta | Hova kerül | Példa |
|---|---|---|
| kódfeladat | `lepesek[]`, `ki` mezővel | „A `@km/hozzaferes-core` váza és portjai" |
| rajzkör | `lepesek[]` | „R-1 javítókör kiadva a Designnak" |
| ellenőrzés, mérés | `naplo[]` + a lépés állapota | „Az R-0 csomag ellenőrzése: 3 hiba" |
| döntés | `naplo[]`, egy emberi mondatban | „A csomagok gerince a modulok lett, nem a korlátok" |
| elakadás | `naplo[]` + a lépés marad `folyamatban` | „A npm-tár zárva, a React nem tölthető" |
| ami Vilmosra vár | `rajtad[]` | „A modul-lista és az árak jóváhagyása" |
| szakasz nyit/zár | `szakaszok[]` + `szazalek` | „F-1 Térköz-skála · folyamatban · 40%" |

**A `naplo` emberi mondatokban íródik:** mit lát ettől másképp — nem azt, melyik fájl változott.

## 3. Ki írja

**Az állapotlapot egyetlen gazda írja: az orchestrator.** Az ügynökök soha nem nyúlnak hozzá.

Oka gyakorlati: a `allapot.json` egyetlen fájl, és ha három ügynök egyszerre írja, összeakad.
Az ügynök **jelent** — a befogadáskor az orchestrator vezeti fel. Ez egy mozdulat, mert a 4. pont
szerinti parancs egy sor.

## 4. A gépezet — mert a szabály gépezet nélkül ugyanaz, mint a gomb gépezet nélkül

Ez a lap három apró eszközt rendel meg. **Amíg ezek nincsenek meg, a szabály el fog kopni** —
nem rosszindulatból, hanem mert 29 kilobájtnyi JSON-t kézzel szerkeszteni súrlódás, a súrlódás
pedig megöli a fegyelmet.

### 4.1 `pnpm allapot` — egy soros felvezetés

```
pnpm allapot kezd   F-3.2 "A meghívó-jegy állapotgépe" --ki deepseek --ora 3
pnpm allapot kesz   F-3.2
pnpm allapot szakasz F-3 --szazalek 40 --allapot folyamatban
pnpm allapot naplo  "Az R-0 ellenőrzése kész: három hiba, egyik sem újrarajzolás"
pnpm allapot rajtad "A modul-lista jóváhagyása" --miert "enélkül az F-7 nem indulhat"
```

Amit csinál: beírja a sort a `nas/public/allapot/allapot.json`-ba, átállítja a `frissitve`
mezőt, **ellenőrzi a sémát**, és kiteszi a lapot (4.3).

### 4.2 `pnpm allapotor` — az őr, ami nem engedi elavulni

Bekerül az `ellenoriz` láncba, a mai `hatar && tokenor && tipus && epit` mellé. Négy szabályt
néz:

1. **Frissebb-e a kód, mint a lap?** Ha az `apps/`, `packages/` vagy `nas/` alatt van olyan
   véglegesített változás, ami **újabb**, mint a `frissitve` mező — **hiba**.
2. **Van-e gazdátlan szakasz?** `folyamatban` szakasz alatt legyen legalább egy `folyamatban`
   lépés, különben nem látszik, ki min dolgozik — **hiba**.
3. **Hazudik-e a százalék?** `szazalek: 100` csak akkor, ha a szakasz minden lépése `kesz` —
   **hiba**.
4. **Érvényes-e a séma?** Hiányzó vagy ismeretlen kulcs — **hiba**.

Ettől kezdve **nem lehet kiadni elavult állapotlappal.** Ez a lényeg: nem az emlékezetre
bízzuk.

### 4.3 Külön, gyors kitevés — a lap nem várhat egy alkalmazás-fordításra

Az állapotlap statikus, és az nginx adja közvetlenül (`location /allapot/`). Ez szándékos: a lap
akkor is él, amikor az alkalmazás épp újraépül vagy elszállt.

Ebből következik, hogy **a frissítésének nem szabad az alkalmazás fordításától függnie.**
A `pnpm allapot` az `allapot.json`-t magában teszi ki — másodpercek, nem percek.

A meglévő kitevő út a `nas/kirak.sh`. **Az orchestrator első dolga megmérni, hogyan működik**,
és nem feltételezni: ha a `kirak.sh` ma mindent együtt tesz ki, akkor kap egy külön, csak az
állapotfájlt mozgató ágat.

### 4.4 A robot „Kint” sora — a lap nem maradhat le a kirakás mögött (Csilla, 2026-10-11)

Minden **sikeres** kirakás után (kapu zöld, dobozok fent, az oldal válaszol, a visszaolvasás egyezik) a Gigabyte robotja maga ír
egy sort az **élő** lapra: `Kint: <rövid sha> — <a véglegesítés tárgya, legfeljebb 100 karakter>`, bukaresti idővel, és átállítja a
`frissitve` mezőt (`tools/gigabyte-robot/kint-sor.sh`). Elutasított vagy elbukott kirakás: nincs sor (a Telegram-üzenet marad).
Egy változatra egy sor, újrakirakásnál sem több. A tárhely fájlját a robot nem írja (nem véglegesít): a saját sorait a Gigabyte-on
tartja (`~/.local/state/gigabyte-robot/kint-sorok.jsonl`, a legutóbbi 30), és minden kirakás után — sikertelen után is, mert a
`nas/public` másolása a lapot felülírja — visszaolvasztja őket a NAS-on lévő fájlba (időrendi helyükre, ismétlés nélkül, ideiglenes
fájl + `mv`). Hibás JSON vagy elérhetetlen NAS: nem ír, egy helyi naplósor, a kirakás ettől nem bukik el.

### 4.5 Amit a sor mond — a megtett munkát (Csilla, 2026-10-11)

**A lap sorai azt írják le, ami megtörtént — soha nem azt, ami még nincs meg.** „… kész az ágon (még nincs kint)” típusú sor nem
kerül a lapra: a „kint” állapotot a robot „Kint” sora mondja ki (4.4). Az ügynök a saját munkáját így vezeti fel: mit csinált és mi lett
belőle („A Hírek lap 4+ hírnél az első hármat mutatja; mérve 390 és 1440 px-en”), ág és kirakás nélküli állapotjelzők nélkül.

Az eszköz két kiegészítése (c6, 2026-10-11): `pnpm allapot lezar <kód> --miert "…"` (kész + egysoros ok a lépés nevének végén —
lezárás, nem törlés) és `pnpm allapot naplo "…" --ido "MM-DD HH:MM"` (utólagos sor az időrendi helyére); `kezd --hatra` nyitott,
még el nem kezdett lépést vesz fel.

## 5. Az adatfájl szerkezete

`nas/public/allapot/allapot.json`:

| Kulcs | Tartalom |
|---|---|
| `frissitve` | ISO időbélyeg — ezt nézi az őr |
| `projekt`, `megjegyzes` | fejléc |
| `szakaszok[]` | `{kod, nev, allapot, szazalek, leiras}` — **az idővonal állomásai** |
| `beallitas[]` | `{nev, allapot}` |
| `lepesek[]` | `{kod, nev, allapot, ora, ki[], rajtad?}` |
| `rajtad[]` | `{mit, miert}` |
| `naplo[]` | `{ido, mi}` — a legfrissebb legfelül |

Állapotok: `kesz` · `folyamatban` · `hatra`.
Az összesített százalék a `szakaszok[].szazalek` **átlaga** — tehát a szakaszok pontatlansága
azonnal hamis össz-számot ad.

**A `ki[]` mező új:** ma a lap azt tárolja, *hány* ágens dolgozott egy lépésen. A módszertan azt
kéri, hogy látszódjon, *melyik*. A megjelenítő a `ki[]`-t írja ki, ha van, különben marad a régi
darabszám — így a régi sorok sem törnek el.

## 6. A mai állapot — mérve, nem feltételezve

A `allapot.json` **2026-09-09 20:05-kor** frissült utoljára, és a `lepesek` listája az `E-17b`
„folyamatban" tételnél ér véget. Azóta lezárult a 7. szakasz, elkészült az E-41…E-50 és a B-01,
és a mai napon hét dokumentum (R-0 feladatlap és ellenőrzés, R-1 javítókör és ellenőrzés,
modulszabály, orchestrator-megbízás, ez a lap).

**Ebből semmi nem látszik a lapon.** Az első teendő tehát nem új munka felvezetése, hanem a lap
visszahozása a valóságba.

## 7. Amit a `CLAUDE.md`-be és az `AGENTS.md`-be be kell írni

A két fájl ma azonos (mérve), és minden munkamenet ezzel kezd. A szabály csak akkor
rendszerszintű, ha itt áll. Beillesztendő az „Amit ne csinálj" szakasz elé:

```markdown
## Az állapotlap — kötelező

**Ami nincs az állapotlapon, az nem történik meg.**
Minden munka a KEZDÉSEKOR kerül fel, nem a végén — kód, rajzkör, ellenőrzés, döntés,
elakadás egyaránt. A lap: https://saas.mediapartizan.ro/allapot/, az adat:
`nas/public/allapot/allapot.json`, a felvezetés: `pnpm allapot …`.
A részletek: `docs/ALLAPOT-SZABALY.md`. Az `ellenoriz` lánc nem enged kiadni
elavult állapotlappal.
```

És az „Amit ne csinálj" listája egy sorral bővül:

```markdown
- Ne dolgozz úgy, hogy az állapotlapon nem látszik. Ha nincs fent, nem történik meg.
```
