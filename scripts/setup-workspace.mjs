#!/usr/bin/env node

/**
 * Setup Workspace — Portfolio 2025
 *
 * Ce script configure le dossier parent comme workspace complet :
 * 1. Clone le backend si absent
 * 2. Installe les dependances systeme (Homebrew, Node, pnpm, PostgreSQL, Redis)
 * 3. Configure le .env backend avec des secrets generes
 * 4. Lance les migrations
 * 5. Cree le .claude/ avec skills, team, agents et hooks
 * 6. Cree le CLAUDE.md global
 *
 * Usage :
 *   node portfolio-2025-front/scripts/setup-workspace.mjs [options]
 *
 * Options :
 *   --dry-run           Affiche sans executer
 *   --skip-backend      Ne pas cloner/configurer le backend
 *   --skip-database     Ne pas installer PostgreSQL
 *   --skip-redis        Ne pas installer Redis
 *   --skip-claude       Ne pas creer le setup .claude/
 *   --help              Affiche cette aide
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONT_DIR = resolve(SCRIPT_DIR, "..");
const PARENT_DIR = resolve(FRONT_DIR, "..");
const BACK_DIR = resolve(PARENT_DIR, "portfolio-2025-back");

const BACK_REPO = "git@github.com:TimMoyence/portfolio-2025-back.git";
const BACK_REPO_HTTPS =
  "https://github.com/TimMoyence/portfolio-2025-back.git";

const PREFERRED_NODE_MAJOR = 22;
const PNPM_VERSION = "9.15.3";
const POSTGRES_FORMULA = "postgresql@16";
const REDIS_FORMULA = "redis";
const LOCAL_DB_ROLE = "portfolio_dev";
const LOCAL_DB_PASSWORD = "portfolio_dev";
const LOCAL_DB_NAME = "portfolio_2025_dev";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`Setup Workspace — Portfolio 2025

Usage :
  node portfolio-2025-front/scripts/setup-workspace.mjs [options]

Options :
  --dry-run           Affiche sans executer
  --skip-backend      Ne pas cloner/configurer le backend
  --skip-database     Ne pas installer PostgreSQL
  --skip-redis        Ne pas installer Redis
  --skip-claude       Ne pas creer le setup .claude/
  --help              Affiche cette aide
`);
}

function parseOptions(args) {
  const opts = {
    dryRun: false,
    skipBackend: false,
    skipDatabase: false,
    skipRedis: false,
    skipClaude: false,
  };
  for (const arg of args) {
    switch (arg) {
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--skip-backend":
        opts.skipBackend = true;
        break;
      case "--skip-database":
        opts.skipDatabase = true;
        break;
      case "--skip-redis":
        opts.skipRedis = true;
        break;
      case "--skip-claude":
        opts.skipClaude = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Option inconnue "${arg}". Utilisez --help.`);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

function run(command, args, options = {}) {
  const {
    cwd = PARENT_DIR,
    dryRun = false,
    env = process.env,
    captureOutput = false,
    description,
    allowFailure = false,
  } = options;
  const printable = [command, ...args].join(" ");
  console.log(`\n> ${description ?? printable}`);
  if (dryRun) {
    console.log(`  [dry-run] ${printable}`);
    return { status: 0, stdout: "", stderr: "" };
  }
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    stdio: captureOutput ? "pipe" : "inherit",
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`Commande echouee : ${printable}`);
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function commandExists(cmd, env) {
  return (
    spawnSync("/bin/zsh", ["-lc", `command -v ${cmd}`], {
      cwd: PARENT_DIR,
      env,
      encoding: "utf8",
      stdio: "pipe",
    }).status === 0
  );
}

function prependToPath(env, dir) {
  if (!dir) return;
  const entries = (env.PATH ?? "").split(":").filter(Boolean);
  if (!entries.includes(dir)) env.PATH = [dir, ...entries].join(":");
}

// ---------------------------------------------------------------------------
// Homebrew + system deps
// ---------------------------------------------------------------------------

function applyBrewEnv(env, opts) {
  const out = run("brew", ["shellenv"], {
    captureOutput: true,
    dryRun: opts.dryRun,
    env,
    description: "Chargement Homebrew",
  }).stdout;
  for (const line of out.split("\n")) {
    const m = line.match(/^export ([A-Z0-9_]+)="([^"]*)";$/);
    if (m) env[m[1]] = m[2];
  }
}

function ensureHomebrew(opts, env) {
  if (commandExists("brew", env)) {
    applyBrewEnv(env, opts);
    return;
  }
  run(
    "/bin/bash",
    [
      "-c",
      'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    ],
    { dryRun: opts.dryRun, env, description: "Installation Homebrew" },
  );
  if (!opts.dryRun) applyBrewEnv(env, opts);
}

function ensureBrewFormula(formula, opts, env) {
  const info = run("brew", ["list", "--versions", formula], {
    captureOutput: true,
    allowFailure: true,
    dryRun: opts.dryRun,
    env,
    description: `Verification ${formula}`,
  });
  if (opts.dryRun || info.status === 0) return;
  run("brew", ["install", formula], {
    dryRun: opts.dryRun,
    env,
    description: `Installation ${formula}`,
  });
}

function ensureFormulaBin(formula, opts, env) {
  const prefix = run("brew", ["--prefix", formula], {
    captureOutput: true,
    dryRun: opts.dryRun,
    env,
    description: `Prefix ${formula}`,
  }).stdout.trim();
  if (!opts.dryRun) prependToPath(env, resolve(prefix, "bin"));
}

function ensureXcodeCLT(opts, env) {
  const probe = run("xcode-select", ["-p"], {
    captureOutput: true,
    allowFailure: true,
    dryRun: opts.dryRun,
    env,
    description: "Verification Xcode CLT",
  });
  if (opts.dryRun || probe.status === 0) return;
  run("xcode-select", ["--install"], {
    env,
    description: "Installation Xcode CLT",
  });
  throw new Error(
    "Terminez l'installation Xcode CLT puis relancez le script.",
  );
}

function ensureNode(opts, env) {
  ensureBrewFormula(`node@${PREFERRED_NODE_MAJOR}`, opts, env);
  ensureFormulaBin(`node@${PREFERRED_NODE_MAJOR}`, opts, env);
}

function ensurePnpm(opts, env) {
  if (commandExists("corepack", env)) {
    run("corepack", ["enable"], {
      dryRun: opts.dryRun,
      env,
      description: "Activation Corepack",
    });
    run(
      "corepack",
      ["prepare", `pnpm@${PNPM_VERSION}`, "--activate"],
      {
        dryRun: opts.dryRun,
        env,
        description: `Activation pnpm ${PNPM_VERSION}`,
      },
    );
    return;
  }
  run("npm", ["install", "-g", `pnpm@${PNPM_VERSION}`], {
    dryRun: opts.dryRun,
    env,
    description: `Installation pnpm ${PNPM_VERSION}`,
  });
}

// ---------------------------------------------------------------------------
// PostgreSQL + Redis
// ---------------------------------------------------------------------------

function ensurePostgres(opts, env) {
  ensureBrewFormula(POSTGRES_FORMULA, opts, env);
  ensureFormulaBin(POSTGRES_FORMULA, opts, env);
  run("brew", ["services", "start", POSTGRES_FORMULA], {
    dryRun: opts.dryRun,
    env,
    description: `Demarrage ${POSTGRES_FORMULA}`,
  });
  // Wait for readiness
  const max = opts.dryRun ? 1 : 15;
  for (let i = 1; i <= max; i++) {
    const r = run(
      "pg_isready",
      ["-h", "127.0.0.1", "-p", "5432", "-d", "postgres"],
      {
        captureOutput: true,
        allowFailure: true,
        dryRun: opts.dryRun,
        env,
        description: `PostgreSQL readiness (${i}/${max})`,
      },
    );
    if (opts.dryRun || r.status === 0) break;
    if (i === max) throw new Error("PostgreSQL n'a pas demarre.");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
}

function ensureLocalDatabase(opts, env) {
  run(
    "psql",
    [
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-tAc",
      `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${LOCAL_DB_ROLE}') THEN
         CREATE ROLE ${LOCAL_DB_ROLE} WITH LOGIN PASSWORD '${LOCAL_DB_PASSWORD}' CREATEDB;
       ELSE
         ALTER ROLE ${LOCAL_DB_ROLE} WITH LOGIN PASSWORD '${LOCAL_DB_PASSWORD}' CREATEDB;
       END IF;
     END $$;`,
    ],
    { captureOutput: true, dryRun: opts.dryRun, env, description: "Creation role DB" },
  );

  const exists = run(
    "psql",
    [
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-tAc",
      `SELECT 1 FROM pg_database WHERE datname = '${LOCAL_DB_NAME}';`,
    ],
    { captureOutput: true, dryRun: opts.dryRun, env, description: "Verification base" },
  ).stdout.trim();

  if (opts.dryRun || exists !== "1") {
    run("createdb", ["-O", LOCAL_DB_ROLE, LOCAL_DB_NAME], {
      dryRun: opts.dryRun,
      env,
      description: `Creation base ${LOCAL_DB_NAME}`,
      allowFailure: opts.dryRun,
    });
  }
}

function ensureRedis(opts, env) {
  ensureBrewFormula(REDIS_FORMULA, opts, env);
  run("brew", ["services", "start", REDIS_FORMULA], {
    dryRun: opts.dryRun,
    env,
    description: "Demarrage Redis",
  });
}

// ---------------------------------------------------------------------------
// Backend clone + setup
// ---------------------------------------------------------------------------

function cloneBackend(opts, env) {
  if (existsSync(BACK_DIR)) {
    console.log("\n> Backend deja present, skip clone.");
    return;
  }

  // Try SSH first, fallback to HTTPS
  const sshResult = run("git", ["clone", BACK_REPO, "portfolio-2025-back"], {
    dryRun: opts.dryRun,
    env,
    description: "Clone backend (SSH)",
    allowFailure: true,
  });

  if (!opts.dryRun && sshResult.status !== 0) {
    run("git", ["clone", BACK_REPO_HTTPS, "portfolio-2025-back"], {
      dryRun: opts.dryRun,
      env,
      description: "Clone backend (HTTPS fallback)",
    });
  }
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const entries = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    entries[t.slice(0, i)] = t.slice(i + 1);
  }
  return entries;
}

function setupBackendEnv(opts) {
  const envPath = resolve(BACK_DIR, ".env");
  const examplePath = resolve(BACK_DIR, ".env.example");

  if (existsSync(envPath)) {
    console.log("\n> .env backend existe deja.");
    return;
  }

  if (!existsSync(examplePath)) {
    console.log("\n> .env.example introuvable — skip.");
    return;
  }

  console.log("\n> Creation .env backend");
  if (opts.dryRun) {
    console.log(`  [dry-run] ${envPath}`);
    return;
  }

  const template = parseEnvFile(examplePath);
  if (!template.JWT_SECRET || template.JWT_SECRET.startsWith("CHANGE_ME"))
    template.JWT_SECRET = randomBytes(48).toString("base64");
  if (
    !template.SECURE_KEY_FOR_PASSWORD_HASHING ||
    template.SECURE_KEY_FOR_PASSWORD_HASHING.startsWith("CHANGE_ME")
  )
    template.SECURE_KEY_FOR_PASSWORD_HASHING =
      randomBytes(48).toString("base64");

  template.DB_HOST = "127.0.0.1";
  template.DB_PORT = "5432";
  template.POSTGRES_DB = LOCAL_DB_NAME;

  const exampleContent = readFileSync(examplePath, "utf8");
  let output = "";
  for (const line of exampleContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      output += line + "\n";
      continue;
    }
    const i = t.indexOf("=");
    if (i === -1) {
      output += line + "\n";
      continue;
    }
    const key = t.slice(0, i);
    output += `${key}=${template[key] ?? t.slice(i + 1)}\n`;
  }
  writeFileSync(envPath, output, "utf8");
  console.log("  Pensez a renseigner OPENAI_API_KEY et SMTP_* si necessaire.");
}

function installBackendDeps(opts, env) {
  run("pnpm", ["install"], {
    cwd: BACK_DIR,
    dryRun: opts.dryRun,
    env,
    description: "Installation deps backend (pnpm)",
  });
}

function runMigrations(opts, env) {
  const migrationEnv = { ...env, ...parseEnvFile(resolve(BACK_DIR, ".env")) };
  run("pnpm", ["run", "build"], {
    cwd: BACK_DIR,
    dryRun: opts.dryRun,
    env: migrationEnv,
    description: "Build backend",
  });
  run("pnpm", ["run", "migration:run"], {
    cwd: BACK_DIR,
    dryRun: opts.dryRun,
    env: migrationEnv,
    description: "Migrations",
    allowFailure: true,
  });
}

// ---------------------------------------------------------------------------
// .claude/ setup
// ---------------------------------------------------------------------------

function setupClaude(opts) {
  if (opts.skipClaude) return;

  console.log("\n--- SETUP CLAUDE ---");

  const claudeDir = resolve(PARENT_DIR, ".claude");
  const dirs = [
    claudeDir,
    resolve(claudeDir, "skills/team"),
    resolve(claudeDir, "commands"),
    resolve(claudeDir, "agents"),
    resolve(claudeDir, "team-templates"),
    resolve(claudeDir, "team-knowledge"),
  ];

  for (const d of dirs) {
    if (opts.dryRun) {
      console.log(`  [dry-run] mkdir ${d}`);
    } else {
      mkdirSync(d, { recursive: true });
    }
  }

  const files = {
    [resolve(claudeDir, "settings.json")]: JSON.stringify(
      { enabledPlugins: { "superpowers@superpowers-marketplace": true } },
      null,
      2,
    ),
    [resolve(claudeDir, "team-knowledge/prompt-enrichments.json")]:
      JSON.stringify(
        {
          version: "1.0.0",
          enrichments: [
            {
              id: "PE-001",
              rule: "Jamais d'acces direct window/document/localStorage sans isPlatformBrowser",
              severity: "HIGH",
              injectWhen: "Agent travaille sur le frontend Angular",
            },
            {
              id: "PE-002",
              rule: "Les standalone components Angular n'ont PAS de NgModule",
              severity: "MEDIUM",
              injectWhen: "Agent cree des composants Angular",
            },
            {
              id: "PE-003",
              rule: "Utiliser authGuard + roleGuard pour proteger les routes privees",
              severity: "HIGH",
              injectWhen: "Agent ajoute une route protegee",
            },
          ],
          lastUpdated: new Date().toISOString().slice(0, 10),
        },
        null,
        2,
      ),
    [resolve(claudeDir, "team-knowledge/error-patterns.json")]:
      JSON.stringify(
        { version: "1.0.0", patterns: [], lastUpdated: new Date().toISOString().slice(0, 10) },
        null,
        2,
      ),
    [resolve(claudeDir, "team-knowledge/autonomy-state.json")]:
      JSON.stringify(
        {
          currentLevel: "L1",
          promotionDate: null,
          runsSinceLastFail: 0,
          lastUpdated: new Date().toISOString().slice(0, 10),
        },
        null,
        2,
      ),
    [resolve(claudeDir, "team-knowledge/next-run.json")]: JSON.stringify(
      {
        version: "1.0.0",
        recommendations: [],
        lastUpdated: new Date().toISOString().slice(0, 10),
      },
      null,
      2,
    ),
  };

  for (const [path, content] of Object.entries(files)) {
    if (opts.dryRun) {
      console.log(`  [dry-run] write ${path}`);
    } else {
      writeFileSync(path, content + "\n", "utf8");
    }
  }

  // CLAUDE.md
  const claudeMd = `# CLAUDE.md — Workspace Portfolio 2025

## Structure

Deux sous-projets independants :
- \`portfolio-2025-front/\` — Angular 19 SSR (npm)
- \`portfolio-2025-back/\` — NestJS 11 API (pnpm)

## Commandes

### Frontend
\`\`\`bash
cd portfolio-2025-front
npm install
npm start               # http://localhost:4200
npm run test:ci          # Tests headless
npm run lint && npm run format:check && npm run typecheck && npm run build
\`\`\`

### Backend
\`\`\`bash
cd portfolio-2025-back
pnpm install
pnpm run start:dev      # http://localhost:3000 (Swagger: /docs)
pnpm test               # Jest
pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run build
\`\`\`

## Architecture

### Frontend — Ports/Adapters + Standalone Components
- \`core/\` : ports (interfaces), adapters (HTTP), services, guards, interceptors
- \`features/\` : pages lazy-loaded (home, auth, contact, growth-audit, common-budget-tm)
- \`shared/\` : composants reutilisables (navbar, footer, hero, svg-icon)

### Backend — DDD + Clean Architecture
- \`interfaces/\` : controllers, DTOs, guards, decorators
- \`application/\` : use cases, mappers, services
- \`domain/\` : entites metier, value objects, ports
- \`infrastructure/\` : TypeORM entities/repos, mail, queues

## Auth

- **Register** : POST /auth/register (public)
- **Login** : POST /auth/login (public) → retourne JWT avec roles
- **Me** : GET /auth/me (Bearer token) → retourne user + roles
- **Guard frontend** : \`authGuard\` (redirect /login) + \`roleGuard('budget')\`
- **Guard backend** : \`@Roles('budget')\` + \`RolesGuard\`

### Ajouter une nouvelle mini-app protegee

1. Creer le composant dans \`features/\`
2. Ajouter la route dans \`app.routes.ts\` avec \`canActivate: [authGuard, roleGuard('nom_role')]\`
3. Cote backend, proteger les endpoints avec \`@Roles('nom_role')\`
4. Ajouter le role a l'utilisateur en base

## Conventions

- Tous les textes en francais
- Conventional Commits (feat, fix, refactor, test, docs, chore)
- OnPush change detection sur tous les composants
- SSR-safe : toujours verifier isPlatformBrowser avant window/document/localStorage
`;

  const claudeMdPath = resolve(PARENT_DIR, "CLAUDE.md");
  if (opts.dryRun) {
    console.log(`  [dry-run] write ${claudeMdPath}`);
  } else {
    writeFileSync(claudeMdPath, claudeMd, "utf8");
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(opts) {
  console.log("\n" + "=".repeat(60));
  console.log("  Setup termine !");
  console.log("=".repeat(60));

  if (opts.dryRun) {
    console.log("\n  Mode dry-run : aucune modification.");
    return;
  }

  console.log(`
Demarrer le backend :
  cd portfolio-2025-back && pnpm run start:dev
  → http://localhost:3000  (API)
  → http://localhost:3000/docs  (Swagger)

Demarrer le frontend :
  cd portfolio-2025-front && npm start
  → http://localhost:4200

Services locaux :
  PostgreSQL : brew services stop ${POSTGRES_FORMULA}
  Redis      : brew services stop ${REDIS_FORMULA}

Pour Claude Code :
  Ouvrir le dossier parent dans Claude Code.
  Le CLAUDE.md et .claude/ sont en place.
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const opts = parseOptions(process.argv.slice(2));
  const env = { ...process.env };

  if (process.platform !== "darwin") {
    throw new Error("Ce script supporte uniquement macOS.");
  }

  console.log("=".repeat(60));
  console.log("  Portfolio 2025 — Setup Workspace");
  console.log("=".repeat(60));

  ensureXcodeCLT(opts, env);
  ensureHomebrew(opts, env);
  ensureNode(opts, env);

  if (!opts.skipBackend) {
    console.log("\n--- BACKEND ---");
    ensurePnpm(opts, env);
    cloneBackend(opts, env);

    if (!opts.skipDatabase) {
      ensurePostgres(opts, env);
      ensureLocalDatabase(opts, env);
    }
    if (!opts.skipRedis) ensureRedis(opts, env);

    setupBackendEnv(opts);
    installBackendDeps(opts, env);
    if (!opts.skipDatabase) runMigrations(opts, env);
  }

  setupClaude(opts);
  printSummary(opts);
}

try {
  main();
} catch (error) {
  console.error(
    `\nSetup echoue : ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
