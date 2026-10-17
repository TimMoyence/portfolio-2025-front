import { of } from 'rxjs';
import type {
  DerouleCours,
  EcranDeroule,
  EtatParticipant,
  ProgressionEnigme,
  ResultatQuestion,
  ResultatsSeance,
  ResumeBareme,
  StatistiquesSeance,
} from '../../cours/content/types';
import type { SpacedQuestionPublique } from '../../cours/runtime/blocks/donnees-publiques';
import type { EtatDesEnigmes } from '../../cours/runtime/blocks/retours';
import type { ResultatsDuFlux } from '../../cours/runtime/core/sync';
import {
  deLaQuestion,
  identifiantPorte,
  libellesDesElements,
} from '../../app/shared/slides/session/lecture-ecran';
import type {
  AnnotationFormateur,
  FichierTelecharge,
  FormationsPort,
  LivretDuCours,
  ParticipantDeSeance,
  ParticipantRapporte,
  RapportSeance,
  Rattachement,
  RegleNotation,
  ReponseLibreFormateur,
  ReponseRapportee,
  StrategiePublique,
  SyntheseConcept,
  VerdictProduction,
  VerdictTentative,
} from '../../app/core/ports/formations.port';
import { etatParticipantVierge } from '../fixtures/etat-participant';
import {
  ENTETE_COURS_B1_09,
  buildCoursContent,
  buildFeuilleEvaluee,
  buildSortiesMachine,
  buildTableauEvalue,
} from './cours.factory';

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
    confusionDominante: 'interet-simple',
    part: 16 / 24,
    sousLeSeuil: false,
    remediation: null,
    ...overrides,
  };
}

