import { Component, PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SlideComponent } from "./slide.component";
import { SlideDeckComponent } from "./slide-deck.component";
import { SlideDeckService } from "./slide-deck.service";
import { FullscreenAdapter } from "./fullscreen.adapter";
import { buildSlideDeckConfig } from "../../../../testing/factories/slide-deck.factory";
import { SLIDE_DECK_CONFIG } from "./slide-deck.tokens";

@Component({
  standalone: true,
  imports: [SlideDeckComponent, SlideComponent],
  template: `
    <app-slide-deck
      mode="scroll"
      theme="ia-solopreneurs"
      [allowFullscreen]="true"
    >
      <app-slide id="hero">Hero</app-slide>
      <app-slide id="why">Why</app-slide>
      <app-slide id="cta">CTA</app-slide>
    </app-slide-deck>
  `,
})
class HostComponent {}

describe("SlideDeckComponent", () => {
  let fixture: ComponentFixture<HostComponent>;
  let deckEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        SlideDeckService,
        FullscreenAdapter,
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: SLIDE_DECK_CONFIG, useValue: buildSlideDeckConfig() },
      ],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    deckEl = fixture.nativeElement.querySelector(".slide-deck");
  });

  it("applique la classe de thème", () => {
    expect(deckEl.classList).toContain("theme-ia-solopreneurs");
  });

  it("commence en mode scroll", () => {
    expect(deckEl.classList).toContain("mode-scroll");
    expect(deckEl.classList).not.toContain("mode-fullscreen");
  });

  it("affiche un bouton fullscreen quand allowFullscreen=true", () => {
    const btn = deckEl.querySelector(
      '[data-testid="slide-deck-fullscreen-toggle"]',
    );
    expect(btn).toBeTruthy();
  });

  it("rend toutes les slides projetées", () => {
    const slides = deckEl.querySelectorAll("section.slide");
    expect(slides.length).toBe(3);
  });

  it("F déclenche enter() sur FullscreenAdapter", () => {
    const adapter = TestBed.inject(FullscreenAdapter);
    const spy = spyOn(adapter, "enter").and.resolveTo();
    const event = new KeyboardEvent("keydown", { key: "f" });
    document.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it("ArrowDown appelle next() sur le service", () => {
    const service = TestBed.inject(SlideDeckService);
    const spy = spyOn(service, "next");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(spy).toHaveBeenCalled();
  });

  it("ArrowUp appelle previous() sur le service", () => {
    const service = TestBed.inject(SlideDeckService);
    const spy = spyOn(service, "previous");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(spy).toHaveBeenCalled();
  });

  it("loadSwiperElement est appelé lors du toggle fullscreen", async () => {
    const adapter = TestBed.inject(FullscreenAdapter);
    const enterSpy = spyOn(adapter, "enter").and.resolveTo();
    const loadSpy = spyOn(adapter, "loadSwiperElement").and.resolveTo();

    const btn = deckEl.querySelector(
      '[data-testid="slide-deck-fullscreen-toggle"]',
    ) as HTMLButtonElement;
    btn.click();
    await Promise.resolve();
    expect(loadSpy).toHaveBeenCalled();
    expect(enterSpy).toHaveBeenCalled();
  });

  it("affiche un wrapper swiper quand mode = fullscreen", () => {
    const service = TestBed.inject(SlideDeckService);
    service.setMode("fullscreen");
    fixture.detectChanges();
    const swiper = deckEl.querySelector("swiper-container");
    expect(swiper).toBeTruthy();
  });

  it("rend les slides comme enfants directs de swiper-container en mode fullscreen", () => {
    const service = TestBed.inject(SlideDeckService);
    service.setMode("fullscreen");
    fixture.detectChanges();
    const swiper = deckEl.querySelector("swiper-container") as HTMLElement;
    expect(swiper).toBeTruthy();
    const directSlides = swiper.querySelectorAll(":scope > swiper-slide");
    expect(directSlides.length).toBe(3);
  });

  it("repasse en mode scroll quand fullscreenchange retourne au document normal", () => {
    const service = TestBed.inject(SlideDeckService);
    service.setMode("fullscreen");
    fixture.detectChanges();
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });
    document.dispatchEvent(new Event("fullscreenchange"));
    fixture.detectChanges();
    expect(service.mode()).toBe("scroll");
  });
});

describe("SlideDeckComponent — visibility filter", () => {
  it("filtre les slides scroll-only en mode fullscreen", () => {
    @Component({
      standalone: true,
      imports: [SlideDeckComponent, SlideComponent],
      template: `
        <app-slide-deck mode="fullscreen" [allowFullscreen]="true">
          <app-slide id="a" visibility="both">A</app-slide>
          <app-slide id="b" visibility="scroll-only">B</app-slide>
          <app-slide id="c" visibility="present-only">C</app-slide>
        </app-slide-deck>
      `,
    })
    class HostFsComponent {}

    TestBed.configureTestingModule({
      imports: [HostFsComponent],
      providers: [
        SlideDeckService,
        FullscreenAdapter,
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: SLIDE_DECK_CONFIG, useValue: buildSlideDeckConfig() },
      ],
    });
    const fix = TestBed.createComponent(HostFsComponent);
    fix.detectChanges();
    const swiper = fix.nativeElement.querySelector(
      "swiper-container",
    ) as HTMLElement;
    const slides = swiper.querySelectorAll(":scope > swiper-slide");
    // both + present-only visibles, scroll-only filtree
    expect(slides.length).toBe(2);
  });

  it("filtre les slides present-only en mode scroll", () => {
    @Component({
      standalone: true,
      imports: [SlideDeckComponent, SlideComponent],
      template: `
        <app-slide-deck mode="scroll" [allowFullscreen]="true">
          <app-slide id="a" visibility="both">A</app-slide>
          <app-slide id="b" visibility="scroll-only">B</app-slide>
          <app-slide id="c" visibility="present-only">C</app-slide>
        </app-slide-deck>
      `,
    })
    class HostScrollComponent {}

    TestBed.configureTestingModule({
      imports: [HostScrollComponent],
      providers: [
        SlideDeckService,
        FullscreenAdapter,
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: SLIDE_DECK_CONFIG, useValue: buildSlideDeckConfig() },
      ],
    });
    const fix = TestBed.createComponent(HostScrollComponent);
    fix.detectChanges();
    const sections = fix.nativeElement.querySelectorAll("section.slide");
    // both + scroll-only visibles, present-only filtree
    expect(sections.length).toBe(2);
  });
});
