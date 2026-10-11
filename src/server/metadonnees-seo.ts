import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import { estObjet } from '../cours/runtime/core/valeurs';
import { messageDErreur } from './lecture-api';

export interface SourcesDesMetadonneesSeo {
  readonly candidats: readonly string[];
  readonly lireFichier: (chemin: string) => string | null;
  readonly journal: Pick<Console, 'warn'>;
}

function metadonneesDe(contenu: string): SeoMetadataFile {
  const json: unknown = JSON.parse(contenu);
  if (!estObjet(json) || !estObjet(json['site']) || !Array.isArray(json['pages'])) {
    throw new TypeError('objet attendu avec un champ site et une liste pages');
  }
  return json as unknown as SeoMetadataFile;
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
        return metadonneesDe(contenu);
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
