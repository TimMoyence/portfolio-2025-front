import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CoursContent,
  DerouleCours,
  EtatParticipant,
  EtatPulse,
  FreeRange,
  PacingMode,
  PilotageEcran,
  ResultatsSeance,
  StatistiquesSeance,
  TypeQuestion,
  ValeurProduction,
} from '../../../cours/content/types';
import type { SpacedQuestionPublique } from '../../../cours/runtime/blocks/donnees-publiques';

export type ValeurReponse = number | string;

export interface SeanceOuverte {
  sessionId: string;
  code: string;
}

export interface CommandePilotage {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange;
  pilotage?: { screenId: string } & PilotageEcran;
}

export interface VerdictProduction {
  correcte: boolean;
  score: number;
  details: readonly {
    cle: string;
    juste: boolean;
    libelleConfusion: string | null;
  }[];
  libelleConfusion: string | null;
}

export interface VerdictTentative {
  correcte: boolean;
  fragment: string | null;
  tentativesRestantes: number;
}

export interface StrategiePublique {
  id: string;
  libelle: string;
  fausse?: boolean;
}

export interface StrategiesDuDefi {
  strategies: readonly StrategiePublique[];
}

export interface RappelsDus {
  questions: readonly SpacedQuestionPublique[];
}

export interface ProductionEtudiante {
  questionId: string;
  valeur: ValeurProduction;
  dureeMs: number;
}

export interface TentativeEnigme {
  enigmeId: string;
  reponse: string;
  dureeMs: number;
}

export interface TentativeDefi {
  texte: string;
  dureeMs: number;
}

export interface SyntheseConcept {
  concept: string;
  libelle: string;
  boite1: number;
  boite2: number;
  boite3: number;
  nonVus: number;
}

export interface InscriptionParticipant {
  prenom: string;
  nom: string;
  email: string;
  website?: string;
  formStartedAt?: number;
  secretDeReprise?: string;
}

export interface Rattachement {
  participantId: string;
  sessionId: string;
  ecranCourant: number;
  modeRythme: PacingMode;
  jeton: string;
  secretDeReprise: string;
}

export interface ReponseEtudiant {
  questionId: string;
  valeur: ValeurReponse;
  dureeMs: number;
}

export interface ReponseLibreEtudiant {
  screenId: string;
  activityId: string;
  response: string;
  dureeMs: number;
}

export interface ReponseLibreEnregistree {
  status: 'enregistre';
}

export interface AnnotationFormateur {
  id: string;
  sessionId: string;
  teacherId: string;
  screenId: string;
  note: string;
  updatedAt: string;
}

export interface ReponseLibreFormateur {
  id: string;
  sessionId: string;
  participantId: string;
  screenId: string;
  activityId: string;
  response: string;
  dureeMs: number;
  status: 'enregistre' | 'en_attente' | 'echec';
  submittedAt: string;
}

export interface ParticipantDeSeance {
  id: string;
  prenom: string;
  nom: string;
  evince: boolean;
}

export interface RegleNotation {
  noteMax: number;
  base: 'participation-relative-cohorte';
  partCohorteReference: number;
  ratioSeuilValidation: number;
  neSaitPasCompteCommeReponse: boolean;
  pointsNonReponse: number;
  reponsesLibresNotees: boolean;
  seuilQuestionProbleme: number;
  decimalesStatistiques: number;
  typesNotables: readonly TypeQuestion[];
  productionCompteSi: 'au-moins-une-saisie';
  statistiquesSurQuestionsNotees: boolean;
}

export interface VerdictReponse {
  reussite: boolean;
  libelleConfusion: string | null;
}

export interface IncidentEtudiant {
  type: string;
  contexte?: Record<string, unknown>;
  horodatage: string;
}

export type BoiteRevision = 1 | 2 | 3;

export interface QuestionDue {
  questionId: string;
  concept: string;
  boite: BoiteRevision;
}

export interface QuestionsDues {
  questions: readonly QuestionDue[];
}

export interface ReponseRapportee {
  questionId: string;
  concept: string;
  valeur: string;
  correcte: boolean;
  misconception: string | null;
  dureeMs: number;
}

export interface ParticipantRapporte {
  prenom: string;
  nom: string;
  email: string;
  completion: number;
  note: number;
  sousSeuil: boolean;
  reponses: readonly ReponseRapportee[];
  incidents: number;
}

export interface RapportSeance {
  courseSlug: string;
  code: string;
  ouverteLe: string;
  fermeeLe: string;
  participants: readonly ParticipantRapporte[];
  conceptsFragiles: readonly string[];
  resultats: ResultatsSeance;
  statistiques?: StatistiquesSeance;
  notation?: RegleNotation;
}

