import { TestBed } from "@angular/core/testing";
import type { QuizInteraction } from "../../models/slide.model";
import { QuizInteractionComponent } from "./quiz-interaction.component";

/**
 * Couvre les 3 variantes du quiz (single, multi, free-text) et les
 * emissions `valueChanged` correspondantes — le couplage avec
 * `InteractionSlotComponent` y depend directement.
 */
describe("QuizInteractionComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [QuizInteractionComponent] });
  });

  function build(config: QuizInteraction) {
    const fixture = TestBed.createComponent(QuizInteractionComponent);
    fixture.componentRef.setInput("config", config);
    fixture.detectChanges();
    return fixture;
  }

  it("single-choice : emet la valeur selectionnee sur clic", () => {
    const cfg: QuizInteraction = {
      type: "quiz",
      id: "q1",
      kind: "single-choice",
      question: "Quel secteur ?",
      profileField: "sector",
      options: [
        { value: "services", label: "Services" },
        { value: "commerce", label: "Commerce" },
      ],
    };
    const fixture = build(cfg);
    const emitted: (string | string[])[] = [];
    fixture.componentInstance.valueChanged.subscribe((v) => emitted.push(v));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-quiz-option="commerce"]',
    );
    expect(btn).not.toBeNull();
    btn.click();
    fixture.detectChanges();

    expect(emitted).toEqual(["commerce"]);
    expect(fixture.componentInstance.singleValue()).toBe("commerce");
  });

  it("multi-choice : emet le tableau complet a chaque toggle", () => {
    const cfg: QuizInteraction = {
      type: "quiz",
      id: "q2",
      kind: "multi-choice",
      question: "Outils utilises ?",
      profileField: "toolsAlreadyUsed",
      options: [
        { value: "gsc", label: "Google Search Console" },
        { value: "ps", label: "PageSpeed" },
        { value: "ahrefs", label: "Ahrefs" },
      ],
    };
    const fixture = build(cfg);
    const emitted: (string | string[])[] = [];
    fixture.componentInstance.valueChanged.subscribe((v) => emitted.push(v));

    const gsc: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-quiz-option="gsc"]',
    );
    const ps: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-quiz-option="ps"]',
    );
    gsc.click();
    ps.click();
    fixture.detectChanges();

    expect(emitted.length).toBe(2);
    expect(emitted[0]).toEqual(["gsc"]);
    expect(emitted[1]).toEqual(["gsc", "ps"]);
  });

  it("multi-choice : uncheck retire la valeur du tableau", () => {
    const cfg: QuizInteraction = {
      type: "quiz",
      id: "q3",
      kind: "multi-choice",
      question: "Q ?",
      profileField: "x",
      options: [{ value: "a", label: "A" }],
    };
    const fixture = build(cfg);
    const check: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-quiz-option="a"]',
    );
    check.click();
    fixture.detectChanges();
    check.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.multiValues().size).toBe(0);
  });

  it("free-text : emet la valeur sur saisie", () => {
    const cfg: QuizInteraction = {
      type: "quiz",
      id: "q4",
      kind: "free-text",
      question: "Quel est votre defi SEO ?",
      profileField: "challenge",
      placeholder: "Ex: mon site n'est pas indexe",
    };
    const fixture = build(cfg);
    const emitted: (string | string[])[] = [];
    fixture.componentInstance.valueChanged.subscribe((v) => emitted.push(v));

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector(
      "[data-quiz-free-text]",
    );
    textarea.value = "pas indexe";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    expect(emitted).toEqual(["pas indexe"]);
  });

  it("hasSelection reflete l'etat initial (false) puis apres choix (true)", () => {
    const cfg: QuizInteraction = {
      type: "quiz",
      id: "q5",
      kind: "single-choice",
      question: "Q ?",
      profileField: "x",
      options: [{ value: "a", label: "A" }],
    };
    const fixture = build(cfg);
    expect(fixture.componentInstance.hasSelection()).toBeFalse();
    fixture.componentInstance.selectSingle("a");
    expect(fixture.componentInstance.hasSelection()).toBeTrue();
  });
});
