import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CoursContent,
  DerouleCours,
  FreeRange,
  PacingMode,
  ResultatsSeance,
} from '../../../cours/content/types';

export type ValeurReponse = number | string;

export interface SeanceOuverte {
  sessionId: string;
  code: string;
}

export interface CommandePilotage {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange;
}

export interface InscriptionParticipant {
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  website?: string;
  formStartedAt?: number;
}

export interface Rattachement {
  participantId: string;
  sessionId: string;
  ecranCourant: number;
  modeRythme: PacingMode;
  jeton: string;
}

export interface ReponseEtudiant {
  questionId: string;
  valeur: ValeurReponse;
  dureeMs: number;
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
}

export type MotifRefusRattachement = 'code-inconnu' | 'deja-inscrit' | 'rattachement-impossible';

const MESSAGES_REFUS_RATTACHEMENT: Readonly<Record<MotifRefusRattachement, string>> = {
  'code-inconnu': "Ce code de séance n'existe pas : vérifiez les caractères dictés.",
  'deja-inscrit': "Cette inscription est déjà enregistrée, ou la séance n'en accepte plus.",
  'rattachement-impossible': 'Le rattachement à la séance a échoué.',
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
  'cours-modifie': 'Le cours a changé depuis l’ouverture de la séance : prévenez votre formateur.',
  'sujet-indisponible': 'Le sujet de la séance n’a pas pu être chargé.',
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

export type MotifRefusReponse = 'reseau' | 'deja-repondue' | 'seance-non-demarree' | 'refusee';

const MESSAGES_REFUS_REPONSE: Readonly<Record<MotifRefusReponse, string>> = {
  reseau: $localize`:cours.reponseReseau|@@coursReponseReseau:Votre réponse n’a pas pu partir : ce poste la renverra dès que le serveur répondra.`,
  'deja-repondue': $localize`:cours.reponseDejaRepondue|@@coursReponseDejaRepondue:Votre réponse à cette question était déjà enregistrée.`,
  'seance-non-demarree': $localize`:cours.reponseSeanceNonDemarree|@@coursReponseSeanceNonDemarree:La séance n’a pas encore démarré : votre réponse n’a pas été enregistrée. Attendez le signal de votre formateur.`,
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

export interface FormationsPort {
  ouvrirSeance(courseSlug: string): Observable<SeanceOuverte>;
  lireDeroule(sessionId: string): Observable<DerouleCours>;
  lireSujet(sessionId: string, jeton: string): Observable<CoursContent>;
  demarrer(sessionId: string): Observable<void>;
  piloter(sessionId: string, commande: CommandePilotage): Observable<void>;
  cloturer(sessionId: string): Observable<void>;
  lireResultats(sessionId: string): Observable<RapportSeance>;
  rejoindre(code: string, inscription: InscriptionParticipant): Observable<Rattachement>;
  repondre(sessionId: string, jeton: string, reponse: ReponseEtudiant): Observable<VerdictReponse>;
  signalerIncidents(
    sessionId: string,
    jeton: string,
    incidents: readonly IncidentEtudiant[],
  ): Observable<void>;
  lireQuestionsDues(sessionId: string, jeton: string): Observable<QuestionsDues>;
}

export const FORMATIONS_PORT = new InjectionToken<FormationsPort>('FORMATIONS_PORT');