export type MotifRefusRattachement =
  | 'code-inconnu'
  | 'seance-complete'
  | 'seance-terminee'
  | 'place-deja-prise'
  | 'participant-evince'
  | 'rattachement-impossible';

const MESSAGES_REFUS_RATTACHEMENT: Readonly<Record<MotifRefusRattachement, string>> = {
  'code-inconnu': $localize`:cours.refusCodeInconnu|@@coursRefusCodeInconnu:Ce code de séance n'existe pas : vérifiez les caractères dictés.`,
  'seance-complete': $localize`:cours.refusSeanceComplete|@@coursRefusSeanceComplete:Cette séance a atteint sa capacité : demandez à votre formateur de libérer une place.`,
  'seance-terminee': $localize`:cours.refusSeanceTerminee|@@coursRefusSeanceTerminee:Cette séance est terminée : elle n’accepte plus de nouveau participant.`,
  'place-deja-prise': $localize`:cours.refusPlaceDejaPrise|@@coursRefusPlaceDejaPrise:Votre place est déjà ouverte sur un autre appareil : demandez au formateur de libérer votre poste.`,
  'participant-evince': $localize`:cours.refusParticipantEvince|@@coursRefusParticipantEvince:Le formateur vous a retiré de cette séance : adressez-vous à lui pour être réadmis.`,
  'rattachement-impossible': $localize`:cours.refusRattachementImpossible|@@coursRefusRattachementImpossible:Le rattachement à la séance a échoué.`,
};

export class RattachementRefuse extends Error {
  constructor(
    readonly motif: MotifRefusRattachement,
    readonly statut: number,
  ) {
    super(MESSAGES_REFUS_RATTACHEMENT[motif]);
    this.name = 'RattachementRefuse';
  }
}

export type MotifRefusSujet = 'cours-modifie' | 'sujet-indisponible';

const MESSAGES_REFUS_SUJET: Readonly<Record<MotifRefusSujet, string>> = {
  'cours-modifie': $localize`:cours.refusCoursModifie|@@coursRefusCoursModifie:Le cours a changé depuis l’ouverture de la séance : prévenez votre formateur.`,
  'sujet-indisponible': $localize`:cours.refusSujetIndisponible|@@coursRefusSujetIndisponible:Le sujet de la séance n’a pas pu être chargé.`,
};

export class SujetRefuse extends Error {
  constructor(
    readonly motif: MotifRefusSujet,
    readonly statut: number,
  ) {
    super(MESSAGES_REFUS_SUJET[motif]);
    this.name = 'SujetRefuse';
  }
}

export type MotifRefusReponse =
  | 'reseau'
  | 'deja-repondue'
  | 'seance-non-demarree'
  | 'seance-terminee'
  | 'ecran-non-servi'
  | 'phase-fermee'
  | 'enigme-verrouillee'
  | 'tentatives-epuisees'
  | 'reprises-epuisees'
  | 'production-vide'
  | 'evince'
  | 'refusee';

const MESSAGES_REFUS_REPONSE: Readonly<Record<MotifRefusReponse, string>> = {
  reseau: $localize`:cours.reponseReseau|@@coursReponseReseau:Votre réponse n’a pas pu partir : ce poste la renverra dès que le serveur répondra.`,
  'deja-repondue': $localize`:cours.reponseDejaRepondue|@@coursReponseDejaRepondue:Votre réponse à cette question était déjà enregistrée.`,
  'seance-non-demarree': $localize`:cours.reponseSeanceNonDemarree|@@coursReponseSeanceNonDemarree:La séance n’a pas encore démarré : votre réponse n’a pas été enregistrée. Attendez le signal de votre formateur.`,
  'seance-terminee': $localize`:cours.reponseSeanceTerminee|@@coursReponseSeanceTerminee:La séance est terminée : votre réponse n’a pas été enregistrée.`,
  'ecran-non-servi': $localize`:cours.reponseEcranNonServi|@@coursReponseEcranNonServi:Cet écran n’est pas encore ouvert`,
  'phase-fermee': $localize`:cours.reponsePhaseFermee|@@coursReponsePhaseFermee:Le vote est fermé pour cette question`,
  'enigme-verrouillee': $localize`:cours.reponseEnigmeVerrouillee|@@coursReponseEnigmeVerrouillee:Verrouillée : l’énigme précédente l’ouvrira`,
  'tentatives-epuisees': $localize`:cours.reponseTentativesEpuisees|@@coursReponseTentativesEpuisees:Tentatives épuisées : l’énigme suivante s’ouvre, sans fragment`,
  'reprises-epuisees': $localize`:cours.reponseReprisesEpuisees|@@coursReponseReprisesEpuisees:Production déjà envoyée trois fois : votre dernière version reste enregistrée jusqu’à la correction.`,
  'production-vide': $localize`:cours.reponseProductionVide|@@coursReponseProductionVide:Saisissez au moins une valeur ou choisissez « Je ne sais pas »`,
  evince: $localize`:cours.reponseEvince|@@coursReponseEvince:Votre formateur a retiré ce poste de la séance : votre réponse n’a pas été enregistrée.`,
  refusee: $localize`:cours.reponseRefusee|@@coursReponseRefusee:Votre réponse n’a pas été acceptée par le serveur : prévenez votre formateur.`,
};

