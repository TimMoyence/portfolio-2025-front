import {
  champsHorsContrat,
  DELAI_DE_LECTURE_MS,
  garderEnCache,
  lireJsonSousDelai,
  messageDErreur,
} from './lecture-api';
import type { DynamicArticleSitemapEntry } from './seo-builders';
import { pageDArticlesServie } from '../app/core/adapters/site-schemas';
import { LOCALES_DU_SITE } from '../app/core/config/locales';
import { trimTrailingSlashes } from '../app/core/utils/barres';

export interface DependancesDuLecteurDArticles {
  readonly apiBaseUrl: string | undefined;
  readonly fetch: typeof fetch;
  readonly journal: Pick<Console, 'warn'>;
  readonly maintenant?: () => number;
}

const LIMITE_PAR_PAGE = 24;
export const PAGES_MAX_PAR_LOCALE = 50;

interface PageDArticles {
  readonly entrees: DynamicArticleSitemapEntry[];
  readonly suivant: string | null;
}

async function lirePage(
  url: string,
  locale: string,
  dependances: DependancesDuLecteurDArticles,
): Promise<PageDArticles | null> {
  try {
    const lecture = await lireJsonSousDelai(dependances.fetch, url, DELAI_DE_LECTURE_MS);
    if (!lecture.ok) {
      dependances.journal.warn(`[sitemap] articles ${locale} : l'API a répondu ${lecture.statut}`);
      return null;
    }
    const lue = pageDArticlesServie.safeParse(lecture.corps);
    if (!lue.success) {
      dependances.journal.warn(
        `[sitemap] articles ${locale} : réponse de l'API hors contrat (${champsHorsContrat(lue.error)})`,
      );
      return null;
    }
    return {
      entrees: lue.data.items.map((article) => ({
        locale,
        slug: article.slug,
        lastmod: article.updated_at,
      })),
      suivant: lue.data.next_cursor || null,
    };
  } catch (erreur) {
    dependances.journal.warn(
      `[sitemap] articles ${locale} : API injoignable (${messageDErreur(erreur)})`,
    );
    return null;
  }
}

async function lireLocale(
  apiBaseUrl: string,
  locale: string,
  dependances: DependancesDuLecteurDArticles,
): Promise<DynamicArticleSitemapEntry[]> {
  const entrees: DynamicArticleSitemapEntry[] = [];
  let curseur: string | null = null;
  for (let pageLue = 0; pageLue < PAGES_MAX_PAR_LOCALE; pageLue += 1) {
    const parametres = new URLSearchParams({ locale, limit: String(LIMITE_PAR_PAGE) });
    if (curseur) parametres.set('cursor', curseur);
    const page = await lirePage(`${apiBaseUrl}/articles?${parametres}`, locale, dependances);
    if (page === null) return entrees;
    entrees.push(...page.entrees);
    if (page.suivant === null) return entrees;
    curseur = page.suivant;
  }
  dependances.journal.warn(
    `[sitemap] articles ${locale} : plafond de ${PAGES_MAX_PAR_LOCALE} pages atteint, liste tronquée`,
  );
  return entrees;
}

export function lecteurDArticlesDuSitemap(
  dependances: DependancesDuLecteurDArticles,
): () => Promise<readonly DynamicArticleSitemapEntry[]> {
  return garderEnCache(dependances.maintenant ?? Date.now, async () => {
    if (!dependances.apiBaseUrl) return [];
    const apiBaseUrl = trimTrailingSlashes(dependances.apiBaseUrl);
    const parLocale = await Promise.all(
      LOCALES_DU_SITE.map((locale) => lireLocale(apiBaseUrl, locale, dependances)),
    );
    return parLocale.flat();
  });
}
