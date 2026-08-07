export interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

/**
 * Interactions servies dans le bucket `present`. Le sondage est aujourd'hui la
 * seule variante disposant d'un composant de rendu (`slide-poll`) : l'alias
 * reste nommé pour que `SlideInteractions.present` garde un point d'extension
 * si une seconde variante réapparaît.
 */
export type PresentInteraction = PollInteraction;

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
  value: string;
  label: string;
}

/**
 * Question de quiz integree dans un slide. Sert a personnaliser le
 * toolkit genere en aval (secteur, budget, niveau IA, etc.). La valeur
 * selectionnee est injectee dans `InteractionCollectorService.profile`
 * sous la cle `profileField`.
 */
export interface QuizInteraction {
  type: 'quiz';
  id: string;
  question: string;
  kind: 'single-choice' | 'multi-choice' | 'free-text';
  hint?: string;
  /** Options (obligatoires pour single/multi-choice, absentes en free-text). */
  options?: QuizInteractionOption[];
  profileField: string;
  placeholder?: string;
}

export type ScrollInteraction = ReflectionInteraction | QuizInteraction;

export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}
