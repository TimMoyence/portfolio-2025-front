import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { PRESENTATION_PORT } from "../../../core/ports/presentation.port";
import { SlideDeckService } from "../../../shared/slides";
import { IaSolopreneursComponent } from "./ia-solopreneurs.component";

describe("IaSolopreneursComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IaSolopreneursComponent],
      providers: [
        SlideDeckService,
        provideRouter([]),
        {
          provide: PRESENTATION_PORT,
          useValue: { getInteractions: () => of([]) },
        },
      ],
    });
  });

  it("rend la slide hero avec le titre attendu", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector("app-slide-hero");
    expect(hero).toBeTruthy();
    expect(hero.textContent).toContain("IA");
  });

  it("rend au moins une slide quiz reliee a PRESENTATION_PORT", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const quiz = fixture.nativeElement.querySelector("app-slide-quiz");
    expect(quiz).toBeTruthy();
  });

  it("rend la slide CTA toolkit en fin de presentation", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const cta = fixture.nativeElement.querySelector("app-slide-cta");
    expect(cta).toBeTruthy();
    expect(cta.textContent.toLowerCase()).toContain("toolkit");
  });
});
