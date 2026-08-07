import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type { ToolkitPageData } from '../models/toolkit-page.model';
import type { ToolkitRequest, ToolkitResponse } from '../models/toolkit-request.model';
import { LeadMagnetHttpAdapter } from './lead-magnet-http.adapter';

describe('LeadMagnetHttpAdapter', () => {
  let adapter: LeadMagnetHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    setupTestBed({ providers: [LeadMagnetHttpAdapter] });

    adapter = TestBed.inject(LeadMagnetHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

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

    adapter.requestToolkit(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/lead-magnets/formations-toolkit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it("getToolkitByToken() devrait GETer la page toolkit en encodant le token dans l'URL", () => {
    const response = { recap: { firstName: 'Tim' } } as ToolkitPageData;

    adapter.getToolkitByToken('a b/c').subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/lead-magnets/toolkit/a%20b%2Fc`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
