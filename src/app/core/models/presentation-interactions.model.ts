// ── Interactions mode Present (présentateur clique, audience regarde l'écran) ──

/** Sondage à main levée — le présentateur clique pour compter les votes */
export interface PollInteraction {
  type: "poll";
  question: string;
  options: string[];
  /** Autorise la sélection de plusieurs options (défaut: false) */
  multiSelect?: boolean;
}

/** Compte à rebours — pause dramatique avant de continuer */
export interface CountdownInteraction {
  type: "countdown";
  label: string;
  durationSeconds: number;
}

export type PresentInteraction = PollInteraction | CountdownInteraction;

// ── Interactions mode Scroll (le lecteur interagit seul, à son rythme) ──

/** Question ouverte introspective */
export interface ReflectionInteraction {
  type: "reflection";
  question: string;
  placeholder: string;
  rows?: number;
}

/** Checklist interactive — "lesquels utilisez-vous deja ?" */
export interface ChecklistInteraction {
  type: "checklist";
  question: string;
  items: string[];
  /** Sous-titre explicatif affiché sous la question */
  hint?: string;
  /** Champ du profil d'interaction a alimenter avec les items coches */
  profileField?: string;
}

/** Échelle d'auto-évaluation (slider ou radio) */
export interface SelfRatingInteraction {
  type: "self-rating";
  question: string;
  min: number;
  max: number;
  labels: { min: string; max: string };
  /** Sous-titre explicatif affiché sous la question */
  hint?: string;
  /** Champ du profil d'interaction a alimenter avec la valeur selectionnee */
  profileField?: string;
}

/**
 * Option d'une question de quiz a choix. Le label est deja localise
 * (chaine prete a afficher) contrairement a `QuizQuestion` dans
 * `formation.types.ts` qui travaille avec des `I18nString` au niveau
 * config. Les slides consomment le label deja resolu.
 */
export interface QuizInteractionOption {
  /** Valeur stable stockee dans le profil d'interaction. */
  value: string;
  /** Libelle localise affiche dans le selecteur. */
  label: string;
}

/**
 * Question de quiz integree dans un slide. Sert a personnaliser le
 * toolkit genere en aval (secteur, budget, niveau IA, etc.). La valeur
 * selectionnee est injectee dans `InteractionCollectorService.profile`
 * sous la cle `profileField`.
 *
 * Trois variantes :
 * - `single-choice` : une seule option active (radio / select).
 * - `multi-choice` : plusieurs options cumulables (checkbox).
 * - `free-text` : champ texte libre (pas d'options).
 */
export interface QuizInteraction {
  type: "quiz";
  /** Identifiant unique au sein de la slide — sert de cle analytics. */
  id: string;
  question: string;
  kind: "single-choice" | "multi-choice" | "free-text";
  /** Sous-titre explicatif affiché sous la question */
  hint?: string;
  /** Options (obligatoires pour single/multi-choice, absentes en free-text). */
  options?: QuizInteractionOption[];
  /** Champ du profil d'interaction alimenté par la réponse. */
  profileField: string;
  /** Placeholder pour la variante `free-text`. */
  placeholder?: string;
}

export type ScrollInteraction =
  | ReflectionInteraction
  | ChecklistInteraction
  | SelfRatingInteraction
  | QuizInteraction;

/** Interactions par mode, servies par le backend et attachées à chaque slide */
export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}
