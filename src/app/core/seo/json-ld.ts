import { chaineDe } from '../../../cours/runtime/core/texte/valeurs';
import { urlLocalisee } from './pages/chemins';
import { URL_DU_SITE } from './pages/nom-du-site';
import { nomCourt } from './noms-courts';
import { cheminPublicDeLaPage, estIndexable, localeParDefaut } from './pages/pages-seo';
import type { SeoMetadataFile, SeoPageEntry } from './seo-metadata.model';

export type BlocJsonLd = Record<string, unknown>;

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
  'ItemList',
  'FAQPage',
  'WebSite',
]);

interface EtapeDuFil {
  name: string;
  item: string;
}

export interface FicheServie {
  parent: string;
  nom: string;
  url: string;
  bloc: BlocJsonLd;
}

const baseDuSite = (metadata: SeoMetadataFile): string => metadata.site.baseUrl ?? URL_DU_SITE;

const designation = (baseUrl: string, entite: 'person' | 'organization'): BlocJsonLd => ({
  '@id': `${baseUrl}/#${entite}`,
});

const dater = (bloc: BlocJsonLd, page: SeoPageEntry, baseUrl: string): BlocJsonLd => {
  const type = chaineDe(bloc, '@type');
  if (!type || !TYPES_DATES.has(type)) return bloc;

  const date: BlocJsonLd = { ...bloc };
  if (!date['dateModified'] && page.lastmod) date['dateModified'] = page.lastmod;
  if (!date['datePublished'] && date['dateModified']) date['datePublished'] = date['dateModified'];
  if (!date['author'] && type !== 'WebSite') date['author'] = designation(baseUrl, 'person');
  return date;
};

const pageIndexable = (metadata: SeoMetadataFile, chemin: string, refus: string) => {
  const page = metadata.pages.find(
    (candidate) => candidate.path === chemin && estIndexable(candidate),
  );
  if (page === undefined) throw new Error(refus);
  return page;
};

const navigationDuSite = (
  metadata: SeoMetadataFile,
  baseUrl: string,
  locale: string,
  chemins: readonly string[],
): BlocJsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'SiteNavigationElement',
  name: chemins.map((chemin) =>
    nomCourt(
      pageIndexable(metadata, chemin, `chemin de navigation sans page indexable : ${chemin}`),
      locale,
    ),
  ),
  url: chemins.map((chemin) => urlLocalisee(baseUrl, locale, chemin)),
});

const blocLocalise = (
  metadata: SeoMetadataFile,
  baseUrl: string,
  locale: string,
  bloc: 'localBusiness' | 'person',
): BlocJsonLd | undefined => {
  const neutre = metadata.global?.[bloc];
  if (!neutre) return undefined;
  const textes = metadata.global?.textes ?? {};
  const cles = new Set(
    Object.values(textes).flatMap((parLangue) => Object.keys(parLangue[bloc] ?? {})),
  );
  for (const cle of cles) {
    const manquante = metadata.site.locales.find(
      (langue) => textes[langue]?.[bloc]?.[cle] === undefined,
    );
    if (manquante)
      throw new Error(`texte localisé sans traduction : ${bloc}.${cle} (${manquante})`);
  }
  const compose: BlocJsonLd = { ...neutre, ...textes[locale]?.[bloc] };
  const url = chaineDe(compose, 'url');
  return url?.startsWith('/') ? { ...compose, url: urlLocalisee(baseUrl, locale, url) } : compose;
};

const blocsDuSite = (metadata: SeoMetadataFile, baseUrl: string, locale: string): BlocJsonLd[] => {
  const { navigation } = metadata.global ?? {};
  return [
    blocLocalise(metadata, baseUrl, locale, 'localBusiness'),
    navigation && navigationDuSite(metadata, baseUrl, locale, navigation),
    blocLocalise(metadata, baseUrl, locale, 'person'),
  ].filter((bloc): bloc is BlocJsonLd => !!bloc);
};

const blocsPropres = (page: SeoPageEntry, locale: string, defaut: string): BlocJsonLd[] => {
  const jsonLd = (page.locales[locale] ?? page.locales[defaut])?.jsonLd;
  if (!jsonLd) return [];
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
};

const prefixesDuChemin = (chemin: string): string[] => {
  const segments = chemin.split('/').filter(Boolean);
  return ['/', ...segments.map((_, i) => `/${segments.slice(0, i + 1).join('/')}`)];
};

const filDAriane = (
  metadata: SeoMetadataFile,
  baseUrl: string,
  locale: string,
  chemin: string,
  feuille?: EtapeDuFil,
): BlocJsonLd[] => {
  if (chemin === '/' && feuille === undefined) return [];
  const etapes: EtapeDuFil[] = [
    ...prefixesDuChemin(chemin).map((prefixe) => ({
      name: nomCourt(
        pageIndexable(metadata, prefixe, `préfixe sans page indexable : ${prefixe} (de ${chemin})`),
        locale,
      ),
      item: urlLocalisee(baseUrl, locale, prefixe),
    })),
    ...(feuille ? [feuille] : []),
  ];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: etapes.map((etape, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        ...etape,
      })),
    },
  ];
};

export const jsonLdDeLaPage = (
  metadata: SeoMetadataFile,
  locale: string,
  page?: SeoPageEntry,
): BlocJsonLd[] => {
  const baseUrl = baseDuSite(metadata);
  if (!page) return blocsDuSite(metadata, baseUrl, locale);
  return [
    ...blocsDuSite(metadata, baseUrl, locale),
    ...blocsPropres(page, locale, localeParDefaut(metadata)).map((bloc) =>
      dater(bloc, page, baseUrl),
    ),
    ...filDAriane(metadata, baseUrl, locale, cheminPublicDeLaPage(page)),
  ];
};

export const jsonLdDUneFiche = (
  metadata: SeoMetadataFile,
  locale: string,
  { parent, nom, url, bloc }: FicheServie,
): BlocJsonLd[] => {
  const baseUrl = baseDuSite(metadata);
  return [
    ...blocsDuSite(metadata, baseUrl, locale),
    {
      ...bloc,
      author: designation(baseUrl, 'person'),
      publisher: designation(baseUrl, 'organization'),
    },
    ...filDAriane(metadata, baseUrl, locale, parent, { name: nom, item: url }),
  ];
};
