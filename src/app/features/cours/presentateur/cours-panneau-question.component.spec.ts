import { TestBed } from '@angular/core/testing';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { CoursPanneauQuestionComponent } from './cours-panneau-question.component';
import { questionsDuPanneau } from './questions-du-panneau';

describe('CoursPanneauQuestionComponent', () => {
  it('D-05 · montre au pupitre chaque réponse attendue telle que le cours la sert, sur tous les cours servis', () => {
    const fixture = TestBed.createComponent(CoursPanneauQuestionComponent);
    fixture.componentRef.setInput('seuil', null);
    fixture.componentRef.setInput('resultats', []);
    fixture.componentRef.setInput('participants', 0);
    fixture.componentRef.setInput('pilotageBloque', false);

    const reecrites = INSTANTANES_DES_COURS_SERVIS.flatMap(([prefixe, instantane]) => {
      fixture.componentRef.setInput('deroule', instantane.deroule);
      return ecransDuPupitreDe(instantane)
        .flatMap(questionsDuPanneau)
        .flatMap((question) => {
          fixture.componentRef.setInput('question', question);
          fixture.detectChanges();
          const affichee = (fixture.nativeElement as HTMLElement)
            .querySelector('[data-testid="presentateur-question-bonne-reponse"]')
            ?.textContent?.trim();
          const servie = question.corrige.bonneReponse.trim();
          return affichee === servie
            ? []
            : [
                `${prefixe} ${question.corrige.questionId} : « ${affichee} » au lieu de « ${servie} »`,
              ];
        });
    });

    expect(reecrites).toEqual([]);
  });
});
