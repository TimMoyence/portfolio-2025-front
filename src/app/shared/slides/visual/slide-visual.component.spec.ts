import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { ResultatsSeance, Role } from '../../../../cours/content/types';
import { buildRevelationServie } from '../../../../testing/factories/cours.factory';
import {
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../../testing/factories/formations.factory';
import { ecransDuPupitreB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { poserLesEntrees } from '../../../../testing/montage-page';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import {
  ATELIER_CORRIGE,
  TRI_CORRIGE,
  buildVerdictDeQuestion,
  buildVerdictDuTri,
  buildVisualAnswerReviewSlide,
  buildVisualImageHeroSlide,
  buildVisualQuizSlide,
  buildVisualSlide,
  buildVisualSortCorrectionSlide,
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
      fixture.componentRef.setInput('slide', buildVisualSortCorrectionSlide());
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

    function monterLaCorrectionAvecLesComptes(
      entrees: Readonly<Record<string, unknown>>,
      question: Parameters<typeof buildResultatQuestion>[0],
    ): ComponentFixture<SlideVisualComponent> {
      return poserLesEntrees(TestBed.createComponent(SlideVisualComponent), {
        slide: buildVisualSortCorrectionSlide(),
        resultats: buildResultatsSeance({
          questions: [
            buildResultatQuestion({
              questionId: TRI_CORRIGE.sortId,
              ecranId: TRI_CORRIGE.screenId,
              ...question,
            }),
          ],
        }),
        ...entrees,
      });
    }

    it('F07 · projette au presentateur, carte par carte, combien l ont bien placee', () => {
      const fixture = monterLaCorrectionAvecLesComptes(
        { role: 'presentateur' },
        {
          total: 12,
          parCle: { inflation: { total: 12, justes: 5 }, 'ca-2025': { total: 12, justes: 11 } },
        },
      );
      const element = fixture.nativeElement as HTMLElement;
      const compte = (id: string): string =>
        element
          .querySelector(`[data-carte="${id}"] [data-testid="sort-review-compte"]`)
          ?.textContent?.replace(/\s+/g, ' ')
          .trim() ?? '';

      expect(compte('inflation')).toBe('5 / 12 bien placée');
      expect(compte('ca-2025')).toBe('11 / 12 bien placée');
    });

    it('F07 · ne montre aucun compte de classe a l etudiant', () => {
      const fixture = monterLaCorrectionAvecLesComptes(
        {},
        { parCle: { inflation: { total: 12, justes: 5 } } },
      );

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[data-testid="sort-review-compte"]'),
      ).toBeNull();
    });
  });

  describe('correction des reponses', () => {
    const [EVOLUTION, PART] = ATELIER_CORRIGE.questions;

    function monter(
      role: Role,
      retours: ReadonlyMap<string, RetourBrique[]> = new Map(),
      resultats: ResultatsSeance | null = null,
    ): HTMLElement {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput(
        'slide',
        buildVisualAnswerReviewSlide({
          revelation: buildRevelationServie({
            ecranId: ATELIER_CORRIGE.screenId,
            questions: [{ questionId: PART, cible: '45,5 %', optionId: null }],
          }),
        }),
      );
      fixture.componentRef.setInput('role', role);
      fixture.componentRef.setInput('retours', retours);
      fixture.componentRef.setInput('resultats', resultats);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    function ligne(element: HTMLElement, reference: string): HTMLElement | null {
      return element.querySelector<HTMLElement>(`[data-reference="${reference}"]`);
    }

    it('T6 · rend l ecran answer-review avec le layout de correction', () => {
      const element = monter('etudiant');

      expect(element.querySelector('app-slide-answer-review')).not.toBeNull();
      expect(element.querySelector('[role="alert"]')).toBeNull();
    });

    it('T6 · montre a l etudiant sa reponse attendue et ses verdicts sur l ecran source', () => {
      const element = monter(
        'etudiant',
        new Map([
          [
            ATELIER_CORRIGE.screenId,
            [buildVerdictDeQuestion(EVOLUTION, true), buildVerdictDeQuestion(PART, false)],
          ],
          ['B2-01-AUTRE', [buildVerdictDeQuestion(EVOLUTION, false)]],
        ]),
      );

      expect(ligne(element, PART)?.textContent).toContain('45,5 %');
      expect(ligne(element, EVOLUTION)?.classList).toContain(
        'slide-answer-review__explication--juste',
      );
      expect(ligne(element, PART)?.classList).toContain('slide-answer-review__explication--erreur');
    });

    it('T10 · projette au presentateur la reussite de la classe sur les questions de la source', () => {
      const element = monter(
        'presentateur',
        new Map(),
        buildResultatsSeance({
          questions: [
            buildResultatQuestion({
              questionId: EVOLUTION,
              ecranId: ATELIER_CORRIGE.screenId,
              total: 20,
              correctes: 14,
            }),
            buildResultatQuestion({ questionId: PART, ecranId: 'B2-01-AUTRE', total: 9 }),
          ],
        }),
      );

      expect(ligne(element, EVOLUTION)?.textContent).toContain('14 / 20');
      expect(ligne(element, PART)?.querySelector('.slide-answer-review__reussite')).toBeNull();
    });

    it('T6 · colore en vert et rouge chaque énigme du coffre sur sa correction du B2-01', () => {
      const correction = ecransDuPupitreB2_01().find(({ id }) => id === 'B2-01-A6-02-CORRECTION');
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', correction);
      fixture.componentRef.setInput('role', 'etudiant');
      fixture.componentRef.setInput(
        'retours',
        new Map<string, RetourBrique[]>([
          [
            'B2-01-A6-02-COFFRE',
            [
              {
                kind: 'progression-enigmes',
                parcoursId: 'b2-01-a6-coffre',
                resolues: [{ enigmeId: 'b2-01-a6-e1-mix', fragment: 'A' }],
                tentativesRestantes: { 'b2-01-a6-e1-mix': 2, 'b2-01-a6-e2-points': 0 },
              },
            ],
          ],
        ]),
      );
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      expect(ligne(element, 'b2-01-a6-e1-mix')?.classList).toContain(
        'slide-answer-review__explication--juste',
      );
      expect(ligne(element, 'b2-01-a6-e2-points')?.classList).toContain(
        'slide-answer-review__explication--erreur',
      );
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
