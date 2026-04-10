import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import type { AppConfig } from "../../../core/config/app-config.model";
import { APP_CONFIG } from "../../../core/config/app-config.token";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import { createLeadMagnetPortStub } from "../../../../testing/factories/lead-magnet.factory";
import {
  buildPresentationDeck,
  buildPresentationSlide,
} from "../../../../testing/factories/slide.factory";
import { PresentationEngineComponent } from "./presentation-engine.component";

const mockAppConfig: AppConfig = {
  production: false,
  appName: "test",
  apiBaseUrl: "http://localhost:3000/api/v1/portfolio25/",
  baseUrl: "http://localhost:4200",
  external: { sebastianUrl: "" },
};

describe("PresentationEngineComponent", () => {
  let component: PresentationEngineComponent;
  let fixture: ComponentFixture<PresentationEngineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresentationEngineComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: mockAppConfig },
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

  it("devrait calculer les 3 actes du deck", () => {
    const groups = component.acts();
    expect(groups.length).toBe(3);
    expect(groups[0].act.id).toBe("act-intro");
    expect(groups[0].slides.length).toBe(2);
    expect(groups[1].act.id).toBe("act-main");
    expect(groups[1].slides.length).toBe(2);
    expect(groups[2].act.id).toBe("act-conclusion");
    expect(groups[2].slides.length).toBe(2);
  });

  it("devrait exposer la slide courante et son acte", () => {
    expect(component.currentSlide()?.id).toBe("deck-1");
    expect(component.currentAct()?.id).toBe("act-intro");
  });

  describe("navigateNext", () => {
    it("devrait passer a l index 1 quand la slide courante n a pas de fragments", () => {
      // deck-1 a fragmentCount = 0
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);
    });

    it("devrait reveler les fragments avant d avancer si la slide en a", () => {
      // deck-1 (fragmentCount=0) → deck-2 (fragmentCount=2)
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);

      // Premier next → revele fragment 1, reste sur deck-2
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);

      // Deuxieme next → revele fragment 2, reste sur deck-2
      component.navigateNext();
      expect(component.currentIndex()).toBe(1);

      // Troisieme next → avance vers deck-3
      component.navigateNext();
      expect(component.currentIndex()).toBe(2);
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
  });

  describe("goToSlide", () => {
    it("devrait positionner l index directement", () => {
      component.goToSlide(3);
      expect(component.currentIndex()).toBe(3);
      expect(component.currentSlide()?.id).toBe("deck-4");
    });

    it("devrait clamper les valeurs hors limites", () => {
      component.goToSlide(99);
      expect(component.currentIndex()).toBe(5);

      component.goToSlide(-1);
      expect(component.currentIndex()).toBe(0);
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

  describe("navigation clavier en mode presentation", () => {
    beforeEach(() => {
      component.toggleMode("present");
      fixture.detectChanges();
    });

    /** Helper pour dispatcher une touche sur document. */
    function dispatch(key: string): void {
      const event = new KeyboardEvent("keydown", { key, cancelable: true });
      document.dispatchEvent(event);
    }

    it("ArrowRight devrait appeler navigateNext", () => {
      spyOn(component, "navigateNext");
      dispatch("ArrowRight");
      expect(component.navigateNext).toHaveBeenCalled();
    });

    it("ArrowLeft devrait appeler navigatePrev", () => {
      spyOn(component, "navigatePrev");
      dispatch("ArrowLeft");
      expect(component.navigatePrev).toHaveBeenCalled();
    });

    it("Escape devrait ramener au mode scroll", () => {
      dispatch("Escape");
      expect(component.mode()).toBe("scroll");
    });

    it("ne devrait pas reagir en mode scroll", () => {
      component.toggleMode("scroll");
      spyOn(component, "navigateNext");
      dispatch("ArrowRight");
      expect(component.navigateNext).not.toHaveBeenCalled();
    });
  });
});
