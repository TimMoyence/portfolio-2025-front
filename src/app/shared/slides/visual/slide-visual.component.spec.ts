import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import {
  TRI_CORRIGE,
  buildVerdictDuTri,
  buildVisualImageHeroSlide,
  buildVisualQuizSlide,
  buildVisualSlide,
  buildVisualSortReviewSlide,
} from '../../../../testing/factories/visual-slide.factory';
import type { RetourBrique } from '../session/contrat-hote';
import { SlideVisualComponent } from './slide-visual.component';

describe('SlideVisualComponent', () => {
  beforeEach(() => setupTestBed({ imports: [SlideVisualComponent] }));

  it('rend un écran B2 avec le composant du design system et les textes du serveur', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualSlide());
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-slide-hero')).not.toBeNull();
    expect(element.textContent).toContain('Lire un chiffre');
    expect(element.textContent).toContain('Contrôler avant de décider');
  });

  it('sans seance, presente le quiz v2 en apercu explicite et n emet aucune reponse', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualQuizSlide());
    const reponses = jasmine.createSpy('reponses');
    fixture.componentInstance.reponse.subscribe(reponses);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelectorAll<HTMLButtonElement>('.slide-quiz__option')[0].click();
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="slide-quiz-apercu"]')).not.toBeNull();
    expect(element.textContent).not.toContain('Le résultat vient de la séance');
    expect(reponses).not.toHaveBeenCalled();
  });

  it('affiche un message lorsque le layout reçu est inconnu', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput(
      'slide',
      buildVisualSlide({
        donnees: { recit: { presentation: { version: 2, renderer: 'introuvable', props: {} } } },
      }),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });

  it('transmet la priorite de chargement au hero de l ecran prioritaire', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualImageHeroSlide());
    fixture.componentRef.setInput('prioritaire', true);
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('.slide-hero__bg img');
    expect(img?.getAttribute('loading')).toBe('eager');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
  });

  it('laisse le chargement differe aux ecrans qui ne sont pas prioritaires', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualImageHeroSlide());
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('.slide-hero__bg img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  describe('correction du tri', () => {
    function monter(retours: ReadonlyMap<string, RetourBrique[]> = new Map()): HTMLElement {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildVisualSortReviewSlide());
      fixture.componentRef.setInput('retours', retours);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    function enErreur(element: HTMLElement): string[] {
      return [...element.querySelectorAll<HTMLElement>('.slide-sort-review__carte--erreur')].map(
        (carte) => carte.dataset['carte'] ?? '',
      );
    }

    it('L4 · rend l ecran sort-review avec le layout de correction', () => {
      const element = monter();

      expect(element.querySelector('app-slide-sort-review')).not.toBeNull();
      expect(element.querySelector('[role="alert"]')).toBeNull();
      expect(enErreur(element)).toEqual([]);
    });

    it('L4 · borde les cartes que l etudiant a mal placees au tri source', () => {
      const element = monter(
        new Map([
          [TRI_CORRIGE.screenId, [buildVerdictDuTri({ 'ca-2025': true, inflation: false })]],
        ]),
      );

      expect(enErreur(element)).toEqual(['inflation']);
    });

    it('L4 · ignore le verdict d un autre tri ou d un autre ecran', () => {
      const element = monter(
        new Map([
          [TRI_CORRIGE.screenId, [buildVerdictDuTri({ inflation: false }, 'autre-tri')]],
          ['B2-01-AUTRE', [buildVerdictDuTri({ 'ca-2025': false })]],
        ]),
      );

      expect(enErreur(element)).toEqual([]);
    });
  });

  it('ne transmet la priorite qu a un hero, sans casser les autres layouts', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualQuizSlide());
    fixture.componentRef.setInput('prioritaire', true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-slide-quiz')).not.toBeNull();
  });
});
