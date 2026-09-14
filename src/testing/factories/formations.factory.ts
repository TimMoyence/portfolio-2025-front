import { of } from 'rxjs';
import type {
  DerouleCours,
  EcranDeroule,
  ResultatQuestion,
  ResultatsSeance,
} from '../../cours/content/types';
import type {
  FormationsPort,
  RapportSeance,
  Rattachement,
} from '../../app/core/ports/formations.port';
import { buildCoursContent } from './cours.factory';

export { buildCoursContent };

function buildResultatQuestion(overrides: Partial<ResultatQuestion> = {}): ResultatQuestion {
  return {
    questionId: 'Q-CAP-03',
    total: 24,
    correctes: 16,
    neSaitPas: 2,
    confusions: [
      { id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés', nombre: 6 },
    ],
    ...overrides,
  };
}

export function buildResultatsSeance(overrides: Partial<ResultatsSeance> = {}): ResultatsSeance {
  return {
    participants: 24,
    questions: [buildResultatQuestion()],
    ...overrides,
  };
}

export function buildRapportSeance(overrides: Partial<RapportSeance> = {}): RapportSeance {
  return {
    courseSlug: 'b1-09-interets-composes',
    code: '4821',
    ouverteLe: '2026-09-11T08:00:00.000Z',
    fermeeLe: '2026-09-11T10:00:00.000Z',
    participants: [],
    conceptsFragiles: ['capitalisation'],
    resultats: buildResultatsSeance(),
    ...overrides,
  };
}

function buildEcranDeroule(overrides: Partial<EcranDeroule> = {}): EcranDeroule {
  return {
    id: 'ecran-1',
    type: 'vote',
    duree: 180,
    interactif: true,
    notes: 'Rappeler la formule de capitalisation avant de lancer le vote.',
    seuil: 0.7,
    corriges: [
      {
        questionId: 'Q-CAP-03',
        bonneReponse: '1480.24',
        confusions: [{ id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés' }],
      },
    ],
    ...overrides,
  };
}

export function buildDerouleCours(overrides: Partial<DerouleCours> = {}): DerouleCours {
  return {
    id: 'b1-09-interets-composes',
    titre: 'Faire fructifier : interets composes et capitalisation',
    niveau: 'B1',
    duree: 210,
    concepts: ['capitalisation', 'valeur-acquise'],
    ecrans: [buildEcranDeroule({ id: 'ecran-1' }), buildEcranDeroule({ id: 'ecran-2' })],
    remediations: { 'interet-simple': 'ecran-2' },
    ...overrides,
  };
}

function buildRattachement(overrides: Partial<Rattachement> = {}): Rattachement {
  return {
    participantId: 'participant-1',
    sessionId: 'seance-1',
    seed: 7,
    ecranCourant: 0,
    modeRythme: 'pilote',
    jeton: 'jeton-1',
    ...overrides,
  };
}

export function createFormationsPortStub(): jasmine.SpyObj<FormationsPort> {
  const port = jasmine.createSpyObj<FormationsPort>('FormationsPort', [
    'ouvrirSeance',
    'lireDeroule',
    'lireSujet',
    'demarrer',
    'piloter',
    'cloturer',
    'lireResultats',
    'rejoindre',
    'repondre',
    'signalerIncidents',
    'lireQuestionsDues',
  ]);
  port.ouvrirSeance.and.returnValue(of({ sessionId: 'seance-1', code: '4821' }));
  port.lireDeroule.and.returnValue(of(buildDerouleCours()));
  port.lireSujet.and.returnValue(of(buildCoursContent()));
  port.demarrer.and.returnValue(of(undefined));
  port.piloter.and.returnValue(of(undefined));
  port.cloturer.and.returnValue(of(undefined));
  port.lireResultats.and.returnValue(of(buildRapportSeance()));
  port.rejoindre.and.returnValue(of(buildRattachement()));
  port.repondre.and.returnValue(of({ correcte: true, libelleConfusion: null }));
  port.signalerIncidents.and.returnValue(of(undefined));
  port.lireQuestionsDues.and.returnValue(of({ questions: [] }));
  return port;
}
