import {
  bancAdaptateurHttp,
  verifierErreurRelayee,
  verifierPostRelaye,
} from '../../../testing/http-attendu';
import type { CookieConsentPayload } from '../models/cookie-consent.model';
import type { MessageResponse } from '../models/message.response';
import { CookieConsentHttpAdapter } from './cookie-consent-http.adapter';

describe('CookieConsentHttpAdapter', () => {
  const banc = bancAdaptateurHttp(CookieConsentHttpAdapter);

  it('should POST consent payload to the cookie-consents endpoint', () => {
    const payload: CookieConsentPayload = {
      policyVersion: '2026-02-11',
      locale: 'fr',
      region: 'EU_UK',
      source: 'banner',
      action: 'accept_all',
      preferences: {
        essential: true,
        preferences: true,
        analytics: true,
        marketing: true,
      },
    };
    const response: MessageResponse = {
      message: 'Consentement enregistré.',
      httpCode: 201,
    };

    verifierPostRelaye(
      banc.adapter.recordConsent(payload),
      banc.httpMock,
      '/cookie-consents',
      payload,
      response,
    );
  });

  it('should propagate HTTP errors', () => {
    const payload: CookieConsentPayload = {
      policyVersion: '2026-02-11',
      locale: 'en',
      region: 'EU_UK',
      source: 'settings',
      action: 'essential_only',
      preferences: {
        essential: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
    };

    verifierErreurRelayee(banc.adapter.recordConsent(payload), banc.httpMock, '/cookie-consents', {
      corps: 'Internal Server Error',
      status: 500,
      statusText: 'Internal Server Error',
    });
  });
});
