# ─── Backend (Node.js) ────────────────────────────────────────────
FROM node:20-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
