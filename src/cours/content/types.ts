import type {
  ComptesJalonResponseDto,
  ConfusionCompteeResponseDto,
  CorrigePresentateurResponseDto,
  Diffusion as DiffusionServie,
  EcranDerouleResponseDto,
  EtatParticipantResponseDto,
  EtatPulse as EtatPulseServi,
  FeuilleEvalueeResponseDto,
  FreeRangeDto,
  JustesParCleResponseDto,
  LigneDeMachineResponseDto,
  MachineEvalueeResponseDto,
  MetadonneesBrique as MetadonneesServies,
  PacingMode as PacingModeServi,
  PhaseDeVote,
  PilotageServiResponseDto,
  ProgressionEnigmeResponseDto,
  ResultatQuestionResponseDto,
  ResultatsSeanceResponseDto,
  ResumeBaremeResponseDto,
  StatistiquesSeanceResponseDto,
  SubmitProductionRequestDto,
  TableauEvalueResponseDto,
  ToleranceResponseDto,
  TypeQuestion as TypeQuestionServi,
  ValeurDeMachineResponseDto,
} from '../../../contrat/types.gen';
import {
  zBoite,
  zEtatPulse,
  zMetadonneesBrique,
  zPhaseDeVote,
  zTypeQuestion,
} from '../../../contrat/zod.gen';

export type ValeurFormule = number | string | boolean;

export const TYPES_QUESTION = zTypeQuestion.options;
export type TypeQuestion = TypeQuestionServi;

export type Diffusion = DiffusionServie;

export const ETATS_PULSE = zEtatPulse.options;
export type EtatPulse = EtatPulseServi;

export const PHASES_DE_VOTE = zPhaseDeVote.options;
export type VotePhase = PhaseDeVote;

export type PacingMode = PacingModeServi;

export type FreeRange = FreeRangeDto;

export const REGIMES_DE_VERROU = zMetadonneesBrique.shape.regime.options;
export type RegimeVerrou = MetadonneesServies['regime'];

export const BOITES_DE_REVISION = zBoite.options.map((boite) => boite.value);

export type MetadonneesBrique = MetadonneesServies;
export type Tolerance = ToleranceResponseDto;
export type FormeFormule = 'references' | { readonly memeQue: string };
export type ValeurProduction = SubmitProductionRequestDto['valeur'];
export type ValeurAffichee = ValeurDeMachineResponseDto;
export type LigneDeMachine = LigneDeMachineResponseDto;
export type SortiesMachine = MachineEvalueeResponseDto;
export type TableauEvalue = TableauEvalueResponseDto;
export type FeuilleEvaluee = FeuilleEvalueeResponseDto;
export type NatureDeCellule = FeuilleEvaluee['natures'][string];
export type ConfusionComptee = ConfusionCompteeResponseDto;
export type Decompte = JustesParCleResponseDto;
export type DecomptesParCle = Readonly<Record<string, Decompte>>;
export type ResultatQuestion = ResultatQuestionResponseDto;
export type ResultatsSeance = ResultatsSeanceResponseDto;
export type StatistiquesSeance = StatistiquesSeanceResponseDto;
export type ComptesJalon = ComptesJalonResponseDto;
export type ProgressionEnigme = ProgressionEnigmeResponseDto;
export type ResumeBareme = ResumeBaremeResponseDto;
export type PilotageEcran = PilotageServiResponseDto;
export type EtatParticipant = EtatParticipantResponseDto;
export type CorrigeEcranPresentateur = NonNullable<EcranDerouleResponseDto['corrigeEcran']>;

export type Role = 'presentateur' | 'etudiant';

export interface QuestionRevelee {
  readonly questionId: string;
  readonly cible: string;
  readonly optionId: string | null;
}

export interface ExplicationServie {
  readonly reference: string;
  readonly texte: string;
}

export interface ReflexionServie {
  readonly attendu: string;
  readonly suite: string | null;
}

export interface RevelationServie {
  readonly ecranId: string;
  readonly questions: readonly QuestionRevelee[];
  readonly annexe: CorrigeEcranPresentateur | null;
  readonly reflexion: ReflexionServie | null;
  readonly explications?: readonly ExplicationServie[];
}

export interface CadrageDuRenvoi {
  readonly extrait?: {
    readonly lignes?: readonly number[];
    readonly champs?: readonly string[];
  };
}

interface PieceJointePublique {
  readonly libelle: string;
  readonly fichier: string;
}

interface PieceJointeReservee {
  readonly libelle: string;
  readonly reservee: true;
}

export type PieceJointe = PieceJointePublique | PieceJointeReservee;

export interface EcranContent {
  id: string;
  type: string;
  titre?: string | null;
  duree: number;
  interactif: boolean;
  donnees?: Record<string, unknown>;
  renvoi?: string;
  cadrageDuRenvoi?: CadrageDuRenvoi;
  pieceJointe?: PieceJointe;
  ecranSource?: string;
  resoluPar?: readonly string[];
  revelation?: RevelationServie;
  reflexion?: ReflexionServie | null;
}

export interface CoursContent {
  id: string;
  titre: string;
  niveau: string;
  duree: number;
  concepts: readonly string[];
  ecrans: readonly EcranContent[];
}

export interface CoursCatalogue extends CoursContent {
  readonly version: number;
  readonly publieLe: string;
}

export type CorrigePresentateur = CorrigePresentateurResponseDto;

export interface EcranDeroule extends EcranContent {
  readonly notes: string;
  readonly diffusion: Diffusion;
  readonly seuil: number | null;
  readonly corriges: readonly CorrigePresentateur[];
  readonly questions: readonly {
    readonly id: string;
    readonly enonce: string;
    readonly options: readonly { readonly id: string; readonly libelle: string }[] | null;
  }[];
  readonly corrigeEcran: CorrigeEcranPresentateur | null;
  readonly reflexion: ReflexionServie | null;
  readonly explications?: readonly ExplicationServie[];
}

export interface DerouleCours extends Omit<CoursContent, 'ecrans'> {
  readonly ecrans: readonly EcranDeroule[];
}
