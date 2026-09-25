import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync } from '@angular/core/testing';
import { throwError } from 'rxjs';
import type { PresentationPort } from '../../../../core/ports/presentation.port';
import type { ScrollInteraction } from '../../../../core/models/presentation-interactions.model';
import {
  choisirLOptionDuQuiz,
  configurerLHoteDInteraction,
  monterApresChargement,
} from '../../../../../testing/hote-d-interaction';
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

    portStub = configurerLHoteDInteraction(HostComponent, {
      'quiz-intro': { scroll: knowledgeQuizPayload },
    });
  });

  function choisir(index: number): ComponentFixture<HostComponent> {
    return choisirLOptionDuQuiz(monterApresChargement(HostComponent), index);
  }

  it('appelle PRESENTATION_PORT.getInteractions avec le slug', fakeAsync(() => {
    monterApresChargement(HostComponent);
    expect(portStub.getInteractions).toHaveBeenCalledWith('ia-solopreneurs');
  }));

  it('rend la question et les options', fakeAsync(() => {
    const fixture = monterApresChargement(HostComponent);
    const question = fixture.nativeElement.querySelector('.slide-quiz__question');
    expect(question.textContent).toContain('premier réflexe IA');
    const options = fixture.nativeElement.querySelectorAll('.slide-quiz__option');
    expect(options.length).toBe(3);
  }));

  it('affiche feedback correct quand bonne réponse sélectionnée', fakeAsync(() => {
    const feedback = choisir(1).nativeElement.querySelector('.slide-quiz__feedback');
    expect(feedback.classList).toContain('is-correct');
  }));

  it('affiche feedback incorrect quand mauvaise réponse', fakeAsync(() => {
    const feedback = choisir(0).nativeElement.querySelector('.slide-quiz__feedback');
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

    choisirLOptionDuQuiz(fixture, 1);
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
    const fixture = choisir(1);

    expect(fixture.nativeElement.querySelector('.slide-quiz__confidence')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('niveau de confiance');
  }));

  it('ne rend rien si le port échoue (degradation gracieuse)', fakeAsync(() => {
    portStub.getInteractions.and.returnValue(throwError(() => new Error('network')));
    const fixture = monterApresChargement(HostComponent);
    const root = fixture.nativeElement.querySelector('.slide-quiz');
    expect(root).toBeNull();
  }));
});
