import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import type { PresentationPort } from '../../../../core/ports/presentation.port';
import type { ScrollInteraction } from '../../../../core/models/presentation-interactions.model';
import {
  buildInteractionsResponse,
  createPresentationPortStub,
} from '../../../../../testing/factories/presentation.factory';
import type { ModeInteraction } from '../mode-interaction';
import { SlideQuizComponent } from './slide-quiz.component';

@Component({
  standalone: true,
  imports: [SlideQuizComponent],
  template: ` <app-slide-quiz slug="ia-solopreneurs" interactionId="quiz-intro" /> `,
})
class HostComponent {}

describe('SlideQuizComponent', () => {
  let portStub: jasmine.SpyObj<PresentationPort>;

  beforeEach(() => {
    const knowledgeQuizPayload = [
      {
        type: 'quiz',
        question: 'Quel est le premier réflexe IA ?',
        options: ['Délégation', 'Automatisation', 'Génération'],
        correctIndex: 1,
      },
    ] as unknown as ScrollInteraction[];

    portStub = createPresentationPortStub(
      buildInteractionsResponse({
        interactions: {
          'quiz-intro': { scroll: knowledgeQuizPayload },
        },
      }),
    );

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PRESENTATION_PORT, useValue: portStub }],
    });
  });

  it('appelle PRESENTATION_PORT.getInteractions avec le slug', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(portStub.getInteractions).toHaveBeenCalledWith('ia-solopreneurs');
  }));

  it('rend la question et les options', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const question = fixture.nativeElement.querySelector('.slide-quiz__question');
    expect(question.textContent).toContain('premier réflexe IA');
    const options = fixture.nativeElement.querySelectorAll('.slide-quiz__option');
    expect(options.length).toBe(3);
  }));

  it('affiche feedback correct quand bonne réponse sélectionnée', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.slide-quiz__option');
    options[1].click();
    fixture.detectChanges();
    const feedback = fixture.nativeElement.querySelector('.slide-quiz__feedback');
    expect(feedback.classList).toContain('is-correct');
  }));

  it('affiche feedback incorrect quand mauvaise réponse', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.slide-quiz__option');
    options[0].click();
    fixture.detectChanges();
    const feedback = fixture.nativeElement.querySelector('.slide-quiz__feedback');
    expect(feedback.classList).toContain('is-incorrect');
  }));

  function choisirSansCorrection(mode?: ModeInteraction): {
    texte: string;
    choix: jasmine.Spy;
  } {
    const fixture = TestBed.createComponent(SlideQuizComponent);
    fixture.componentRef.setInput('questionData', {
      id: 'b2-s03-prediction',
      type: 'quiz',
      question: 'Quelle valeur ?',
      options: ['A', 'B'],
    });
    if (mode !== undefined) {
      fixture.componentRef.setInput('mode', mode);
    }
    const choix = jasmine.createSpy('choix');
    fixture.componentInstance.selection.subscribe(choix);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.slide-quiz__option')[1]
      .click();
    fixture.detectChanges();
    return { texte: (fixture.nativeElement as HTMLElement).textContent ?? '', choix };
  }

  it('envoie le choix au serveur sans divulguer la correction quand elle est absente du sujet', () => {
    const { texte, choix } = choisirSansCorrection('seance');

    expect(choix).toHaveBeenCalledWith(
      jasmine.objectContaining({ questionId: 'b2-s03-prediction', valeur: 'o2' }),
    );
    expect(texte).toContain('Le résultat vient de la séance');
    expect(texte).not.toContain('La bonne réponse est');
    expect(texte).not.toContain('Aperçu');
  });

  it('sans seance, reste un apercu explicite : rien n est envoye ni annonce comme resultat', () => {
    const { texte, choix } = choisirSansCorrection();

    expect(choix).not.toHaveBeenCalled();
    expect(texte).toContain('Aperçu');
    expect(texte).not.toContain('Le résultat vient de la séance');
    expect(texte).not.toContain('La bonne réponse est');
  });

  it('ne collecte aucun niveau de confiance que personne ne reçoit', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    fixture.nativeElement.querySelectorAll('.slide-quiz__option')[1].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.slide-quiz__confidence')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('niveau de confiance');
  }));

  it('ne rend rien si le port échoue (degradation gracieuse)', fakeAsync(() => {
    portStub.getInteractions.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.slide-quiz');
    expect(root).toBeNull();
  }));
});
