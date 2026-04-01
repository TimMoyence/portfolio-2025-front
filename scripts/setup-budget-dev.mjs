#!/usr/bin/env node

/**
 * Setup Budget Dev — Portfolio 2025
 *
 * Script d'onboarding pour le developpement du budget partage.
 * Configure tout l'environnement en une seule commande :
 * 1. Rebase la branche Commonbudget sur origin/master
 * 2. Clone et configure le backend
 * 3. Installe PostgreSQL, Redis, deps, migrations
 * 4. Lance les deux serveurs
 * 5. Analyse la branche et propose les taches d'integration
 *
 * Usage :
 *   node portfolio-2025-front/scripts/setup-budget-dev.mjs [options]
 *
 * Options :
 *   --dry-run       Affiche sans executer
 *   --skip-servers  Ne pas lancer les serveurs
 *   --help          Affiche cette aide
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONT_DIR = resolve(SCRIPT_DIR, '..');
const PARENT_DIR = resolve(FRONT_DIR, '..');
const BACK_DIR = resolve(PARENT_DIR, 'portfolio-2025-back');

const BACK_REPO = 'git@github.com:TimMoyence/portfolio-2025-back.git';
const BACK_REPO_HTTPS = 'https://github.com/TimMoyence/portfolio-2025-back.git';

const PREFERRED_NODE_MAJOR = 22;
const PNPM_VERSION = '9.15.3';
const POSTGRES_FORMULA = 'postgresql@16';
const REDIS_FORMULA = 'redis';
const LOCAL_DB_ROLE = 'portfolio_dev';
const LOCAL_DB_PASSWORD = 'portfolio_dev';
const LOCAL_DB_NAME = 'portfolio_2025_dev';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseOptions(args) {
  const opts = { dryRun: false, skipServers: false };
  for (const arg of args) {
    switch (arg) {
      case '--dry-run': opts.dryRun = true; break;
      case '--skip-servers': opts.skipServers = true; break;
      case '--help':
        console.log(`Usage: node portfolio-2025-front/scripts/setup-budget-dev.mjs [--dry-run] [--skip-servers] [--help]`);
        process.exit(0);
        break;
      default: throw new Error(`Option inconnue "${arg}". Utilisez --help.`);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

function run(command, args, options = {}) {
  const { cwd = PARENT_DIR, dryRun = false, env = process.env, captureOutput = false, description, allowFailure = false } = options;
  const printable = [command, ...args].join(' ');
  console.log(`\n> ${description ?? printable}`);
  if (dryRun) { console.log(`  [dry-run] ${printable}`); return { status: 0, stdout: '', stderr: '' }; }
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', stdio: captureOutput ? 'pipe' : 'inherit' });
  if (!allowFailure && result.status !== 0) throw new Error(`Commande echouee : ${printable}`);
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function commandExists(cmd, env) {
  return spawnSync('/bin/zsh', ['-lc', `command -v ${cmd}`], { cwd: PARENT_DIR, env, encoding: 'utf8', stdio: 'pipe' }).status === 0;
}

function prependToPath(env, dir) {
  if (!dir) return;
  const entries = (env.PATH ?? '').split(':').filter(Boolean);
  if (!entries.includes(dir)) env.PATH = [dir, ...entries].join(':');
}

// ---------------------------------------------------------------------------
// Homebrew + system deps
// ---------------------------------------------------------------------------

function applyBrewEnv(env, opts) {
  const out = run('brew', ['shellenv'], { captureOutput: true, dryRun: opts.dryRun, env, description: 'Chargement Homebrew' }).stdout;
  for (const line of out.split('\n')) {
    const m = line.match(/^export ([A-Z0-9_]+)="([^"]*)";$/);
    if (m) env[m[1]] = m[2];
  }
}

function ensureHomebrew(opts, env) {
  if (commandExists('brew', env)) { applyBrewEnv(env, opts); return; }
  run('/bin/bash', ['-c', 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'], { dryRun: opts.dryRun, env, description: 'Installation Homebrew' });
  if (!opts.dryRun) applyBrewEnv(env, opts);
}

function ensureBrewFormula(formula, opts, env) {
  const info = run('brew', ['list', '--versions', formula], { captureOutput: true, allowFailure: true, dryRun: opts.dryRun, env, description: `Verification ${formula}` });
  if (opts.dryRun || info.status === 0) return;
  run('brew', ['install', formula], { dryRun: opts.dryRun, env, description: `Installation ${formula}` });
}

function ensureFormulaBin(formula, opts, env) {
  const prefix = run('brew', ['--prefix', formula], { captureOutput: true, dryRun: opts.dryRun, env, description: `Prefix ${formula}` }).stdout.trim();
  if (!opts.dryRun) prependToPath(env, resolve(prefix, 'bin'));
}

function ensureNode(opts, env) {
  ensureBrewFormula(`node@${PREFERRED_NODE_MAJOR}`, opts, env);
  ensureFormulaBin(`node@${PREFERRED_NODE_MAJOR}`, opts, env);
}

function ensurePnpm(opts, env) {
  if (commandExists('corepack', env)) {
    run('corepack', ['enable'], { dryRun: opts.dryRun, env, description: 'Activation Corepack' });
    run('corepack', ['prepare', `pnpm@${PNPM_VERSION}`, '--activate'], { dryRun: opts.dryRun, env, description: `Activation pnpm ${PNPM_VERSION}` });
    return;
  }
  run('npm', ['install', '-g', `pnpm@${PNPM_VERSION}`], { dryRun: opts.dryRun, env, description: `Installation pnpm ${PNPM_VERSION}` });
}

// ---------------------------------------------------------------------------
// PostgreSQL + Redis
// ---------------------------------------------------------------------------

function ensurePostgres(opts, env) {
  ensureBrewFormula(POSTGRES_FORMULA, opts, env);
  ensureFormulaBin(POSTGRES_FORMULA, opts, env);
  run('brew', ['services', 'start', POSTGRES_FORMULA], { dryRun: opts.dryRun, env, description: `Demarrage ${POSTGRES_FORMULA}` });
  const max = opts.dryRun ? 1 : 15;
  for (let i = 1; i <= max; i++) {
    const r = run('pg_isready', ['-h', '127.0.0.1', '-p', '5432', '-d', 'postgres'], { captureOutput: true, allowFailure: true, dryRun: opts.dryRun, env, description: `PostgreSQL readiness (${i}/${max})` });
    if (opts.dryRun || r.status === 0) break;
    if (i === max) throw new Error("PostgreSQL n'a pas demarre.");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
}

function ensureLocalDatabase(opts, env) {
  run('psql', ['postgres', '-v', 'ON_ERROR_STOP=1', '-tAc', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${LOCAL_DB_ROLE}') THEN CREATE ROLE ${LOCAL_DB_ROLE} WITH LOGIN PASSWORD '${LOCAL_DB_PASSWORD}' CREATEDB; ELSE ALTER ROLE ${LOCAL_DB_ROLE} WITH LOGIN PASSWORD '${LOCAL_DB_PASSWORD}' CREATEDB; END IF; END $$;`], { captureOutput: true, dryRun: opts.dryRun, env, description: 'Creation role DB' });
  const exists = run('psql', ['postgres', '-v', 'ON_ERROR_STOP=1', '-tAc', `SELECT 1 FROM pg_database WHERE datname = '${LOCAL_DB_NAME}';`], { captureOutput: true, dryRun: opts.dryRun, env, description: 'Verification base' }).stdout.trim();
  if (opts.dryRun || exists !== '1') {
    run('createdb', ['-O', LOCAL_DB_ROLE, LOCAL_DB_NAME], { dryRun: opts.dryRun, env, description: `Creation base ${LOCAL_DB_NAME}`, allowFailure: opts.dryRun });
  }
}

function ensureRedis(opts, env) {
  ensureBrewFormula(REDIS_FORMULA, opts, env);
  run('brew', ['services', 'start', REDIS_FORMULA], { dryRun: opts.dryRun, env, description: 'Demarrage Redis' });
}

// ---------------------------------------------------------------------------
// Git operations
// ---------------------------------------------------------------------------

function rebaseFrontendBranch(opts, env) {
  console.log('\n--- REBASE FRONTEND ---');
  run('git', ['fetch', 'origin'], { cwd: FRONT_DIR, dryRun: opts.dryRun, env, description: 'Fetch origin (frontend)' });
  const currentBranch = run('git', ['branch', '--show-current'], { cwd: FRONT_DIR, captureOutput: true, dryRun: opts.dryRun, env, description: 'Branche courante' }).stdout.trim();
  if (currentBranch !== 'Commonbudget') {
    run('git', ['checkout', 'Commonbudget'], { cwd: FRONT_DIR, dryRun: opts.dryRun, env, description: 'Checkout Commonbudget', allowFailure: true });
    // If the branch does not exist locally, create it from origin
    if (!opts.dryRun) {
      const check = run('git', ['branch', '--show-current'], { cwd: FRONT_DIR, captureOutput: true, env, description: 'Verify checkout' }).stdout.trim();
      if (check !== 'Commonbudget') {
        run('git', ['checkout', '-b', 'Commonbudget', 'origin/Commonbudget'], { cwd: FRONT_DIR, dryRun: opts.dryRun, env, description: 'Checkout from origin/Commonbudget' });
      }
    }
  }
  run('git', ['rebase', 'origin/master'], { cwd: FRONT_DIR, dryRun: opts.dryRun, env, description: 'Rebase Commonbudget sur origin/master' });
}

function cloneBackend(opts, env) {
  if (existsSync(BACK_DIR)) { console.log('\n> Backend deja present, skip clone.'); return; }
  const sshResult = run('git', ['clone', BACK_REPO, 'portfolio-2025-back'], { dryRun: opts.dryRun, env, description: 'Clone backend (SSH)', allowFailure: true });
  if (!opts.dryRun && sshResult.status !== 0) {
    run('git', ['clone', BACK_REPO_HTTPS, 'portfolio-2025-back'], { dryRun: opts.dryRun, env, description: 'Clone backend (HTTPS fallback)' });
  }
}

function setupBackendBranch(opts, env) {
  console.log('\n--- BRANCHE BACKEND ---');
  run('git', ['fetch', 'origin'], { cwd: BACK_DIR, dryRun: opts.dryRun, env, description: 'Fetch origin (backend)', allowFailure: true });
  run('git', ['checkout', '-b', 'Commonbudget'], { cwd: BACK_DIR, dryRun: opts.dryRun, env, description: 'Creer branche Commonbudget backend', allowFailure: true });
  run('git', ['push', '-u', 'origin', 'Commonbudget'], { cwd: BACK_DIR, dryRun: opts.dryRun, env, description: 'Push branche Commonbudget vers origin', allowFailure: true });
}

// ---------------------------------------------------------------------------
// Backend setup
// ---------------------------------------------------------------------------

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const entries = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    entries[t.slice(0, i)] = t.slice(i + 1);
  }
  return entries;
}

function setupBackendEnv(opts) {
  const envPath = resolve(BACK_DIR, '.env');
  const examplePath = resolve(BACK_DIR, '.env.example');
  if (existsSync(envPath)) { console.log('\n> .env backend existe deja.'); return; }
  if (!existsSync(examplePath)) { console.log('\n> .env.example introuvable — skip.'); return; }
  console.log('\n> Creation .env backend');
  if (opts.dryRun) { console.log(`  [dry-run] ${envPath}`); return; }

  const template = parseEnvFile(examplePath);
  if (!template.JWT_SECRET || template.JWT_SECRET.startsWith('CHANGE_ME')) template.JWT_SECRET = randomBytes(48).toString('base64');
  if (!template.SECURE_KEY_FOR_PASSWORD_HASHING || template.SECURE_KEY_FOR_PASSWORD_HASHING.startsWith('CHANGE_ME')) template.SECURE_KEY_FOR_PASSWORD_HASHING = randomBytes(48).toString('base64');
  template.DB_HOST = '127.0.0.1';
  template.DB_PORT = '5432';
  template.POSTGRES_DB = LOCAL_DB_NAME;

  const exampleContent = readFileSync(examplePath, 'utf8');
  let output = '';
  for (const line of exampleContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) { output += line + '\n'; continue; }
    const i = t.indexOf('=');
    if (i === -1) { output += line + '\n'; continue; }
    const key = t.slice(0, i);
    output += `${key}=${template[key] ?? t.slice(i + 1)}\n`;
  }
  writeFileSync(envPath, output, 'utf8');
}

function installBackendDeps(opts, env) {
  run('pnpm', ['install'], { cwd: BACK_DIR, dryRun: opts.dryRun, env, description: 'Installation deps backend (pnpm)' });
}

function installFrontendDeps(opts, env) {
  run('npm', ['install'], { cwd: FRONT_DIR, dryRun: opts.dryRun, env, description: 'Installation deps frontend (npm)' });
}

function runMigrations(opts, env) {
  const migrationEnv = { ...env, ...parseEnvFile(resolve(BACK_DIR, '.env')) };
  run('pnpm', ['run', 'build'], { cwd: BACK_DIR, dryRun: opts.dryRun, env: migrationEnv, description: 'Build backend' });
  run('pnpm', ['run', 'migration:run'], { cwd: BACK_DIR, dryRun: opts.dryRun, env: migrationEnv, description: 'Migrations', allowFailure: true });
}

// ---------------------------------------------------------------------------
// Servers + health
// ---------------------------------------------------------------------------

function launchServers(opts, env) {
  if (opts.dryRun || opts.skipServers) { console.log('\n> [skip] Lancement serveurs'); return { back: null, front: null }; }
  console.log('\n--- LANCEMENT SERVEURS ---');
  const backEnv = { ...env, ...parseEnvFile(resolve(BACK_DIR, '.env')) };
  const back = spawn('pnpm', ['run', 'start:dev'], { cwd: BACK_DIR, env: backEnv, stdio: 'ignore', detached: true });
  back.unref();
  console.log(`  Backend PID: ${back.pid}`);
  const front = spawn('npm', ['start'], { cwd: FRONT_DIR, env, stdio: 'ignore', detached: true });
  front.unref();
  console.log(`  Frontend PID: ${front.pid}`);
  return { back, front };
}

function healthCheck(opts, env) {
  if (opts.dryRun || opts.skipServers) return;
  console.log('\n--- HEALTH CHECK ---');
  // Wait for servers to start
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 8000);
  const apiCheck = run('curl', ['-sf', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:3000/api/v1/portfolio25/docs'], { captureOutput: true, allowFailure: true, dryRun: opts.dryRun, env, description: 'Health check API' });
  console.log(`  API: ${apiCheck.stdout.trim() === '200' ? 'OK' : 'En attente (normal au premier demarrage)'}`);
  const frontCheck = run('curl', ['-sf', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:4200'], { captureOutput: true, allowFailure: true, dryRun: opts.dryRun, env, description: 'Health check Frontend' });
  console.log(`  Frontend: ${frontCheck.stdout.trim() === '200' ? 'OK' : 'En attente (normal au premier demarrage)'}`);
}

// ---------------------------------------------------------------------------
// Branch analysis + tasks
// ---------------------------------------------------------------------------

function analyzeBranch(opts, env) {
  console.log('\n' + '='.repeat(60));
  console.log('  ANALYSE DE LA BRANCHE COMMONBUDGET');
  console.log('='.repeat(60));
  run('git', ['diff', '--stat', 'origin/master...HEAD'], { cwd: FRONT_DIR, dryRun: opts.dryRun, env, description: 'Diff stat vs master' });
}

function printIntegrationTasks() {
  console.log(`
${'='.repeat(60)}
  TACHES D'INTEGRATION BACK <-> FRONT
${'='.repeat(60)}

Le backend est pret avec les endpoints suivants :
  POST   /budget/groups           -- Creer un groupe de budget
  POST   /budget/entries          -- Creer une entree
  GET    /budget/entries          -- Lister (filtres: groupId, month, year, category)
  GET    /budget/summary          -- Resume mensuel par categorie
  POST   /budget/entries/import   -- Import CSV
  POST   /budget/categories       -- Creer une categorie custom
  GET    /budget/categories       -- Lister les categories (defaut + custom)
  POST   /budget/share            -- Partager avec un autre utilisateur

Le frontend a deja :
  - BudgetPort + BudgetHttpAdapter (prets a l'emploi dans core/)
  - Models TypeScript pour toutes les entites (core/models/budget.model.ts)
  - Factories de test (testing/factories/budget.factory.ts)

TACHES A FAIRE :
  1. Injecter BUDGET_PORT dans CommonBudgetTmComponent
  2. Remplacer localStorage par les appels API via BudgetPort
  3. Au premier chargement, creer un BudgetGroup si aucun n'existe
  4. Mapper les 19 categories hardcodees vers les categories en base (GET /budget/categories)
  5. Remplacer le parsing CSV local par POST /budget/entries/import
  6. Remplacer les signaux locaux (overrides, salaryByMonth) par des appels API
  7. Ajouter le bouton "Partager avec Maria" qui appelle POST /budget/share
  8. Ajouter les guards sur la route : canActivate: [authGuard, roleGuard('budget')]

POUR ACCEDER AU BUDGET EN LOCAL :
  1. Creer un compte : POST http://localhost:3000/api/v1/portfolio25/auth/register
     Body: { "email": "maria@example.com", "password": "MonPass123!",
             "firstName": "Maria", "lastName": "Naumenko", "roles": ["budget"] }
  2. Se connecter sur http://localhost:4200/login
  3. Aller sur http://localhost:4200/atelier/budget

Swagger : http://localhost:3000/docs (tous les endpoints documentes)
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const opts = parseOptions(process.argv.slice(2));
  const env = { ...process.env };

  if (process.platform !== 'darwin') throw new Error('Ce script supporte uniquement macOS.');

  console.log('='.repeat(60));
  console.log('  Budget Dev Setup — Common Budget T&M');
  console.log('='.repeat(60));

  // 1. Git operations
  rebaseFrontendBranch(opts, env);

  // 2. System deps
  ensureHomebrew(opts, env);
  ensureNode(opts, env);
  ensurePnpm(opts, env);

  // 3. Backend
  console.log('\n--- BACKEND ---');
  cloneBackend(opts, env);
  setupBackendBranch(opts, env);

  // 4. Database + Redis
  ensurePostgres(opts, env);
  ensureLocalDatabase(opts, env);
  ensureRedis(opts, env);

  // 5. Backend config + deps + migrations
  setupBackendEnv(opts);
  installBackendDeps(opts, env);
  runMigrations(opts, env);

  // 6. Frontend deps
  installFrontendDeps(opts, env);

  // 7. Launch servers
  launchServers(opts, env);
  healthCheck(opts, env);

  // 8. Analysis
  analyzeBranch(opts, env);
  printIntegrationTasks();
}

try {
  main();
} catch (error) {
  console.error(`\nSetup echoue : ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
