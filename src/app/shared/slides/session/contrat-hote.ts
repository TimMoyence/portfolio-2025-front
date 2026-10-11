import type {
  ComptesJalon,
  EtatPulse,
  PilotageEcran,
  ResultatQuestion,
  ValeurProduction,
} from '../../../../cours/content/types';

export type { EtatPulse };

export type EvenementBrique =
  | {
      readonly kind: 'reponse';
      readonly screenId: string;
      readonly questionId: string;
      readonly valeur: number | string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'production';
      readonly screenId: string;
      readonly questionId: string;
      readonly valeur: ValeurProduction;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'tentative';
      readonly screenId: string;
      readonly parcoursId: string;
      readonly enigmeId: string;
      readonly reponse: string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'libre';
      readonly screenId: string;
      readonly activityId: string;
      readonly response: string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'defi';
      readonly screenId: string;
      readonly defiId: string;
      readonly texte: string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'jalon';
      readonly screenId: string;
      readonly sondageId: string;
      readonly etat: EtatPulse;
    }
  | {
      readonly kind: 'reglage';
      readonly screenId: string;
      readonly reglages: Readonly<Record<string, number>>;
    };

export interface DirectEcran {
  readonly pilotage: PilotageEcran;
  readonly resultats: readonly ResultatQuestion[] | null;
  readonly comptesJalon: ComptesJalon | null;
}