export class ReponseRefusee extends Error {
  constructor(
    readonly motif: MotifRefusReponse,
    readonly statut: number,
  ) {
    super(MESSAGES_REFUS_REPONSE[motif]);
    this.name = 'ReponseRefusee';
  }
}

export type MotifRefusReponseLibre =
  'reseau' | 'seance-non-demarree' | 'seance-terminee' | 'ecran-non-servi' | 'refusee';

export class ReponseLibreRefusee extends Error {
  constructor(
    readonly motif: MotifRefusReponseLibre,
    readonly statut: number,
  ) {
    super(`Réponse libre refusée : ${motif} (statut ${statut})`);
    this.name = 'ReponseLibreRefusee';
  }
}

export interface FormationsPort {
  ouvrirSeance(courseSlug: string, options?: { capacite?: number }): Observable<SeanceOuverte>;
  lireDeroule(sessionId: string): Observable<DerouleCours>;
  lireSujet(sessionId: string, jeton: string): Observable<CoursContent>;
  demarrer(sessionId: string): Observable<void>;
  piloter(sessionId: string, commande: CommandePilotage): Observable<void>;
  cloturer(sessionId: string): Observable<void>;
  lireResultats(sessionId: string): Observable<RapportSeance>;
  exporterBilan(sessionId: string): Observable<RapportSeance>;
  lireAnnotations(sessionId: string): Observable<{ annotations: readonly AnnotationFormateur[] }>;
  enregistrerAnnotation(
    sessionId: string,
    annotation: Pick<AnnotationFormateur, 'screenId' | 'note'>,
  ): Observable<AnnotationFormateur>;
  lireReponsesLibres(
    sessionId: string,
  ): Observable<{ responses: readonly ReponseLibreFormateur[] }>;
  lireParticipants(sessionId: string): Observable<{ participants: readonly ParticipantDeSeance[] }>;
  rejoindre(code: string, inscription: InscriptionParticipant): Observable<Rattachement>;
  repondre(sessionId: string, jeton: string, reponse: ReponseEtudiant): Observable<VerdictReponse>;
  enregistrerReponseLibre(
    sessionId: string,
    jeton: string,
    reponse: ReponseLibreEtudiant,
  ): Observable<ReponseLibreEnregistree>;
  signalerIncidents(
    sessionId: string,
    jeton: string,
    incidents: readonly IncidentEtudiant[],
  ): Observable<void>;
  lireQuestionsDues(sessionId: string, jeton: string): Observable<QuestionsDues>;
  envoyerProduction(
    sessionId: string,
    jeton: string,
    production: ProductionEtudiante,
  ): Observable<VerdictProduction>;
  tenterEnigme(
    sessionId: string,
    jeton: string,
    parcoursId: string,
    tentative: TentativeEnigme,
  ): Observable<VerdictTentative>;
  declarerJalon(
    sessionId: string,
    jeton: string,
    sondageId: string,
    etat: EtatPulse,
  ): Observable<void>;
  lireRappels(sessionId: string, jeton: string): Observable<RappelsDus>;
  envoyerDefi(
    sessionId: string,
    jeton: string,
    defiId: string,
    tentative: TentativeDefi,
  ): Observable<StrategiesDuDefi>;
  lireStrategies(sessionId: string, jeton: string, defiId: string): Observable<StrategiesDuDefi>;
  lireMonEtat(sessionId: string, jeton: string): Observable<EtatParticipant>;
  lireSyntheseRappels(sessionId: string): Observable<{ concepts: readonly SyntheseConcept[] }>;
  evincerParticipant(sessionId: string, participantId: string): Observable<void>;
  readmettreParticipant(sessionId: string, participantId: string): Observable<void>;
  libererPoste(sessionId: string, participantId: string): Observable<void>;
}

export const FORMATIONS_PORT = new InjectionToken<FormationsPort>('FORMATIONS_PORT');
