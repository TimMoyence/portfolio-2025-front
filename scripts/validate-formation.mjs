#!/usr/bin/env node
// @ts-check

/**
 * Usage (depuis portfolio-2025-front) :
 *   node scripts/validate-formation.mjs
 *
 * Exit code 0 = OK. Exit code 1 = au moins une formation invalide.
 */

import { pathToFileURL } from 'node:url';

import { cheminDuDepot } from './lib/depot.mjs';
import { messageDErreur } from '../src/server/lecture-api.ts';
import { executer } from './lib/processus.mjs';

const MIN_OFFER_SCORE = 7;
const MAX_OFFER_SCORE = 7;
const SLUG_EN_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function collectFormations() {
  const bridgePath = cheminDuDepot('scripts/validate-formation.bridge.mts');
  const stdout = await executer('npx', ['-y', 'tsx', bridgePath], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  try {
    return JSON.parse(stdout);
  } catch (err) {
    throw new Error(`Invalid JSON from bridge: ${messageDErreur(err)}\n${stdout}`);
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkRequirement(errors, condition, message) {
  if (!condition) errors.push(message);
  return condition ? 1 : 0;
}

export function validateOffer(config) {
  const errors = [];
  const warnings = [];
  const hasTitle = typeof config.title === 'string' && config.title.trim().length >= 10;
  const descriptionWords = countWords(config.description);
  const hasDescription = descriptionWords >= 15;
  const hasPrice = typeof config.price === 'string' && config.price.trim();
  const hasCta = typeof config.cta === 'string' && config.cta.trim();
  const hasMeta = Array.isArray(config.meta) && config.meta.length >= 2;
  const hasCompleteMeta =
    Array.isArray(config.meta) &&
    config.meta.every(
      (entry) =>
        typeof entry.key === 'string' &&
        entry.key.trim() &&
        typeof entry.value === 'string' &&
        entry.value.trim(),
    );
  const hasSlug = typeof config.slug === 'string' && SLUG_EN_KEBAB.test(config.slug);
  let score = checkRequirement(
    errors,
    hasTitle,
    'title is required and must contain at least 10 characters',
  );
  score += checkRequirement(
    errors,
    hasDescription,
    `description has ${descriptionWords} words — offer copy requires >= 15`,
  );
  score += checkRequirement(errors, hasPrice, 'price is required');
  score += checkRequirement(errors, hasCta, 'cta is required');
  score += checkRequirement(errors, hasMeta, 'at least two offer metadata entries are required');
  score += checkRequirement(
    errors,
    hasCompleteMeta,
    'every offer metadata entry needs a key and a value',
  );
  score += checkRequirement(errors, hasSlug, 'slug must be a stable URL-safe identifier');

  if (score < MIN_OFFER_SCORE) {
    errors.push(
      `offer completeness score = ${score}/${MAX_OFFER_SCORE} — required >= ${MIN_OFFER_SCORE}`,
    );
  }

  return { errors, warnings, score };
}

async function main() {
  let configs;
  try {
    configs = await collectFormations();
  } catch (err) {
    console.error(`[validate-formation] failed to load registry: ${messageDErreur(err)}`);
    process.exit(1);
  }

  if (!Array.isArray(configs) || configs.length === 0) {
    console.error('[validate-formation] no formations found in registry');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const config of configs) {
    const { errors, warnings, score } = validateOffer(config);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`[validate-formation] ${config.slug} — OK (score ${score}/${MAX_OFFER_SCORE})`);
      continue;
    }
    if (errors.length > 0) {
      console.error(
        `[validate-formation] ${config.slug} — FAIL (score ${score}/${MAX_OFFER_SCORE})`,
      );
      for (const e of errors) console.error(`  ✘ ${e}`);
      totalErrors += errors.length;
    } else {
      console.warn(
        `[validate-formation] ${config.slug} — WARN (score ${score}/${MAX_OFFER_SCORE})`,
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
