import { TestBed } from '@angular/core/testing';
import {
  buildVisualQuizSlide,
  buildVisualSlide,
} from '../../../../testing/factories/visual-slide.factory';
import { SlideVisualComponent } from './slide-visual.component';

describe('SlideVisualComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SlideVisualComponent] }));

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
});
