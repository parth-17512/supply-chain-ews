# ─── Frontend (Next.js) — multi-stage build ──────────────────────

# Stage 1: Install deps + build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Point API calls at the backend container
ENV NEXT_PUBLIC_API_URL=http://backend:5000
RUN npm run build

# Stage 2: Minimal runtime image using Next.js standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy the standalone output (includes server.js + required node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
