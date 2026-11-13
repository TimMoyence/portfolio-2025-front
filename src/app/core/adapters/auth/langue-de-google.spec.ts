import { LOCALE_ID } from '@angular/core';
import { buildAuthSession } from '../../../../testing/factories/auth.factory';
import { bancAdaptateurHttp, verifierPostRelaye } from '../../../../testing/http/http-attendu';
import { AuthHttpAdapter } from './auth-http.adapter';

describe('Inscription Google dans la langue de la page', () => {
  const banc = bancAdaptateurHttp(AuthHttpAdapter, {
    providers: [AuthHttpAdapter, { provide: LOCALE_ID, useValue: 'fr' }],
  });

  it('CPT-01 · envoie la langue de la page avec le jeton Google', () => {
    verifierPostRelaye(
      banc.adapter.googleAuth('google-id-token'),
      banc.httpMock,
      '/auth/google',
      { idToken: 'google-id-token', locale: 'fr' },
      buildAuthSession(),
    );
  });
});
