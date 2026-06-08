import { PLATFORM_ID } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AtelierComponent } from "./atelier.component";

/**
 * Specs du hub L'Atelier (`/atelier`).
 *
 * Couvrent : la composition des sections clés (hero unique, deux teasers
 * `.lab-big`, les deux démos jouables, la bande CTA), l'interactivité de la
 * démo météo simulée (changement de ville → recalcul des valeurs), le câblage
 * de navigation (teasers → landings, CTA → /offer et /formations), et la
 * SSR-safety (rendu serveur sans crash, jauge/heatmap à un état lisible).
 *
 * Pas de mocks dupliqués : la page ne dépend d'aucun port (démos autonomes),
 * seuls Router (RouterLink) sont fournis.
 */
describe("AtelierComponent", () => {
  // Le rendu browser des sections `appReveal` pose `anim-ready` sur <html>
  // (singleton partagé). On nettoie pour ne pas polluer les specs suivants.
  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  describe("en contexte navigateur", () => {
    let component: AtelierComponent;
    let fixture: ComponentFixture<AtelierComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AtelierComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "browser" },
          provideRouter([]),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AtelierComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("devrait se créer", () => {
      expect(component).toBeTruthy();
    });

    it("devrait rendre un unique titre de hero (laboratoire vivant · jouer)", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      expect(headings[0]?.textContent).toContain("laboratoire vivant");
      expect(headings[0]?.textContent).toContain("jouer");
    });

    it("devrait composer les deux teasers .lab-big vers les landings", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const features = compiled.querySelectorAll(".lab-big");
      expect(features.length).toBe(2);

      const links = Array.from(
        compiled.querySelectorAll(".lab-big a.link-arrow"),
      ).map((a) => a.getAttribute("href"));
      expect(links).toContain("/atelier/meteo");
      expect(links).toContain("/atelier/sebastian");
    });

    it("devrait afficher la bande de deux démos jouables (météo + Sebastian)", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector(".atelier-grid .meteo")).not.toBeNull();
      expect(compiled.querySelector(".atelier-grid .seb-panel")).not.toBeNull();
      // 4 villes jouables
      expect(compiled.querySelectorAll(".meteo-cities .city-btn").length).toBe(
        4,
      );
    });

    it("devrait recalculer la démo météo au changement de ville", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tempBefore = compiled
        .querySelector(".meteo-temp")
        ?.textContent?.trim();

      component["selectCity"]("nice");
      fixture.detectChanges();

      const tempAfter = compiled
        .querySelector(".meteo-temp")
        ?.textContent?.trim();
      expect(tempAfter).not.toBe(tempBefore);
      expect(tempAfter).toContain("24");

      const active = compiled
        .querySelector(".city-btn.on")
        ?.textContent?.trim();
      expect(active).toBe("Nice");
    });

    it("devrait générer une heatmap Sebastian de 28 cases", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll(".heatmap i").length).toBe(28);
    });

    it("devrait rendre la bande CTA vers /offer et /formations", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const band = compiled.querySelector("app-asili-cta-band");
      expect(band).not.toBeNull();
      const ctas = Array.from(band?.querySelectorAll("a") ?? []).map((a) =>
        a.getAttribute("href"),
      );
      expect(ctas).toContain("/offer");
      expect(ctas).toContain("/formations");
    });

    it("devrait animer la jauge depuis 0 en navigateur", () => {
      // En contexte navigateur le constructeur réinitialise la jauge à 0
      // avant l'animation requestAnimationFrame.
      expect(component["gaugeValue"]()).toBeLessThanOrEqual(
        component["healthTarget"],
      );
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let component: AtelierComponent;
    let fixture: ComponentFixture<AtelierComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AtelierComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "server" },
          provideRouter([]),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AtelierComponent);
      component = fixture.componentInstance;
    });

    it("devrait se créer et rendre sans crash en SSR", () => {
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component).toBeTruthy();
    });

    it("devrait exposer la jauge à sa valeur cible en SSR (état lisible sans JS)", () => {
      expect(component["gaugeValue"]()).toBe(component["healthTarget"]);
    });

    it("devrait exposer une heatmap déterministe de 28 cases en SSR", () => {
      expect(component["heatmap"]().length).toBe(28);
    });
  });
});
