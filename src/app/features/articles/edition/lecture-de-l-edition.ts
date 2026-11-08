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
  readonly sourceDuDecryptage: ItemDeSection | null;
  readonly impact: string;
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
  const sourceDuDecryptage = decryptage?.items[0] ?? null;
  return {
    titre: decryptage?.title.trim() || article.title,
    chapeau: chapeau ? renderArticleMarkdown(chapeau) : '',
    points: lignes.flatMap((ligne) => PUCE.exec(ligne)?.slice(1, 2) ?? []).map((p) => p.trim()),
    decryptage,
    corpsDuDecryptage: decryptage?.body ? renderArticleMarkdown(decryptage.body) : '',
    sourceDuDecryptage,
    impact: impactDe(decryptage, sourceDuDecryptage),
    rubriques: article.sections.filter((section) => section.kind === 'rubric'),
    radars: article.sections.filter((section) => section.kind === 'radar'),
    anatomie: anatomieDeLEdition(article),
  };
}

function impactDe(decryptage: SectionDeLArticle | null, item: ItemDeSection | null): string {
  const texte = item?.text.trim() ?? '';
  return texte === decryptage?.title.trim() ? '' : texte;
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
  for (const section of article.sections) {
    for (const item of section.items) {
      const libelle = section.kind === 'deep_dive' ? section.title : item.entity;
      if (!faits.has(item.url)) faits.set(item.url, libelle);
    }
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
