import type { FormationConfig } from "./formation.types";
import { assertValidFormationConfig } from "./formation.types";

/**
 * Registre central des formations publiees. Vide depuis la migration
 * BIG BANG slide-driven (Tasks 19/20/21) : les 3 formations historiques
 * sont desormais declarees explicitement dans `app.routes.ts` via leur
 * propre composant. Le registry et `buildFormationRoutes` seront retires
 * dans la Task 22 — ce shim transitoire evite simplement les imports
 * orphelins entre commits.
 */
const ALL_FORMATIONS: ReadonlyArray<FormationConfig> = [];

// Validation defensive : echoue le build si une config est malformee.
// Throw au niveau module ->  detecte en TypeCheck + prerender + SSR.
for (const config of ALL_FORMATIONS) {
  assertValidFormationConfig(config);
}

const BY_SLUG = new Map<string, FormationConfig>(
  ALL_FORMATIONS.map((config) => [config.slug, config]),
);

// Protection contre les collisions de slug : echoue le build si deux
// formations declarent le meme slug (issu du challenge S1 tech-lead).
if (BY_SLUG.size !== ALL_FORMATIONS.length) {
  const slugs = ALL_FORMATIONS.map((config) => config.slug);
  const duplicates = slugs.filter(
    (slug, index) => slugs.indexOf(slug) !== index,
  );
  throw new Error(
    `[formations.registry] duplicate slug(s) detected: ${[...new Set(duplicates)].join(", ")}`,
  );
}

/** Liste des formations publiees (status === 'published'). */
export const publishedFormations = (): ReadonlyArray<FormationConfig> =>
  ALL_FORMATIONS.filter((config) => config.metadata.status === "published");

/** Liste brute — utilisee par `getPrerenderParams` (inclut drafts). */
export const allFormations = (): ReadonlyArray<FormationConfig> =>
  ALL_FORMATIONS;

/**
 * Resout une formation par son slug. Retourne `undefined` pour permettre
 * au caller de declencher un 404 SEO-propre (via `isKnownRoute`).
 */
export const findFormationBySlug = (
  slug: string,
): FormationConfig | undefined => BY_SLUG.get(slug);

/**
 * Liste des slugs prerender. Synchrone pour respecter la contrainte
 * `getPrerenderParams` Angular 19. Inclut uniquement les formations
 * publiees — les drafts restent accessibles en SSR on-demand.
 */
export const getPrerenderableFormationSlugs = (): string[] =>
  publishedFormations().map((config) => config.slug);
