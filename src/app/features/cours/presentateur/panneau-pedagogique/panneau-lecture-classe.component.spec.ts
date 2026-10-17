import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type {
  EcranDeroule,
  ProgressionEnigme,
  ResultatQuestion,
} from '../../../../../cours/content/types';
import type { ReponseLibreFormateur } from '../../../../core/ports/formations.port';
import { enoncesDesActivites } from '../../../../shared/slides/session/lecture-ecran';
import {
  buildProgressionEnigme,
  buildReponseLibreFormateur,
  buildResultatQuestion,
} from '../../../../../testing/factories/formations.factory';
import { ecransDuPupitreDe } from '../../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../../testing/fixtures/instantanes-des-cours';
import { ecranNomme } from '../../../../../testing/montage-d-instantane';
import { PanneauLectureClasseComponent } from './panneau-lecture-classe.component';

type Fixture = ComponentFixture<PanneauLectureClasseComponent>;

interface Classe {
  readonly participants: number;
  readonly resultats?: readonly ResultatQuestion[];
  readonly enigmes?: readonly ProgressionEnigme[];
  readonly reponsesLibres?: readonly ReponseLibreFormateur[];
}

const ECRANS_SERVIS: readonly EcranDeroule[] = INSTANTANES_DES_COURS_SERVIS.flatMap(
  ([, instantane]) => ecransDuPupitreDe(instantane),
);

function ecranServi(id: string): EcranDeroule {
  return ecranNomme(ECRANS_SERVIS, id);
}

function parcoursDe(ecran: EcranDeroule): {
  readonly id: string;
  readonly enigmes: readonly string[];
} | null {
  const parcours = ecran.donnees?.['parcours'] as
    { readonly id: string; readonly enigmes: readonly { readonly id: string }[] } | undefined;
  return parcours === undefined
    ? null
    : { id: parcours.id, enigmes: parcours.enigmes.map(({ id }) => id) };
}

function monter(ecran: EcranDeroule, classe: Classe): Fixture {
  const fixture = TestBed.createComponent(PanneauLectureClasseComponent);
  fixture.componentRef.setInput('ecran', ecran);
  fixture.componentRef.setInput('resultats', classe.resultats ?? []);
  fixture.componentRef.setInput('enigmes', classe.enigmes ?? []);
  fixture.componentRef.setInput('reponsesLibres', classe.reponsesLibres ?? []);
  fixture.componentRef.setInput('participants', classe.participants);
  fixture.detectChanges();
  return fixture;
}

function texte(element: Element | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').replace(/ %/g, '%').trim();
}

function lignes(fixture: Fixture): readonly (readonly string[])[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="lecture-classe-ligne"]'),
    (ligne) => Array.from(ligne.querySelectorAll('th, td'), texte),
  );
}

function confiance(fixture: Fixture): string | null {
  const element = (fixture.nativeElement as HTMLElement).querySelector(
    '[data-testid="lecture-classe-confiance"]',
  );
  return element === null ? null : texte(element);
}

function classeEntiere(ecran: EcranDeroule): Required<Classe> {
  const parcours = parcoursDe(ecran);
  const enigmes = parcours?.enigmes ?? [];
  const questions = ecran.questions.map(({ id }) => id);
  const activites = [...enoncesDesActivites(ecran).keys()].filter((id) => !questions.includes(id));
  return {
    participants: 2,
    resultats: questions
      .filter((id) => !enigmes.includes(id))
      .map((questionId) =>
        buildResultatQuestion({
          questionId,
          ecranId: ecran.id,
          total: 2,
          correctes: 1,
          scoreMoyen: 0.5,
        }),
      ),
    enigmes: enigmes.map((enigmeId) =>
      buildProgressionEnigme({
        parcoursId: parcours?.id ?? '',
        enigmeId,
        ouvertes: 2,
        resolues: 1,
      }),
    ),
    reponsesLibres: activites.flatMap((activityId) =>
      ['participant-1', 'participant-2'].map((participantId) =>
        buildReponseLibreFormateur({
          id: `${participantId}-${activityId}`,
          participantId,
          screenId: ecran.id,
          activityId,
        }),
      ),
    ),
  };
}

