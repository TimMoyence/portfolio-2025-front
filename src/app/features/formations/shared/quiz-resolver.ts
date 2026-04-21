import type {
  QuizInteraction,
  QuizInteractionOption,
} from "../../../shared/models/slide.model";
import type { SupportedLocale } from "./formation-locale.util";
import { selectLocalizedString } from "./formation-locale.util";
import type { QuizQuestion } from "./formation.types";

/**
 * Transforme une `QuizQuestion` (niveau config, labels `I18nString`) en
 * `QuizInteraction` (niveau slide, labels string resolus pour la locale
 * courante). Garantit le contrat de type entre la source editoriale
 * multi-locale et le composant de rendu qui attend du texte brut.
 *
 * Conserve l'identifiant, le champ profil, le kind, les options (avec
 * labels localises) et re-expose la `question` localisee.
 */
export function resolveQuizQuestion(
  question: QuizQuestion,
  locale: SupportedLocale,
  hint?: string,
): QuizInteraction {
  const options: QuizInteractionOption[] | undefined = question.options?.map(
    (opt) => ({
      value: opt.value,
      label: selectLocalizedString(opt.label, locale),
    }),
  );

  return {
    type: "quiz",
    id: question.id,
    question: selectLocalizedString(question.question, locale),
    kind: question.kind,
    profileField: question.profileField,
    ...(hint !== undefined && { hint }),
    ...(options !== undefined && { options }),
  };
}

/**
 * Version batch : resolver de toutes les questions d'un `QuizConfig`.
 * Shortcut ergonomique pour les consumers qui projettent la totalite du
 * quiz vers le slot d'interactions d'une slide.
 */
export function resolveQuizQuestions(
  questions: ReadonlyArray<QuizQuestion>,
  locale: SupportedLocale,
): QuizInteraction[] {
  return questions.map((q) => resolveQuizQuestion(q, locale));
}
