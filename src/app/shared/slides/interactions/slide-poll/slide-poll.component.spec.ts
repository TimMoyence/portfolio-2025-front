import { Component } from "@angular/core";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { of } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import { SlidePollComponent } from "./slide-poll.component";

@Component({
  standalone: true,
  imports: [SlidePollComponent],
  template: `<app-slide-poll slug="ia-solopreneurs" interactionId="poll-1" />`,
})
class HostComponent {}

describe("SlidePollComponent", () => {
  beforeEach(() => {
    const portStub = {
      getInteractions: () =>
        of({
          slug: "ia-solopreneurs",
          interactions: {
            "poll-1": {
              present: [
                {
                  type: "poll",
                  question: "Quel outil utilises-tu le plus ?",
                  options: ["ChatGPT", "Claude", "Gemini"],
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

  it("rend la question et les options", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector(".slide-poll__question")
        .textContent.trim(),
    ).toBe("Quel outil utilises-tu le plus ?");
    expect(
      fixture.nativeElement.querySelectorAll(".slide-poll__option").length,
    ).toBe(3);
  }));

  it("incrémente le compteur local après vote", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const opts = fixture.nativeElement.querySelectorAll(".slide-poll__option");
    opts[0].click();
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector(
      ".slide-poll__bar[data-index='0']",
    );
    expect(bar.style.width).toBe("100%");
  }));
});
