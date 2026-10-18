# Infrastruktúra-leltár

Claude Cowork · 2026-09-06

Minden sor jelölve: **[mérve]** = ma én mértem meg, és odaírtam, honnan · **[mondta]** = Portik
mondta, nem mértem · **[nyitott]** = nem tudjuk, meg kell nézni.

---

## 1. Ahol a projekt fut

### Synology NAS — `transzmozaik`

| Adat | Érték |
|---|---|
| Elérés | Tailscale, `100.89.241.71`; a `transzmozaik` név is feloldódik **[mérve: a géped munkakörnyezetéből]** |
| DSM | 7.4.1 **[mérve: a NAS-on]** |
| Processzor / memória | 15 GB memória, ebből 9,6 GB szabad **[mérve]** |
| Kötetek | `/volume1` 21 TB (15 TB szabad), `/volume2` 21 TB (20 TB szabad) **[mérve]** |
| Konténermotor | Docker 24.0.2, használható a belépésünkkel **[mérve]** |
| Futó dobozok | 28 db **[mérve]** |
| A projekt mappája | `/volume2/docker/aitmetica-saas` **[létrehozva ma]** |
| A projekt doboza | `aitmetica-saas-web`, nginx:alpine, 127.0.0.1:8400 **[mérve]** |

**Ami már fut rajta (más projekteké — nem nyúlunk hozzájuk):** misszio-*, mvh-synology-*,
forgatag-*, benevolum-*. Köztük öt PostgreSQL 16, egy Redis 7, egy MinIO, egy Umami. **[mérve]**

> **Következmény a tervre:** a többi projekted PostgreSQL **16**-on fut. Az alaptervben 18-at
> javasoltam, mert új projekt és a leghosszabb támogatás. Külön dobozban fut, tehát nem zavarja
> a többit — de ha egységes verziót akarsz a NAS-on, ez most még olcsón módosítható.

### Dell Pro Max T2 — helyi AI

| Adat | Érték |
|---|---|
| Elérés | Tailscale, `http://100.89.253.13:11434` **[mérve]** |
| Gép | Intel Ultra 9 285K, 128 GB memória, RTX 5000 Ada 32 GB **[mondta]** |
| Betöltött modellek | `gemma4:31b` (19,9 GB), `qwen3.8:27b` (17,7 GB), `qwen3:4b` (2,5 GB), `bge-m3` (1,2 GB) **[mérve]** |
| Épp fut-e modell | most egy sem **[mérve]** |

> **Következmény:** a két nagy modell együtt 37,6 GB, a kártyán 32 GB van — **nem férnek el
> egyszerre**. Ez egyezik azzal, amit korábban mondtál. A SaaS-nak ezért sorba kell állnia a
> kártyáért, és számolni kell azzal, hogy a ComfyUI is használja.
> A `qwen3:4b` a marosvásárhelyieknél megbízhatatlannak bizonyult — itt sem tervezünk vele.

### MacBook Pro M5 Max
128 GB, helyben ComfyUI **[mondta]**. Ebben a projektben egyelőre nincs szerepe.

---

## 2. Ahol én dolgozom

| Környezet | Amit tud | Korlát |
|---|---|---|
| Felhős munkakörnyezet | node 22, pnpm, docker, PostgreSQL-kliens, php, böngésző; 30 GB szabad, 8 GB memória **[mérve]** | kimenő hálózat csak titkosított csatornán; a privát tárhelyedet **nem** éri el **[mérve]** |
| A géped Linux munkakörnyezete | git, node 22, python 3; a NAS és a GitHub is elérhető innen **[mérve]** | 2 mag, 3,8 GB memória, **a lemeze tele van** (40 MB szabad) **[mérve]** |

> **Következmény:** a nehéz munka a felhőben vagy a NAS-on fut. A géped munkakörnyezete a
> fájlmozgatásra és a NAS elérésére való — ott nem építünk semmit.

---

## 3. Címek, tanúsítványok, névszolgáltatás

| Cím | Hova mutat | Állapot |
|---|---|---|
| `saas.mediapartizan.ro` | 81.18.94.4 | él, saját Let's Encrypt tanúsítvánnyal **[mérve]** |
| `mt.mediapartizan.ro` | 81.18.94.4 | Misszió Tours, külön tanúsítvány **[mérve]** |
| `uj.marosvasarhelyiek.ro` | 81.18.94.4 | marosvásárhelyiek **[mérve]** |
| `mediapartizan.ro` | 185.171.184.39 | máshol van, nem a NAS-on **[mérve]** |

- A tanúsítványok **névenként külön** szólnak, nem gyűjtőtanúsítvány — minden új címhez újat kell kérni. **[mérve]**
- A címeket a DSM fordított proxya irányítja a dobozokra; a beállítófájlt csak a te felületedről módosítjuk. **[mérve: jogosultság nélkül nem olvasható]**
- **Nyitott:** a 80-as porton más kiszolgáló felel, ezért a `https` nélkül beírt cím rossz helyre visz. Egy második bejegyzés rendezi, a te kattintásoddal.
- A helyi hálózatod névszolgáltatója (`172.16.10.1`) órákig tarthatja a régi választ egy új címnél — ez ma meg is történt. **[mérve]**

---

## 4. Forráskód és belépések

| Mi | Hol |
|---|---|
| Tárhely | `git@github.com:Tolgyes/aitmetica-saas.git`, privát **[mérve: olvasás és írás is működik]** |
| Kulcs | `vault/github-kulcs` a géped SaaS mappájában; a nyilvános fele a tárhelyen |
| NAS-belépés | `vault/nas-belepes.txt` |
| Feltöltés | én végzem, a kulccsal; a NAS a tárhelyről szedi le |
| **Amit a tárhely soha nem tartalmaz** | a `vault` mappa — külön ki van tiltva **[mérve: az első feltöltés fájllistája]** |

---

## 5. Fizetős és helyi AI

| Szolgáltató | Állapot |
|---|---|
| Helyi (Ollama a Dellen) | elérhető, négy modell **[mérve]** |
| DeepSeek, Kimi, OpenAI | van kulcsod, más projektben használatban **[mondta]** — **[nyitott]**, hogy ebben a projektben melyiket használjuk és milyen kerettel |
| Anthropic | ezen a beszélgetésen keresztül; termékbe épített használat **[nyitott]** |

---

## 6. Amit még nem tudunk — és mikor derül ki

| Kérdés | Mikor kell |
|---|---|
| Elbírja-e a NAS a projekt teljes adagját (alkalmazás, adatbázis, háttérmunkás) | az E-1 lépésnél, mielőtt bármit telepítek |
| Mentés és **kipróbált** visszaállítás a NAS-on | a pilotkész kapunál, de a mentést az E-2 után beállítjuk |
| Ki az üzemeltetési felelős, ha te nem érsz rá | a pilotkész kapunál |
| A meglévő rendszereid (médiatár, előkönyvelés, feliratozó) újrahasználhatók-e | a hírfigyelőnél derül ki, ha kell belőlük valami; ma **kódszinten nincs felmérve** |
| Kell-e a projektnek saját Redis és fájltároló, vagy elég a meglévő | az E-2 lépésnél |
