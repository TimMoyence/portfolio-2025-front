import { champsHorsContrat, garderEnCache, lireJsonJournalise } from './lecture-api';
import { catalogueServi } from '../app/core/adapters/formations-schemas';
import { cheminDuCoursEnSeance } from '../app/core/config/cours-en-seance';
import { trimTrailingSlashes } from '../app/core/utils/barres';

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

async function lirePublication(
  slug: string,
  apiBaseUrl: string,
  dependances: DependancesDuLecteur,
): Promise<PublicationDeCours | null> {
  const chemin = cheminDuCours(slug);
  const lecture = await lireJsonJournalise(
    dependances,
    `${apiBaseUrl}/formations/catalogue/${slug}`,
    {
      refus: (statut) =>
        `[sitemap] ${chemin} : GET /formations/catalogue/${slug} a répondu ${statut}, ${REPLI}`,
      injoignable: (message) => `[sitemap] ${chemin} : API injoignable (${message}), ${REPLI}`,
    },
  );
  if (lecture === null) return null;
  const catalogue = catalogueServi.safeParse(lecture.corps);
  if (!catalogue.success) {
    dependances.journal.warn(
      `[sitemap] ${chemin} : réponse de l'API hors contrat (${champsHorsContrat(catalogue.error)}), ${REPLI}`,
    );
    return null;
  }
  return { chemin, publieLe: catalogue.data.publieLe };
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
