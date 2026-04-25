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

  it("rend la 3e colonne Gemini dans la comparaison chat-produire", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? "";
    expect(text).toContain("Gemini");
    expect(text).toContain("Workspace");
  });

  it("rend la 3e colonne n8n dans la comparaison automatiser", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? "";
    expect(text).toContain("n8n");
    expect(text).toContain("self-host");
  });

  it("rend le palier intermediaire 60 euros sur stack-budget", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? "";
    // Palier intermediaire avec mention budget ~60-70 euros
    expect(text).toMatch(/intermédiaire/i);
    expect(text).toContain("Perplexity Pro");
  });

  it("rend la slide outils-detail (table 16 outils) en mode scroll", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector("app-slide-table");
    expect(table).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toBe(16);
  });

  it("masque les slides present-only en mode scroll", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    // En scroll, transition-pratique et one-more-thing sont present-only -> masques
    const transition = root.querySelector('[id="transition-pratique"]');
    const promesse = root.querySelector('[id="promesse"]');
    const oneMore = root.querySelector('[id="one-more-thing"]');
    expect(transition).toBeNull();
    expect(promesse).toBeNull();
    expect(oneMore).toBeNull();
  });

  it("rend les polls accroche, clients et recap-8020", () => {
    const fixture = TestBed.createComponent(IaSolopreneursComponent);
    fixture.detectChanges();
    const polls = fixture.nativeElement.querySelectorAll("app-slide-poll");
    expect(polls.length).toBeGreaterThanOrEqual(3);
  });
});
