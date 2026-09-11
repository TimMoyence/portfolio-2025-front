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
