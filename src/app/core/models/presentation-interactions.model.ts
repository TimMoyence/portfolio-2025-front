interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

interface ReflectionInteraction {
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
interface QuizInteractionOption {
  value: string;
  label: string;
}

interface QuizInteraction {
  type: 'quiz';
  id: string;
  question: string;
  kind: 'single-choice' | 'multi-choice' | 'free-text';
  hint?: string;
  options?: QuizInteractionOption[];
  profileField: string;
  placeholder?: string;
}

export type ScrollInteraction = ReflectionInteraction | QuizInteraction;

export interface SlideInteractions {
  present?: PollInteraction[];
  scroll?: ScrollInteraction[];
}
