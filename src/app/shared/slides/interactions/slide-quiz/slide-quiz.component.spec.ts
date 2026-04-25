import { Component } from "@angular/core";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import type { PresentationPort } from "../../../../core/ports/presentation.port";
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
  let portStub: PresentationPort;

  beforeEach(() => {
    portStub = {
      getInteractions: jasmine.createSpy("getInteractions").and.returnValue(
        of({
          slug: "ia-solopreneurs",
          interactions: {
            "quiz-intro": {
              scroll: [
                {
                  type: "quiz",
                  question: "Quel est le premier réflexe IA ?",
                  options: ["Délégation", "Automatisation", "Génération"],
                  correctIndex: 1,
                },
              ],
            },
          },
        }),
      ),
    } as unknown as PresentationPort;

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

  it("affiche un message d'erreur si le port échoue", fakeAsync(() => {
    (portStub.getInteractions as jasmine.Spy).and.returnValue(
      throwError(() => new Error("network")),
    );
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector(".slide-quiz__error");
    expect(error).toBeTruthy();
  }));
});
