const NOMS: Readonly<Record<string, string>> = {
  'modeles-ia': $localize`:@@articlesRubriqueModelesIa:Modèles IA & Recherche`,
  'outils-ia': $localize`:@@articlesRubriqueOutilsIa:Outils IA & Agents`,
  'dev-frameworks': $localize`:@@articlesRubriqueDevFrameworks:Dev & Frameworks`,
  'web-internet': $localize`:@@articlesRubriqueWebInternet:Web & Internet`,
  'business-niches': $localize`:@@articlesRubriqueBusinessNiches:Business & Niches`,
};

export function nomDeRubrique(id: string): string | null {
  return Object.hasOwn(NOMS, id) ? NOMS[id] : null;
}
