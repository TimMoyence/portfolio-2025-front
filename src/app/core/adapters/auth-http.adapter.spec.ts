import { environment } from '../../../environments/environment';
import { bancAdaptateurHttp, verifierPostRelaye } from '../../../testing/http-attendu';
import { lecturesStrictes } from '../../../testing/lecture-stricte';
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

  describe('lecture des réponses servies par le back', () => {
    const profil = { firstName: 'Pierre', lastName: 'Martin', phone: null };
    lecturesStrictes(banc, [
      {
        route: 'POST /api/auth/login',
        chemin: '/auth/login',
        appel: (a) => a.login(buildLoginCredentials()),
      },
      {
        route: 'POST /api/auth/register',
        chemin: '/auth/register',
        appel: (a) => a.register({ ...buildLoginCredentials(), firstName: 'J', lastName: 'D' }),
      },
      { route: 'GET /api/auth/me', chemin: '/auth/me', appel: (a) => a.me() },
      { route: 'POST /api/auth/google', chemin: '/auth/google', appel: (a) => a.googleAuth('t') },
      {
        route: 'POST /api/auth/forgot-password',
        chemin: '/auth/forgot-password',
        appel: (a) => a.requestPasswordReset(buildForgotPasswordPayload()),
      },
      {
        route: 'POST /api/auth/reset-password',
        chemin: '/auth/reset-password',
        appel: (a) => a.resetPassword(buildResetPasswordPayload()),
      },
      {
        route: 'POST /api/auth/set-password',
        chemin: '/auth/set-password',
        appel: (a) => a.setPassword(buildSetPasswordPayload()),
      },
      {
        route: 'PATCH /api/auth/change-password',
        chemin: '/auth/change-password',
        appel: (a) =>
          a.changePassword({
            currentPassword: buildLoginCredentials().password,
            newPassword: buildSetPasswordPayload().newPassword,
          }),
      },
      {
        route: 'PATCH /api/auth/profile',
        chemin: '/auth/profile',
        appel: (a) => a.updateProfile(profil),
      },
      { route: 'POST /api/auth/refresh', chemin: '/auth/refresh', appel: (a) => a.refresh() },
      { route: 'POST /api/auth/logout', chemin: '/auth/logout', appel: (a) => a.logout() },
      {
        route: 'GET /api/auth/verify-email',
        chemin: '/auth/verify-email',
        appel: (a) => a.verifyEmail('jeton'),
      },
      {
        route: 'POST /api/auth/resend-verification',
        chemin: '/auth/resend-verification',
        appel: (a) => a.resendVerification({ email: 'john@example.com' }),
      },
    ]);
  });

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
