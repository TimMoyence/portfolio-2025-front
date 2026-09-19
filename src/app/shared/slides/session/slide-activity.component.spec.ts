import { TestBed } from '@angular/core/testing';
import {
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../../testing/factories/formations.factory';
import {
  buildVisualQuizSlide,
  buildVisualSlide,
} from '../../../../testing/factories/visual-slide.factory';
import { SlideActivityComponent } from './slide-activity.component';

describe('SlideActivityComponent : deck visuel B2', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SlideActivityComponent] }));

  it('projette le quiz v2 sans interaction pour le formateur et compte les reponses recues', () => {
    const fixture = TestBed.createComponent(SlideActivityComponent);
    fixture.componentRef.setInput('slide', buildVisualQuizSlide());
    fixture.componentRef.setInput('render', 'stage');
    fixture.componentRef.setInput('role', 'presentateur');
    fixture.componentRef.setInput(
      'resultats',
      buildResultatsSeance({
        participants: 12,
        questions: [buildResultatQuestion({ questionId: 'b2-s03-prediction', total: 7 })],
      }),
    );
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('button.slide-quiz__option').length).toBe(0);
    expect(element.querySelectorAll('.slide-quiz__option').length).toBe(2);
    expect(
      element
        .querySelector('[data-testid="slide-quiz-reponses-recues"]')
        ?.textContent?.replace(/\s+/g, ' '),
    ).toContain('7 / 12');
  });

  it('utilise le même renderer visuel que le catalogue pour l’étudiant', () => {
    const fixture = TestBed.createComponent(SlideActivityComponent);
    fixture.componentRef.setInput('slide', buildVisualSlide());
    fixture.componentRef.setInput('role', 'etudiant');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-slide-visual app-slide-hero')).not.toBeNull();
    expect(element.textContent).toContain('Lire un chiffre');
    expect(element.querySelector('fp-story')).toBeNull();
  });

  it('transmet le choix QCM à la séance sans fournir la bonne réponse au client', () => {
    const fixture = TestBed.createComponent(SlideActivityComponent);
    fixture.componentRef.setInput('slide', buildVisualQuizSlide());
    fixture.componentRef.setInput('role', 'etudiant');
    fixture.componentRef.setInput('sessionId', 'seance-1');
    const reponses = jasmine.createSpy('reponses');
    fixture.componentInstance.reponse.subscribe(reponses);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.slide-quiz__option')[1]
      .click();
    fixture.detectChanges();

    expect(reponses).toHaveBeenCalledWith(
      jasmine.objectContaining({ questionId: 'b2-s03-prediction', valeur: 'o2' }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'La bonne réponse est',
    );
  });
});
