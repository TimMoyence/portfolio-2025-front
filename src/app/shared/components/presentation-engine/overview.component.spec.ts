import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { Component, PLATFORM_ID, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { buildPresentationDeck } from "../../../../testing/factories/slide.factory";
import type { PresentationSlide } from "../../models/slide.model";
import type { OverviewActGroup } from "./overview.component";
import { OverviewComponent } from "./overview.component";

/**
 * Composant hote pour tester l'OverviewComponent avec ses inputs/outputs.
 */
@Component({
  standalone: true,
  imports: [OverviewComponent],
  template: `
    <app-overview
      [acts]="acts()"
      [slides]="slides()"
      [currentIndex]="currentIndex()"
      (selectSlide)="selectedIndex.set($event)"
      (closeOverview)="closed.set(true)"
    />
  `,
})
class TestHostComponent {
  readonly slides = signal<PresentationSlide[]>([]);
  readonly acts = signal<OverviewActGroup[]>([]);
  readonly currentIndex = signal(0);
  readonly selectedIndex = signal<number | null>(null);
  readonly closed = signal(false);
}

/**
 * Regroupe les slides par acte (meme logique que PresentationEngineComponent).
 */
function groupByAct(slides: PresentationSlide[]): OverviewActGroup[] {
  const grouped = new Map<string, PresentationSlide[]>();
  for (const slide of slides) {
    const actId = slide.act.id;
    if (!grouped.has(actId)) {
      grouped.set(actId, []);
    }
    grouped.get(actId)!.push(slide);
  }
  return Array.from(grouped.entries()).map(([, groupSlides]) => ({
    act: groupSlides[0].act,
    slides: groupSlides,
  }));
}

describe("OverviewComponent", () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let deck: PresentationSlide[];

  beforeEach(async () => {
    deck = buildPresentationDeck();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    host.slides.set(deck);
    host.acts.set(groupByAct(deck));
    host.currentIndex.set(0);
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
  });

  it("devrait afficher une colonne par acte (3 colonnes)", () => {
    const columns = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-act-column"]',
    );
    expect(columns.length).toBe(3);
  });

  it("devrait afficher tous les titres de slides dans chaque colonne (2/4/4)", () => {
    const columns = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-act-column"]',
    );

    const buttonsPerColumn = Array.from(columns).map(
      (col) =>
        (col as HTMLElement).querySelectorAll(
          '[data-testid="overview-slide-button"]',
        ).length,
    );
    // act-conclusion a 4 slides dans le deck brut (deck-7, deck-8, deck-9, deck-10)
    expect(buttonsPerColumn).toEqual([2, 4, 4]);
  });

  it("devrait mettre en surbrillance la slide courante (border-scheme-accent + aria-current)", () => {
    host.currentIndex.set(2);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-slide-button"]',
    );
    const highlightedBtn = buttons[2] as HTMLElement;
    expect(highlightedBtn.classList).toContain("border-scheme-accent");
    expect(highlightedBtn.getAttribute("aria-current")).toBe("true");

    // Les autres ne doivent pas etre en surbrillance
    const otherBtn = buttons[0] as HTMLElement;
    expect(otherBtn.classList).not.toContain("border-scheme-accent");
    expect(otherBtn.getAttribute("aria-current")).toBeNull();
  });

  it("devrait emettre selectSlide avec l'index global au click sur une miniature", () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-slide-button"]',
    );
    // Cliquer sur la 4eme miniature (index global 3)
    (buttons[3] as HTMLElement).click();
    fixture.detectChanges();

    expect(host.selectedIndex()).toBe(3);
  });

  it("devrait emettre close au click sur le bouton fermer", () => {
    const closeBtn = fixture.nativeElement.querySelector(
      '[data-testid="overview-close"]',
    );
    closeBtn.click();
    fixture.detectChanges();

    expect(host.closed()).toBe(true);
  });

  it("devrait emettre close quand Escape est presse", () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    fixture.detectChanges();

    expect(host.closed()).toBe(true);
  });

  it("devrait afficher le label de l'acte au dessus de chaque colonne", () => {
    const labels = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-act-label"]',
    );
    expect(labels.length).toBe(3);
    expect((labels[0] as HTMLElement).textContent?.trim()).toBe("Introduction");
    expect((labels[1] as HTMLElement).textContent?.trim()).toBe(
      "Contenu principal",
    );
    expect((labels[2] as HTMLElement).textContent?.trim()).toBe("Conclusion");
  });

  it("devrait afficher le numero de slide (1-based) sur chaque miniature", () => {
    const numbers = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-slide-number"]',
    );
    // Deck brut : 10 slides (deck-1 a deck-10)
    expect(numbers.length).toBe(10);

    const values = Array.from(numbers).map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );
    expect(values).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  });

  it("devrait afficher le layout de chaque slide en badge", () => {
    const layouts = fixture.nativeElement.querySelectorAll(
      '[data-testid="overview-slide-layout"]',
    );
    // Deck brut : 10 slides avec layout defini
    expect(layouts.length).toBe(10);

    const values = Array.from(layouts).map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );
    expect(values).toEqual([
      "hero",
      "split",
      "stats",
      "comparison",
      "demo",
      "quote",
      "cta",
      "split",
      "hero", // deck-9 (presentOnly)
      "split", // deck-10 (scrollOnly)
    ]);
  });
});
