import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync } from '@angular/core/testing';
import { throwError } from 'rxjs';
import type { PresentationPort } from '../../../../core/ports/presentation.port';
import type { SlideInteractions } from '../../../../core/models/presentation-interactions.model';
import {
  choisirLOptionDuQuiz,
  configurerLHoteDInteraction,
  monterApresChargement,
} from '../../../../../testing/hote-d-interaction';
import { horlogesDeSaisie, sousHorlogeArreteeA } from '../../../../../testing/horloge-simulee';
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
    ] as unknown as SlideInteractions['scroll'];

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

  function choisirSansCorrection(
    mode?: ModeInteraction,
    avantLeChoix: () => void = () => undefined,
  ): {
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
    avantLeChoix();

    choisirLOptionDuQuiz(fixture, 1);
    return { texte: (fixture.nativeElement as HTMLElement).textContent ?? '', choix };
  }

  it('mesure la duree de reponse sur l horloge monotone quand l horloge du poste recule', () => {
    const horloges = horlogesDeSaisie();
    const { choix } = choisirSansCorrection('seance', () => horloges.saisirPendant(20_000));

    expect(choix).toHaveBeenCalledOnceWith(jasmine.objectContaining({ dureeMs: 20_000 }));
  });

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

  describe('durée de réponse envoyée à la séance', () => {
    const horloge = sousHorlogeArreteeA(new Date('2026-10-16T08:00:00Z'));

    it('mesure le temps écoulé depuis l affichage de la question', () => {
      const { choix } = choisirSansCorrection('seance', () => jasmine.clock().tick(4200));

      expect(choix).toHaveBeenCalledWith(jasmine.objectContaining({ dureeMs: 4200 }));
    });

    it('envoie la durée écoulée quand l horloge recule de plus que cette durée avant le choix', () => {
      const { choix } = choisirSansCorrection('seance', () => {
        jasmine.clock().tick(300);
        horloge.reculerDe(1000);
      });

      expect(choix).toHaveBeenCalledWith(jasmine.objectContaining({ dureeMs: 300 }));
    });
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
