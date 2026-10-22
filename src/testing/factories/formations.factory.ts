import { of } from 'rxjs';
import type { RapportQuestionResponseDto } from '../../../contrat/types.gen';
import type {
  DerouleCours,
  EcranDeroule,
  EtatParticipant,
  ProgressionEnigme,
  ResultatQuestion,
  ResultatsSeance,
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
  ReponseLibreFormateur,
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
import {
  buildRapportSeance,
  buildRattachement,
  buildRegleNotation,
  buildResultatQuestion,
  buildResultatsSeance,
  buildResumeBareme,
  buildStatistiquesSeance,
} from './rapport-seance.factory';

export {
  buildCoursContent,
  buildRapportSeance,
  buildRattachement,
  buildRegleNotation,
  buildResultatQuestion,
  buildResultatsSeance,
  buildResumeBareme,
  buildStatistiquesSeance,
};

const HORODATAGE = '2026-09-19T08:00:00.000Z';

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
  const questions = ecrans.flatMap(resultatsDeLEcran);
  return {
    participants: 2,
    questions,
    confusions: questions.flatMap(({ confusions }) => confusions).slice(0, 1),
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

const UUID_DE_SEANCE = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const UUID_DE_PARTICIPANT = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
const UUID_DE_FORMATEUR = '2b7e1c9d-3a4f-4e5b-8c6d-9e0f1a2b3c4d';

export function buildEtatParticipant(overrides: Partial<EtatParticipant> = {}): EtatParticipant {
  return {
    ...etatParticipantVierge({
      sessionId: UUID_DE_SEANCE,
      participantId: UUID_DE_PARTICIPANT,
      revision: 0,
    }),
    ...overrides,
  };
}

export function buildReponseRapportee(
  overrides: Partial<RapportQuestionResponseDto> = {},
): RapportQuestionResponseDto {
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
    reponses: [buildReponseRapportee()],
    reponsesLibres: [],
    incidents: 0,
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
        optionId: 'b',
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
    ...overrides,
  };
}

export function buildAnnotationFormateur(
  overrides: Partial<AnnotationFormateur> = {},
): AnnotationFormateur {
  return {
    id: '6a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d',
    sessionId: UUID_DE_SEANCE,
    teacherId: UUID_DE_FORMATEUR,
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
    id: '9c8b7a6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d',
    sessionId: UUID_DE_SEANCE,
    participantId: UUID_DE_PARTICIPANT,
    screenId: 'ecran-1',
    activityId: 'reflexion-1',
    response: 'Je compare d’abord les bases avant les pourcentages.',
    premiereReponse: null,
    dureeMs: 42_000,
    submittedAt: HORODATAGE,
    ...overrides,
  };
}

export function buildParticipantDeSeance(
  overrides: Partial<ParticipantDeSeance> = {},
): ParticipantDeSeance {
  return {
    id: UUID_DE_PARTICIPANT,
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
