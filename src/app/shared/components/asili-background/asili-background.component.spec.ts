import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AsiliBackgroundComponent } from "./asili-background.component";

/**
 * Stub de `MediaQueryList` capable de rejouer un evenement `change`, pour
 * simuler un utilisateur qui bascule « reduire les animations » pendant la
 * session. Expose l'ecouteur enregistre et le spy de desabonnement.
 */
const createMotionQueryStub = (
  initialMatches: boolean,
): {
  mql: MediaQueryList;
  handler: ((event: MediaQueryListEvent) => void) | null;
  removeSpy: jasmine.Spy;
  emit: (matches: boolean) => void;
} => {
  const stub = {
    mql: null as unknown as MediaQueryList,
    handler: null as ((event: MediaQueryListEvent) => void) | null,
    removeSpy: jasmine.createSpy("removeEventListener"),
    emit: (matches: boolean): void => {
      stub.handler?.({ matches } as MediaQueryListEvent);
    },
  };
  stub.mql = {
    matches: initialMatches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ): void => {
      stub.handler = listener;
    },
    removeEventListener: stub.removeSpy,
  } as unknown as MediaQueryList;
  return stub;
};

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

    it("coupe la boucle quand prefers-reduced-motion s'active en cours de session", () => {
      const motionQuery = createMotionQueryStub(false);
      spyOn(window, "matchMedia").and.returnValue(motionQuery.mql);
      const cancelSpy = spyOn(window, "cancelAnimationFrame").and.callThrough();
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();

      expect(motionQuery.handler)
        .withContext("un ecouteur `change` doit etre enregistre")
        .not.toBeNull();

      motionQuery.emit(true);

      expect(cancelSpy).toHaveBeenCalled();
      fixture.destroy();
    });

    it("relance la boucle quand prefers-reduced-motion est desactive en cours de session", () => {
      const motionQuery = createMotionQueryStub(true);
      spyOn(window, "matchMedia").and.returnValue(motionQuery.mql);
      const rafSpy = spyOn(window, "requestAnimationFrame").and.returnValue(1);
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();
      expect(rafSpy).not.toHaveBeenCalled();

      motionQuery.emit(false);

      expect(rafSpy).toHaveBeenCalled();
      fixture.destroy();
    });

    it("retire l'ecouteur de prefers-reduced-motion au destroy", () => {
      const motionQuery = createMotionQueryStub(true);
      spyOn(window, "matchMedia").and.returnValue(motionQuery.mql);
      const fixture = TestBed.createComponent(AsiliBackgroundComponent);
      fixture.detectChanges();

      fixture.destroy();

      expect(motionQuery.removeSpy).toHaveBeenCalledWith(
        "change",
        jasmine.any(Function),
      );
    });
  });
});
