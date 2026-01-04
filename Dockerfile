FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .

FROM deps AS build
RUN npm run build -- --configuration=production

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Sécurité : user non-root
RUN adduser --system --uid 1001 nodeuser \
  && chown -R nodeuser:nodeuser /app
USER nodeuser

EXPOSE 4000
CMD ["node", "dist/portfolio-app/server/server.mjs"]
