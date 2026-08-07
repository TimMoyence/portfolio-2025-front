import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config.token';
import type { PresentationInteractionsResponse } from '../ports/presentation.port';
import { PresentationHttpAdapter } from './presentation-http.adapter';

describe('PresentationHttpAdapter', () => {
  let adapter: PresentationHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PresentationHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    });

    adapter = TestBed.inject(PresentationHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('appelle GET /presentations/{slug}/interactions et mappe la reponse', () => {
    const slug = 'ia-solopreneurs';
    const response: PresentationInteractionsResponse = {
      slug,
      interactions: {
        'slide-a': {
          scroll: [
            {
              type: 'reflection',
              question: 'Quelle tâche déléguer ?',
              placeholder: 'Ex: relances',
            },
          ],
        },
      },
    };

    let received: PresentationInteractionsResponse | undefined;
    adapter.getInteractions(slug).subscribe((result) => {
      received = result;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/presentations/${slug}/interactions`);
    expect(req.request.method).toBe('GET');
    req.flush(response);

    expect(received).toEqual(response);
  });

  it('propage les erreurs HTTP', () => {
    const slug = 'inconnu';
    let status: number | undefined;

    adapter.getInteractions(slug).subscribe({
      next: () => fail('aurait dû échouer'),
      error: (error) => {
        status = error.status;
      },
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/presentations/${slug}/interactions`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });
});
