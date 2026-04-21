import type { QuizQuestion } from "./formation.types";
import { resolveQuizQuestion, resolveQuizQuestions } from "./quiz-resolver";

describe("quiz-resolver", () => {
  const singleChoice: QuizQuestion = {
    id: "q-secteur",
    question: { fr: "Quel secteur ?", en: "Which sector?" },
    kind: "single-choice",
    profileField: "sector",
    options: [
      {
        value: "services",
        label: { fr: "Services", en: "Services" },
      },
      {
        value: "artisan",
        label: { fr: "Artisanat", en: "Crafts" },
      },
    ],
  };

  const freeText: QuizQuestion = {
    id: "q-libre",
    question: { fr: "Votre defi ?", en: "Your challenge?" },
    kind: "free-text",
    profileField: "challenge",
  };

  it("resout la question dans la locale demandee", () => {
    const fr = resolveQuizQuestion(singleChoice, "fr");
    expect(fr.question).toBe("Quel secteur ?");

    const en = resolveQuizQuestion(singleChoice, "en");
    expect(en.question).toBe("Which sector?");
  });

  it("projette les options I18nString vers des labels string", () => {
    const en = resolveQuizQuestion(singleChoice, "en");
    expect(en.options).toEqual([
      { value: "services", label: "Services" },
      { value: "artisan", label: "Crafts" },
    ]);
  });

  it("preserve id, kind et profileField sans mutation", () => {
    const out = resolveQuizQuestion(singleChoice, "fr");
    expect(out.id).toBe(singleChoice.id);
    expect(out.kind).toBe("single-choice");
    expect(out.profileField).toBe("sector");
    expect(out.type).toBe("quiz");
  });

  it("laisse options undefined quand la question est free-text", () => {
    const out = resolveQuizQuestion(freeText, "fr");
    expect(out.options).toBeUndefined();
  });

  it("resoudre le batch complet d'un QuizConfig", () => {
    const result = resolveQuizQuestions([singleChoice, freeText], "en");
    expect(result.length).toBe(2);
    expect(result[0].question).toBe("Which sector?");
    expect(result[1].question).toBe("Your challenge?");
  });

  it("ne mute pas la QuizQuestion source (immutabilite)", () => {
    const before = JSON.stringify(singleChoice);
    resolveQuizQuestion(singleChoice, "en");
    expect(JSON.stringify(singleChoice)).toBe(before);
  });
});
