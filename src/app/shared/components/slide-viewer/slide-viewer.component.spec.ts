import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { SlideViewerComponent } from "./slide-viewer.component";
import type { Slide } from "../../models/slide.model";

const TEST_SLIDES: Slide[] = [
  {
    id: "slide-1",
    title: "Premier slide",
    bullets: ["Point A", "Point B"],
    notes: "Notes détaillées du slide 1",
  },
  {
    id: "slide-2",
    title: "Deuxième slide",
    subtitle: "Sous-titre",
    table: {
      headers: ["Col A", "Col B"],
      rows: [["1", "2"]],
    },
  },
  {
    id: "slide-3",
    title: "Slide interactif",
    promptTemplate: {
      label: "Votre secteur",
      placeholder: "ex: Coach sportif",
      template: "Mon secteur : {{sector}}. Génère un pitch.",
    },
  },
];

describe("SlideViewerComponent", () => {
  let component: SlideViewerComponent;
  let fixture: ComponentFixture<SlideViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideViewerComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SlideViewerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("slides", TEST_SLIDES);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("mode scroll (défaut)", () => {
    it("should not be in presentation mode by default", () => {
      expect(component.isPresenting()).toBeFalse();
    });

    it("should render all slides in scroll mode", () => {
      const sections =
        fixture.nativeElement.querySelectorAll("[data-slide-id]");
      expect(sections.length).toBe(3);
    });

    it("should display slide titles", () => {
      const titles =
        fixture.nativeElement.querySelectorAll("[data-slide-title]");
      expect(titles[0].textContent).toContain("Premier slide");
      expect(titles[1].textContent).toContain("Deuxième slide");
    });

    it("should display bullets when present", () => {
      const bullets = fixture.nativeElement.querySelectorAll(
        '[data-slide-id="slide-1"] li',
      );
      expect(bullets.length).toBe(2);
      expect(bullets[0].textContent).toContain("Point A");
    });

    it("should display table when present", () => {
      const table = fixture.nativeElement.querySelector(
        '[data-slide-id="slide-2"] table',
      );
      expect(table).toBeTruthy();
      const headers = table.querySelectorAll("th");
      expect(headers[0].textContent).toContain("Col A");
    });

    it("should toggle notes visibility", () => {
      expect(component.expandedNotes().has(0)).toBeFalse();
      component.toggleNotes(0);
      expect(component.expandedNotes().has(0)).toBeTrue();
      component.toggleNotes(0);
      expect(component.expandedNotes().has(0)).toBeFalse();
    });
  });

  describe("navigation", () => {
    it("should start at slide 0", () => {
      expect(component.currentSlideIndex()).toBe(0);
    });

    it("should advance to next slide", () => {
      component.nextSlide();
      expect(component.currentSlideIndex()).toBe(1);
    });

    it("should go to previous slide", () => {
      component.nextSlide();
      component.prevSlide();
      expect(component.currentSlideIndex()).toBe(0);
    });

    it("should not go below 0", () => {
      component.prevSlide();
      expect(component.currentSlideIndex()).toBe(0);
    });

    it("should not exceed last slide", () => {
      component.nextSlide();
      component.nextSlide();
      component.nextSlide();
      expect(component.currentSlideIndex()).toBe(2);
    });

    it("should go to specific slide", () => {
      component.goToSlide(2);
      expect(component.currentSlideIndex()).toBe(2);
    });

    it("should clamp out-of-bounds goToSlide", () => {
      component.goToSlide(99);
      expect(component.currentSlideIndex()).toBe(2);
    });
  });

  describe("prompt template", () => {
    it("should render prompt form for slide with promptTemplate", () => {
      const form = fixture.nativeElement.querySelector(
        '[data-slide-id="slide-3"] [data-prompt-form]',
      );
      expect(form).toBeTruthy();
    });

    it("should generate prompt with sector replacement", () => {
      component.sectorInput.set("Coach sportif");
      component.generatePrompt(TEST_SLIDES[2].promptTemplate!);
      expect(component.generatedPrompt()).toContain(
        "Mon secteur : Coach sportif.",
      );
    });

    it("should not generate prompt with empty sector", () => {
      component.sectorInput.set("");
      component.generatePrompt(TEST_SLIDES[2].promptTemplate!);
      expect(component.generatedPrompt()).toBe("");
    });
  });
});
