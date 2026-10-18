# A MÁSODIK befogadó rendszer (A-12) doboza. Szándékosan kicsi: nincs Next, nincs adatbázis-kiszolgáló —
# egy Node folyamat és egy SQLite fájl. Ugyanazt a `@km/news-monitor-core` magot futtatja, mint a webalkalmazás.
# A forrást futásidőben a tsx fordítja: a host néhány ezer sor, külön fordítási lépés nem éri meg.

# A NODE_KEP csak a felhős próbaépítéshez cserélhető (tanúsítványos proxy); a NAS-on az alapérték fut.
ARG NODE_KEP=node:24-alpine
FROM ${NODE_KEP} AS alap
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1
RUN npm install -g pnpm@10.28.0
WORKDIR /src

# 1. csak a csomagleírók → változatlan lockfile-nál a függőségek nem töltődnek újra
FROM alap AS fuggosegek
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-system/package.json packages/design-system/
COPY packages/ai-adapters/package.json packages/ai-adapters/
COPY packages/news-monitor-core/package.json packages/news-monitor-core/
COPY packages/news-monitor-feliratok/package.json packages/news-monitor-feliratok/
COPY packages/news-monitor-promptok/package.json packages/news-monitor-promptok/
COPY packages/letolto/package.json packages/letolto/
# F-3/F-5/F-6 moduljai — a webes Dockerfile-lal együtt pótolva (T-19): nélkülük a doboz ERR_MODULE_NOT_FOUND-dal újraindulgatott a teszten (2026-09-12 19:37)
COPY packages/hozzaferes-core/package.json packages/hozzaferes-core/
COPY packages/esemeny-core/package.json packages/esemeny-core/
COPY packages/fajl-core/package.json packages/fajl-core/
COPY apps/referencia-host/package.json apps/referencia-host/
RUN pnpm install --frozen-lockfile --filter @km/referencia-host...

# 2. futtató doboz: a függőségek mellé a forrás. A felirat- és promptfájlok ADATFÁJLOK,
#    a csomagok mappáiban maradnak (futásidőben `import.meta.url`-ből olvassuk).
FROM fuggosegek AS futo
ENV NODE_ENV=production
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/referencia-host ./apps/referencia-host
# Az SQLite-fájl helye: külön kötet, hogy az újraépítés ne vigye el az adatokat.
RUN mkdir -p /adat && chown node:node /adat && chown -R node:node /src
USER node
WORKDIR /src/apps/referencia-host
EXPOSE 8600
CMD ["pnpm", "kiszolgal"]