describe('PanneauLectureClasseComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauLectureClasseComponent] }));

  const ATELIER = 'B2-03-A1-10-ATELIER-CONNECTEURS';

  it('donne une ligne par question de l atelier, chacune lue sur les présents', () => {
    const fixture = monter(ecranServi(ATELIER), {
      participants: 2,
      resultats: [
        buildResultatQuestion({ questionId: 'b2-03-a1-implication', total: 2, correctes: 1 }),
        buildResultatQuestion({ questionId: 'b2-03-a1-f205', total: 1, correctes: 1 }),
        buildResultatQuestion({ questionId: 'b2-03-a2-formule', total: 20, correctes: 20 }),
      ],
    });

    expect(lignes(fixture)).toEqual([
      ['Q1', '2 / 2', '50%'],
      ['Q2', '1 / 2', '100%'],
    ]);
    expect(confiance(fixture)).toBe('À confirmer');
  });

  it('annonce l absence de donnees tant que personne n a repondu sur l ecran', () => {
    const fixture = monter(ecranServi(ATELIER), { participants: 12 });

    expect(lignes(fixture)).toEqual([
      ['Q1', '0 / 12', '—'],
      ['Q2', '0 / 12', '—'],
    ]);
    expect(confiance(fixture)).toBe('Aucune donnée');
  });

  it('juge le diagnostic solide quand chaque question atteint 90 % de couverture', () => {
    const ecran = ecranServi(ATELIER);
    const resultats = (couverture: number): readonly ResultatQuestion[] =>
      ecran.questions.map(({ id }, rang) =>
        buildResultatQuestion({ questionId: id, total: rang === 0 ? couverture : 9, correctes: 5 }),
      );

    expect(confiance(monter(ecran, { participants: 10, resultats: resultats(9) }))).toBe('Solide');
    expect(confiance(monter(ecran, { participants: 10, resultats: resultats(8) }))).toBe(
      'À confirmer',
    );
  });

  it('lit une production par son score moyen', () => {
    const fixture = monter(ecranServi('B2-03-A2-06-TABLEUR-NON-OU'), {
      participants: 2,
      resultats: [
        buildResultatQuestion({
          questionId: 'b2-03-a2-tableur-non-ou',
          type: 'feuille',
          total: 2,
          correctes: 0,
          scoreMoyen: 0.75,
        }),
      ],
    });

    expect(lignes(fixture)).toEqual([['Q1', '2 / 2', '75%']]);
  });

  it('lit chaque enigme du coffre par la progression de la classe dans son parcours', () => {
    const ecran = ecranServi('B2-03-A4-03-COFFRE-CONTROLE');
    const parcours = parcoursDe(ecran);
    const [e1, e2, e3, e4] = parcours?.enigmes ?? [];
    const fixture = monter(ecran, {
      participants: 2,
      enigmes: [
        buildProgressionEnigme({
          parcoursId: parcours?.id,
          enigmeId: e1,
          ouvertes: 1,
          resolues: 1,
        }),
        buildProgressionEnigme({
          parcoursId: parcours?.id,
          enigmeId: e2,
          ouvertes: 2,
          resolues: 1,
        }),
        buildProgressionEnigme({
          parcoursId: parcours?.id,
          enigmeId: e3,
          ouvertes: 1,
          resolues: 0,
        }),
        buildProgressionEnigme({ parcoursId: 'K-AUTRE', enigmeId: e4, ouvertes: 9, resolues: 9 }),
      ],
    });

    expect(lignes(fixture)).toEqual([
      ['Q1', '1 / 2', '100%'],
      ['Q2', '2 / 2', '50%'],
      ['Q3', '1 / 2', '0%'],
      ['Q4', '0 / 2', '—'],
    ]);
  });

  it('compte les auteurs d une reflexion, sans taux ni diagnostic', () => {
    const ecran = ecranServi('B2-03-A2-01-CONTRAIRE');
    const [activityId] = [...enoncesDesActivites(ecran).keys()];
    const fixture = monter(ecran, {
      participants: 2,
      reponsesLibres: [
        buildReponseLibreFormateur({
          id: 'r1',
          participantId: 'p1',
          screenId: ecran.id,
          activityId,
        }),
        buildReponseLibreFormateur({
          id: 'r2',
          participantId: 'p1',
          screenId: ecran.id,
          activityId,
        }),
        buildReponseLibreFormateur({
          id: 'r3',
          participantId: 'p2',
          screenId: ecran.id,
          activityId,
        }),
        buildReponseLibreFormateur({
          id: 'r4',
          participantId: 'p3',
          screenId: 'AUTRE',
          activityId,
        }),
      ],
    });

    expect(lignes(fixture)).toEqual([['Q1', '2 / 2', '']]);
    expect(confiance(fixture)).toBeNull();
  });

  it('ne montre rien sur un ecran sans question ni activite', () => {
    const fixture = monter(ecranServi('B2-03-A1-02-ACCROCHE'), { participants: 2 });

    expect(lignes(fixture)).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('.panneau-lecture')).toBeNull();
  });

  describe('sur chaque ecran des cours servis, quand toute la classe a repondu', () => {
    const ECRANS_LUS = ECRANS_SERVIS.filter(
      (ecran) => ecran.questions.length > 0 || enoncesDesActivites(ecran).size > 0,
    );

    it('trouve des ecrans a lire dans chaque cours servi', () => {
      for (const [prefixe, instantane] of INSTANTANES_DES_COURS_SERVIS) {
        const lus = ecransDuPupitreDe(instantane).filter((ecran) => ECRANS_LUS.includes(ecran));
        expect(lus.length).withContext(prefixe).toBeGreaterThan(0);
      }
    });

    for (const ecran of ECRANS_LUS) {
      it(`${ecran.id} : chaque question et chaque activite se lit « 2 / 2 », jamais « — »`, () => {
        const classe = classeEntiere(ecran);
        const fixture = monter(ecran, classe);
        const attendues = [
          ...ecran.questions.map(() => '50%'),
          ...classe.reponsesLibres.filter((_, rang) => rang % 2 === 0).map(() => ''),
        ];

        expect(lignes(fixture)).toEqual(
          attendues.map((taux, rang) => [`Q${rang + 1}`, '2 / 2', taux]),
        );
      });
    }
  });
});
