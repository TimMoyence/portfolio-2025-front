import {
  DELAI_DE_LECTURE_MS,
  garderEnCache,
  lireJsonSousDelai,
  messageDErreur,
} from './lecture-api';
import { cheminDuCoursEnSeance } from '../app/core/config/cours-en-seance';
import { trimTrailingSlashes } from '../app/core/utils/barres';
import { estObjet } from '../cours/runtime/core/valeurs';

export interface PublicationDeCours {
  readonly chemin: string;
  readonly publieLe: string;
}

export interface DependancesDuLecteur {
  readonly apiBaseUrl: string | undefined;
  readonly slugs: readonly string[];
  readonly fetch: typeof fetch;
  readonly journal: Pick<Console, 'warn'>;
  readonly maintenant?: () => number;
}

const REPLI = 'repli sur le lastmod de seo-metadata.json';

function cheminDuCours(slug: string): string {
  return `/${cheminDuCoursEnSeance(slug)}`;
}

function dateDePublication(corps: unknown): string | null {
  const publieLe = estObjet(corps) ? corps['publieLe'] : undefined;
  return typeof publieLe === 'string' && !Number.isNaN(Date.parse(publieLe)) ? publieLe : null;
}

async function lirePublication(
  slug: string,
  apiBaseUrl: string,
  dependances: DependancesDuLecteur,
): Promise<PublicationDeCours | null> {
  const chemin = cheminDuCours(slug);
  try {
    const lecture = await lireJsonSousDelai(
      dependances.fetch,
      `${apiBaseUrl}/formations/catalogue/${slug}`,
      DELAI_DE_LECTURE_MS,
    );
    if (!lecture.ok) {
      dependances.journal.warn(
        `[sitemap] ${chemin} : GET /formations/catalogue/${slug} a répondu ${lecture.statut}, ${REPLI}`,
      );
      return null;
    }
    const publieLe = dateDePublication(lecture.corps);
    if (publieLe === null) {
      dependances.journal.warn(
        `[sitemap] ${chemin} : publieLe absent ou invalide dans la réponse de l'API, ${REPLI}`,
      );
      return null;
    }
    return { chemin, publieLe };
  } catch (erreur) {
    dependances.journal.warn(
      `[sitemap] ${chemin} : API injoignable (${messageDErreur(erreur)}), ${REPLI}`,
    );
    return null;
  }
}

export function lecteurDePublicationsDeCours(
  dependances: DependancesDuLecteur,
): () => Promise<readonly PublicationDeCours[]> {
  return garderEnCache(
    dependances.maintenant ?? Date.now,
    async (): Promise<readonly PublicationDeCours[]> => {
      const apiBaseUrl = trimTrailingSlashes(dependances.apiBaseUrl ?? '');
      if (!apiBaseUrl) {
        dependances.journal.warn(
          `[sitemap] PORTFOLIO_ARTICLE_API_URL absente : aucune date de publication lue pour ${dependances.slugs.map(cheminDuCours).join(', ')}, ${REPLI}`,
        );
        return [];
      }
      const lues = await Promise.all(
        dependances.slugs.map((slug) => lirePublication(slug, apiBaseUrl, dependances)),
      );
      return lues.filter((publication): publication is PublicationDeCours => publication !== null);
    },
  );
}
