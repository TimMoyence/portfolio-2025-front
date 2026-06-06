import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import type { AsiliManifestoLine } from "./asili-manifesto.component";
import { AsiliManifestoComponent } from "./asili-manifesto.component";

const LINES: readonly AsiliManifestoLine[] = [
  { step: "Le probleme", html: "La technologie promet beaucoup," },
  { html: 'et laisse souvent un <span class="t">flou</span>.' },
  { step: "La clarte", html: "Mon metier commence la :" },
];

describe("AsiliManifestoComponent", () => {
  let fixture: ComponentFixture<AsiliManifestoComponent>;

  function setup(
    lines: readonly AsiliManifestoLine[] = LINES,
    platformId: "browser" | "server" = "browser",
  ): void {
    TestBed.configureTestingModule({
      imports: [AsiliManifestoComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliManifestoComponent);
    fixture.componentRef.setInput("lines", lines);
  }

  it("se cree", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("rend une ligne .mani-line par entree", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const lines = host.querySelectorAll<HTMLElement>(".mani-line");
    expect(lines.length).toBe(LINES.length);
  });

  it("rend le contenu riche avec l'accent .t via innerHTML", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const accent = host.querySelector<HTMLElement>(".mani-text .t");
    expect(accent).not.toBeNull();
    expect(accent?.textContent?.trim()).toBe("flou");
  });

  it("affiche le step en .mani-step seulement quand fourni", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const steps = host.querySelectorAll<HTMLElement>(".mani-step");
    // Deux lignes sur trois portent un step.
    expect(steps.length).toBe(2);
    expect(steps[0].textContent?.trim()).toBe("Le probleme");
  });

  it("rend toutes les lignes allumees (.lit) au depart : fail-open", () => {
    setup(LINES, "server");
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const lit = host.querySelectorAll<HTMLElement>(".mani-line.lit");
    expect(lit.length).toBe(LINES.length);
  });

  it("reste rendu cote serveur sans logique browser", () => {
    setup(LINES, "server");
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll(".mani-line").length).toBe(LINES.length);
    // Toutes les lignes restent lisibles (lit) en SSR.
    expect(host.querySelectorAll(".mani-line.lit").length).toBe(LINES.length);
  });

  describe("scrollytelling browser", () => {
    let observe: jasmine.Spy;
    let disconnect: jasmine.Spy;
    let captured: IntersectionObserverCallback | null;
    let original: typeof IntersectionObserver;
    let lastInit: IntersectionObserverInit | undefined;

    beforeEach(() => {
      captured = null;
      lastInit = undefined;
      observe = jasmine.createSpy("observe");
      disconnect = jasmine.createSpy("disconnect");
      original = window.IntersectionObserver;
      (
        window as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver = class {
        constructor(
          cb: IntersectionObserverCallback,
          init?: IntersectionObserverInit,
        ) {
          captured = cb;
          lastInit = init;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = (): void => {};
        takeRecords = (): IntersectionObserverEntry[] => [];
        root = null;
        rootMargin = "";
        thresholds = [];
      };
    });

    afterEach(() => {
      (
        window as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver = original;
    });

    it("retire .lit en mode anime puis observe chaque ligne", () => {
      setup();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      // En browser, l'observer prend le relais : plus aucune ligne lit au repos.
      expect(host.querySelectorAll(".mani-line.lit").length).toBe(0);
      expect(observe).toHaveBeenCalledTimes(LINES.length);
    });

    it("centre la bande d'observation sur le milieu de l'ecran", () => {
      setup();
      fixture.detectChanges();
      expect(lastInit?.rootMargin).toBe("-48% 0px -48% 0px");
    });

    it("allume une ligne quand elle traverse le centre, l'eteint en sortie", () => {
      setup();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const line = host.querySelector<HTMLElement>(".mani-line");
      expect(line).not.toBeNull();

      captured!(
        [
          {
            isIntersecting: true,
            target: line,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
      expect(line?.classList).toContain("lit");

      captured!(
        [
          {
            isIntersecting: false,
            target: line,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
      expect(line?.classList).not.toContain("lit");
    });

    it("deconnecte l'observer a la destruction", () => {
      setup();
      fixture.detectChanges();
      fixture.destroy();
      expect(disconnect).toHaveBeenCalled();
    });
  });
});
