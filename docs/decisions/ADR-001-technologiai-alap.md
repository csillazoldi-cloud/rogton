# ADR-001 — Technológiai alap

**Dátum:** 2026-09-06 · **Állapot:** ELFOGADVA — a PostgreSQL 18 (2026-09-06), majd a teljes javaslat Vilmos szavával, négy kérdésben (2026-09-06, D-07)

## A kérdés
Milyen konkrét technológiára épüljön a rendszer? Az átadó 5.1 irányt ad
(TypeScript, React/Next.js, PostgreSQL), de kimondja: nem jóváhagyott verziólista,
és az aktuális támogatott verziókat hivatalos forrásból kell ellenőrizni.

## Amit megmértem (2026-09-06, npm registry / nodejs.org / endoflife.date)
Node 24.20.0 LTS (eol 2028-04-30) · Node 26 csak 2026-10-28-tól LTS ·
Next.js 16.3.4 · React 19.2.8 · TypeScript 7.0.2 · PostgreSQL 18.6 (eol 2030-11) /
17.11 (2029-11) · Drizzle 0.45.2 stabil · Prisma 8 kiadásjelölt · zod 4.5.4 ·
BullMQ 6.3.4 · Playwright 1.63.0 · Tailwind 4.3.3

## A döntés
Node 24 LTS · Next.js 16 · React 19 · TypeScript 7 · PostgreSQL 18 · Drizzle · zod 4 ·
BullMQ + Redis · Playwright · pnpm munkaterület · dependency-cruiser határőr ·
saját tokenrendszer Tailwind nélkül.

## Miért
- Kiadásjelölt csomag (Prisma 8) nem lehet az alap.
- Nem LTS Node (26) nem lehet az alap addig, amíg nem az.
- A Tailwind elhagyása azért, mert az R-11 („semmi beégetett szín, betű, lekerekítés")
  géppel csak akkor kényszeríthető ki, ha minden érték egyetlen tokenkészletből jön.
- A dependency-cruiser azért kötelező az első naptól, mert a worklog bukását nem a jó szándék
  hiánya okozta, hanem az, hogy a modulhatárokat semmi nem védte.

## Elvetett alternatívák
- **Prisma**: érettebb eszközkészlet, de a 8-as még kiadásjelölt, a 7-esről pedig egy éven belül
  migrálni kellene. Drizzle mellett az SQL közelsége a sorszintű elválasztásnál előny.
- **Tailwind**: gyorsabb indulás, de nehezebben ellenőrizhető R-11 szempontból.
- **Node 26**: 2026-10-28 után újratárgyalható.

## Utólagos megerősítés
2026-09-06: a leltárból kiderült, hogy a NAS-on futó többi projekt PostgreSQL 16-ot használ.
Felvetettem, hogy egységesíthetnénk. Vilmos döntése: **marad a 18**, külön dobozban.

## Ismert kockázat
A TypeScript 7 friss, Go-alapú fordító. Ha az első héten valamelyik eszköz nem megy vele,
visszalépünk a 6-os ágra. Ez a lépés a terv része, nem kudarc.
