import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { HTTP_RESPONSE_STATUS } from '../../core/ssr/http-response-status';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent — statut HTTP rendu côté serveur', () => {
  it('répond 404 pour une page inexistante', () => {
    const statuses: number[] = [];
    setupTestBed({
      router: true,
      http: false,
      imports: [NotFoundComponent],
      providers: [
        { provide: HTTP_RESPONSE_STATUS, useValue: { set: (code: number) => statuses.push(code) } },
      ],
    });

    TestBed.createComponent(NotFoundComponent).detectChanges();

    expect(statuses).toEqual([404]);
  });
});

describe('NotFoundComponent — accessibilité', () => {
  it('nomme « 404 » le code dessiné lettre à lettre, comme une image, pour un lecteur d écran', () => {
    setupTestBed({ router: true, http: false, imports: [NotFoundComponent] });
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const code = (fixture.nativeElement as HTMLElement).querySelector('.nf-code');
    expect([code?.getAttribute('role'), code?.getAttribute('aria-label')]).toEqual(['img', '404']);
  });
});
