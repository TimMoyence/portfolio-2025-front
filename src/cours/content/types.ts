import type { ProgressionDesEnigmes } from '../runtime/blocks/retours';
import {
  MODALITES,
  REGIMES_DE_VERROU,
  type Diffusion,
  type EtatPulse,
  type FormeFormule,
  type MetadonneesBrique,
  type ResultatsSeance as ResultatsSeanceServis,
  type StatistiquesSeance,
  type Tolerance,
  type ValeurProduction,
  type VotePhase,
} from 'portfolio-2025-partage/contrats';
import type { ValeurFormule } from 'portfolio-2025-partage/formule';

export type {
  ComptesJalon,
  ConfusionComptee,
  Decompte,
  DecomptesParCle,
  Diffusion,
  EtatPulse,
  FormeFormule,
  FreeRange,
  MetadonneesBrique,
  Modalite,
  PacingMode,
  ProgressionEnigme,
  RegimeVerrou,
  ResultatQuestion,
  ResultatsEnDirect,
  StatistiquesSeance,
  Tolerance,
  TypeQuestion,
  ValeurProduction,
  VotePhase,
} from 'portfolio-2025-partage/contrats';
export type { ResumeBareme } from 'portfolio-2025-partage/contrats';

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

export interface RevelationServie {
  readonly ecranId: string;
  readonly questions: readonly QuestionRevelee[];
  readonly annexe: CorrigeEcranPresentateur | null;
  readonly reflexion: { readonly attendu: string; readonly suite: string | null } | null;
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

export interface ResultatsSeance extends ResultatsSeanceServis {
  readonly statistiques?: StatistiquesSeance;
}

export interface CorrigePresentateur {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly confusions: readonly { readonly id: string; readonly libelle: string }[];
}

export interface GuideFormateur {
  readonly aDire?: string;
  readonly question?: string;
  readonly reponse?: string;
  readonly calcul?: string;
  readonly relance?: string;
  readonly transition?: string;
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
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'tableau';
      readonly attendus: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
      readonly tolerance: Tolerance;
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'classement';
      readonly attendus: readonly {
        readonly carteId: string;
        readonly categorieId: string;
        readonly justification: string;
      }[];
      readonly seuilReussite: number;
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
  readonly guide?: GuideFormateur;
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
  if (!MODALITES.includes(entree.modalite)) {
    throw new Error('Modalité inconnue');
  }
  if (!REGIMES_DE_VERROU.includes(entree.regime)) {
    throw new Error('Régime de verrou inconnu');
  }
  return entree;
}
