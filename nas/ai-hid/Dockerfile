FROM node:24-bookworm-slim

# A Codex (natív program) a rendszer tanúsítványaival ellenőrzi a ChatGPT-t — a slim kép nem tartalmazza őket
# (mérve 2026-09-07: „invalid peer certificate: UnknownIssuer" nélkülük). A Claude Code a Node sajátjait használja.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Rögzített verziók — ezeket mérve ellenőriztük
RUN npm install -g @anthropic-ai/claude-code@2.1.263 @openai/codex@0.153.4

ENV HOME=/home/node \
    NODE_ENV=production \
    PORT=8500 \
    NO_COLOR=1 \
    CI=1

WORKDIR /hid
COPY hid.mjs .
# a Codex saját mappája (belépő + a frissített belépő + naplók) — a compose ezt névvel ellátott kötetben tartja meg
RUN mkdir -p /home/node/.codex && chown -R node:node /home/node/.codex /hid

USER node
EXPOSE 8500

# A /titkok mappát a docker-compose csatolja (csak olvasásra). A Codex belépője onnan másolódik a saját mappájába,
# de csak ha ott még nincs (a Codex maga frissíti a belépőjét, és a frissített változatnak meg kell maradnia).
CMD ["sh","-c","export CLAUDE_CODE_OAUTH_TOKEN=\"$(cat /titkok/claude-belepo.txt 2>/dev/null | tr -d '\\r\\n')\"; [ -s /home/node/.codex/auth.json ] || { [ -s /titkok/codex-auth.json ] && cp /titkok/codex-auth.json /home/node/.codex/auth.json && chmod 600 /home/node/.codex/auth.json; }; exec node hid.mjs"]
