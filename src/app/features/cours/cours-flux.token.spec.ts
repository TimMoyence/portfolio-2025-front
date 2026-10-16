import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { buildAuthSession, createAuthPortStub } from '../../../testing/factories/auth.factory';
import { createFluxDouble } from '../../../testing/factories/sync.factory';
import { createVerrouEnMemoire } from '../../../testing/factories/verrou.factory';
import { reveillerApres } from '../../../testing/horloge-simulee';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { getApiBaseUrl } from '../../core/http/api-config';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { AuthStateService } from '../../core/services/auth-state.service';
import { VERROU_INTER_ONGLETS } from '../../core/services/verrou-inter-onglets';
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
  let port: ReturnType<typeof createAuthPortStub>;

  beforeEach(() => {
    double.fabrique.calls.reset();
    port = createAuthPortStub();
    setupTestBed({
      providers: [
        { provide: CREATEUR_FLUX, useValue: double.fabrique },
        { provide: AUTH_PORT, useValue: port },
        { provide: VERROU_INTER_ONGLETS, useValue: createVerrouEnMemoire() },
      ],
    });
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

  function preparerLeFlux(accessToken: string) {
    TestBed.inject(AuthStateService).login(buildAuthSession({ accessToken, expiresIn: 900 }));
    TestBed.inject(CREATEUR_FLUX_FORMATEUR)('seance-1');
    const { entetes, preparerLaSession } = double.fabrique.calls.mostRecent().args[0];
    return {
      entetes: () => entetes?.(),
      preparer: (forcer: boolean) => preparerLaSession?.(forcer),
    };
  }

  async function attendreLeJetonNeuf(
    flux: ReturnType<typeof preparerLeFlux>,
    forcer: boolean,
  ): Promise<void> {
    port.refresh.and.returnValue(of(buildAuthSession({ accessToken: 'jwt-neuf' })));

    expect(await flux.preparer(forcer)).toBe('reussi');
    expect(port.refresh).toHaveBeenCalledTimes(1);
    expect(flux.entetes()).toEqual({ authorization: 'Bearer jwt-neuf' });
  }

  it('rafraichit avant l ouverture un jeton expire, pour que le flux parte avec le jeton neuf', async () => {
    const flux = preparerLeFlux('jwt-perime');
    reveillerApres(3_600_000);

    await attendreLeJetonNeuf(flux, false);
  });

  it('ouvre sans rafraichir un jeton valide, et ne le rafraichit que si le serveur l a refuse', async () => {
    const flux = preparerLeFlux('jwt-valide');

    expect(await flux.preparer(false)).toBe('reussi');
    expect(port.refresh).not.toHaveBeenCalled();

    await attendreLeJetonNeuf(flux, true);
  });

  for (const status of [0, 429, 503]) {
    it(`rend injoignable un rafraichissement en echec ${status}, que le flux relancera`, async () => {
      port.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      const { preparer } = preparerLeFlux('jwt-refuse');

      expect(await preparer(true)).toBe('injoignable');
    });
  }

  it('rend refuse un rafraichissement refuse, qui clot la session', async () => {
    port.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const { entetes, preparer } = preparerLeFlux('jwt-refuse');

    expect(await preparer(true)).toBe('refuse');
    expect(entetes()).toEqual({});
  });
});
