import { environment } from '../../../environments/environment';
import { bancAdaptateurHttp, verifierErreurRelayee } from '../../../testing/http-attendu';
import type { PresentationInteractionsResponse } from '../ports/presentation.port';
import { PresentationHttpAdapter } from './presentation-http.adapter';

describe('PresentationHttpAdapter', () => {
  const banc = bancAdaptateurHttp(PresentationHttpAdapter);

  it('encode le slug dans l URL des interactions', () => {
    banc.adapter.getInteractions('ia solo/x').subscribe();

    const requete = banc.httpMock.expectOne(
      `${environment.apiBaseUrl}/presentations/ia%20solo%2Fx/interactions`,
    );
    expect(requete.request.method).toBe('GET');
    requete.flush({ slug: 'ia solo/x', interactions: {} });
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
    banc.adapter.getInteractions(slug).subscribe((result) => {
      received = result;
    });

    const req = banc.httpMock.expectOne(
      `${environment.apiBaseUrl}/presentations/${slug}/interactions`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);

    expect(received).toEqual(response);
  });

  it('propage les erreurs HTTP', () => {
    const slug = 'inconnu';

    verifierErreurRelayee(
      banc.adapter.getInteractions(slug),
      banc.httpMock,
      `/presentations/${slug}/interactions`,
      { corps: 'Not found', status: 404, statusText: 'Not Found' },
    );
  });
});
