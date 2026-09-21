import * as fc from 'fast-check';
import type { EtatParticipant } from '../../../cours/content/types';
import type { RetourBrique } from '../../shared/slides/session/contrat-hote';
import { buildEtatParticipant } from '../../../testing/factories/formations.factory';
import { ajouterRetours, retirerLesRefus, retoursDeLEtat } from './retours-brique';

const GRAINE = 20260920;
const TOURS = 300;

const identifiant = fc.stringMatching(/^[a-z]{1,6}$/);

const detail = fc.record({
  cle: identifiant,
  juste: fc.boolean(),
  libelleConfusion: fc.option(identifiant, { nil: null }),
});

const reponseServie = fc.record({
  questionId: identifiant,
  valeur: fc.oneof(fc.double({ noNaN: true }), identifiant),
  correcte: fc.boolean(),
  score: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: null }),
  details: fc.option(fc.array(detail, { maxLength: 3 }), { nil: null }),
  libelleConfusion: fc.option(identifiant, { nil: null }),
});

const parcoursServi = fc.record({
  parcoursId: identifiant,
  resolues: fc.array(fc.record({ enigmeId: identifiant, fragment: identifiant }), { maxLength: 3 }),
  tentativesRestantes: fc.dictionary(identifiant, fc.nat({ max: 10 }), { maxKeys: 3 }),
});

const etatServi = fc
  .record({
    reponses: fc.uniqueArray(reponseServie, {
      maxLength: 8,
      selector: (reponse) => reponse.questionId,
    }),
    enigmes: fc.uniqueArray(parcoursServi, {
      maxLength: 4,
      selector: (parcours) => parcours.parcoursId,
    }),
  })
  .map((parts) => buildEtatParticipant(parts as Partial<EtatParticipant>));

const ecranDe = (identifiantPorte: string): string | null =>
  identifiantPorte.startsWith('z') ? null : `ecran-${identifiantPorte[0]}`;

function tousLesRetours(carte: ReadonlyMap<string, readonly RetourBrique[]>): RetourBrique[] {
  return [...carte.values()].flat();
}

describe('simulation : reconstruction des retours à la reprise (AC-33)', () => {
  it('ne pose que des retours dont l’écran est connu, et jamais deux fois le même verdict', () => {
    fc.assert(
      fc.property(etatServi, (etat) => {
        const carte = retoursDeLEtat(etat, ecranDe);
        const poses = tousLesRetours(carte);
        const questionsPortees = etat.reponses
          .map((reponse) => reponse.questionId)
          .filter((questionId) => ecranDe(questionId) !== null);
        const parcoursPortes = etat.enigmes
          .map((parcours) => parcours.parcoursId)
          .filter((parcoursId) => ecranDe(parcoursId) !== null);

        expect(poses.length).toBe(questionsPortees.length * 2 + parcoursPortes.length);
        for (const [screenId, retours] of carte) {
          expect(screenId).not.toBe('');
          expect(retours.length).toBeGreaterThan(0);
        }
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('choisit le verdict de production si et seulement si le serveur a servi des détails', () => {
    fc.assert(
      fc.property(etatServi, (etat) => {
        const poses = tousLesRetours(retoursDeLEtat(etat, ecranDe));
        const detaillees = new Set(
          etat.reponses
            .filter((reponse) => reponse.details !== null && ecranDe(reponse.questionId) !== null)
            .map((reponse) => reponse.questionId),
        );

        for (const retour of poses) {
          if (retour.kind === 'verdict-production') {
            expect(detaillees.has(retour.questionId)).toBeTrue();
            expect(Number.isFinite(retour.score)).toBeTrue();
          }
          if (retour.kind === 'verdict-reponse') {
            expect(detaillees.has(retour.questionId)).toBeFalse();
          }
        }
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});

describe('simulation : arrivée désordonnée des verdicts sur les écrans', () => {
  const verdictPour = (questionId: string): RetourBrique => ({
    kind: 'verdict-reponse',
    questionId,
    correcte: true,
    libelleConfusion: null,
  });
  const refus: RetourBrique = { kind: 'refus', motif: 'reseau', message: 'Coupure.' };

  it('pose exactement un verdict par question quel que soit l’ordre d’arrivée', () => {
    fc.assert(
      fc.property(fc.uniqueArray(identifiant, { minLength: 1, maxLength: 20 }), (questions) => {
        const arrivees = [...questions].reverse();
        const carte = arrivees.reduce<ReadonlyMap<string, readonly RetourBrique[]>>(
          (etat, questionId) =>
            ajouterRetours(etat, `ecran-${questionId}`, [verdictPour(questionId)]),
          new Map(),
        );

        expect(carte.size).toBe(questions.length);
        for (const questionId of questions) {
          expect(carte.get(`ecran-${questionId}`)).toEqual([verdictPour(questionId)]);
        }
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('ne perd aucun verdict quand des refus s’intercalent puis sont retirés', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            identifiant.map((q) => ({ q })),
            fc.constant(null),
          ),
          {
            minLength: 1,
            maxLength: 25,
          },
        ),
        (evenements) => {
          const ecran = 'ecran-unique';
          let carte: ReadonlyMap<string, readonly RetourBrique[]> = new Map();
          const attendus: string[] = [];
          for (const evenement of evenements) {
            if (evenement === null) {
              carte = ajouterRetours(carte, ecran, [refus]);
            } else {
              carte = retirerLesRefus(carte, ecran);
              carte = ajouterRetours(carte, ecran, [verdictPour(evenement.q)]);
              attendus.push(evenement.q);
            }
          }
          const restants = (carte.get(ecran) ?? []).filter(
            (retour) => retour.kind === 'verdict-reponse',
          );

          expect(restants.map((retour) => retour.questionId)).toEqual(attendus);
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});
