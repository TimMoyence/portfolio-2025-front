import type { ProgressionDesEnigmes } from '../runtime/blocks/retours';
import { estMembre } from '../runtime/core/valeurs';

export type ValeurFormule = number | string | boolean;

export const TYPES_QUESTION = [
  'numeric',
  'vote',
  'feuille',
  'tableau',
  'classement',
  'enigme',
] as const;
export type TypeQuestion = (typeof TYPES_QUESTION)[number];

export type Diffusion = 'catalogue' | 'seance';

export const ETATS_PULSE = ['perdu', 'ca-va', 'clair'] as const;
export type EtatPulse = (typeof ETATS_PULSE)[number];

export const PHASES_DE_VOTE = ['vote', 'discussion', 'revote', 'revele'] as const;
export type VotePhase = (typeof PHASES_DE_VOTE)[number];

export const PACING_MODES = ['pilote', 'libre'] as const;
export type PacingMode = (typeof PACING_MODES)[number];

export interface FreeRange {
  premier: number;
  dernier: number;
}

export const MODALITES = ['solo', 'binome', 'groupe', 'classe'] as const;
export type Modalite = (typeof MODALITES)[number];

export const REGIMES_DE_VERROU = ['ouvert', 'focus', 'examen'] as const;
export type RegimeVerrou = (typeof REGIMES_DE_VERROU)[number];

export const BOITES_DE_REVISION = [1, 2, 3] as const;
export type BoiteDeRevision = (typeof BOITES_DE_REVISION)[number];

export interface MetadonneesBrique {
  readonly concepts: readonly string[];
  readonly misconceptionsCiblees: readonly string[];
  readonly dureeMinutes: number;
  readonly modalite: Modalite;
  readonly regime: RegimeVerrou;
}

export interface Tolerance {
  readonly type: 'relative' | 'absolue' | 'decimales';
  readonly valeur: number;
}

export type FormeFormule = 'references' | { readonly memeQue: string };

export type ValeurProduction =
  | { readonly type: 'feuille'; readonly cellules: Readonly<Record<string, string>> }
  | {
      readonly type: 'tableau';
      readonly saisies: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
    }
  | { readonly type: 'classement'; readonly classement: Readonly<Record<string, string>> }
  | { readonly type: 'feuille' | 'tableau' | 'classement'; readonly neSaitPas: true };

export interface ValeurAffichee {
  readonly valeur: number | null;
  readonly affichage: string;
}

export interface LigneDeMachine {
  readonly valeur: ValeurAffichee;
  readonly resultat: ValeurAffichee;
  readonly courante: boolean;
}

export interface PointDeCourbe {
  readonly x: number;
  readonly y: number | null;
}

export interface SortiesMachine {
  readonly valeurs: Readonly<Record<string, number>>;
  readonly resultat: ValeurAffichee;
  readonly etapes: readonly ValeurAffichee[];
  readonly courbes: Readonly<Record<string, readonly PointDeCourbe[]>>;
  readonly lignes: Readonly<Record<string, readonly LigneDeMachine[]>>;
  readonly phrase: string;
}

export interface TableauEvalue {
  readonly lignes: readonly {
    readonly rang: number;
    readonly valeurs: Readonly<Record<string, ValeurAffichee>>;
  }[];
  readonly totaux: Readonly<Record<string, ValeurAffichee>>;
  readonly synthese: readonly ValeurAffichee[];
  readonly soldeFinal: ValeurAffichee | null;
}

export type NatureDeCellule = 'texte' | 'nombre' | 'logique' | 'erreur';

export interface FeuilleEvaluee {
  readonly saisies: Readonly<Record<string, string>>;
  readonly affichages: Readonly<Record<string, string>>;
  readonly natures: Readonly<Record<string, NatureDeCellule>>;
  readonly formules: readonly string[];
}

