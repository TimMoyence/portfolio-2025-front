import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildAuthSession } from '../../../testing/factories/auth.factory';
import { createFluxDouble } from '../../../testing/factories/sync.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { getApiBaseUrl } from '../../core/http/api-config';
import { AuthStateService } from '../../core/services/auth-state.service';
import type { StatutFlux, Sync } from '../../../cours/runtime/core/sync';
import { CREATEUR_FLUX, CREATEUR_FLUX_FORMATEUR, ouvrirLeFluxFormateur } from './cours-flux.token';

describe('ouvrirLeFluxFormateur', () => {
  it("branche l'etat, les resultats et le suivi du flux", () => {
    const double = createFluxDouble();
    const etat = jasmine.createSpy('etat');
    const resultats = jasmine.createSpy('resultats');
    const suivi = signal<StatutFlux | null>(null);

    ouvrirLeFluxFormateur(double.flux, { etat, resultats, suivi, retenir: () => undefined });
    double.diffuser({ ecranCourant: 2 });
    double.diffuserResultats({ participants: 3, questions: [] });
    double.diffuserStatut({ etat: 'connecte' });

    expect(etat).toHaveBeenCalledWith(jasmine.objectContaining({ ecranCourant: 2 }));
    expect(resultats).toHaveBeenCalledWith(jasmine.objectContaining({ participants: 3 }));
    expect(suivi()).toEqual({ etat: 'connecte' });
  });

  it("retient le flux avant de l'ouvrir", () => {
    const double = createFluxDouble();
    let ouvertAuMomentDeRetenir: boolean | null = null;
    const retenir = (flux: Sync): void => {
      ouvertAuMomentDeRetenir = double.flux.ouvrir.calls.any();
      expect(flux).toBe(double.flux);
    };

    ouvrirLeFluxFormateur(double.flux, {
      etat: () => undefined,
      resultats: () => undefined,
      suivi: signal<StatutFlux | null>(null),
      retenir,
    });

    expect(ouvertAuMomentDeRetenir).toBeFalse();
    expect(double.flux.ouvrir).toHaveBeenCalledTimes(1);
  });
});

describe('CREATEUR_FLUX_FORMATEUR', () => {
  const double = createFluxDouble();

  beforeEach(() => {
    double.fabrique.calls.reset();
    setupTestBed({ providers: [{ provide: CREATEUR_FLUX, useValue: double.fabrique }] });
  });

  afterEach(() => {
    TestBed.inject(AuthStateService).clearSession();
  });

  it('ouvre le flux formateur de la seance sans jeton de participant', () => {
    const flux = TestBed.inject(CREATEUR_FLUX_FORMATEUR)('seance-1');
    const options = double.fabrique.calls.mostRecent().args[0];

    expect(flux).toBe(double.flux);
    expect(options.baseUrl).toBe(`${TestBed.runInInjectionContext(getApiBaseUrl)}/formations`);
    expect(options.sessionId).toBe('seance-1');
    expect(options.chemin).toBe('presenter-stream');
    expect(options.jeton).toBeUndefined();
  });

  it('lit le jeton du compte a chaque ouverture, renouvellement compris', () => {
    const authState = TestBed.inject(AuthStateService);
    authState.login(buildAuthSession({ accessToken: 'jwt-formateur' }));
    TestBed.inject(CREATEUR_FLUX_FORMATEUR)('seance-1');
    const entetes = double.fabrique.calls.mostRecent().args[0].entetes;

    expect(entetes?.()).toEqual({ authorization: 'Bearer jwt-formateur' });

    authState.login(buildAuthSession({ accessToken: 'jwt-renouvele' }));

    expect(entetes?.())
      .withContext('une reconnexion porte le jeton renouvele sans recharger la page')
      .toEqual({ authorization: 'Bearer jwt-renouvele' });

    authState.clearSession();

    expect(entetes?.()).toEqual({});
  });
});
