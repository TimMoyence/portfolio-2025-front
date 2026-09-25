import type { MetadonneesBrique, RegimeVerrou } from '../../content/types';
import type { CardsortPlanPublic as CardsortPlanBrique } from './FpCardsort';
import type { ChallengeProblemePublic } from './FpChallenge';
import type { Concept4Definition } from './FpConcept4';
import type {
  EscapeEnigmePublique,
  EscapeParcoursPublic as EscapeParcoursBrique,
} from './FpEscape';
import type { ExitBilletPublic } from './FpExit';
import type { NumericQuestionPublique } from './FpNumeric';
import type { PlotDefinition as PlotDefinitionBrique } from './FpPlot';
import type { ProCas } from './FpPro';
import type { PulseSondage } from './FpPulse';
import type { SheetPlanPublic as SheetPlanBrique } from './FpSheet';
import type { SpacedQuestionPublique as SpacedQuestionBrique } from './FpSpaced';
import type { StoryRecit } from './FpStory';
import type { TableBuildPlanPublic, TableColonne } from './FpTableBuild';
import type { WorkedExemple } from './FpWorked';
import type { OptionPublique } from './projection';

export type {
  Concept4Definition,
  ExitBilletPublic,
  OptionPublique,
  PulseSondage,
  StoryRecit,
  WorkedExemple,
};

export type NumeriquePublic = NumericQuestionPublique;

export interface VotePublic {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

export interface PlotDefinition extends PlotDefinitionBrique {
  readonly description?: string;
}

export interface SheetPlanPublic extends SheetPlanBrique {
  readonly consignes: readonly string[];
}

export interface CardsortPlanPublic extends CardsortPlanBrique {
  readonly dureeJeuMs?: number;
}

export type { TableBuildPlanPublic };

export type TableColonneServie = TableColonne;

export interface EscapeParcoursPublic extends Omit<EscapeParcoursBrique, 'enigmes'> {
  readonly tentativesMax: number;
  readonly enigmes: readonly Omit<EscapeEnigmePublique, 'fragment'>[];
}

export interface SpacedQuestionPublique extends Omit<SpacedQuestionBrique, 'boite'> {
  readonly boite: 1 | 2 | 3;
}

type QuestionDeQuestionnaire =
  | { readonly brique: 'fp-numeric'; readonly donnees: DonneesParBrique['fp-numeric'] }
  | { readonly brique: 'fp-vote'; readonly donnees: DonneesParBrique['fp-vote'] };

export interface DonneesParBrique {
  readonly 'fp-story': { readonly recit: StoryRecit };
  readonly 'fp-pro': { readonly cas: ProCas };
  readonly 'fp-worked': {
    readonly exemple: WorkedExemple;
    readonly etayage: number;
    readonly pilote?: boolean;
  };
  readonly 'fp-concept4': { readonly definition: Concept4Definition };
  readonly 'fp-plot': { readonly definition: PlotDefinition };
  readonly 'fp-challenge': {
    readonly probleme: Omit<ChallengeProblemePublic, 'strategies'> & {
      readonly strategies: readonly [];
    };
  };
  readonly 'fp-cardsort': { readonly plan: CardsortPlanPublic };
  readonly 'fp-sheet': { readonly plan: SheetPlanPublic };
  readonly 'fp-table-build': { readonly plan: TableBuildPlanPublic };
  readonly 'fp-escape': { readonly parcours: EscapeParcoursPublic };
  readonly 'fp-pulse': { readonly sondage: PulseSondage };
  readonly 'fp-spaced': {
    readonly rappel: {
      readonly id: string;
      readonly intitule: string;
      readonly metadonnees: MetadonneesBrique;
    };
  };
  readonly 'fp-numeric': { readonly question: NumeriquePublic };
  readonly 'fp-vote': { readonly question: VotePublic; readonly questionJumelle?: VotePublic };
  readonly 'fp-recall': {
    readonly question: VotePublic & { readonly metadonnees: MetadonneesBrique };
    readonly delaiMs: number;
  };
  readonly 'fp-exit': { readonly billet: ExitBilletPublic };
  readonly questionnaire: {
    readonly intitule: string;
    readonly consigne: string;
    readonly regime: RegimeVerrou;
    readonly ordre: 'fixe' | 'melange';
    readonly questions: readonly QuestionDeQuestionnaire[];
  };
  readonly 'ecran-verrouille': Readonly<Record<string, never>>;
}
