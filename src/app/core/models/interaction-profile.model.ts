/** Profil d'interaction collecte durant la navigation dans une presentation. */
export interface InteractionProfile {
  /** Niveau IA auto-evalue par le lecteur */
  aiLevel: "debutant" | "intermediaire" | "avance" | null;
  /** Identifiants des outils deja utilises (coches dans les checklists) */
  toolsAlreadyUsed: string[];
  /** Tranche budgetaire selectionnee */
  budgetTier: "0" | "60" | "120" | null;
  /** Secteur d'activite saisi dans le formulaire demo */
  sector: string | null;
  /** Prompt genere a partir du template de la slide demo */
  generatedPrompt: string | null;
}
