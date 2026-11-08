import { HttpTestingController } from '@angular/common/http/testing';
import { LOCALE_ID, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ArticleDetailComponent } from '../../app/features/articles/fiche/article-detail.component';
import { environment } from '../../environments/environment';
import { fournirLaRoute } from '../factories/serveur/route.factory';
import { setupTestBed } from '../setup-test-bed';

export function rendreLEdition(
  composant: Type<unknown>,
  slug: string,
  url: string,
  reponse: object,
): HTMLElement {
  setupTestBed({
    router: true,
    imports: [composant],
    providers: [{ provide: LOCALE_ID, useValue: 'fr' }, fournirLaRoute({ parametres: { slug } })],
  });
  const httpMock = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(composant);
  fixture.detectChanges();
  httpMock.expectOne((request) => request.url === url).flush(reponse);
  fixture.detectChanges();
  httpMock.verify();
  return fixture.nativeElement as HTMLElement;
}

export function rendreLaFiche(article: { readonly slug: string }): HTMLElement {
  return rendreLEdition(
    ArticleDetailComponent,
    article.slug,
    `${environment.apiBaseUrl}/articles/${article.slug}`,
    article,
  );
}

export function ancresDuSommaire(page: HTMLElement): (string | undefined)[] {
  return Array.from(page.querySelectorAll<HTMLAnchorElement>('.sommaire a')).map(
    (lien) => lien.getAttribute('href')?.split('#')[1],
  );
}
