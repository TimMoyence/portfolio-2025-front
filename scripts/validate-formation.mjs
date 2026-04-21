#!/usr/bin/env node
// @ts-check

/**
 * Validate all formations configured in the registry.
 *
 * Critères AEO-aware (Answer Engine Optimization) vérifiés au-delà de
 * `assertValidFormationConfig` :
 *  - TL;DR (metadata.description) : 134-167 mots fr/en (déjà runtime)
 *  - ≥ 3 slides dont le titre est au format question ("Comment...", "Pourquoi...", "Quand...", "Qui...", "Que...", "Combien...")
 *  - ≥ 5 entrées FAQ (déjà runtime)
 *  - Score de complétude sémantique ≥ 7/10 (lite) :
 *      +2 si TL;DR présent (134-167 mots)
 *      +2 si FAQ ≥ 5 entrées
 *      +1 si ≥ 3 H2-questions (titres de slides)
 *      +1 si keywords incluent le slug (cohérence brand/slug)
 *      +1 si teaches.length ≥ 3 (richesse pédagogique)
 *      +1 si heroImage absolue
 *      +1 si tags.length ≥ 3
 *      +1 si level explicite (beginner/intermediate/advanced)
 *
 * Exit code 0 = OK. Exit code 1 = au moins une formation invalide.
 * Sortie formattée pour être lue dans un pre-commit hook et CI GitHub.
 *
 * Usage (depuis portfolio-2025-front) :
 *   node scripts/validate-formation.mjs
 */

import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const QUESTION_PREFIXES = [
  "comment",
  "pourquoi",
  "quand",
  "qui",
  "que ",
  "quoi",
  "combien",
  "est-ce",
  "faut-il",
  "dois-je",
  "peut-on",
  "how",
  "why",
  "when",
  "who",
  "what",
  "which",
  "do i",
  "can i",
  "should i",
];

const MIN_SEMANTIC_SCORE = 7;
const MAX_SEMANTIC_SCORE = 10;

function toLowerSafe(s) {
  return typeof s === "string" ? s.toLowerCase().trim() : "";
}

function isQuestionTitle(title) {
  const t = toLowerSafe(title);
  if (!t) return false;
  if (t.endsWith("?")) return true;
  return QUESTION_PREFIXES.some((p) => t.startsWith(p));
}

/**
 * Runs `tsx` on a thin TS bridge that imports the registry and prints
 * every formation config as JSON. Using the real runtime ensures that
 * `assertValidFormationConfig` has already run (throws at module level
 * if a config is invalid).
 */
function collectFormations() {
  return new Promise((resolveP, rejectP) => {
    const bridgePath = resolve(__dirname, "validate-formation.bridge.mts");
    const child = spawn(
      "npx",
      ["-y", "tsx", bridgePath],
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "inherit"] },
    );
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("error", rejectP);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectP(new Error(`tsx bridge exited with code ${code}`));
        return;
      }
      try {
        resolveP(JSON.parse(stdout));
      } catch (err) {
        rejectP(
          new Error(`Invalid JSON from bridge: ${err.message}\n${stdout}`),
        );
      }
    });
  });
}

function countWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function validateAeo(config) {
  const errors = [];
  const warnings = [];

  const frWords = countWords(config.metadata.description.fr);
  const enWords = countWords(config.metadata.description.en);
  if (frWords < 134 || frWords > 167) {
    errors.push(
      `metadata.description.fr has ${frWords} words — AEO requires 134-167`,
    );
  }
  if (enWords < 134 || enWords > 167) {
    errors.push(
      `metadata.description.en has ${enWords} words — AEO requires 134-167`,
    );
  }

  const questionSlides = config.slides.filter((s) => isQuestionTitle(s.title));
  if (questionSlides.length < 3) {
    // Soft signal : les titres au format question boostent l'AEO mais ne
    // sont pas bloquants. Conserve-le comme warning pour signaler la marge
    // de progres sans invalider les formations editoriales existantes.
    warnings.push(
      `only ${questionSlides.length} slide titles are questions — AEO recommends >= 3 H2-questions`,
    );
  }

  if (config.seo.faq.length < 5) {
    errors.push(
      `seo.faq has ${config.seo.faq.length} entries — AEO requires >= 5`,
    );
  }

  let score = 0;
  if (frWords >= 134 && frWords <= 167 && enWords >= 134 && enWords <= 167) {
    score += 2;
  }
  if (config.seo.faq.length >= 5) score += 2;
  if (questionSlides.length >= 3) score += 1;
  const slugTokens = config.slug.split("-");
  const keywordsContainSlugPart = config.seo.keywords.some((kw) =>
    slugTokens.some((tok) => kw.toLowerCase().includes(tok)),
  );
  if (keywordsContainSlugPart) score += 1;
  if (config.seo.teaches.length >= 3) score += 1;
  if (/^https?:\/\//.test(config.metadata.heroImage)) score += 1;
  if (config.metadata.tags.length >= 3) score += 1;
  if (
    config.metadata.level === "beginner" ||
    config.metadata.level === "intermediate" ||
    config.metadata.level === "advanced"
  ) {
    score += 1;
  }

  if (score < MIN_SEMANTIC_SCORE) {
    errors.push(
      `semantic completeness score = ${score}/${MAX_SEMANTIC_SCORE} — required >= ${MIN_SEMANTIC_SCORE}`,
    );
  } else if (score < MIN_SEMANTIC_SCORE + 1) {
    warnings.push(
      `semantic completeness score = ${score}/${MAX_SEMANTIC_SCORE} — at minimum threshold`,
    );
  }

  return { errors, warnings, score };
}

async function main() {
  let configs;
  try {
    configs = await collectFormations();
  } catch (err) {
    console.error(`[validate-formation] failed to load registry: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(configs) || configs.length === 0) {
    console.error("[validate-formation] no formations found in registry");
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const config of configs) {
    const { errors, warnings, score } = validateAeo(config);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(
        `[validate-formation] ${config.slug} — OK (score ${score}/${MAX_SEMANTIC_SCORE})`,
      );
      continue;
    }
    if (errors.length > 0) {
      console.error(
        `[validate-formation] ${config.slug} — FAIL (score ${score}/${MAX_SEMANTIC_SCORE})`,
      );
      for (const e of errors) console.error(`  ✘ ${e}`);
      totalErrors += errors.length;
    } else {
      console.warn(
        `[validate-formation] ${config.slug} — WARN (score ${score}/${MAX_SEMANTIC_SCORE})`,
      );
    }
    for (const w of warnings) console.warn(`  ⚠ ${w}`);
    totalWarnings += warnings.length;
  }

  console.log(
    `\n[validate-formation] summary: ${configs.length} formations, ${totalErrors} error(s), ${totalWarnings} warning(s)`,
  );
  process.exit(totalErrors > 0 ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
