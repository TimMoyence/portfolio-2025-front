import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { PRESENTATION_PORT } from "../../core/ports/presentation.port";
import { SlideDeckService } from "../../shared/slides";
import { SlidesLibraryComponent } from "./slides-library.component";

describe("SlidesLibraryComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SlidesLibraryComponent],
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

  it("rend au moins un echantillon de chaque layout", () => {
    const fixture = TestBed.createComponent(SlidesLibraryComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector("app-slide-hero")).toBeTruthy();
    expect(root.querySelector("app-slide-image-left")).toBeTruthy();
    expect(root.querySelector("app-slide-image-right")).toBeTruthy();
    expect(root.querySelector("app-slide-video")).toBeTruthy();
    expect(root.querySelector("app-slide-stats")).toBeTruthy();
    expect(root.querySelector("app-slide-quote")).toBeTruthy();
    expect(root.querySelector("app-slide-comparison")).toBeTruthy();
    expect(root.querySelector("app-slide-grid")).toBeTruthy();
    expect(root.querySelector("app-slide-cta")).toBeTruthy();
  });
});
