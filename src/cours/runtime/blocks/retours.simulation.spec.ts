import * as fc from 'fast-check';
import { estObjet, estVerdictDeProduction, estVerdictDeReponse } from './retours';

const GRAINE = 20260920;
const TOURS = 500;

const texte = fc.string({ maxLength: 12 });

const detailValide = fc.record({
  cle: texte,
  juste: fc.boolean(),
  libelleConfusion: fc.option(texte, { nil: null }),
});

const verdictDeReponseValide = fc.record({
  questionId: texte,
  correcte: fc.boolean(),
  libelleConfusion: fc.option(texte, { nil: null }),
});

const verdictDeProductionValide = fc.record({
  questionId: texte,
  correcte: fc.boolean(),
  score: fc.double({ noNaN: true }),
  details: fc.array(detailValide, { maxLength: 5 }),
});

describe('simulation : gardes de type sur les verdicts venus du serveur', () => {
  it('ne lève jamais et rend toujours un booléen, sur n’importe quelle valeur', () => {
    fc.assert(
      fc.property(fc.anything({ maxDepth: 4 }), (valeur) => {
        expect(typeof estObjet(valeur)).toBe('boolean');
        expect(typeof estVerdictDeReponse(valeur)).toBe('boolean');
        expect(typeof estVerdictDeProduction(valeur)).toBe('boolean');
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('accepte tout verdict bien formé', () => {
    fc.assert(
      fc.property(verdictDeReponseValide, (verdict) => {
        expect(estVerdictDeReponse(verdict)).toBeTrue();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
    fc.assert(
      fc.property(verdictDeProductionValide, (verdict) => {
        expect(estVerdictDeProduction(verdict)).toBeTrue();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('refuse un verdict de production dès qu’un seul détail sort du contrat', () => {
    fc.assert(
      fc.property(
        verdictDeProductionValide,
        fc.anything({ maxDepth: 2 }),
        fc.nat({ max: 5 }),
        (verdict, intrus, position) => {
          if (estObjet(intrus)) {
            return;
          }
          const details = [...verdict.details];
          details.splice(Math.min(position, details.length), 0, intrus as never);

          expect(estVerdictDeProduction({ ...verdict, details })).toBeFalse();
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('refuse un verdict dont un champ obligatoire est effacé', () => {
    fc.assert(
      fc.property(
        verdictDeProductionValide,
        fc.constantFrom('questionId', 'correcte', 'score', 'details'),
        (verdict, champ) => {
          const ampute: Record<string, unknown> = { ...verdict };
          delete ampute[champ];

          expect(estVerdictDeProduction(ampute)).toBeFalse();
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('ne prend jamais un tableau pour un verdict', () => {
    fc.assert(
      fc.property(fc.array(fc.anything({ maxDepth: 2 }), { maxLength: 4 }), (tableau) => {
        expect(estObjet(tableau)).toBeFalse();
        expect(estVerdictDeReponse(tableau)).toBeFalse();
        expect(estVerdictDeProduction(tableau)).toBeFalse();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});
