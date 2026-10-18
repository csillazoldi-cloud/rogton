# Rögtön — a befogadó alkalmazás doboza (apps/web).
# Több lépcsős: a végső dobozban csak a futáshoz kellő fájlok vannak, forrás és eszközök nem.

# A NODE_KEP csak a felhős próbaépítéshez cserélhető (tanúsítványos proxy); élesben az alapérték fut.
ARG NODE_KEP=node:24-alpine
FROM ${NODE_KEP} AS alap
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 CI=1
RUN npm install -g pnpm@10.28.0
WORKDIR /src

# 1. csak a csomagleírók → a függőségek külön rétegbe kerülnek, változatlan lockfile-nál nem töltődnek újra
FROM alap AS fuggosegek
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-system/package.json packages/design-system/
COPY packages/ai-adapters/package.json packages/ai-adapters/
COPY packages/profile-core/package.json packages/profile-core/
COPY packages/onboarding-core/package.json packages/onboarding-core/
COPY packages/news-monitor-core/package.json packages/news-monitor-core/
COPY packages/news-monitor-feliratok/package.json packages/news-monitor-feliratok/
COPY packages/news-monitor-promptok/package.json packages/news-monitor-promptok/
COPY packages/letolto/package.json packages/letolto/
# F-3/F-5/F-6 moduljai (egy korábbi kirakás ezen bukott: a csomag forrása bekerült, a függősége — zod — nem, mert a
# függőség-réteg nem ismerte a csomagot; a tünet: „Module not found: Can't resolve 'zod'" a packages/esemeny-core/src/host.ts-ben)
COPY packages/hozzaferes-core/package.json packages/hozzaferes-core/
COPY packages/esemeny-core/package.json packages/esemeny-core/
COPY packages/fajl-core/package.json packages/fajl-core/
# R-16 K1 (MODULSZABÁLY 5., ugyanaznap): az arculat-modul magja
COPY packages/arculat-core/package.json packages/arculat-core/
COPY packages/vizual-receptek/package.json packages/vizual-receptek/
# V1/V2 (2026-09-16): a Visszajelzés modul két csomagja — ugyanaz a lecke, mint fent
COPY packages/visszajelzes-core/package.json packages/visszajelzes-core/
COPY packages/visszajelzes-react/package.json packages/visszajelzes-react/
COPY apps/web/package.json apps/web/
COPY tools/hatar/package.json tools/hatar/
RUN pnpm install --frozen-lockfile --filter @rogton/web...

# 2. forrás + összerakás
FROM fuggosegek AS epites
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter @rogton/web run epit
# G4: a forrástérképek (*.map) a forráskódot hordozzák megjegyzésekkel együtt — a futtató dobozba nem kellenek (tools/tiltott őrzi)
RUN find apps/web/.next -name '*.map' -delete

# 3. futtató doboz — nem root, csak az önálló csomag
FROM ${NODE_KEP} AS futo
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=epites --chown=node:node /src/apps/web/.next/standalone ./
COPY --from=epites --chown=node:node /src/apps/web/.next/static ./apps/web/.next/static
COPY --from=epites --chown=node:node /src/apps/web/public ./apps/web/public
# A hírfigyelő AI-utasításai és feliratai ADATFÁJLOK: az önálló csomag összeállítója nem látja őket
# (futásidőben, `import.meta.url`-ből olvassuk), ezért kézzel visszük be. Ez a bekötési leírásban is szerepel.
COPY --from=epites --chown=node:node /src/packages/news-monitor-promptok/promptok ./packages/news-monitor-promptok/promptok
COPY --from=epites --chown=node:node /src/packages/news-monitor-feliratok/feliratok ./packages/news-monitor-feliratok/feliratok
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
