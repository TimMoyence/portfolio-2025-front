import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { Act, PresentationSlide } from "../../models/slide.model";
import { buildPresentationDeck } from "../../../../testing/factories/slide.factory";
import {
  PresenterBarActGroup,
  PresenterBarComponent,
} from "./presenter-bar.component";

/**
 * Regroupe un deck en ActGroup contigus (meme algorithme que le parent
 * PresentationEngineComponent). Isole dans le spec pour eviter d'importer
 * le parent et garder les tests purement unitaires.
 */
function groupByAct(slides: PresentationSlide[]): PresenterBarActGroup[] {
  const grouped = new Map<string, PresentationSlide[]>();
  for (const slide of slides) {
    const id = slide.act.id;
    if (!grouped.has(id)) {
      grouped.set(id, []);
    }
    grouped.get(id)!.push(slide);
  }
  return Array.from(grouped.entries()).map(([, groupSlides]) => ({
    act: groupSlides[0].act,
    slides: groupSlides,
  }));
}

describe("PresenterBarComponent", () => {
  let component: PresenterBarComponent;
  let fixture: ComponentFixture<PresenterBarComponent>;
  let deck: PresentationSlide[];
  let acts: PresenterBarActGroup[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresenterBarComponent],
      // `provideHttpClient` est requis par `SvgIconComponent` pour charger
      // les icones chevron-left et chevron-right depuis assets/icons.
      providers: [provideHttpClient()],
    }).compileComponents();

    deck = buildPresentationDeck();
    acts = groupByAct(deck);

    fixture = TestBed.createComponent(PresenterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("slides", deck);
    fixture.componentRef.setInput("acts", acts);
    fixture.componentRef.setInput("currentIndex", 0);
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher tous les actes dans la barre horizontale", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("ul.md\\:flex button");
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent?.trim()).toBe("Introduction");
    expect(buttons[1].textContent?.trim()).toBe("Contenu principal");
    expect(buttons[2].textContent?.trim()).toBe("Conclusion");
  });

  it("devrait mettre en surbrillance l'acte courant", () => {
    // currentIndex=0 → deck-1 → acte-intro
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("ul.md\\:flex button");
    expect(buttons[0].getAttribute("aria-current")).toBe("location");
    expect(buttons[1].getAttribute("aria-current")).toBeNull();
    expect(buttons[2].getAttribute("aria-current")).toBeNull();
    expect(buttons[0].className).toContain("bg-scheme-accent");

    // On passe a la slide 2 (deck-3 → acte-main)
    fixture.componentRef.setInput("currentIndex", 2);
    fixture.detectChanges();

    const buttonsAfter: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("ul.md\\:flex button");
    expect(buttonsAfter[0].getAttribute("aria-current")).toBeNull();
    expect(buttonsAfter[1].getAttribute("aria-current")).toBe("location");
    expect(buttonsAfter[2].getAttribute("aria-current")).toBeNull();
  });

  it("devrait afficher les dots uniquement pour les slides de l'acte courant", () => {
    // acte-intro a 2 slides
    let dots: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("ul:not(.md\\:flex) button");
    expect(dots.length).toBe(2);

    // acte-main a 4 slides
    fixture.componentRef.setInput("currentIndex", 2);
    fixture.detectChanges();
    dots = fixture.nativeElement.querySelectorAll("ul:not(.md\\:flex) button");
    expect(dots.length).toBe(4);

    // acte-conclusion a 4 slides dans le deck brut (deck-7, deck-8, deck-9, deck-10)
    fixture.componentRef.setInput("currentIndex", 6);
    fixture.detectChanges();
    dots = fixture.nativeElement.querySelectorAll("ul:not(.md\\:flex) button");
    expect(dots.length).toBe(4);
  });

  it("devrait emettre goToSlide avec l'index global au click sur un dot", () => {
    // Place sur la slide 2 (deck-3, premiere de acte-main, index global 2)
    fixture.componentRef.setInput("currentIndex", 2);
    fixture.detectChanges();

    const emitted: number[] = [];
    component.goToSlide.subscribe((index) => emitted.push(index));

    const dots: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("ul:not(.md\\:flex) button");
    // Le 3e dot de acte-main correspond a deck-5 (index global 4)
    dots[2].click();
    expect(emitted).toEqual([4]);
  });

  it("devrait emettre goToAct au click sur un segment d'acte", () => {
    const emitted: string[] = [];
    component.goToAct.subscribe((id) => emitted.push(id));

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("ul.md\\:flex button");
    buttons[1].click();
    expect(emitted).toEqual(["act-main"]);

    buttons[2].click();
    expect(emitted).toEqual(["act-main", "act-conclusion"]);
  });

  it("devrait emettre next au click sur le bouton suivant", () => {
    let nextCount = 0;
    component.next.subscribe(() => nextCount++);

    const nextBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Slide suivante"]',
    ) as HTMLButtonElement;
    nextBtn.click();
    expect(nextCount).toBe(1);
  });

  it("devrait emettre prev au click sur le bouton precedent", () => {
    fixture.componentRef.setInput("currentIndex", 3);
    fixture.detectChanges();

    let prevCount = 0;
    component.prev.subscribe(() => prevCount++);

    const prevBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Slide précédente"]',
    ) as HTMLButtonElement;
    prevBtn.click();
    expect(prevCount).toBe(1);
  });

  it("devrait desactiver le bouton precedent sur la premiere slide", () => {
    const prevBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Slide précédente"]',
    ) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(component.isFirst()).toBe(true);
  });

  it("devrait desactiver le bouton suivant sur la derniere slide", () => {
    fixture.componentRef.setInput("currentIndex", deck.length - 1);
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Slide suivante"]',
    ) as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
    expect(component.isLast()).toBe(true);
  });

  it("devrait afficher la position dans l'acte (ex: 2/4 sur la 2e slide d'un acte de 4)", () => {
    // acte-main contient deck-3, deck-4, deck-5, deck-6 (index globaux 2..5)
    // Place sur deck-4 (index 3) → position 2 dans un acte de 4
    fixture.componentRef.setInput("currentIndex", 3);
    fixture.detectChanges();

    expect(component.positionInAct()).toBe(2);
    expect(component.currentActSlides().length).toBe(4);

    const counter = fixture.nativeElement.querySelector(
      '[aria-live="polite"]',
    ) as HTMLElement;
    expect(counter.textContent?.replace(/\s+/g, " ").trim()).toContain(
      "Slide 2/4",
    );
  });

  it("firstSlideIndexOfAct devrait retourner l'index global correct", () => {
    expect(component.firstSlideIndexOfAct("act-intro")).toBe(0);
    expect(component.firstSlideIndexOfAct("act-main")).toBe(2);
    expect(component.firstSlideIndexOfAct("act-conclusion")).toBe(6);
    // Acte inconnu → fallback 0
    expect(component.firstSlideIndexOfAct("act-inconnu")).toBe(0);
  });

  it("currentAct devrait etre undefined si le deck est vide", () => {
    fixture.componentRef.setInput("slides", [] as PresentationSlide[]);
    fixture.componentRef.setInput("acts", [] as PresenterBarActGroup[]);
    fixture.componentRef.setInput("currentIndex", 0);
    fixture.detectChanges();

    expect(component.currentAct()).toBeUndefined();
    expect(component.currentActSlides()).toEqual([]);
    expect(component.positionInAct()).toBe(0);
    expect(component.isLast()).toBe(true);
  });

  it("indexOfSlide devrait retourner l'index global d'une slide", () => {
    const act: Act = { id: "act-main", label: "Contenu principal" };
    // deck-5 est a l'index 4
    const slide = deck.find((s) => s.id === "deck-5")!;
    expect(slide.act.id).toBe(act.id);
    expect(component.indexOfSlide(slide)).toBe(4);
  });
});
