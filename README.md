PORTFOLIO 2025

## Docker (SSR Angular)
- Build: `docker build -t ghcr.io/<owner>/portfolio-2025-front:dev .`
- Run locally: `docker run --rm -p 4000:4000 ghcr.io/<owner>/portfolio-2025-front:dev` (uses `PORT=4000` by default).
- The image only needs runtime deps; the build stage runs `npm ci` + `npm run build --configuration=production`.

## CI/CD (GitHub Actions)
- Workflow `.github/workflows/ci.yml` builds on push/PR, pushes images to GHCR on `main` with tags `latest` and the commit SHA.
- Optional deploy step (guarded by secrets) refreshes the `web` service on the remote server via `docker compose`.
- Required secrets for deploy: `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_REGISTRY_USER`, `DEPLOY_REGISTRY_TOKEN`. Optional: `DEPLOY_PATH` (default `/opt/portfolio-2025`), `DEPLOY_COMPOSE_FILE` (default `/opt/portfolio-2025/compose.yaml`).
