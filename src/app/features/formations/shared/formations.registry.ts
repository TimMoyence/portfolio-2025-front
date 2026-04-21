import type { FormationConfig } from "./formation.types";
import { assertValidFormationConfig } from "./formation.types";
import { automatiserAvecIaFormation } from "../automatiser-avec-ia/automatiser-avec-ia.config";
import { iaSolopreneursFormation } from "../ia-solopreneurs/ia-solopreneurs.config";

/**
 * Registre central des formations publiees. Ordre == ordre d'apparition
 * dans le hub. Chaque nouvelle formation s'ajoute ici en une ligne apres
 * creation de son `{slug}.config.ts`.
 *
 * Synchrone et compile-time : la registry est importee par
 * `getPrerenderParams` qui doit rester synchrone (contrainte Angular 19
 * SSR — `inject()` synchrone avant tout `await`).
 */
const ALL_FORMATIONS: ReadonlyArray<FormationConfig> = [
  iaSolopreneursFormation,
  automatiserAvecIaFormation,
];

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
