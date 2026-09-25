import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { bancAdaptateurHttp } from '../../../../testing/http-attendu';
import { requestIdInterceptor } from './request-id.interceptor';

describe('requestIdInterceptor', () => {
  const banc = bancAdaptateurHttp(HttpClient, {
    http: false,
    providers: [
      provideHttpClient(withInterceptors([requestIdInterceptor])),
      provideHttpClientTesting(),
    ],
  });

  it('devrait ajouter un header X-Request-Id a chaque requete', () => {
    banc.adapter.get('/api/test').subscribe();

    const req = banc.httpMock.expectOne('/api/test');
    const requestId = req.request.headers.get('X-Request-Id');
    expect(requestId).toBeTruthy();
    expect(requestId!.length).toBeGreaterThan(0);
    req.flush({});
  });

  it('devrait generer des IDs differents pour chaque requete', () => {
    banc.adapter.get('/api/first').subscribe();
    banc.adapter.get('/api/second').subscribe();

    const reqs = banc.httpMock.match(() => true);
    expect(reqs.length).toBe(2);

    const id1 = reqs[0].request.headers.get('X-Request-Id');
    const id2 = reqs[1].request.headers.get('X-Request-Id');

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);

    reqs[0].flush({});
    reqs[1].flush({});
  });
});
