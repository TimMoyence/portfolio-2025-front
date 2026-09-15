import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { FreeRange, PacingMode } from '../../../cours/content/types';

export type ValeurReponse = number | string;

export type TypeQuestionBareme = 'numeric' | 'vote' | 'asn' | 'order';

export type TypeTolerance = 'relative' | 'absolue' | 'decimales';

export interface ToleranceBareme {
  type: TypeTolerance;
  valeur: number;
}

export interface QuestionBareme {
  id: string;
  type: TypeQuestionBareme;
  concept: string;
  tolerance?: ToleranceBareme;
  noteCompte: boolean;
}

export interface PiegeBareme {
  valeur: ValeurReponse;
  misconception: string;
}

export interface SolutionBareme {
  valeur: ValeurReponse;
  pieges: readonly PiegeBareme[];
}

export interface TirageBareme {
  seed: number;
  solutions: Readonly<Record<string, SolutionBareme>>;
}

export interface Bareme {
  version: 1;
  questions: readonly QuestionBareme[];
  tirages: readonly TirageBareme[];
}

export interface OuvertureSeance {
  courseSlug: string;
  bareme: Bareme;
}

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
  seed: number;
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
  correcte: boolean;
  misconception: string | null;
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

export interface FormationsPort {
  ouvrirSeance(demande: OuvertureSeance): Observable<SeanceOuverte>;
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
