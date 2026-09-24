import type { DynamicArticleSitemapEntry } from './seo-builders';
import { trimTrailingSlashes } from './url-utils';

export interface DependancesDuLecteurDArticles {
  readonly apiBaseUrl: string | undefined;
  readonly fetch: typeof fetch;
  readonly journal: Pick<Console, 'warn'>;
  readonly maintenant?: () => number;
}

const LIMITE_PAR_PAGE = 24;
export const PAGES_MAX_PAR_LOCALE = 50;
const LOCALES = ['fr', 'en'] as const;
const DELAI_MS = 2_000;
const DUREE_DU_CACHE_MS = 300_000;

interface PageDArticles {
  readonly entrees: DynamicArticleSitemapEntry[];
  readonly suivant: string | null;
}

function entreesDe(locale: string, items: unknown): DynamicArticleSitemapEntry[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return [];
    const champs = item as Readonly<Record<string, unknown>>;
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
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_MS);
  try {
    const reponse = await dependances.fetch(url, {
      headers: { accept: 'application/json' },
      signal: controleur.signal,
    });
    if (!reponse.ok) {
      dependances.journal.warn(`[sitemap] articles ${locale} : l'API a répondu ${reponse.status}`);
      return null;
    }
    const corps = (await reponse.json()) as Readonly<Record<string, unknown>> | null;
    const suivant = corps?.['next_cursor'];
    return {
      entrees: entreesDe(locale, corps?.['items']),
      suivant: typeof suivant === 'string' && suivant ? suivant : null,
    };
  } catch (erreur) {
    dependances.journal.warn(
      `[sitemap] articles ${locale} : API injoignable (${erreur instanceof Error ? erreur.message : String(erreur)})`,
    );
    return null;
  } finally {
    clearTimeout(minuterie);
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
  const maintenant = dependances.maintenant ?? Date.now;
  let cache: { readonly expireA: number; readonly entrees: readonly DynamicArticleSitemapEntry[] } =
    {
      expireA: Number.NEGATIVE_INFINITY,
      entrees: [],
    };

  return async () => {
    if (!dependances.apiBaseUrl) return [];
    if (cache.expireA > maintenant()) return cache.entrees;
    const apiBaseUrl = trimTrailingSlashes(dependances.apiBaseUrl);
    const parLocale = await Promise.all(
      LOCALES.map((locale) => lireLocale(apiBaseUrl, locale, dependances)),
    );
    cache = { expireA: maintenant() + DUREE_DU_CACHE_MS, entrees: parLocale.flat() };
    return cache.entrees;
  };
}
