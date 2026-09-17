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
  duree: number;
  interactif: boolean;
  donnees?: Record<string, unknown>;
}

export interface CoursContent {
  id: string;
  titre: string;
  niveau: string;
  duree: number;
  concepts: readonly string[];
  ecrans: readonly EcranContent[];
}

export interface ConfusionComptee {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

export interface ResultatQuestion {
  readonly questionId: string;
  readonly total: number;
  readonly correctes: number;
  readonly neSaitPas: number;
  readonly confusions: readonly ConfusionComptee[];
}

export interface ResultatsSeance {
  readonly participants: number;
  readonly questions: readonly ResultatQuestion[];
}

export interface CorrigePresentateur {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly confusions: readonly { readonly id: string; readonly libelle: string }[];
}

export interface GuideFormateur {
  readonly objectif?: string;
  readonly reponseAttendue?: string;
  readonly erreursTypiques?: readonly string[];
  readonly relance?: string;
  readonly transition?: string;
}

export interface EcranDeroule extends EcranContent {
  readonly notes: string;
  readonly seuil: number | null;
  readonly corriges: readonly CorrigePresentateur[];
  readonly guide?: GuideFormateur;
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
