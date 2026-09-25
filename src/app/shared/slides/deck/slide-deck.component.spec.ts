import { Component, PLATFORM_ID, type Type } from '@angular/core';
import { clearTranslations, loadTranslations } from '@angular/localize';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlideComponent } from './slide.component';
import { SlideDeckComponent } from './slide-deck.component';
import { SlideDeckService } from './slide-deck.service';
import { FullscreenAdapter } from './fullscreen.adapter';
import { buildSlideDeckConfig } from '../../../../testing/factories/slide-deck.factory';
import { SLIDE_DECK_CONFIG } from './slide-deck.tokens';

@Component({
  standalone: true,
  imports: [SlideDeckComponent, SlideComponent],
  template: `
    <app-slide-deck mode="scroll" theme="ia-solopreneurs" [allowFullscreen]="true">
      <app-slide id="hero">Hero</app-slide>
      <app-slide id="why">Why</app-slide>
      <app-slide id="cta">CTA</app-slide>
    </app-slide-deck>
  `,
})
class HostComponent {}

function monterLeDeckDeDemonstration<T>(hote: Type<T>): ComponentFixture<T> {
  TestBed.configureTestingModule({
    imports: [hote],
    providers: [
      SlideDeckService,
      FullscreenAdapter,
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: SLIDE_DECK_CONFIG, useValue: buildSlideDeckConfig() },
    ],
  });
  const monte = TestBed.createComponent(hote);
  monte.detectChanges();
  return monte;
}

