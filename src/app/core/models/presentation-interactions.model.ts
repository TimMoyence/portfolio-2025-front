// ── Interactions mode Present (présentateur clique, audience regarde l'écran) ──

/** Sondage à main levée — le présentateur clique pour compter les votes */
export interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  /** Autorise la sélection de plusieurs options (défaut: false) */
  multiSelect?: boolean;
}

/**
 * Interactions servies dans le bucket `present`. Le sondage est aujourd'hui la
 * seule variante disposant d'un composant de rendu (`slide-poll`) : l'alias
 * reste nommé pour que `SlideInteractions.present` garde un point d'extension
 * si une seconde variante réapparaît.
 */
export type PresentInteraction = PollInteraction;

// ── Interactions mode Scroll (le lecteur interagit seul, à son rythme) ──

/** Question ouverte introspective */
export interface ReflectionInteraction {
  type: 'reflection';
  question: string;
  placeholder: string;
  rows?: number;
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
  type: 'quiz';
  /** Identifiant unique au sein de la slide — sert de cle analytics. */
  id: string;
  question: string;
  kind: 'single-choice' | 'multi-choice' | 'free-text';
  /** Sous-titre explicatif affiché sous la question */
  hint?: string;
  /** Options (obligatoires pour single/multi-choice, absentes en free-text). */
  options?: QuizInteractionOption[];
  /** Champ du profil d'interaction alimenté par la réponse. */
  profileField: string;
  /** Placeholder pour la variante `free-text`. */
  placeholder?: string;
}

/**
 * Interactions servies dans le bucket `scroll` — une variante par composant de
 * rendu vivant (`slide-reflection`, `slide-quiz`).
 */
export type ScrollInteraction = ReflectionInteraction | QuizInteraction;

/** Interactions par mode, servies par le backend et attachées à chaque slide */
export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}
