import {
  allFormations,
  findFormationBySlug,
  getPrerenderableFormationSlugs,
  publishedFormations,
} from "./formations.registry";

/**
 * Tests des helpers de la registry formations. On verifie la resolution
 * par slug, la coherence des listes (publiees vs toutes) et le contrat
 * `getPrerenderableFormationSlugs` qui pilote le prerender SSR.
 */
describe("formations.registry", () => {
  it("expose au moins une formation enregistree", () => {
    expect(allFormations().length).toBeGreaterThan(0);
  });

  it("resout ia-solopreneurs comme formation publiee", () => {
    const ia = findFormationBySlug("ia-solopreneurs");
    expect(ia).toBeDefined();
    expect(ia?.metadata.status).toBe("published");
    expect(ia?.configVersion).toBe(1);
  });

  it("retourne undefined pour un slug inexistant", () => {
    expect(findFormationBySlug("slug-inconnu")).toBeUndefined();
  });

  it("publishedFormations exclut les statuts non-publies", () => {
    const published = publishedFormations();
    const nonPublished = allFormations().filter(
      (config) => config.metadata.status !== "published",
    );
    expect(published.length + nonPublished.length).toBe(allFormations().length);
    expect(
      published.every((config) => config.metadata.status === "published"),
    ).toBeTrue();
  });

  it("getPrerenderableFormationSlugs est synchrone et retourne des slugs publies", () => {
    const slugs = getPrerenderableFormationSlugs();
    expect(Array.isArray(slugs)).toBeTrue();
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs).toContain("ia-solopreneurs");
  });
});
