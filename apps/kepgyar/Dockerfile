# A képgyártó doboza (gma-kepgyar, csak belső hálózaton). Node 24 + a Playwright Chromiuma + a vizuálgyártó mag.
# Építés a tároló gyökeréből:  docker build -f apps/kepgyar/Dockerfile -t gma-kepgyar .
FROM node:24-bookworm-slim
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm install -g pnpm@10.28.0
WORKDIR /src
# 1. függőségek (külön réteg)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/vizual-core/package.json packages/vizual-core/
COPY apps/kepgyar/package.json apps/kepgyar/
RUN pnpm install --frozen-lockfile --filter @rogton/kepgyar... --prod=false
# 2. a böngésző a rendszerkönyvtáraival (a playwright-core verziójával egyezőt)
RUN npx -y playwright@1.56.0 install --with-deps chromium && rm -rf /var/lib/apt/lists/*
# 3. a forrás és az adatok
COPY tsconfig.base.json ./
COPY packages/vizual-core packages/vizual-core
COPY packages/vizual-receptek packages/vizual-receptek
COPY tools/vizual/referencia tools/vizual/referencia
COPY apps/kepgyar apps/kepgyar
USER node
EXPOSE 8601
WORKDIR /src/apps/kepgyar
CMD ["node", "src/szerver.ts"]
