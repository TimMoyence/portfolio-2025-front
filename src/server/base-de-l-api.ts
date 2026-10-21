import { trimTrailingSlashes } from '../app/core/utils/barres';

export function baseDeLApi(
  dependances: { readonly apiBaseUrl: string | undefined; readonly journal: Pick<Console, 'warn'> },
  consequence: string,
): string | null {
  const base = trimTrailingSlashes(dependances.apiBaseUrl ?? '');
  if (base === '') {
    dependances.journal.warn(`[sitemap] PORTFOLIO_ARTICLE_API_URL absente : ${consequence}`);
    return null;
  }
  return base;
}
