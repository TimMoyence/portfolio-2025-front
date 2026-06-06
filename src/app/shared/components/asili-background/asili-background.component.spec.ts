import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AsiliBackgroundComponent } from "./asili-background.component";

describe("AsiliBackgroundComponent", () => {
  describe("en SSR", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [AsiliBackgroundComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "server" }],
      });
    });

    it("ne rend pas de <canvas> côté serveur", () => {
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector("canvas")).toBeNull();
    });
  });

  describe("en browser", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [AsiliBackgroundComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      });
    });

    it("rend un <canvas> aria-hidden", () => {
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();
      const canvas = fixture.nativeElement.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas.getAttribute("aria-hidden")).toBe("true");
    });

    it("ne lance PAS de boucle rAF sous prefers-reduced-motion", () => {
      spyOn(window, "matchMedia").and.returnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as MediaQueryList);
      const rafSpy = spyOn(window, "requestAnimationFrame").and.callThrough();
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it("annule la boucle au destroy", () => {
      spyOn(window, "matchMedia").and.returnValue({
        matches: false,
        media: "",
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as MediaQueryList);
      const cancelSpy = spyOn(window, "cancelAnimationFrame").and.callThrough();
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();
      fixture.destroy();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
