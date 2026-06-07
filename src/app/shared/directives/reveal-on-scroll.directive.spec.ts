import { Component, PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { RevealOnScrollDirective } from "./reveal-on-scroll.directive";

@Component({
  standalone: true,
  imports: [RevealOnScrollDirective],
  template: `<div appReveal [appRevealDelay]="2">contenu</div>`,
})
class HostComponent {}

describe("RevealOnScrollDirective", () => {
  // Isolation : la classe `anim-ready` vit sur <html> (singleton partagé entre
  // tous les specs). On la retire avant ET après chaque test pour immuniser les
  // assertions SSR contre une fuite d'état laissée par un spec précédent qui
  // aurait rendu un `appReveal` en plateforme browser sans nettoyer.
  beforeEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  describe("en environnement browser", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      });
    });

    it("pose reveal + data-delay sur l'hôte et anim-ready sur <html>", () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector("div");
      expect(div.classList).toContain("reveal");
      expect(div.getAttribute("data-delay")).toBe("2");
      expect(document.documentElement.classList).toContain("anim-ready");
    });

    it("ajoute 'in' quand l'IntersectionObserver déclenche", () => {
      let captured: IntersectionObserverCallback | null = null;
      const observe = jasmine.createSpy("observe");
      const disconnect = jasmine.createSpy("disconnect");
      const original = window.IntersectionObserver;
      (
        window as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver = class {
        constructor(cb: IntersectionObserverCallback) {
          captured = cb;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = (): void => {};
        takeRecords = (): IntersectionObserverEntry[] => [];
        root = null;
        rootMargin = "";
        thresholds = [];
      };

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector("div");
      expect(observe).toHaveBeenCalled();
      captured!(
        [{ isIntersecting: true, target: div } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(div.classList).toContain("in");
      expect(disconnect).toHaveBeenCalled();

      (
        window as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver = original;
    });
  });

  describe("en environnement SSR", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "server" }],
      });
    });

    it("ne pose aucune classe (fail-open : reste visible)", () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector("div");
      expect(div.classList).not.toContain("reveal");
      expect(document.documentElement.classList).not.toContain("anim-ready");
    });
  });
});
