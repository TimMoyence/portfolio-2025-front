import { Component } from "@angular/core";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { of } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import { SlideReflectionComponent } from "./slide-reflection.component";

@Component({
  standalone: true,
  imports: [SlideReflectionComponent],
  template: `
    <app-slide-reflection slug="ia-solopreneurs" interactionId="reflect-1" />
  `,
})
class HostComponent {}

describe("SlideReflectionComponent", () => {
  beforeEach(() => {
    const portStub = {
      getInteractions: () =>
        of({
          slug: "ia-solopreneurs",
          interactions: {
            "reflect-1": {
              scroll: [
                {
                  type: "reflection",
                  question: "Quelle tâche aimerais-tu déléguer à une IA ?",
                  placeholder: "Ex: relances email",
                },
              ],
            },
          },
        }),
    };
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PRESENTATION_PORT, useValue: portStub }],
    });
  });

  it("rend prompt et textarea", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".slide-reflection__prompt")
        .textContent,
    ).toContain("Quelle tâche");
    expect(fixture.nativeElement.querySelector("textarea")).toBeTruthy();
  }));

  it("affiche un message de validation après save", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const ta = fixture.nativeElement.querySelector("textarea");
    ta.value = "déléguer support";
    ta.dispatchEvent(new Event("input"));
    fixture.nativeElement.querySelector(".slide-reflection__save").click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".slide-reflection__saved"),
    ).toBeTruthy();
  }));
});