export function buildProgressionEnigme(
  overrides: Partial<ProgressionEnigme> = {},
): ProgressionEnigme {
  return {
    parcoursId: 'K-EVASION-01',
    enigmeId: 'seuil',
    ouvertes: 2,
    resolues: 1,
    tentativesMoyennes: 1.5,
    epuisees: 0,
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

const TYPE_DE_LA_PRODUCTION: ReadonlyMap<string, ResultatQuestion['type']> = new Map([
  ['fp-sheet', 'feuille'],
  ['fp-table-build', 'tableau'],
  ['fp-cardsort', 'classement'],
  ['fp-escape', 'enigme'],
]);

function resultatsDeLEcran(ecran: EcranDeroule): readonly ResultatQuestion[] {
  const production = TYPE_DE_LA_PRODUCTION.get(ecran.type);
  const cles = [...libellesDesElements(ecran).keys()];
  return ecran.questions.map(({ id, options }) =>
    buildResultatQuestion({
      questionId: id,
      ecranId: ecran.id,
      type: options === null ? (production ?? 'numeric') : 'vote',
      total: 2,
      correctes: 1,
      neSaitPas: 1,
      confusions: (deLaQuestion(ecran.corriges, id)?.confusions ?? []).map((confusion) => ({
        ...confusion,
        nombre: 1,
      })),
      parOption:
        options === null ? null : Object.fromEntries(options.map((option) => [option.id, 1])),
      scoreMoyen: production === undefined ? null : 0.9,
      parCle:
        cles.length === 0
          ? null
          : Object.fromEntries(cles.map((cle) => [cle, { total: 2, justes: 1 }])),
    }),
  );
}

export function buildResultatsDeChaqueQuestion(
  ecrans: readonly EcranDeroule[],
): ResultatsSeance & Pick<ResultatsDuFlux, 'jalons' | 'enigmes'> {
  return {
    participants: 2,
    questions: ecrans.flatMap(resultatsDeLEcran),
    jalons: Object.fromEntries(
      ecrans
        .filter(({ type }) => type === 'fp-pulse')
        .flatMap((ecran) => identifiantPorte(ecran.donnees, 'sondage') ?? [])
        .map((sondage) => [sondage, { perdu: 1, 'ca-va': 1, clair: 1, total: 3 }]),
    ),
    enigmes: ecrans
      .filter(({ type }) => type === 'fp-escape')
      .flatMap((ecran) =>
        [...libellesDesElements(ecran).keys()].map((enigmeId) =>
          buildProgressionEnigme({
            parcoursId: identifiantPorte(ecran.donnees, 'parcours') ?? '',
            enigmeId,
          }),
        ),
      ),
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

export function buildResultatsDuFlux(overrides: Partial<ResultatsDuFlux> = {}): ResultatsDuFlux {
  return {
    ...buildResultatsSeance(),
    statistiques: buildStatistiquesSeance(),
    jalons: {},
    enigmes: [],
    bareme: buildResumeBareme(),
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
    typesNotables: ['vote', 'numeric', 'classement', 'feuille', 'tableau'],
    productionCompteSi: 'au-moins-une-saisie',
    statistiquesSurQuestionsNotees: true,
    ...overrides,
  };
}

export function buildResumeBareme(overrides: Partial<ResumeBareme> = {}): ResumeBareme {
  return {
    questionsNotees: 31,
    parType: {
      vote: { notees: 19, nonNotees: 13 },
      numeric: { notees: 7, nonNotees: 0 },
      classement: { notees: 3, nonNotees: 0 },
      feuille: { notees: 1, nonNotees: 0 },
      tableau: { notees: 1, nonNotees: 0 },
      enigme: { notees: 0, nonNotees: 4 },
    },
    ...overrides,
  };
}

export function buildVerdictProduction(
  overrides: Partial<VerdictProduction> = {},
): VerdictProduction {
  return {
    correcte: false,
    score: 0.75,
    details: [
      { cle: 'E2', juste: true, libelleConfusion: null },
      { cle: 'E3', juste: false, libelleConfusion: 'Référence relative non figée.' },
    ],
    libelleConfusion: 'Référence relative non figée.',
    ...overrides,
  };
}

export function buildEtatDesEnigmes(overrides: Partial<EtatDesEnigmes> = {}): EtatDesEnigmes {
  return {
    etats: {
      'enigme-1': { etat: 'resolue', tentativesRestantes: 9 },
      'enigme-2': { etat: 'ouverte', tentativesRestantes: 10 },
    },
    enigmeOuverte: 'enigme-2',
    acheve: false,
    ...overrides,
  };
}

export function buildVerdictTentative(overrides: Partial<VerdictTentative> = {}): VerdictTentative {
  return {
    correcte: true,
    fragment: '7',
    tentativesRestantes: 9,
    ...buildEtatDesEnigmes(),
    ...overrides,
  };
}

export function buildStrategiePublique(
  overrides: Partial<StrategiePublique> = {},
): StrategiePublique {
  return {
    id: 'somme-des-taux',
    libelle: 'Additionner les taux annoncés',
    ...overrides,
  };
}

export function buildSyntheseConcept(overrides: Partial<SyntheseConcept> = {}): SyntheseConcept {
  return {
    concept: 'evolution-reciproque',
    libelle: 'Évolution réciproque',
    boite1: 6,
    boite2: 14,
    boite3: 3,
    nonVus: 1,
    ...overrides,
  };
}

export function buildSpacedQuestionPublique(
  overrides: Partial<SpacedQuestionPublique> = {},
): SpacedQuestionPublique {
  return {
    questionId: 'b2-01-r-compensation',
    concept: 'evolution-reciproque',
    boite: 1,
    cours: 'B2-01 · Traitement de l’information chiffrée',
    enonce: 'Après une baisse de 20 %, quelle hausse ramène au départ ?',
    options: [
      { id: 'plus-25-pct-ecd953a1', libelle: '+25 %' },
      { id: 'plus-20-pct-6b3a9c2e', libelle: '+20 %' },
    ],
    ...overrides,
  };
}

export function buildEtatParticipant(overrides: Partial<EtatParticipant> = {}): EtatParticipant {
  return {
    ...etatParticipantVierge({
      sessionId: 'seance-1',
      participantId: 'participant-1',
      revision: 0,
    }),
    ...overrides,
  };
}

export function buildReponseRapportee(overrides: Partial<ReponseRapportee> = {}): ReponseRapportee {
  return {
    questionId: 'Q-CAP-03',
    concept: 'capitalisation',
    type: 'numeric',
    score: null,
    valeur: '1480.24',
    reponse: '1 480,24',
    correcte: true,
    misconception: null,
    libelleConfusion: null,
    dureeMs: 4200,
    ...overrides,
  };
}

export function buildParticipantRapporte(
  overrides: Partial<ParticipantRapporte> = {},
): ParticipantRapporte {
  return {
    prenom: 'Malik',
    nom: 'Durand',
    email: 'malik@example.com',
    completion: 1,
    note: 12,
    sousSeuil: false,
    reponses: [buildReponseRapportee()],
    reponsesLibres: [],
    incidents: 0,
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
    libellesDesConcepts: { capitalisation: 'Capitalisation' },
    resultats: buildResultatsSeance(),
    statistiques: buildStatistiquesSeance(),
    notation: buildRegleNotation(),
    bareme: buildResumeBareme(),
    jalons: {},
    enigmes: [],
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
        bonneReponse: '1 480,24',
        confusions: [{ id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés' }],
      },
    ],
    questions: [],
    corrigeEcran: null,
    reflexion: null,
    ...overrides,
  };
}

export function buildDerouleCours(overrides: Partial<DerouleCours> = {}): DerouleCours {
  return {
    ...ENTETE_COURS_B1_09,
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
    secretDeReprise: 'secret-de-reprise-1',
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
    note: 'Relancer le rang du fond sur la base de calcul.',
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
    premiereReponse: null,
    strategiesServiesLe: null,
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
    evince: false,
    ...overrides,
  };
}

export function buildLivretDuCours(overrides: Partial<LivretDuCours> = {}): LivretDuCours {
  return {
    version: 1,
    sujet: buildCoursContent(),
    corrige: buildDerouleCours(),
    ...overrides,
  };
}

export function buildFichierTelecharge(
  overrides: Partial<FichierTelecharge> = {},
): FichierTelecharge {
  return {
    nom: 'B3-01_reprise_acte_2.xlsx',
    contenu: new Blob(['PK'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    ...overrides,
  };
}

export function createFormationsPortStub(): jasmine.SpyObj<FormationsPort> {
  const port = jasmine.createSpyObj<FormationsPort>('FormationsPort', [
    'ouvrirSeance',
    'lireDeroule',
    'telechargerPieceJointeDuDeroule',
    'lireLivret',
    'lireSujet',
    'telechargerPieceJointe',
    'demarrer',
    'piloter',
    'cloturer',
    'lireResultats',
    'exporterBilan',
    'telechargerRapportCsv',
    'lireAnnotations',
    'enregistrerAnnotation',
    'lireReponsesLibres',
    'lireParticipants',
    'rejoindre',
    'repondre',
    'enregistrerReponseLibre',
    'signalerIncidents',
    'envoyerProduction',
    'tenterEnigme',
    'evaluerMachine',
    'evaluerTableau',
    'evaluerFeuille',
    'declarerJalon',
    'lireRappels',
    'envoyerDefi',
    'lireStrategies',
    'lireMonEtat',
    'lireSyntheseRappels',
    'evincerParticipant',
    'readmettreParticipant',
    'libererPoste',
  ]);
  port.ouvrirSeance.and.returnValue(of({ sessionId: 'seance-1', code: '4821' }));
  port.lireDeroule.and.returnValue(of(buildDerouleCours()));
  port.lireLivret.and.returnValue(of(buildLivretDuCours()));
  port.lireSujet.and.returnValue(of(buildCoursContent()));
  port.telechargerPieceJointe.and.returnValue(of(buildFichierTelecharge()));
  port.telechargerPieceJointeDuDeroule.and.returnValue(of(buildFichierTelecharge()));
  port.demarrer.and.returnValue(of(undefined));
  port.piloter.and.returnValue(of(undefined));
  port.cloturer.and.returnValue(of(undefined));
  port.lireResultats.and.returnValue(of(buildRapportSeance()));
  port.exporterBilan.and.returnValue(of(buildRapportSeance()));
  port.telechargerRapportCsv.and.returnValue(of(buildFichierTelecharge()));
  port.lireAnnotations.and.returnValue(of({ annotations: [] }));
  port.enregistrerAnnotation.and.callFake((sessionId, annotation) =>
    of(buildAnnotationFormateur({ sessionId, ...annotation })),
  );
  port.lireReponsesLibres.and.returnValue(of({ responses: [] }));
  port.lireParticipants.and.returnValue(of({ participants: [] }));
  port.rejoindre.and.returnValue(of(buildRattachement()));
  port.repondre.and.returnValue(of({ reussite: true, libelleConfusion: null }));
  port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
  port.signalerIncidents.and.returnValue(of(undefined));
  port.envoyerProduction.and.returnValue(of(buildVerdictProduction()));
  port.tenterEnigme.and.returnValue(of(buildVerdictTentative()));
  port.evaluerMachine.and.returnValue(of(buildSortiesMachine()));
  port.evaluerTableau.and.returnValue(of(buildTableauEvalue()));
  port.evaluerFeuille.and.returnValue(of(buildFeuilleEvaluee()));
  port.declarerJalon.and.returnValue(of(undefined));
  port.lireRappels.and.returnValue(of({ questions: [buildSpacedQuestionPublique()] }));
  port.envoyerDefi.and.returnValue(of({ strategies: [buildStrategiePublique()] }));
  port.lireStrategies.and.returnValue(of({ strategies: [buildStrategiePublique()] }));
  port.lireMonEtat.and.returnValue(of(buildEtatParticipant()));
  port.lireSyntheseRappels.and.returnValue(of({ concepts: [buildSyntheseConcept()] }));
  port.evincerParticipant.and.returnValue(of(undefined));
  port.readmettreParticipant.and.returnValue(of(undefined));
  port.libererPoste.and.returnValue(of(undefined));
  return port;
}
