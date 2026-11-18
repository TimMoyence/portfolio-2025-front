import { chaineDe } from '../../../cours/runtime/core/texte/valeurs';
import { urlLocalisee } from './chemins';
import { URL_DU_SITE } from './nom-du-site';
import { localeParDefaut } from './pages-seo';
import type { SeoMetadataFile, SeoPageEntry } from './seo-metadata.model';

export type BlocJsonLd = Record<string, unknown>;

// Tous les `<` sont echappes, pas seulement `</script>` : apres un `<!--<script`,
// l'etat « script data double escaped » du tokenizer HTML empeche le `</script>`
// suivant de fermer le bloc (mXSS).
// https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-state
export const serialiserJsonLd = (donnees: unknown): string =>
  JSON.stringify(donnees).replace(/</g, '\\u003c');

const TYPES_DATES = new Set([
  'WebPage',
  'ProfilePage',
  'AboutPage',
  'ContactPage',
  'Article',
  'BlogPosting',
  'NewsArticle',
  'CreativeWork',
  'Course',
  'Service',
  'ProfessionalService',
  'ItemList',
  'FAQPage',
  'WebSite',
]);

const TYPES_SANS_AUTEUR = new Set(['WebSite', 'LocalBusiness', 'ProfessionalService']);

const CHEMIN_DE_LA_PRESENTATION = '/presentation';

const dater = (bloc: BlocJsonLd, page: SeoPageEntry, baseUrl: string): BlocJsonLd => {
  const type = chaineDe(bloc, '@type');
  if (!type || !TYPES_DATES.has(type)) return bloc;

  const date: BlocJsonLd = { ...bloc };
  if (!date['dateModified'] && page.lastmod) date['dateModified'] = page.lastmod;
  if (!date['datePublished'] && date['dateModified']) date['datePublished'] = date['dateModified'];
  if (!date['author'] && !TYPES_SANS_AUTEUR.has(type))
    date['author'] = { '@id': `${baseUrl}/#person` };
  return date;
};

const blocsDuSite = (metadata: SeoMetadataFile, page?: SeoPageEntry): BlocJsonLd[] => {
  const { localBusiness, siteNavigation, person } = metadata.global ?? {};
  const personne = page?.path === CHEMIN_DE_LA_PRESENTATION ? undefined : person;
  return [localBusiness, siteNavigation, personne].filter((bloc): bloc is BlocJsonLd => !!bloc);
};

const blocsPropres = (page: SeoPageEntry, locale: string, defaut: string): BlocJsonLd[] => {
  const jsonLd = (page.locales[locale] ?? page.locales[defaut])?.jsonLd;
  if (!jsonLd) return [];
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
};

const filDAriane = (page: SeoPageEntry, baseUrl: string, locale: string): BlocJsonLd[] =>
  page.breadcrumb?.length
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: page.breadcrumb.map((entree, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: entree.name,
            item: urlLocalisee(baseUrl, locale, entree.path),
          })),
        },
      ]
    : [];

export const jsonLdDeLaPage = (
  metadata: SeoMetadataFile,
  locale: string,
  page?: SeoPageEntry,
): BlocJsonLd[] => {
  if (!page) return blocsDuSite(metadata);
  const baseUrl = metadata.site.baseUrl ?? URL_DU_SITE;
  return [
    ...blocsDuSite(metadata, page),
    ...blocsPropres(page, locale, localeParDefaut(metadata)).map((bloc) =>
      dater(bloc, page, baseUrl),
    ),
    ...filDAriane(page, baseUrl, locale),
  ];
};
