import { environment } from '../../../environments/environment';
import { bancAdaptateurHttp, verifierPostRelaye } from '../../../testing/http-attendu';
import {
  buildAuthSession,
  buildAuthUser,
  buildForgotPasswordPayload,
  buildLoginCredentials,
  buildResetPasswordPayload,
  buildSetPasswordPayload,
} from '../../../testing/factories/auth.factory';
import { AuthHttpAdapter } from './auth-http.adapter';

describe('AuthHttpAdapter', () => {
  const banc = bancAdaptateurHttp(AuthHttpAdapter);

  it('should POST credentials to the login endpoint with credentials', () => {
    const credentials = buildLoginCredentials();
    const response = buildAuthSession({
      user: buildAuthUser({ email: credentials.email }),
    });

    const req = verifierPostRelaye(
      banc.adapter.login(credentials),
      banc.httpMock,
      '/auth/login',
      credentials,
      response,
    );
    expect(req.request.withCredentials).toBeTrue();
  });

  it('should POST payload to the register endpoint and return a message', () => {
    const payload = {
      email: 'john@example.com',
      password: buildLoginCredentials().password,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33123456789',
    };

    const response = {
      message: 'Inscription reussie. Un email de verification a ete envoye a votre adresse.',
    };

    verifierPostRelaye(
      banc.adapter.register(payload),
      banc.httpMock,
      '/auth/register',
      payload,
      response,
    );
  });

  it('should POST idToken to /auth/google', () => {
    const session = buildAuthSession();

    verifierPostRelaye(
      banc.adapter.googleAuth('google-id-token'),
      banc.httpMock,
      '/auth/google',
      { idToken: 'google-id-token' },
      session,
    );
  });

  it('should POST email to /auth/forgot-password', () => {
    const payload = buildForgotPasswordPayload({ email: 'john@example.com' });
    const response = {
      message: 'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
    };

    verifierPostRelaye(
      banc.adapter.requestPasswordReset(payload),
      banc.httpMock,
      '/auth/forgot-password',
      payload,
      response,
    );
  });

  it('should POST token and password to /auth/reset-password', () => {
    const payload = buildResetPasswordPayload();
    const response = { message: 'Mot de passe reinitialise avec succes.' };

    verifierPostRelaye(
      banc.adapter.resetPassword(payload),
      banc.httpMock,
      '/auth/reset-password',
      payload,
      response,
    );
  });

  it('should POST password to /auth/set-password', () => {
    const payload = buildSetPasswordPayload();
    const user = buildAuthUser({ id: 'user-1', email: 'john@example.com' });

    verifierPostRelaye(
      banc.adapter.setPassword(payload),
      banc.httpMock,
      '/auth/set-password',
      payload,
      user,
    );
  });

  it('should PATCH profile data to /auth/profile', () => {
    const payload = { firstName: 'Pierre', lastName: 'Martin', phone: null };
    const user = buildAuthUser({
      firstName: 'Pierre',
      lastName: 'Martin',
      phone: null,
    });

    banc.adapter.updateProfile(payload).subscribe((result) => {
      expect(result).toEqual(user);
    });

    const req = banc.httpMock.expectOne(`${environment.apiBaseUrl}/auth/profile`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(user);
  });

  it('should POST to /auth/refresh with credentials (cookie HttpOnly)', () => {
    const session = buildAuthSession();

    const req = verifierPostRelaye(
      banc.adapter.refresh(),
      banc.httpMock,
      '/auth/refresh',
      {},
      session,
    );
    expect(req.request.withCredentials).toBeTrue();
  });

  it('should POST to /auth/logout with credentials (cookie HttpOnly)', () => {
    const response = { message: 'Deconnexion reussie.' };

    const req = verifierPostRelaye(
      banc.adapter.logout(),
      banc.httpMock,
      '/auth/logout',
      {},
      response,
    );
    expect(req.request.withCredentials).toBeTrue();
  });
});
