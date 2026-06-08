import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { PRESENTATION_PORT } from "../../../core/ports/presentation.port";
import { SlideDeckService } from "../../../shared/slides";
import { createPresentationPortStub } from "../../../../testing/factories/presentation.factory";
import { AutomatiserAvecIaComponent } from "./automatiser-avec-ia.component";

describe("AutomatiserAvecIaComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AutomatiserAvecIaComponent],
      providers: [
        SlideDeckService,
        provideRouter([]),
        {
          provide: PRESENTATION_PORT,
          useValue: createPresentationPortStub(),
        },
      ],
    });
  });

  it("rend la slide hero", () => {
    const fixture = TestBed.createComponent(AutomatiserAvecIaComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("app-slide-hero")).toBeTruthy();
  });

  it("rend une slide CTA toolkit", () => {
    const fixture = TestBed.createComponent(AutomatiserAvecIaComponent);
    fixture.detectChanges();
    const cta = fixture.nativeElement.querySelector("app-slide-cta");
    expect(cta).toBeTruthy();
  });
});
