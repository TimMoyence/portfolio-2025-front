import { TestBed } from '@angular/core/testing';
import type { ResultatQuestion } from '../../../../cours/content/types';
import { resultatsServis } from '../../../../cours/runtime/core/sync';
import { formaterPart } from '../../../../cours/runtime/core/typographie';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { reponsesServiesPar } from '../../../../testing/fixtures/reponses-servies';
import { CoursPanneauQuestionComponent } from './cours-panneau-question.component';
import { questionsDuPanneau } from './questions-du-panneau';

const RESULTATS_DU_PUPITRE = reponsesServiesPar(
  'GET /api/v1/portfolio25/formations/sessions/:id/presenter-stream resultats',
).flatMap((corps) => resultatsServis.parse(corps).questions);

function contraireDe(servi: ResultatQuestion, dernierEcran: string): ResultatQuestion {
  return {
    ...servi,
    part: servi.part === 0.25 ? 0.75 : 0.25,
    sousLeSeuil: !servi.sousLeSeuil,
    remediation: servi.sousLeSeuil
      ? null
      : { confusionId: servi.confusions.at(0)?.id ?? 'servie', ecranId: dernierEcran },
  };
}

describe('CoursPanneauQuestionComponent', () => {
  it('Z1-D02 · suit la part, le seuil et la remédiation servis par le back, même contraires à un recalcul, sur tous les résultats servis', () => {
    const fixture = TestBed.createComponent(CoursPanneauQuestionComponent);
    fixture.componentRef.setInput('participants', 0);
    fixture.componentRef.setInput('pilotageBloque', false);
    const emises: number[] = [];
    fixture.componentInstance.remediation.subscribe((rang) => emises.push(rang));
    const eleve = fixture.nativeElement as HTMLElement;

    const lus = RESULTATS_DU_PUPITRE.flatMap((servi) =>
      INSTANTANES_DES_COURS_SERVIS.flatMap(([prefixe, { deroule }]) => {
        const ecran = deroule.ecrans.find(({ id }) => id === servi.ecranId);
        const question = ecran
          ? questionsDuPanneau(ecran).find(({ corrige }) => corrige.questionId === servi.questionId)
          : undefined;
        if (ecran === undefined || question === undefined) {
          return [];
        }
        fixture.componentRef.setInput('deroule', deroule);
        fixture.componentRef.setInput('seuil', ecran.seuil);
        fixture.componentRef.setInput('question', question);
        return [servi, contraireDe(servi, deroule.ecrans.at(-1)?.id ?? '')].map((resultat) => {
          fixture.componentRef.setInput('resultats', [resultat]);
          fixture.detectChanges();
          emises.length = 0;
          eleve
            .querySelector<HTMLButtonElement>('[data-testid="presentateur-remediation"]')
            ?.click();
          const cible = resultat.remediation?.ecranId;
          const rang = deroule.ecrans.findIndex(({ id }) => id === cible);
          return {
            question: `${prefixe} ${servi.questionId}`,
            vu: [
              eleve
                .querySelector('[data-testid="presentateur-question"]')
                ?.getAttribute('data-etat'),
              eleve
                .querySelector('[data-testid="presentateur-question-part"]')
                ?.textContent?.trim(),
              emises.at(0) ?? null,
            ],
            servi: [
              resultat.sousLeSeuil ? 'sous-le-seuil' : null,
              formaterPart(resultat.part),
              rang === -1 ? null : rang,
            ],
          };
        });
      }),
    );

    expect(lus.length).toBeGreaterThan(RESULTATS_DU_PUPITRE.length);
    expect(lus.some(({ servi }) => servi[2] !== null)).toBeTrue();
    expect(lus.filter(({ vu, servi }) => JSON.stringify(vu) !== JSON.stringify(servi))).toEqual([]);
  });

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