describe('SlideDeckComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let deckEl: HTMLElement;

  beforeEach(() => {
    fixture = monterLeDeckDeDemonstration(HostComponent);
    deckEl = fixture.nativeElement.querySelector('.slide-deck');
  });

  it('applique la classe de thème', () => {
    expect(deckEl.classList).toContain('theme-ia-solopreneurs');
  });

  it('commence en mode scroll', () => {
    expect(deckEl.classList).toContain('mode-scroll');
    expect(deckEl.classList).not.toContain('mode-fullscreen');
  });

  it('affiche un bouton fullscreen quand allowFullscreen=true', () => {
    const btn = deckEl.querySelector('[data-testid="slide-deck-fullscreen-toggle"]');
    expect(btn).toBeTruthy();
  });

  it('rend toutes les slides projetées', () => {
    const slides = deckEl.querySelectorAll('section.slide');
    expect(slides.length).toBe(3);
  });

  it('F déclenche enter() sur FullscreenAdapter', () => {
    const adapter = TestBed.inject(FullscreenAdapter);
    const spy = spyOn(adapter, 'enter').and.resolveTo();
    const event = new KeyboardEvent('keydown', { key: 'f' });
    document.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it('ArrowDown declenche un scroll vers la slide suivante', () => {
    const spy = spyOn(deckEl, 'scrollTo');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(spy).toHaveBeenCalled();
  });

  it('ArrowUp declenche un scroll vers la slide precedente', () => {
    const spy = spyOn(deckEl, 'scrollTo');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(spy).toHaveBeenCalled();
  });

  it('loadSwiperElement est appelé lors du toggle fullscreen', async () => {
    const adapter = TestBed.inject(FullscreenAdapter);
    const enterSpy = spyOn(adapter, 'enter').and.resolveTo();
    const loadSpy = spyOn(adapter, 'loadSwiperElement').and.resolveTo();

    const btn = deckEl.querySelector(
      '[data-testid="slide-deck-fullscreen-toggle"]',
    ) as HTMLButtonElement;
    btn.click();
    await Promise.resolve();
    expect(loadSpy).toHaveBeenCalled();
    expect(enterSpy).toHaveBeenCalled();
  });

  function passerEnPleinEcran(): SlideDeckService {
    const service = TestBed.inject(SlideDeckService);
    service.setMode('fullscreen');
    fixture.detectChanges();
    return service;
  }

  it('affiche un wrapper swiper quand mode = fullscreen', () => {
    passerEnPleinEcran();
    const swiper = deckEl.querySelector('swiper-container');
    expect(swiper).toBeTruthy();
  });

  it('rend les slides comme enfants directs de swiper-container en mode fullscreen', () => {
    passerEnPleinEcran();
    const swiper = deckEl.querySelector('swiper-container') as HTMLElement;
    expect(swiper).toBeTruthy();
    const directSlides = swiper.querySelectorAll(':scope > swiper-slide');
    expect(directSlides.length).toBe(3);
  });

  it('synchronise le compteur avec la slide active de swiper', () => {
    const service = passerEnPleinEcran();

    const swiper = deckEl.querySelector('swiper-container') as HTMLElement;
    swiper.dispatchEvent(
      new CustomEvent('swiperslidechange', {
        detail: [{ activeIndex: 1 }],
      }),
    );
    fixture.detectChanges();

    expect(service.current()).toBe('why');
    const progress = deckEl.querySelector('.slide-deck-progress span') as HTMLElement;
    expect(progress.textContent?.trim()).toBe('2 / 3');
  });

  it('repasse en mode scroll quand fullscreenchange retourne au document normal', () => {
    const service = passerEnPleinEcran();
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
    document.dispatchEvent(new Event('fullscreenchange'));
    fixture.detectChanges();
    expect(service.mode()).toBe('scroll');
  });
});

describe('SlideDeckComponent — libellés du plein écran', () => {
  function monterLeDeck(): { deck: HTMLElement; service: SlideDeckService; rafraichir(): void } {
    const fix = monterLeDeckDeDemonstration(HostComponent);
    return {
      deck: fix.nativeElement.querySelector('.slide-deck') as HTMLElement,
      service: TestBed.inject(SlideDeckService),
      rafraichir: () => fix.detectChanges(),
    };
  }

  function bouton(deck: HTMLElement): HTMLButtonElement {
    return deck.querySelector('[data-testid="slide-deck-fullscreen-toggle"]') as HTMLButtonElement;
  }

  afterEach(() => clearTranslations());

  it('nomme le bouton en français par défaut, pour l’entrée comme pour la sortie', () => {
    const { deck, service, rafraichir } = monterLeDeck();
    expect(bouton(deck).getAttribute('aria-label')).toBe('Présenter en plein écran');
    expect(bouton(deck).textContent).toContain('Présenter');

    service.setMode('fullscreen');
    rafraichir();

    expect(bouton(deck).getAttribute('aria-label')).toBe('Quitter le mode présentation');
    expect(bouton(deck).textContent).toContain('Quitter');
  });

  it('traduit le libellé accessible et le libellé visible en locale anglaise', () => {
    loadTranslations({
      slideDeckFullscreenEnter: 'Present full screen',
      slideDeckFullscreenExit: 'Leave presentation mode',
      slideDeckFullscreenEnterShort: 'Present',
      slideDeckFullscreenExitShort: 'Leave',
    });
    const { deck, service, rafraichir } = monterLeDeck();
    expect(bouton(deck).getAttribute('aria-label')).toBe('Present full screen');

    service.setMode('fullscreen');
    rafraichir();

    expect(bouton(deck).getAttribute('aria-label')).toBe('Leave presentation mode');
    expect(bouton(deck).textContent?.trim()).toContain('Leave');
    expect(bouton(deck).textContent).not.toContain('Quitter');
  });
});

describe('SlideDeckComponent — visibility filter', () => {
  it('filtre les slides scroll-only en mode fullscreen', () => {
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

    const fix = monterLeDeckDeDemonstration(HostFsComponent);
    const swiper = fix.nativeElement.querySelector('swiper-container') as HTMLElement;
    const slides = swiper.querySelectorAll(':scope > swiper-slide');
    expect(slides.length).toBe(2);
  });

  it('compte "c", 3e slide enregistree mais 1re visible en mode scroll, comme 1 / 1', () => {
    @Component({
      standalone: true,
      imports: [SlideDeckComponent, SlideComponent],
      template: `
        <app-slide-deck mode="scroll" [allowFullscreen]="true">
          <app-slide id="a" visibility="present-only">A</app-slide>
          <app-slide id="b" visibility="present-only">B</app-slide>
          <app-slide id="c" visibility="both">C</app-slide>
        </app-slide-deck>
      `,
    })
    class HostCounterComponent {}

    const fix = monterLeDeckDeDemonstration(HostCounterComponent);

    TestBed.inject(SlideDeckService).goTo('c');
    fix.detectChanges();

    const progress = fix.nativeElement.querySelector('.slide-deck-progress span') as HTMLElement;
    expect(progress.textContent?.trim()).toBe('1 / 1');
  });

  it('filtre les slides present-only en mode scroll', () => {
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

    const fix = monterLeDeckDeDemonstration(HostScrollComponent);
    const sections = fix.nativeElement.querySelectorAll('section.slide');
    expect(sections.length).toBe(2);
  });
});
