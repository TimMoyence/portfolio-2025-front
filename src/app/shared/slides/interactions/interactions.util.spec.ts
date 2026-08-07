import { of, throwError } from 'rxjs';
import { flattenInteractions, loadInteraction, type FlatInteraction } from './interactions.util';

describe('interactions.util', () => {
  describe('flattenInteractions / normaliseInteractions', () => {
    it('aplatit la shape nested {interactions:{slideId:{scroll|present}}} en derivant slideId', (done) => {
      const source = of({
        slug: 'demo',
        interactions: {
          'slide-a': {
            scroll: [{ type: 'reflection', question: 'Q1' }],
            present: [{ type: 'poll', question: 'Q2' }],
          },
        },
      });

      flattenInteractions(source).subscribe((list) => {
        expect(list.length).toBe(2);
        // L'aplatissement parcourt `present` avant `scroll` (ordre preserve).
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
        // slideId derive de id quand slideId absent
        expect(list[0].slideId).toBe('q1');
        expect(list[0].type).toBe('quiz');
        // slideId explicite preserve
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

    it("trouve l'interaction par slideId (shape nested)", (done) => {
      const source = of({
        slug: 'demo',
        interactions: {
          'slide-a': { scroll: [{ type: 'reflection', question: 'trouvee' }] },
        },
      });

      loadInteraction<Reflection>(source, 'reflection', 'slide-a', () =>
        fail('onError ne devrait pas etre appele'),
      ).subscribe((found) => {
        expect(found).not.toBeNull();
        expect(found?.question).toBe('trouvee');
        done();
      });
    });

    it("trouve l'interaction par id legacy", (done) => {
      const source = of([{ id: 'q1', type: 'quiz', question: 'legacy-quiz' }]);

      loadInteraction<FlatInteraction>(source, 'quiz', 'q1', () =>
        fail('onError ne devrait pas etre appele'),
      ).subscribe((found) => {
        expect(found).not.toBeNull();
        expect(found?.type).toBe('quiz');
        done();
      });
    });

    it('retourne null si le type ne correspond pas (mismatch)', (done) => {
      const source = of({
        slug: 'demo',
        interactions: {
          'slide-a': { scroll: [{ type: 'reflection', question: 'x' }] },
        },
      });

      loadInteraction<FlatInteraction>(source, 'poll', 'slide-a', () =>
        fail('onError ne devrait pas etre appele'),
      ).subscribe((found) => {
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
