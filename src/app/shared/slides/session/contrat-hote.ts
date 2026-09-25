import type {
  ComptesJalon,
  EtatPulse,
  PilotageEcran,
  ResultatQuestion,
  ValeurProduction,
} from '../../../../cours/content/types';
import type { SpacedQuestionPublique } from '../../../../cours/runtime/blocks/donnees-publiques';
import type {
  ProgressionDesEnigmes,
  StrategieServie,
  VerdictDeTentative,
} from '../../../../cours/runtime/blocks/retours';
import type { MotifRefusReponse } from '../../../core/ports/formations.port';

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

export type RetourBrique =
  | {
      readonly kind: 'verdict-reponse';
      readonly questionId: string;
      readonly correcte: boolean;
      readonly libelleConfusion: string | null;
    }
  | {
      readonly kind: 'verdict-production';
      readonly questionId: string;
      readonly correcte: boolean;
      readonly score: number;
      readonly details: readonly {
        readonly cle: string;
        readonly juste: boolean;
        readonly libelleConfusion: string | null;
      }[];
    }
  | ({ readonly kind: 'tentative' } & VerdictDeTentative)
  | ({ readonly kind: 'progression-enigmes' } & ProgressionDesEnigmes)
  | {
      readonly kind: 'strategies';
      readonly defiId: string;
      readonly strategies: readonly StrategieServie[];
    }
  | {
      readonly kind: 'rappels';
      readonly questions: readonly SpacedQuestionPublique[];
    }
  | { readonly kind: 'deja-repondu'; readonly questionId: string }
  | {
      readonly kind: 'refus';
      readonly motif: MotifRefusReponse;
      readonly message: string;
    };

export interface DirectEcran {
  readonly pilotage: PilotageEcran;
  readonly resultats: readonly ResultatQuestion[] | null;
  readonly comptesJalon: ComptesJalon | null;
}