export interface ConfusionComptee {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

export interface Decompte {
  readonly total: number;
  readonly justes: number;
}

export type DecomptesParCle = Readonly<Record<string, Decompte>>;

export interface ResultatQuestion {
  readonly questionId: string;
  readonly ecranId: string;
  readonly type: TypeQuestion;
  readonly noteCompte: boolean;
  readonly total: number;
  readonly correctes: number;
  readonly neSaitPas: number;
  readonly confusions: readonly ConfusionComptee[];
  readonly parOption: Readonly<Record<string, number>> | null;
  readonly scoreMoyen: number | null;
  readonly parCle: DecomptesParCle | null;
  readonly confusionDominante: string | null;
  readonly part: number;
  readonly sousLeSeuil: boolean;
  readonly remediation: { readonly confusionId: string; readonly ecranId: string } | null;
}

export interface ResultatsSeance {
  readonly participants: number;
  readonly questions: readonly ResultatQuestion[];
}

export interface StatistiquesSeance {
  readonly moyenne: number;
  readonly mediane: number;
  readonly dispersion: number;
  readonly tauxParticipation: number;
  readonly tauxReussite: number;
  readonly questionsProblemes: readonly string[];
}

export interface ComptesJalon {
  readonly perdu: number;
  readonly 'ca-va': number;
  readonly clair: number;
  readonly total: number;
}

export interface ProgressionEnigme {
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly ouvertes: number;
  readonly resolues: number;
  readonly tentativesMoyennes: number;
  readonly epuisees: number;
}

export interface ResumeBareme {
  readonly questionsNotees: number;
  readonly parType: Readonly<
    Record<TypeQuestion, { readonly notees: number; readonly nonNotees: number }>
  >;
}

export interface RegleDeNotation {
  readonly noteMax: number;
  readonly base: 'participation-relative-cohorte';
  readonly partCohorteReference: number;
  readonly ratioSeuilValidation: number;
  readonly neSaitPasCompteCommeReponse: boolean;
  readonly pointsNonReponse: number;
  readonly reponsesLibresNotees: boolean;
  readonly seuilQuestionProbleme: number;
  readonly decimalesStatistiques: number;
  readonly typesNotables: readonly TypeQuestion[];
  readonly productionCompteSi: 'au-moins-une-saisie';
  readonly statistiquesSurQuestionsNotees: boolean;
}

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

export interface PilotageEcran {
  readonly phase?: VotePhase;
  readonly revele?: boolean;
  readonly etayage?: number;
  readonly etayageAtteint?: number;
  readonly explicationsDevoilees?: number;
  readonly reglages?: Readonly<Record<string, number>>;
  readonly resultatsProjetes?: boolean;
  readonly optionsAffichees?: boolean;
  readonly sortiesProjetees?: SortiesMachine;
  readonly questionAffichee?: string;
  readonly questionOuverte?: string | null;
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

export interface CorrigePresentateur {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly confusions: readonly { readonly id: string; readonly libelle: string }[];
}

export type CorrigeEcranPresentateur =
  | {
      readonly type: 'feuille';
      readonly attendus: readonly {
        readonly reference: string;
        readonly formuleReference: string;
        readonly valeur: ValeurFormule;
        readonly tolerance: Tolerance;
        readonly forme: FormeFormule;
      }[];
    }
  | {
      readonly type: 'tableau';
      readonly attendus: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
      readonly tolerance: Tolerance;
      readonly tableauCorrige: TableauEvalue;
    }
  | {
      readonly type: 'classement';
      readonly attendus: readonly {
        readonly carteId: string;
        readonly categorieId: string;
        readonly justification: string;
      }[];
    }
  | {
      readonly type: 'enigmes';
      readonly enigmes: readonly {
        readonly enigmeId: string;
        readonly solution: string;
        readonly fragment: string;
      }[];
      readonly codeFinal: string;
    }
  | {
      readonly type: 'defi';
      readonly strategies: readonly {
        readonly id: string;
        readonly libelle: string;
        readonly fausse: boolean;
      }[];
    }
  | {
      readonly type: 'revelation';
      readonly titre: string;
      readonly lignes: readonly string[];
    }
  | {
      readonly type: 'reflexion';
      readonly attendu: string;
      readonly suite: string;
    };

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

export interface EtatParticipant {
  readonly sessionId: string;
  readonly participantId: string;
  readonly revision: number;
  readonly reponses: readonly {
    readonly questionId: string;
    readonly valeur: number | string | ValeurProduction;
    readonly correcte: boolean | null;
    readonly score: number | null;
    readonly details:
      | readonly {
          readonly cle: string;
          readonly juste: boolean;
          readonly libelleConfusion: string | null;
        }[]
      | null;
    readonly libelleConfusion: string | null;
  }[];
  readonly reponsesLibres: readonly {
    readonly activityId: string;
    readonly response: string;
  }[];
  readonly jalons: readonly {
    readonly sondageId: string;
    readonly etat: EtatPulse;
  }[];
  readonly enigmes: readonly ProgressionDesEnigmes[];
  readonly defis: readonly {
    readonly defiId: string;
    readonly premiereTentative: string;
  }[];
  readonly rappels: { readonly questionIds: readonly string[] };
}

export interface DerouleCours extends Omit<CoursContent, 'ecrans'> {
  readonly ecrans: readonly EcranDeroule[];
  readonly remediations: Readonly<Record<string, string>>;
}

export function creerMetadonneesBrique(entree: MetadonneesBrique): MetadonneesBrique {
  if (entree.concepts.length === 0) {
    throw new Error('Une brique doit cibler au moins un concept');
  }
  if (!Number.isFinite(entree.dureeMinutes) || entree.dureeMinutes <= 0) {
    throw new Error('La durée annoncée doit être strictement positive');
  }
  if (!estMembre(MODALITES, entree.modalite)) {
    throw new Error('Modalité inconnue');
  }
  if (!estMembre(REGIMES_DE_VERROU, entree.regime)) {
    throw new Error('Régime de verrou inconnu');
  }
  return entree;
}
