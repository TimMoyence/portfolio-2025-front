import { isClientOnlyRoute } from './routes-client';

describe('isClientOnlyRoute', () => {
  it('sert la coquille client au profil, protege par la session', () => {
    expect(isClientOnlyRoute('/profil')).toBeTrue();
  });

  it('laisse le serveur rediriger les anciennes applications de l atelier', () => {
    expect(isClientOnlyRoute('/atelier/meteo/app')).toBeFalse();
    expect(isClientOnlyRoute('/atelier/sebastian/app/badges')).toBeFalse();
  });
});
