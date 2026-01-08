FROM node:22-slim AS base
WORKDIR /app

# --- Install deps (build) ---
FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .

# --- Build production SSR bundle ---
FROM deps AS build
RUN npm run build -- --configuration=production
RUN test -f dist/portfolio-app/server.mjs || (echo "Missing dist/portfolio-app/server.mjs" && find dist -maxdepth 3 -type f | sed -n '1,200p' && exit 1)

# --- Runtime ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# 1) Create a dedicated non-root user/group
RUN groupadd --gid 1001 nodeuser \
 && useradd  --uid 1001 --gid 1001 --system --create-home nodeuser

# 2) Install production dependencies only
COPY --chown=nodeuser:nodeuser package*.json ./
RUN npm ci --omit=dev

# 3) Copy built output
COPY --from=build --chown=nodeuser:nodeuser /app/dist ./dist

USER nodeuser

EXPOSE 4000

# Option A: run via npm script (safe)
CMD ["node", "dist/portfolio-app/server.mjs"]

# Option B: run directly (equivalent)
# CMD ["node", "dist/portfolio-app/server/server.mjs"]