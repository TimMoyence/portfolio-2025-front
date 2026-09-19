import { of } from 'rxjs';
import type {
  DerouleCours,
  EcranDeroule,
  GuideFormateur,
  ResultatQuestion,
  ResultatsSeance,
  StatistiquesSeance,
} from '../../cours/content/types';
import type {
  AnnotationFormateur,
  FormationsPort,
  GroupeFormation,
  ParticipantDeSeance,
  RapportSeance,
  Rattachement,
  RegleNotation,
  ReponseLibreFormateur,
} from '../../app/core/ports/formations.port';
import { buildCoursContent } from './cours.factory';

export { buildCoursContent };

const HORODATAGE = '2026-09-19T08:00:00.000Z';

export function buildResultatQuestion(overrides: Partial<ResultatQuestion> = {}): ResultatQuestion {
  return {
    questionId: 'Q-CAP-03',
    ecranId: 'ecran-1',
    type: 'vote',
    noteCompte: true,
    total: 24,
    correctes: 16,
    neSaitPas: 2,
    confusions: [
      { id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés', nombre: 6 },
    ],
    parOption: null,
    scoreMoyen: null,
    parCle: null,
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

export function buildStatistiquesSeance(
  overrides: Partial<StatistiquesSeance> = {},
): StatistiquesSeance {
  return {
    moyenne: 12.5,
    mediane: 13,
    dispersion: 3.25,
    tauxParticipation: 0.75,
    tauxReussite: 0.6,
    questionsProblemes: [],
    ...overrides,
  };
}

export function buildRegleNotation(overrides: Partial<RegleNotation> = {}): RegleNotation {
  return {
    noteMax: 20,
    base: 'participation-relative-cohorte',
    partCohorteReference: 0.2,
    ratioSeuilValidation: 0.4,
    neSaitPasCompteCommeReponse: true,
    pointsNonReponse: 0,
    reponsesLibresNotees: false,
    seuilQuestionProbleme: 0.7,
    decimalesStatistiques: 2,
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

export function buildEcranDeroule(overrides: Partial<EcranDeroule> = {}): EcranDeroule {
  return {
    id: 'ecran-1',
    type: 'vote',
    duree: 180,
    interactif: true,
    notes: 'Rappeler la formule de capitalisation avant de lancer le vote.',
    diffusion: 'catalogue',
    seuil: 0.7,
    corriges: [
      {
        questionId: 'Q-CAP-03',
        bonneReponse: '1480.24',
        confusions: [{ id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés' }],
      },
    ],
    questions: [],
    corrigeEcran: null,
    ...overrides,
  };
}

export function buildGuideFormateur(overrides: Partial<GuideFormateur> = {}): GuideFormateur {
  return {
    aDire: 'Avant de commenter la pente, vérifiez le repère.',
    question: 'Quelle est l’unité de l’axe vertical ?',
    reponse: 'Des milliers d’euros, pas des euros.',
    calcul: '12 400 / 1 000 = 12,4',
    relance: 'Qui peut lire la légende à voix haute ?',
    transition: 'On passe au taux global.',
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

export function buildRattachement(overrides: Partial<Rattachement> = {}): Rattachement {
  return {
    participantId: 'participant-1',
    sessionId: 'seance-1',
    ecranCourant: 0,
    modeRythme: 'pilote',
    jeton: 'jeton-1',
    ...overrides,
  };
}

export function buildGroupeFormation(overrides: Partial<GroupeFormation> = {}): GroupeFormation {
  return {
    id: 'groupe-1',
    sessionId: 'seance-1',
    name: 'Groupe A',
    createdAt: HORODATAGE,
    updatedAt: HORODATAGE,
    ...overrides,
  };
}

export function buildAnnotationFormateur(
  overrides: Partial<AnnotationFormateur> = {},
): AnnotationFormateur {
  return {
    id: 'annotation-1',
    sessionId: 'seance-1',
    teacherId: 'formateur-1',
    screenId: 'ecran-1',
    groupName: 'Classe entière',
    note: 'Relancer le groupe du fond sur la base de calcul.',
    updatedAt: HORODATAGE,
    ...overrides,
  };
}

export function buildReponseLibreFormateur(
  overrides: Partial<ReponseLibreFormateur> = {},
): ReponseLibreFormateur {
  return {
    id: 'reponse-libre-1',
    sessionId: 'seance-1',
    participantId: 'participant-1',
    screenId: 'ecran-1',
    activityId: 'reflexion-1',
    response: 'Je compare d’abord les bases avant les pourcentages.',
    dureeMs: 42_000,
    status: 'enregistre',
    submittedAt: HORODATAGE,
    ...overrides,
  };
}

export function buildParticipantDeSeance(
  overrides: Partial<ParticipantDeSeance> = {},
): ParticipantDeSeance {
  return {
    id: 'participant-1',
    prenom: 'Lea',
    nom: 'Dubois',
    groupId: null,
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
    'exporterBilan',
    'lireAnnotations',
    'enregistrerAnnotation',
    'lireReponsesLibres',
    'lireGroupes',
    'creerGroupe',
    'renommerGroupe',
    'affecterParticipant',
    'retirerParticipantDuGroupe',
    'lireParticipants',
    'rejoindre',
    'repondre',
    'enregistrerReponseLibre',
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
  port.exporterBilan.and.returnValue(of(buildRapportSeance()));
  port.lireAnnotations.and.returnValue(of({ annotations: [] }));
  port.enregistrerAnnotation.and.callFake((sessionId, annotation) =>
    of(buildAnnotationFormateur({ sessionId, ...annotation })),
  );
  port.lireReponsesLibres.and.returnValue(of({ responses: [] }));
  port.lireGroupes.and.returnValue(of({ groups: [] }));
  port.creerGroupe.and.callFake((sessionId, name) => of(buildGroupeFormation({ sessionId, name })));
  port.renommerGroupe.and.callFake((sessionId, id, name) =>
    of(buildGroupeFormation({ sessionId, id, name })),
  );
  port.affecterParticipant.and.returnValue(of(undefined));
  port.retirerParticipantDuGroupe.and.returnValue(of(undefined));
  port.lireParticipants.and.returnValue(of({ participants: [] }));
  port.rejoindre.and.returnValue(of(buildRattachement()));
  port.repondre.and.returnValue(of({ reussite: true, libelleConfusion: null }));
  port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
  port.signalerIncidents.and.returnValue(of(undefined));
  port.lireQuestionsDues.and.returnValue(of({ questions: [] }));
  return port;
}
