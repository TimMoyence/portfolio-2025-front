import { DOCUMENT } from '@angular/common';
import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { SeoManagerComponent } from './seo-manager.component';

@Component({ standalone: true, template: '' })
class PageVideComponent {}

const etatDuHead = (): Record<string, unknown> => {
  const head = TestBed.inject(DOCUMENT).head;
  return {
    robots: head.querySelector('meta[name="robots"]')?.getAttribute('content'),
    canonical: Array.from(head.querySelectorAll('link[rel="canonical"]'), (lien) =>
      lien.getAttribute('href'),
    ),
    hreflang: Array.from(head.querySelectorAll('link[hreflang]'), (lien) =>
      lien.getAttribute('hreflang'),
    ),
    jsonLd: head.querySelectorAll('script[type="application/ld+json"]').length,
  };
};

it('ART-ROBOTS-1 · une page indexable porte robots index et son canonical, une page noindex n en porte aucun, et le retour les repose', async () => {
  setupTestBed({
    appConfig: { baseUrl: 'https://asilidesign.fr' },
    providers: [
      { provide: LOCALE_ID, useValue: 'fr' },
      provideRouter([
        { path: 'contact', component: PageVideComponent, data: { seoKey: 'contact' } },
        { path: 'login', component: PageVideComponent, data: { seoKey: 'login' } },
      ]),
    ],
  });
  TestBed.createComponent(SeoManagerComponent);
  const router = TestBed.inject(Router);
  const indexable = {
    robots: 'index, follow',
    canonical: ['https://asilidesign.fr/fr/contact'],
    hreflang: ['fr', 'en', 'x-default'],
    jsonLd: 5,
  };

  await router.navigateByUrl('/contact');
  expect(etatDuHead()).toEqual(indexable);

  await router.navigateByUrl('/login');
  expect(etatDuHead()).toEqual({
    robots: 'noindex, nofollow',
    canonical: [],
    hreflang: [],
    jsonLd: 0,
  });

  await router.navigateByUrl('/contact');
  expect(etatDuHead()).toEqual(indexable);
});
