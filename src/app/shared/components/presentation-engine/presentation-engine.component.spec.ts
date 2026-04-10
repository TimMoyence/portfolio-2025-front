import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { APP_CONFIG } from "../../../core/config/app-config.token";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import { buildAppConfig } from "../../../../testing/factories/app-config.factory";
import { createLeadMagnetPortStub } from "../../../../testing/factories/lead-magnet.factory";
import {
  buildPresentationDeck,
  buildPresentationSlide,
} from "../../../../testing/factories/slide.factory";
import { FragmentService } from "../../services/fragment.service";
import { PresentationEngineComponent } from "./presentation-engine.component";

describe("PresentationEngineComponent", () => {
  let component: PresentationEngineComponent;
  let fixture: ComponentFixture<PresentationEngineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresentationEngineComponent],
      providers: [
        // `provideHttpClient`, `provideRouter`, `APP_CONFIG` et `LEAD_MAGNET_PORT`
        // sont requis par la slide `cta` du deck de test (SlideCtaComponent
        // contient un `LeadMagnetCtaComponent`). Sans ces providers, le rendu
        // du layout cta leve une erreur d'injection.
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: buildAppConfig() },
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PresentationEngineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("slides", buildPresentationDeck());
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait demarrer a l index 0 en mode scroll", () => {
    expect(component.currentIndex()).toBe(0);
    expect(component.mode()).toBe("scroll");
  });

  it("devrait calculer les 3 actes du deck (scroll exclut presentOnly)", () => {
    const groups = component.acts();
    expect(groups.length).toBe(3);
    expect(groups[0].act.id).toBe("act-intro");
    expect(groups[0].slides.length).toBe(2);
    expect(groups[1].act.id).toBe("act-main");
    expect(groups[1].slides.length).toBe(4);
    // act-conclusion : deck-7, deck-8, deck-10 (deck-9 presentOnly exclue en scroll)
    expect(groups[2].act.id).toBe("act-conclusion");
    expect(groups[2].slides.length).toBe(3);
  });

  it("devrait exposer la slide courante et son acte", () => {
    expect(component.currentSlide()?.id).toBe("deck-1");
    expect(component.currentAct()?.id).toBe("act-intro");
  });

  it("devrait exposer une map d index par id de slide en O(1)", () => {
    // En scroll mode : 9 slides actives (deck-9 presentOnly exclue)
    const map = component.slideIndexMap();
    expect(map.size).toBe(9);
    expect(map.get("deck-1")).toBe(0);
    expect(map.get("deck-5")).toBe(4);
    expect(map.get("deck-8")).toBe(7);
    expect(map.get("deck-10")).toBe(8);
  });

  it("devrait logger un warning si les slides d un acte ne sont pas contigues", () => {
    const warnSpy = spyOn(console, "warn");
    const actA = { id: "act-a", label: "A" };
    const actB = { id: "act-b", label: "B" };
    fixture.componentRef.setInput("slides", [
      buildPresentationSlide({ id: "s1", act: actA, fragmentCount: 0 }),
      buildPresentationSlide({ id: "s2", act: actB, fragmentCount: 0 }),
      buildPresentationSlide({ id: "s3", act: actA, fragmentCount: 0 }),
    ]);
    fixture.detectChanges();

    // Force la lecture du computed
    component.acts();

    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.calls.mostRecent().args[0] as string;
    expect(message).toContain("act-a");
  });

  describe("navigateNext", () => {
    it("devrait passer a l index 1 quand la slide courante n a pas de fragments", () => {
      // deck-1 a fragmentCount = 0
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);
    });

    it("devrait reveler les fragments avant d avancer si la slide en a (mode present)", () => {
      const fragmentService =
        fixture.debugElement.injector.get(FragmentService);

      // Les fragments ne sont geres qu en mode present
      component.toggleMode("present");
      fixture.detectChanges();

      // deck-1 (fragmentCount=0) → deck-2 (fragmentCount=2)
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);
      expect(fragmentService.visibleCount()).toBe(0);

      // Premier next → revele fragment 1, reste sur deck-2
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);
      expect(fragmentService.visibleCount()).toBe(1);

      // Deuxieme next → revele fragment 2, reste sur deck-2
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);
      expect(fragmentService.visibleCount()).toBe(2);

      // Troisieme next → avance vers deck-3 (reset a 0)
      component.navigateNext();
      expect(component.currentIndex()).toBe(2);
      expect(fragmentService.visibleCount()).toBe(0);
    });

    it("ne devrait pas depasser la derniere slide", () => {
      // Force un deck a 1 slide sans fragments
      fixture.componentRef.setInput("slides", [
        buildPresentationSlide({ id: "only", fragmentCount: 0 }),
      ]);
      fixture.detectChanges();

      component.navigateNext();
      component.navigateNext();
      expect(component.currentIndex()).toBe(0);
    });
  });

  describe("navigatePrev", () => {
    it("devrait reculer a la slide precedente quand aucun fragment n est revele", () => {
      component.goToSlide(2);
      component.navigatePrev();
      expect(component.currentIndex()).toBe(1);
    });

    it("ne devrait pas descendre en dessous de 0", () => {
      component.navigatePrev();
      expect(component.currentIndex()).toBe(0);
    });

    it("devrait masquer les fragments reveles sans changer de slide (mode present)", () => {
      const fragmentService =
        fixture.debugElement.injector.get(FragmentService);

      // Les fragments ne sont geres qu en mode present
      component.toggleMode("present");
      fixture.detectChanges();

      // Positionne sur deck-2 (fragmentCount=2) et revele 2 fragments
      component.goToSlide(1);
      expect(fragmentService.visibleCount()).toBe(0);
      component.navigateNext(); // revele fragment 1
      component.navigateNext(); // revele fragment 2
      expect(fragmentService.visibleCount()).toBe(2);
      expect(component.currentIndex()).toBe(1);

      // navigatePrev → masque le 2e fragment sans changer de slide
      component.navigatePrev();
      expect(component.currentIndex()).toBe(1);
      expect(fragmentService.visibleCount()).toBe(1);

      // navigatePrev → masque le 1er fragment sans changer de slide
      component.navigatePrev();
      expect(component.currentIndex()).toBe(1);
      expect(fragmentService.visibleCount()).toBe(0);
    });
  });

  describe("goToSlide", () => {
    it("devrait positionner l index directement", () => {
      component.goToSlide(3);
      expect(component.currentIndex()).toBe(3);
      expect(component.currentSlide()?.id).toBe("deck-4");
    });

    it("devrait clamper les valeurs hors limites", () => {
      // En scroll mode : 9 slides actives, max index = 8
      component.goToSlide(99);
      expect(component.currentIndex()).toBe(8);

      component.goToSlide(-1);
      expect(component.currentIndex()).toBe(0);
    });

    it("devrait reinitialiser les fragments de la slide cible de maniere synchrone", () => {
      const fragmentService =
        fixture.debugElement.injector.get(FragmentService);

      component.goToSlide(1); // deck-2 a fragmentCount=2
      fragmentService.next();
      fragmentService.next();
      expect(fragmentService.visibleCount()).toBe(2);

      component.goToSlide(3); // deck-4 (comparison, fragmentCount=0)
      expect(fragmentService.visibleCount()).toBe(0);
    });
  });

  describe("toggleMode", () => {
    it("devrait changer le mode en present", () => {
      component.toggleMode("present");
      expect(component.mode()).toBe("present");
    });

    it("devrait changer le mode en overview", () => {
      component.toggleMode("overview");
      expect(component.mode()).toBe("overview");
    });

    it("devrait revenir en mode scroll", () => {
      component.toggleMode("present");
      component.toggleMode("scroll");
      expect(component.mode()).toBe("scroll");
    });
  });

  describe("rendu des layouts en mode present", () => {
    // En present mode : 9 slides actives (deck-10 scrollOnly exclue, deck-9 presentOnly incluse)
    const expectations: Array<{ index: number; selector: string }> = [
      { index: 0, selector: "app-slide-hero" },
      { index: 1, selector: "app-slide-split" },
      { index: 2, selector: "app-slide-stats" },
      { index: 3, selector: "app-slide-comparison" },
      { index: 4, selector: "app-slide-demo" },
      { index: 5, selector: "app-slide-quote" },
      { index: 6, selector: "app-slide-cta" },
      { index: 7, selector: "app-slide-split" },
      { index: 8, selector: "app-slide-hero" }, // deck-9 (presentOnly)
    ];

    it("devrait instancier tous les layouts presents dans le deck", () => {
      component.toggleMode("present");
      fixture.detectChanges();

      for (const { index, selector } of expectations) {
        component.goToSlide(index);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector(selector))
          .withContext(`slide ${index} → ${selector}`)
          .toBeTruthy();
      }
    });
  });

  describe("etat interactif (notes, prompt)", () => {
    it("toggleNotes devrait ajouter puis retirer un index de l ensemble", () => {
      expect(component.expandedNotes().has(3)).toBe(false);
      component.toggleNotes(3);
      expect(component.expandedNotes().has(3)).toBe(true);
      component.toggleNotes(3);
      expect(component.expandedNotes().has(3)).toBe(false);
    });

    it("generatePrompt devrait remplacer {{sector}} par la valeur saisie", () => {
      component.sectorInput.set("Coach sportif");
      component.generatePrompt({
        label: "Secteur",
        placeholder: "...",
        template: "Vous etes un expert en {{sector}}.",
      });
      expect(component.generatedPrompt()).toBe(
        "Vous etes un expert en Coach sportif.",
      );
    });

    it("generatePrompt devrait vider le prompt si le secteur est vide", () => {
      component.generatedPrompt.set("old");
      component.sectorInput.set("   ");
      component.generatePrompt({
        label: "Secteur",
        placeholder: "...",
        template: "Expert en {{sector}}.",
      });
      expect(component.generatedPrompt()).toBe("");
    });
  });

  describe("navigation clavier en mode presentation", () => {
    beforeEach(() => {
      component.toggleMode("present");
      fixture.detectChanges();
      // Desactive les transitions GSAP pour que les callbacks de navigation
      // soient appeles de maniere synchrone dans les tests.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).prefersReducedMotion = true;
    });

    /** Helper pour dispatcher une touche sur document. */
    function dispatch(key: string): void {
      const event = new KeyboardEvent("keydown", { key, cancelable: true });
      document.dispatchEvent(event);
    }

    it("ArrowDown devrait appeler navigateNext (navigation verticale intra-acte)", () => {
      spyOn(component, "navigateNext");
      dispatch("ArrowDown");
      expect(component.navigateNext).toHaveBeenCalled();
    });

    it("Space devrait appeler navigateNext (navigation verticale intra-acte)", () => {
      spyOn(component, "navigateNext");
      dispatch(" ");
      expect(component.navigateNext).toHaveBeenCalled();
    });

    it("ArrowUp devrait appeler navigatePrev (navigation verticale intra-acte)", () => {
      spyOn(component, "navigatePrev");
      dispatch("ArrowUp");
      expect(component.navigatePrev).toHaveBeenCalled();
    });

    it("Backspace devrait appeler navigatePrev (navigation verticale intra-acte)", () => {
      spyOn(component, "navigatePrev");
      dispatch("Backspace");
      expect(component.navigatePrev).toHaveBeenCalled();
    });

    it("ArrowRight devrait appeler navigateNext (navigation intra-acte)", () => {
      spyOn(component, "navigateNext");
      dispatch("ArrowRight");
      expect(component.navigateNext).toHaveBeenCalled();
    });

    it("ArrowLeft devrait appeler navigatePrev (navigation intra-acte)", () => {
      spyOn(component, "navigatePrev");
      dispatch("ArrowLeft");
      expect(component.navigatePrev).toHaveBeenCalled();
    });

    it("PageDown devrait appeler navigateNextAct (navigation horizontale inter-acte)", () => {
      spyOn(component, "navigateNextAct");
      dispatch("PageDown");
      expect(component.navigateNextAct).toHaveBeenCalled();
    });

    it("PageUp devrait appeler navigatePrevAct (navigation horizontale inter-acte)", () => {
      spyOn(component, "navigatePrevAct");
      dispatch("PageUp");
      expect(component.navigatePrevAct).toHaveBeenCalled();
    });

    it("Escape devrait ramener au mode scroll", () => {
      dispatch("Escape");
      expect(component.mode()).toBe("scroll");
    });

    it("ne devrait pas reagir en mode scroll", () => {
      component.toggleMode("scroll");
      spyOn(component, "navigateNext");
      dispatch("ArrowDown");
      expect(component.navigateNext).not.toHaveBeenCalled();
    });
  });

  describe("navigateNextAct", () => {
    it("devrait sauter au premier slide de l acte suivant", () => {
      // Deck : act-intro (0,1), act-main (2,3,4,5), act-conclusion (6,7)
      // Depuis slide 0 (act-intro) → saute vers slide 2 (act-main)
      component.goToSlide(0);
      component.navigateNextAct();
      expect(component.currentIndex()).toBe(2);
      expect(component.currentSlide()?.act.id).toBe("act-main");
    });

    it("ne devrait rien faire sur le dernier acte", () => {
      // Depuis slide 6 (act-conclusion) → reste sur place
      component.goToSlide(6);
      component.navigateNextAct();
      expect(component.currentIndex()).toBe(6);
      expect(component.currentSlide()?.act.id).toBe("act-conclusion");
    });

    it("devrait sauter de act-main a act-conclusion", () => {
      component.goToSlide(3); // Milieu de act-main
      component.navigateNextAct();
      expect(component.currentIndex()).toBe(6);
      expect(component.currentSlide()?.act.id).toBe("act-conclusion");
    });
  });

  describe("navigatePrevAct", () => {
    it("devrait sauter au premier slide de l acte precedent", () => {
      // Depuis slide 3 (act-main) → saute vers slide 0 (act-intro)
      component.goToSlide(3);
      component.navigatePrevAct();
      expect(component.currentIndex()).toBe(0);
      expect(component.currentSlide()?.act.id).toBe("act-intro");
    });

    it("ne devrait rien faire sur le premier acte", () => {
      // Depuis slide 0 (act-intro) → reste sur place
      component.goToSlide(0);
      component.navigatePrevAct();
      expect(component.currentIndex()).toBe(0);
      expect(component.currentSlide()?.act.id).toBe("act-intro");
    });

    it("devrait sauter de act-conclusion a act-main", () => {
      component.goToSlide(7); // Derniere slide (act-conclusion)
      component.navigatePrevAct();
      expect(component.currentIndex()).toBe(2);
      expect(component.currentSlide()?.act.id).toBe("act-main");
    });
  });

  describe("navigation tactile (swipe) en mode presentation", () => {
    beforeEach(() => {
      component.toggleMode("present");
      fixture.detectChanges();
      // Desactive les transitions GSAP pour que les callbacks de navigation
      // soient appeles de maniere synchrone dans les tests.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).prefersReducedMotion = true;
    });

    /**
     * Cree un TouchEvent synthetique avec les coordonnees fournies.
     * Les navigateurs n'autorisent pas la construction directe de Touch,
     * donc on utilise un objet plain avec les proprietes minimales.
     */
    function createTouchEvent(
      type: "touchstart" | "touchend",
      clientX: number,
      clientY: number,
    ): TouchEvent {
      const touch = { clientX, clientY } as Touch;
      const touchList =
        type === "touchstart"
          ? { 0: touch, length: 1 }
          : { 0: touch, length: 0 };
      return {
        touches: type === "touchstart" ? touchList : { length: 0 },
        changedTouches: { 0: touch, length: 1 },
        preventDefault: jasmine.createSpy("preventDefault"),
      } as unknown as TouchEvent;
    }

    it("swipe gauche devrait appeler navigateNext", () => {
      spyOn(component, "navigateNext");
      // Simule un swipe gauche : start a x=200, end a x=100 (dx = -100)
      component.onTouchStart(createTouchEvent("touchstart", 200, 300));
      component.onTouchEnd(createTouchEvent("touchend", 100, 300));
      expect(component.navigateNext).toHaveBeenCalled();
    });

    it("swipe droite devrait appeler navigatePrev", () => {
      spyOn(component, "navigatePrev");
      // Simule un swipe droite : start a x=100, end a x=200 (dx = +100)
      component.onTouchStart(createTouchEvent("touchstart", 100, 300));
      component.onTouchEnd(createTouchEvent("touchend", 200, 300));
      expect(component.navigatePrev).toHaveBeenCalled();
    });

    it("swipe vers le haut devrait appeler navigateNextAct", () => {
      spyOn(component, "navigateNextAct");
      // Simule un swipe vers le haut : start a y=400, end a y=300 (dy = -100)
      component.onTouchStart(createTouchEvent("touchstart", 200, 400));
      component.onTouchEnd(createTouchEvent("touchend", 200, 300));
      expect(component.navigateNextAct).toHaveBeenCalled();
    });

    it("swipe vers le bas devrait appeler navigatePrevAct", () => {
      spyOn(component, "navigatePrevAct");
      // Simule un swipe vers le bas : start a y=200, end a y=300 (dy = +100)
      component.onTouchStart(createTouchEvent("touchstart", 200, 200));
      component.onTouchEnd(createTouchEvent("touchend", 200, 300));
      expect(component.navigatePrevAct).toHaveBeenCalled();
    });

    it("ne devrait pas naviguer si la distance est inferieure a 50px", () => {
      spyOn(component, "navigateNext");
      spyOn(component, "navigatePrev");
      // Simule un micro-geste : dx = -30, dy = 0
      component.onTouchStart(createTouchEvent("touchstart", 200, 300));
      component.onTouchEnd(createTouchEvent("touchend", 170, 300));
      expect(component.navigateNext).not.toHaveBeenCalled();
      expect(component.navigatePrev).not.toHaveBeenCalled();
    });

    it("ne devrait pas naviguer en mode scroll", () => {
      component.toggleMode("scroll");
      fixture.detectChanges();
      spyOn(component, "navigateNext");
      // Simule un swipe gauche valide
      component.onTouchStart(createTouchEvent("touchstart", 200, 300));
      component.onTouchEnd(createTouchEvent("touchend", 100, 300));
      expect(component.navigateNext).not.toHaveBeenCalled();
    });
  });

  describe("filtrage par visibilite", () => {
    it("devrait exclure les slides presentOnly en mode scroll", () => {
      // Mode scroll (defaut) : deck-9 (presentOnly) doit etre exclue
      expect(component.mode()).toBe("scroll");
      const ids = component.activeSlides().map((s) => s.id);
      expect(ids).not.toContain("deck-9");
      expect(ids.length).toBe(9);
    });

    it("devrait exclure les slides scrollOnly en mode present", () => {
      component.toggleMode("present");
      fixture.detectChanges();
      // deck-10 (scrollOnly) doit etre exclue
      const ids = component.activeSlides().map((s) => s.id);
      expect(ids).not.toContain("deck-10");
      expect(ids.length).toBe(9);
    });

    it("devrait inclure les slides visibility=both dans les deux modes", () => {
      // En scroll
      let ids = component.activeSlides().map((s) => s.id);
      expect(ids).toContain("deck-1"); // pas de visibility → traite comme both

      // En present
      component.toggleMode("present");
      fixture.detectChanges();
      ids = component.activeSlides().map((s) => s.id);
      expect(ids).toContain("deck-1");
    });

    it("devrait traiter les slides sans visibility comme both", () => {
      // deck-1 a deck-8 n ont pas de visibility → toujours incluses
      const scrollIds = component.activeSlides().map((s) => s.id);
      for (let i = 1; i <= 8; i++) {
        expect(scrollIds).toContain(`deck-${i}`);
      }

      component.toggleMode("present");
      fixture.detectChanges();
      const presentIds = component.activeSlides().map((s) => s.id);
      for (let i = 1; i <= 8; i++) {
        expect(presentIds).toContain(`deck-${i}`);
      }
    });

    it("devrait inclure deck-10 (scrollOnly) en mode scroll", () => {
      expect(component.mode()).toBe("scroll");
      const ids = component.activeSlides().map((s) => s.id);
      expect(ids).toContain("deck-10");
    });

    it("devrait inclure deck-9 (presentOnly) en mode present", () => {
      component.toggleMode("present");
      fixture.detectChanges();
      const ids = component.activeSlides().map((s) => s.id);
      expect(ids).toContain("deck-9");
    });

    it("devrait preserver la slide courante lors du changement de mode", () => {
      // Positionne sur deck-5 (index 4 en scroll)
      component.goToSlide(4);
      expect(component.currentSlide()?.id).toBe("deck-5");

      // Bascule en present → deck-5 est toujours visible, index remape
      component.toggleMode("present");
      fixture.detectChanges();
      expect(component.currentSlide()?.id).toBe("deck-5");
      expect(component.currentIndex()).toBe(4);
    });

    it("devrait clamper l index si la slide courante est invisible dans le nouveau mode", () => {
      // Positionne sur deck-10 (scrollOnly) → index 8 en scroll
      component.goToSlide(8);
      expect(component.currentSlide()?.id).toBe("deck-10");

      // Bascule en present → deck-10 est invisible, clamp a max (8)
      component.toggleMode("present");
      fixture.detectChanges();
      // En present mode il y a 9 slides (index 0-8), donc clamp(8) = 8
      expect(component.currentIndex()).toBe(8);
      expect(component.currentSlide()?.id).toBe("deck-9");
    });

    it("devrait filtrer correctement en mode overview (meme filtrage que present)", () => {
      component.toggleMode("overview");
      fixture.detectChanges();
      const ids = component.activeSlides().map((s) => s.id);
      expect(ids).not.toContain("deck-10");
      expect(ids).toContain("deck-9");
      expect(ids.length).toBe(9);
    });

    it("devrait naviguer correctement en present en sautant les scrollOnly", () => {
      component.toggleMode("present");
      fixture.detectChanges();

      // En present mode : 9 slides actives (deck-10 scrollOnly exclue)
      expect(component.activeSlides().length).toBe(9);

      // La derniere slide active en present est deck-9 (presentOnly, index 8)
      component.goToSlide(8);
      expect(component.currentSlide()?.id).toBe("deck-9");

      // Ne depasse pas la derniere slide
      component.navigateNext();
      expect(component.currentSlide()?.id).toBe("deck-9");
    });
  });
});
