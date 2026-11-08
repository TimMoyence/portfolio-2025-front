import type {
  ItemDeSection,
  PublishedArticle,
  SectionDeLArticle,
} from '../../../core/models/article.model';
import { anatomieDeLEdition, type AnatomieDeLEdition } from './anatomie-de-l-edition';
import { renderArticleMarkdown } from './markdown-article.utils';

export interface LectureDeLEdition {
  readonly titre: string;
  readonly chapeau: string;
  readonly points: readonly string[];
  readonly decryptage: SectionDeLArticle | null;
  readonly corpsDuDecryptage: string;
  readonly impact: ItemDeSection | null;
  readonly rubriques: readonly SectionDeLArticle[];
  readonly radars: readonly SectionDeLArticle[];
  readonly anatomie: AnatomieDeLEdition;
}

export interface GroupeDeSources {
  readonly nom: string;
  readonly liens: readonly { readonly url: string; readonly libelle: string }[];
}

const PUCE = /^\s*[-*•]\s+(\S.*)$/;

export function lectureDeLEdition(article: PublishedArticle): LectureDeLEdition {
  const essentiel = article.sections.find((section) => section.kind === 'essential');
  const decryptage = article.sections.find((section) => section.kind === 'deep_dive') ?? null;
  const lignes = (essentiel?.body ?? '').replaceAll('\r\n', '\n').split('\n');
  const chapeau = lignes
    .filter((ligne) => !PUCE.test(ligne))
    .join('\n')
    .trim();
  return {
    titre: decryptage?.title.trim() || article.title,
    chapeau: chapeau ? renderArticleMarkdown(chapeau) : '',
    points: lignes.flatMap((ligne) => PUCE.exec(ligne)?.slice(1, 2) ?? []).map((p) => p.trim()),
    decryptage,
    corpsDuDecryptage: decryptage?.body ? renderArticleMarkdown(decryptage.body) : '',
    impact: decryptage?.items[0] ?? null,
    rubriques: article.sections.filter((section) => section.kind === 'rubric'),
    radars: article.sections.filter((section) => section.kind === 'radar'),
    anatomie: anatomieDeLEdition(article),
  };
}

export function siteDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function sourcesParPublication(article: PublishedArticle): GroupeDeSources[] {
  const faits = new Map<string, string>();
  for (const item of article.sections.flatMap((section) => section.items)) {
    if (!faits.has(item.url)) faits.set(item.url, item.entity);
  }
  const groupes = new Map<string, { url: string; libelle: string }[]>();
  for (const source of article.sources) {
    const liens = groupes.get(source.name) ?? [];
    if (!liens.some((lien) => lien.url === source.url)) {
      liens.push({ url: source.url, libelle: faits.get(source.url) || siteDe(source.url) });
    }
    groupes.set(source.name, liens);
  }
  return [...groupes]
    .map(([nom, liens]) => ({ nom, liens }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}
