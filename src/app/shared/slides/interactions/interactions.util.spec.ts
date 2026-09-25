import { DestroyRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
import {
  buildInteractionsResponse,
  createPresentationPortStub,
} from '../../../../testing/factories/presentation.factory';
import {
  chargerInteraction,
  flattenInteractions,
  loadInteraction,
  type ChargementInteraction,
  type FlatInteraction,
} from './interactions.util';

describe('interactions.util', () => {
  describe('chargerInteraction', () => {
    interface Sondage {
      type: string;
      question: string;
    }

    function chargement(
      overrides: Partial<ChargementInteraction<Sondage>> = {},
    ): ChargementInteraction<Sondage> {
      return {
        enLigne: null,
        port: createPresentationPortStub(
          buildInteractionsResponse({
            interactions: {
              'slide-a': { present: [{ type: 'poll', question: 'servie', options: [] }] },
            },
          }),
        ),
        slug: 'demo',
        type: 'poll',
        interactionId: 'slide-a',
        cible: signal<Sondage | null>(null),
        erreur: signal(false),
        destroyRef: TestBed.inject(DestroyRef),
        ...overrides,
      };
    }

    it("pose l'interaction en ligne sans interroger le port", () => {
      const port = createPresentationPortStub();
      const courant = chargement({ enLigne: { type: 'poll', question: 'en ligne' }, port });

      chargerInteraction(courant);

      expect(courant.cible()?.question).toBe('en ligne');
      expect(port.getInteractions).not.toHaveBeenCalled();
    });

    function attendreUneErreur(courant: ChargementInteraction<Sondage>): void {
      chargerInteraction(courant);

      expect(courant.erreur()).toBeTrue();
      expect(courant.cible()).toBeNull();
    }

    it("signale une erreur quand aucun port n'est fourni", () => {
      attendreUneErreur(chargement({ port: null }));
    });

    it("pose l'interaction trouvee par le port", () => {
      const courant = chargement();

      chargerInteraction(courant);

      expect(courant.cible()?.question).toBe('servie');
      expect(courant.erreur()).toBeFalse();
    });

    it('signale une erreur quand le port echoue', () => {
      const port = createPresentationPortStub();
      port.getInteractions.and.returnValue(throwError(() => new Error('network')));

      attendreUneErreur(chargement({ port }));
    });
  });

  function sourceImbriquee(slideA: Record<string, readonly object[]>) {
    return of({ slug: 'demo', interactions: { 'slide-a': slideA } });
  }

  describe('flattenInteractions / normaliseInteractions', () => {
    it('aplatit la shape nested {interactions:{slideId:{scroll|present}}} en derivant slideId', (done) => {
      const source = sourceImbriquee({
        scroll: [{ type: 'reflection', question: 'Q1' }],
        present: [{ type: 'poll', question: 'Q2' }],
      });

      flattenInteractions(source).subscribe((list) => {
        expect(list.length).toBe(2);
        expect(list[0].slideId).toBe('slide-a');
        expect(list[0].type).toBe('poll');
        expect(list[1].slideId).toBe('slide-a');
        expect(list[1].type).toBe('reflection');
        done();
      });
    });

    it('tolere la shape legacy flat et derive slideId depuis id quand absent', (done) => {
      const source = of([
        { id: 'q1', type: 'quiz', question: 'legacy' },
        { slideId: 's2', type: 'poll', question: 'explicit' },
      ]);

      flattenInteractions(source).subscribe((list) => {
        expect(list.length).toBe(2);
        expect(list[0].slideId).toBe('q1');
        expect(list[0].type).toBe('quiz');
        expect(list[1].slideId).toBe('s2');
        done();
      });
    });

    it('retourne [] pour des entrees invalides (null, non-objet, sans interactions)', (done) => {
      flattenInteractions(of(null)).subscribe((a) => {
        expect(a).toEqual([]);
        flattenInteractions(of(42)).subscribe((b) => {
          expect(b).toEqual([]);
          flattenInteractions(of({ slug: 'x' })).subscribe((c) => {
            expect(c).toEqual([]);
            done();
          });
        });
      });
    });
  });

  describe('loadInteraction', () => {
    interface Reflection extends FlatInteraction {
      question: string;
    }

    function chargerSansErreur<T extends FlatInteraction>(
      source: Observable<unknown>,
      type: string,
      id: string,
    ): Observable<T | null> {
      return loadInteraction<T>(source, type, id, () => fail('onError ne devrait pas etre appele'));
    }

    it("trouve l'interaction par slideId (shape nested)", (done) => {
      const source = sourceImbriquee({ scroll: [{ type: 'reflection', question: 'trouvee' }] });

      chargerSansErreur<Reflection>(source, 'reflection', 'slide-a').subscribe((found) => {
        expect(found).not.toBeNull();
        expect(found?.question).toBe('trouvee');
        done();
      });
    });

    it("trouve l'interaction par id legacy", (done) => {
      const source = of([{ id: 'q1', type: 'quiz', question: 'legacy-quiz' }]);

      chargerSansErreur(source, 'quiz', 'q1').subscribe((found) => {
        expect(found).not.toBeNull();
        expect(found?.type).toBe('quiz');
        done();
      });
    });

    it('retourne null si le type ne correspond pas (mismatch)', (done) => {
      const source = sourceImbriquee({ scroll: [{ type: 'reflection', question: 'x' }] });

      chargerSansErreur(source, 'poll', 'slide-a').subscribe((found) => {
        expect(found).toBeNull();
        done();
      });
    });

    it('appelle onError et retourne null quand la source emet une erreur', (done) => {
      const onError = jasmine.createSpy('onError');
      const source = throwError(() => new Error('network'));

      loadInteraction<FlatInteraction>(source, 'poll', 'slide-a', onError).subscribe((found) => {
        expect(found).toBeNull();
        expect(onError).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
