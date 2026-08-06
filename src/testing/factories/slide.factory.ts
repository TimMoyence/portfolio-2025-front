import type {
  ChecklistInteraction,
  PollInteraction,
  PromptBuilderInteraction,
  ReflectionInteraction,
  SelfRatingInteraction,
} from "../../app/shared/models/slide.model";

/**
 * Construit un PollInteraction avec des valeurs par defaut.
 */
export function buildPollInteraction(
  overrides?: Partial<PollInteraction>,
): PollInteraction {
  return {
    type: "poll",
    question: "Qui utilise deja l'IA ?",
    options: ["Oui", "Non", "Je ne sais pas"],
    ...overrides,
  };
}

/**
 * Construit un ReflectionInteraction avec des valeurs par defaut.
 */
export function buildReflectionInteraction(
  overrides?: Partial<ReflectionInteraction>,
): ReflectionInteraction {
  return {
    type: "reflection",
    question: "Comment cela s'applique-t-il a votre activite ?",
    placeholder: "Decrivez votre situation...",
    ...overrides,
  };
}

/**
 * Construit un ChecklistInteraction avec des valeurs par defaut.
 */
export function buildChecklistInteraction(
  overrides?: Partial<ChecklistInteraction>,
): ChecklistInteraction {
  return {
    type: "checklist",
    question: "Lesquels utilisez-vous deja ?",
    items: ["ChatGPT", "Claude", "Gemini"],
    ...overrides,
  };
}

/**
 * Construit un SelfRatingInteraction avec des valeurs par defaut.
 */
export function buildSelfRatingInteraction(
  overrides?: Partial<SelfRatingInteraction>,
): SelfRatingInteraction {
  return {
    type: "self-rating",
    question: "Ou en etes-vous ?",
    min: 1,
    max: 5,
    labels: { min: "Debutant", max: "Expert" },
    ...overrides,
  };
}

/**
 * Construit un PromptBuilderInteraction avec des valeurs par defaut.
 */
export function buildPromptBuilderInteraction(
  overrides?: Partial<PromptBuilderInteraction>,
): PromptBuilderInteraction {
  return {
    type: "prompt-builder",
    context: "Newsletter hebdo IA — 30 min de veille pour 1 article",
    promptTemplate: "Tu es expert {{sector}}. Redige un resume.",
    placeholder: "Ex: SaaS B2B",
    ...overrides,
  };
}
