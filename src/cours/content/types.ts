export type RenderMode = 'stage' | 'hand' | 'board';

export type Role = 'presentateur' | 'etudiant' | 'revision';

export type PacingMode = 'pilote' | 'libre';

export interface FreeRange {
  premier: number;
  dernier: number;
}

export interface EcranContent {
  id: string;
  type: string;
  titre?: string | null;
  duree: number;
  interactif: boolean;
  donnees?: Record<string, unknown>;
}

export type Diffusion = 'catalogue' | 'seance';

export type TypeQuestion = 'numeric' | 'vote' | 'feuille' | 'tableau' | 'classement' | 'enigme';

export type VotePhase = 'vote' | 'discussion' | 'revote' | 'revele';

export type EtatPulse = 'perdu' | 'ca-va' | 'clair';

export interface PilotageEcran {
  readonly phase?: VotePhase;
  readonly revele?: boolean;
  readonly etayage?: number;
}

export interface Tolerance {
  readonly type: 'relative' | 'absolue' | 'decimales';
  readonly valeur: number;
}

export type FormeFormule = 'references' | { readonly memeQue: string };

export type ValeurProduction =
  | {
      readonly type: 'feuille';
      readonly cellules: Readonly<Record<string, string>>;
    }
  | {
      readonly type: 'tableau';
      readonly saisies: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
    }
  | {
      readonly type: 'classement';
      readonly classement: Readonly<Record<string, string>>;
    }
  | {
      readonly type: 'feuille' | 'tableau' | 'classement';
      readonly neSaitPas: true;
    };

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

export interface ConfusionComptee {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

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
  readonly parCle: Readonly<
    Record<string, { readonly total: number; readonly justes: number }>
  > | null;
}

export interface ResultatsSeance {
  readonly participants: number;
  readonly questions: readonly ResultatQuestion[];
  readonly statistiques?: StatistiquesSeance;
}

export interface StatistiquesSeance {
  readonly moyenne: number;
  readonly mediane: number;
  readonly dispersion: number;
  readonly tauxParticipation: number;
  readonly tauxReussite: number;
  readonly questionsProblemes: readonly string[];
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

export interface ResultatsEnDirect extends ResultatsSeance {
  readonly statistiques: StatistiquesSeance;
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
  readonly bareme: ResumeBareme;
}

export type CorrigeEcranPresentateur =
  | {
      readonly type: 'feuille';
      readonly attendus: readonly {
        readonly reference: string;
        readonly formuleReference: string;
        readonly valeur: number;
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
  readonly renvoi?: string;
}

export interface EtatParticipant {
  readonly sessionId: string;
  readonly participantId: string;
  readonly revision: number;
  readonly reponses: readonly {
    readonly questionId: string;
    readonly valeur: number | string | ValeurProduction;
    readonly correcte: boolean;
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
  readonly enigmes: readonly {
    readonly parcoursId: string;
    readonly resolues: readonly {
      readonly enigmeId: string;
      readonly fragment: string;
    }[];
    readonly tentativesRestantes: Readonly<Record<string, number>>;
  }[];
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

export type Modalite = 'solo' | 'binome' | 'groupe' | 'classe';

export type RegimeVerrou = 'ouvert' | 'focus' | 'examen';

export interface MetadonneesBrique {
  readonly concepts: readonly string[];
  readonly misconceptionsCiblees: readonly string[];
  readonly dureeMinutes: number;
  readonly modalite: Modalite;
  readonly regime: RegimeVerrou;
}

const MODALITES: readonly Modalite[] = ['solo', 'binome', 'groupe', 'classe'];
const REGIMES: readonly RegimeVerrou[] = ['ouvert', 'focus', 'examen'];

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
  if (!REGIMES.includes(entree.regime)) {
    throw new Error('Régime de verrou inconnu');
  }
  return entree;
}
