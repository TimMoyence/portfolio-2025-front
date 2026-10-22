import { urlAbsolue } from '../seo/chemins';

export interface PageDArticlesDemandee {
  readonly locale: string;
  readonly limite: number;
  readonly curseur?: string | null;
}

export function cheminDesArticles(base: string): string {
  return urlAbsolue(base, 'articles');
}

export function parametresDesArticles({
  locale,
  limite,
  curseur,
}: PageDArticlesDemandee): Record<string, string> {
  return curseur
    ? { locale, limit: String(limite), cursor: curseur }
    : { locale, limit: String(limite) };
}

export function urlDesArticles(base: string, page: PageDArticlesDemandee): string {
  return `${cheminDesArticles(base)}?${new URLSearchParams(parametresDesArticles(page))}`;
}
