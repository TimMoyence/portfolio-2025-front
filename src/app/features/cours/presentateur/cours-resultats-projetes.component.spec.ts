import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { buildEcranDeMission, buildReponsesALaMission } from '../../../../testing/banc-du-pupitre';
import { buildVoteQuestion } from '../../../../testing/factories/cours.factory';
import {
  buildEcranDeroule,
  buildResultatQuestion,
  buildResultatsSeance,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CoursResultatsProjetesComponent } from './cours-resultats-projetes.component';

type Fixture = ComponentFixture<CoursResultatsProjetesComponent>;

const SESSION = 'seance-1';

const ECRAN_VOTE = buildEcranDeroule({
  id: 'ecran-vote',
  type: 'fp-vote',
  donnees: { question: buildVoteQuestion() },
  questions: [
    {
      id: 'Q-CAP-03',
      enonce: buildVoteQuestion().enonce,
      options: buildVoteQuestion().options,
    },
  ],
});

const ECRAN_MISSION = buildEcranDeMission();

describe('CoursResultatsProjetesComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;

  function monter(ecran = ECRAN_VOTE, actif = true, revele = true): Fixture {
    const fixture = TestBed.createComponent(CoursResultatsProjetesComponent);
    fixture.componentRef.setInput('ecran', ecran);
    fixture.componentRef.setInput('revele', revele);
    fixture.componentRef.setInput('sessionId', SESSION);
    fixture.componentRef.setInput(
      'resultats',
      buildResultatsSeance({
        participants: 20,
        questions: [
          buildResultatQuestion({ total: 10, correctes: 6, parOption: { a: 3, b: 6, c: 1 } }),
          buildResultatQuestion({ questionId: 'AUTRE-ECRAN', total: 4 }),
        ],
      }),
    );
    fixture.componentRef.setInput('actif', actif);
    fixture.detectChanges();
    return fixture;
  }

  function tous(fixture: Fixture, marque: string): HTMLElement[] {
    return [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        `[data-testid="${marque}"]`,
      ),
    ];
  }

  beforeEach(() => {
    port = createFormationsPortStub();
    port.lireReponsesLibres.and.returnValue(of({ responses: [] }));
    setupTestBed({
      imports: [CoursResultatsProjetesComponent],
      providers: [{ provide: FORMATIONS_PORT, useValue: port }],
    });
  });

  it('ne projette rien tant que le formateur ne l a pas demande', () => {
    expect(tous(monter(ECRAN_VOTE, false), 'resultats-projetes')).toEqual([]);
  });

  it('projette les comptes et la repartition par option des seules questions de l ecran', () => {
    const fixture = monter();

    expect(tous(fixture, 'resultats-projetes-question').length).toBe(1);
    expect(tous(fixture, 'resultats-projetes-total')[0].textContent?.trim()).toBe('10');
    expect(
      tous(fixture, 'resultats-projetes-barre').map((barre) => barre.textContent?.trim()),
    ).toEqual([
      jasmine.stringContaining('3'),
      jasmine.stringContaining('6'),
      jasmine.stringContaining('1'),
    ]);
    expect(tous(fixture, 'resultats-projetes-participants')[0].textContent).toContain('20');
  });

  it('ne projette la part de reponses justes qu une fois l ecran revele', () => {
    const compte = (fixture: Fixture): string =>
      tous(fixture, 'resultats-projetes-question')[0]
        .querySelector('.resultats-projetes__compte')
        ?.textContent?.replace(/\s+/g, '') ?? '';

    expect(compte(monter(ECRAN_VOTE, true, false))).toBe('10réponse(s)');
    expect(compte(monter())).toBe('10réponse(s)·60%deréponsesjustes');
  });

  it('projette les reponses libres groupees par question, sans nom d etudiant', () => {
    port.lireReponsesLibres.and.returnValue(of(buildReponsesALaMission('Un montant.')));
    const fixture = monter(ECRAN_MISSION);
    fixture.detectChanges();

    const carte = tous(fixture, 'resultats-projetes-libres')[0];
    expect(carte.textContent).toContain('Que mesure chaque chiffre ?');
    expect(carte.textContent).toContain('Un montant.');
    expect(carte.textContent).not.toContain('participant-1');
  });

  it('signale une relecture des reponses libres en echec', () => {
    port.lireReponsesLibres.and.returnValue(throwError(() => new Error('500')));
    const fixture = monter(ECRAN_MISSION);
    fixture.detectChanges();

    expect(tous(fixture, 'resultats-projetes-echec')[0].getAttribute('role')).toBe('alert');
  });

  it('ne relit pas les reponses libres sur un ecran qui n en recoit pas', () => {
    monter();

    expect(port.lireReponsesLibres).not.toHaveBeenCalled();
  });
});
