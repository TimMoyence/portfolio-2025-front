import {
  DELAI_DE_LECTURE_MS,
  garderEnCache,
  lireJsonSousDelai,
  messageDErreur,
} from './lecture-api';
import type { DynamicArticleSitemapEntry } from './seo-builders';
import { LOCALES_DU_SITE } from '../app/core/config/locales';
import { trimTrailingSlashes } from '../app/core/utils/barres';
import { estObjet } from '../cours/runtime/core/valeurs';

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

function entreesDe(locale: string, items: unknown): DynamicArticleSitemapEntry[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item: unknown) => {
    if (!estObjet(item)) return [];
    const champs = item;
    if (typeof champs['slug'] !== 'string') return [];
    return [
      {
        locale,
        slug: champs['slug'],
        lastmod: typeof champs['updated_at'] === 'string' ? champs['updated_at'] : undefined,
      },
    ];
  });
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
    const corps = lecture.corps as Readonly<Record<string, unknown>> | null;
    const suivant = corps?.['next_cursor'];
    return {
      entrees: entreesDe(locale, corps?.['items']),
      suivant: typeof suivant === 'string' && suivant ? suivant : null,
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
