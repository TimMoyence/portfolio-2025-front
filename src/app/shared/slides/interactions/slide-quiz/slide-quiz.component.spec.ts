import { Component } from "@angular/core";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { throwError } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import type { PresentationPort } from "../../../../core/ports/presentation.port";
import type { ScrollInteraction } from "../../../../core/models/presentation-interactions.model";
import {
  buildInteractionsResponse,
  createPresentationPortStub,
} from "../../../../../testing/factories/presentation.factory";
import { SlideQuizComponent } from "./slide-quiz.component";

@Component({
  standalone: true,
  imports: [SlideQuizComponent],
  template: `
    <app-slide-quiz slug="ia-solopreneurs" interactionId="quiz-intro" />
  `,
})
class HostComponent {}

describe("SlideQuizComponent", () => {
  let portStub: jasmine.SpyObj<PresentationPort>;

  beforeEach(() => {
    // `SlideQuizComponent` consomme une shape de quiz « connaissance »
    // (options: string[], correctIndex) distincte du contrat de profilage
    // `QuizInteraction`. Le port aplatit la reponse en `unknown`, donc ce
    // payload legacy reste valide a l'execution ; on le caste localement
    // pour satisfaire le typage strict de `SlideInteractions`.
    const scroll = [
      {
        type: "quiz",
        question: "Quel est le premier réflexe IA ?",
        options: ["Délégation", "Automatisation", "Génération"],
        correctIndex: 1,
      },
    ] as unknown as ScrollInteraction[];

    portStub = createPresentationPortStub(
      buildInteractionsResponse({
        interactions: {
          "quiz-intro": { scroll },
        },
      }),
    );

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PRESENTATION_PORT, useValue: portStub }],
    });
  });

  it("appelle PRESENTATION_PORT.getInteractions avec le slug", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(portStub.getInteractions).toHaveBeenCalledWith("ia-solopreneurs");
  }));

  it("rend la question et les options", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const question = fixture.nativeElement.querySelector(
      ".slide-quiz__question",
    );
    expect(question.textContent).toContain("premier réflexe IA");
    const options = fixture.nativeElement.querySelectorAll(
      ".slide-quiz__option",
    );
    expect(options.length).toBe(3);
  }));

  it("affiche feedback correct quand bonne réponse sélectionnée", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll(
      ".slide-quiz__option",
    );
    options[1].click();
    fixture.detectChanges();
    const feedback = fixture.nativeElement.querySelector(
      ".slide-quiz__feedback",
    );
    expect(feedback.classList).toContain("is-correct");
  }));

  it("affiche feedback incorrect quand mauvaise réponse", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll(
      ".slide-quiz__option",
    );
    options[0].click();
    fixture.detectChanges();
    const feedback = fixture.nativeElement.querySelector(
      ".slide-quiz__feedback",
    );
    expect(feedback.classList).toContain("is-incorrect");
  }));

  it("ne rend rien si le port échoue (degradation gracieuse)", fakeAsync(() => {
    portStub.getInteractions.and.returnValue(
      throwError(() => new Error("network")),
    );
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-quiz");
    expect(root).toBeNull();
  }));
});
