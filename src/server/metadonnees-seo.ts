import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';

export interface SourcesDesMetadonneesSeo {
  readonly candidats: readonly string[];
  readonly lireFichier: (chemin: string) => string | null;
  readonly journal: Pick<Console, 'warn'>;
}

function messageDErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur);
}

export function lecteurDeMetadonneesSeo({
  candidats,
  lireFichier,
  journal,
}: SourcesDesMetadonneesSeo): () => SeoMetadataFile | null {
  let lu: { readonly valeur: SeoMetadataFile | null } | undefined;

  const lirePremierLisible = (): SeoMetadataFile | null => {
    for (const candidat of candidats) {
      const contenu = lireFichier(candidat);
      if (contenu === null) continue;
      try {
        return JSON.parse(contenu) as SeoMetadataFile;
      } catch (erreur) {
        journal.warn(`Métadonnées SEO illisibles (${candidat}) : ${messageDErreur(erreur)}`);
      }
    }
    return null;
  };

  return () => {
    lu ??= { valeur: lirePremierLisible() };
    return lu.valeur;
  };
}
