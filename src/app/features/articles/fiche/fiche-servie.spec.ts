import { METADONNEES_DU_SITE } from '../../../core/seo/site-servi';
import { DOCUMENT } from '@angular/common';
import { HttpTestingController } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { injectSeoHead } from '../../../../server/seo/seo-injector';
import { buildPublishedArticle } from '../../../../testing/factories/article.factory';
import { fournirLaRoute } from '../../../../testing/factories/serveur/route.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { ArticleDetailComponent } from './article-detail.component';

const SLUG = 'morning-brief-2026-11-17';
const FICHE = `https://asilidesign.fr/fr/articles/${SLUG}`;

const documentServiPourLaFiche = (): string => {
  setupTestBed({
    router: true,
    appConfig: { baseUrl: 'https://asilidesign.fr' },
    imports: [ArticleDetailComponent],
    providers: [
      { provide: LOCALE_ID, useValue: 'fr' },
      fournirLaRoute({ parametres: { slug: SLUG } }),
    ],
  });
  TestBed.createComponent(ArticleDetailComponent).detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne((requete) => requete.url === `${environment.apiBaseUrl}/articles/${SLUG}`)
    .flush(buildPublishedArticle({ slug: SLUG }));
  const rendu = `<html>${TestBed.inject(DOCUMENT).head.outerHTML}<body></body></html>`;
  return injectSeoHead(
    rendu,
    METADONNEES_DU_SITE,
    `/fr/articles/${SLUG}`,
    'https://asilidesign.fr',
  );
};

const blocsJsonLd = (html: string): Record<string, unknown>[] =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    ([, json]) => JSON.parse(json) as Record<string, unknown>,
  );

it('ART-IDX-1 · la fiche servie par le serveur porte un seul canonical, le sien, et son hreflang', () => {
  const servi = documentServiPourLaFiche();

  expect(servi.match(/<link rel="canonical"[^>]*>/g)).toEqual([
    `<link rel="canonical" href="${FICHE}">`,
  ]);
  expect(servi).toContain(`<link rel="alternate" hreflang="fr" href="${FICHE}">`);
});

describe('ART-JSONLD-2 · SEO-3 · SEO-6 · la fiche servie porte les blocs du site, son Article et son fil d Ariane', () => {
  it('ART-JSONLD-2 · les blocs servis sont ceux du site, puis l Article et son fil', () => {
    expect(blocsJsonLd(documentServiPourLaFiche()).map((bloc) => bloc['@type'])).toEqual([
      'LocalBusiness',
      'SiteNavigationElement',
      'Person',
      'Article',
      'BreadcrumbList',
    ]);
  });

  it('SEO-6 · l Article désigne son auteur et son éditeur par leur seul @id', () => {
    const article = blocsJsonLd(documentServiPourLaFiche()).find(
      (bloc) => bloc['@type'] === 'Article',
    );

    expect(article?.['author']).toEqual({ '@id': 'https://asilidesign.fr/#person' });
    expect(article?.['publisher']).toEqual({ '@id': 'https://asilidesign.fr/#organization' });
  });

  it('SEO-3 · le fil de la fiche passe par Articles et finit sur le titre, à l URL canonique', () => {
    const titre = buildPublishedArticle({ slug: SLUG }).title;
    const fil = blocsJsonLd(documentServiPourLaFiche()).find(
      (bloc) => bloc['@type'] === 'BreadcrumbList',
    );

    const etapes = [
      ['Accueil', 'https://asilidesign.fr/fr/'],
      ['Articles', 'https://asilidesign.fr/fr/articles'],
      [titre, FICHE],
    ];

    expect(fil?.['itemListElement']).toEqual(
      etapes.map(([name, item], rang) => ({ '@type': 'ListItem', position: rang + 1, name, item })),
    );
  });
});
