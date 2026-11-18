import { DOCUMENT } from '@angular/common';
import { HttpTestingController } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { injectSeoHead } from '../../../../server/seo/seo-injector';
import seoMetadata from '../../../../assets/seo/seo-metadata.json';
import { buildPublishedArticle } from '../../../../testing/factories/article.factory';
import { fournirLaRoute } from '../../../../testing/factories/serveur/route.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { SeoMetadataFile } from '../../../core/seo/seo-metadata.model';
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
    seoMetadata as unknown as SeoMetadataFile,
    `/fr/articles/${SLUG}`,
    'https://asilidesign.fr',
  );
};

const typesJsonLd = (html: string): unknown[] =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    ([, json]) => (JSON.parse(json) as { '@type'?: unknown })['@type'],
  );

it('ART-IDX-1 · la fiche servie par le serveur porte un seul canonical, le sien, et son hreflang', () => {
  const servi = documentServiPourLaFiche();

  expect(servi.match(/<link rel="canonical"[^>]*>/g)).toEqual([
    `<link rel="canonical" href="${FICHE}">`,
  ]);
  expect(servi).toContain(`<link rel="alternate" hreflang="fr" href="${FICHE}">`);
});

it('ART-JSONLD-2 · la fiche servie porte les données structurées du site avec son bloc Article', () => {
  expect(typesJsonLd(documentServiPourLaFiche())).toEqual([
    'LocalBusiness',
    'SiteNavigationElement',
    'Person',
    'Article',
  ]);
});
