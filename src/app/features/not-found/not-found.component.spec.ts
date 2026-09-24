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
