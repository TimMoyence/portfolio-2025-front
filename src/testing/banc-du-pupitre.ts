import type { Provider, Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { ConfusionComptee, DerouleCours, EcranDeroule } from '../cours/content/types';
import type { FormationsPort, ReponseLibreFormateur } from '../app/core/ports/formations.port';
import { FORMATIONS_PORT } from '../app/core/ports/formations.port';
import { AuthStateService } from '../app/core/services/auth-state.service';
import { CREATEUR_FLUX } from '../app/features/cours/cours-flux.token';
import { buildAuthSession } from './factories/auth.factory';
import { buildVoteQuestion } from './factories/cours.factory';
import {
  buildEcranDeroule,
  buildReponseLibreFormateur,
  createFormationsPortStub,
} from './factories/formations.factory';
import type { FluxDouble } from './factories/sync.factory';
import { createFluxDouble } from './factories/sync.factory';
import { setupTestBed } from './setup-test-bed';

export const JETON_FORMATEUR = 'jwt-formateur';

export interface BancDuPupitre {
  readonly port: jasmine.SpyObj<FormationsPort>;
  readonly double: FluxDouble;
  readonly router?: boolean;
  readonly providers?: readonly Provider[];
}

async function monterLeBancDuPupitre(
  composant: Type<unknown>,
  { port, double, router = false, providers = [] }: BancDuPupitre,
): Promise<void> {
  await setupTestBed({
    router,
    imports: [composant],
    providers: [
      { provide: FORMATIONS_PORT, useValue: port },
      { provide: CREATEUR_FLUX, useValue: double.fabrique },
      ...providers,
    ],
  }).compileComponents();
  TestBed.inject(AuthStateService).login(buildAuthSession({ accessToken: JETON_FORMATEUR }));
}

export async function monterLeBancSurLeDeroule(
  composant: Type<unknown>,
  deroule: DerouleCours,
  options: Pick<BancDuPupitre, 'router' | 'providers'> = {},
): Promise<Pick<BancDuPupitre, 'port' | 'double'>> {
  const port = createFormationsPortStub();
  port.lireDeroule.and.returnValue(of(deroule));
  const double = createFluxDouble();
  await monterLeBancDuPupitre(composant, { port, double, ...options });
  return { port, double };
}

const montees: ComponentFixture<unknown>[] = [];

export function monterSurLeBanc<T>(composant: Type<T>): ComponentFixture<T> {
  const fixture = TestBed.createComponent(composant);
  montees.push(fixture);
  return fixture;
}

export function demonterLeBancDuPupitre(): void {
  for (const fixture of montees) {
    fixture.destroy();
  }
  montees.length = 0;
  TestBed.inject(AuthStateService).clearSession();
}

export function attendreAucunEnTeteSansSession(double: FluxDouble): void {
  const options = double.fabrique.calls.mostRecent().args[0];

  TestBed.inject(AuthStateService).clearSession();

  expect(options.entetes?.()).toEqual({});
}

export function buildEcranDeVoteCorrige(
  confusions: readonly ConfusionComptee[],
  overrides: Partial<EcranDeroule> = {},
): EcranDeroule {
  return buildEcranDeroule({
    id: 'ecran-vote',
    type: 'fp-vote',
    donnees: { question: buildVoteQuestion() },
    corriges: [
      {
        questionId: 'Q-CAP-03',
        bonneReponse: '1480.24',
        confusions: confusions.map(({ id, libelle }) => ({ id, libelle })),
      },
    ],
    ...overrides,
  });
}

export function buildEcranDeVoteJumele(): EcranDeroule {
  return buildEcranDeroule({
    id: 'ecran-vote',
    type: 'fp-vote',
    donnees: {
      question: buildVoteQuestion(),
      questionJumelle: buildVoteQuestion({ id: 'Q-CAP-03-bis' }),
    },
  });
}

export function buildReponsesALaMission(response: string): {
  responses: readonly ReponseLibreFormateur[];
} {
  return {
    responses: [
      buildReponseLibreFormateur({
        screenId: 'ecran-mission',
        activityId: 'mission:mesure',
        response,
      }),
    ],
  };
}

export function buildEcranDeMission(): EcranDeroule {
  return buildEcranDeroule({
    id: 'ecran-mission',
    type: 'fp-pro',
    corriges: [],
    donnees: {
      cas: { questionsLibres: [{ id: 'mission:mesure', question: 'Que mesure chaque chiffre ?' }] },
    },
  });
}
