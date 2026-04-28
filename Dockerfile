# ── tradexGG — Backend ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Instala dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Código do servidor
COPY backend/ ./backend/

# Frontend servido como estático pelo Express
COPY frontend/ ./frontend/

EXPOSE 3000

CMD ["node", "backend/server.js"]
