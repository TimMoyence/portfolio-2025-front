import { environment } from '../../../environments/environment';
import { bancAdaptateurHttp, verifierPostRelaye } from '../../../testing/http-attendu';
import type { ToolkitPageData } from '../models/toolkit-page.model';
import type { ToolkitRequest, ToolkitResponse } from '../models/toolkit-request.model';
import { LeadMagnetHttpAdapter } from './lead-magnet-http.adapter';

describe('LeadMagnetHttpAdapter', () => {
  const banc = bancAdaptateurHttp(LeadMagnetHttpAdapter);

  it("requestToolkit() devrait POSTer la requete sur l'endpoint lead-magnets", () => {
    const payload: ToolkitRequest = {
      firstName: 'Tim',
      email: 'tim@example.com',
      formationSlug: 'ia-solopreneurs',
      termsVersion: '2026-02-11',
      termsLocale: 'fr',
      termsAcceptedAt: '2026-03-01T10:00:00Z',
    };
    const response: ToolkitResponse = {
      message: 'Toolkit envoyé.',
      accessToken: 'token-abc',
    };

    verifierPostRelaye(
      banc.adapter.requestToolkit(payload),
      banc.httpMock,
      '/lead-magnets/formations-toolkit',
      payload,
      response,
    );
  });

  it("getToolkitByToken() devrait GETer la page toolkit en encodant le token dans l'URL", () => {
    const response = { recap: { firstName: 'Tim' } } as ToolkitPageData;

    banc.adapter.getToolkitByToken('a b/c').subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = banc.httpMock.expectOne(`${environment.apiBaseUrl}/lead-magnets/toolkit/a%20b%2Fc`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
