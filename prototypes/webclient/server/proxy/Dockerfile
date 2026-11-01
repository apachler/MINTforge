FROM node:24.22.2-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY proxy.mjs ./
# Rauchtest gegen den Luanti-Server im Compose-Netz:
#   docker compose exec proxy node test/luanti-handshake.mjs luanti 30000
COPY test/luanti-handshake.mjs ./test/

USER node
EXPOSE 8765
CMD ["node", "proxy.mjs"]
