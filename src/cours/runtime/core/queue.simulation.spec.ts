import * as fc from 'fast-check';
import { buildEnvoiReponse } from '../../../testing/factories/queue.factory';
import { verifierLaProprieteAsynchrone } from '../../../testing/proprietes';
import { enqueue, flush, pending } from './queue';
import { removeKey } from './storage';

const CLE = 'fp.file-reponses';
const TOURS = 120;

type Coup = { readonly depose: string } | { readonly reseau: boolean };

const coup: fc.Arbitrary<Coup> = fc.oneof(
  fc.stringMatching(/^Q-\d{1,3}$/).map((depose) => ({ depose })),
  fc.boolean().map((reseau) => ({ reseau })),
);

function marque(envoi: { questionId: string; horodatage: string }): string {
  return `${envoi.questionId}@${envoi.horodatage}`;
}

describe('simulation : la file hors ligne ne perd ni ne double aucun envoi', () => {
  beforeEach(() => removeKey(CLE));
  afterEach(() => removeKey(CLE));

  it('garde l’égalité « acquittés ∪ file = soumis » sur des coupures tirées à graine fixe', async () => {
    await verifierLaProprieteAsynchrone(
      fc.asyncProperty(fc.array(coup, { minLength: 1, maxLength: 40 }), async (coups) => {
        removeKey(CLE);
        const soumis: string[] = [];
        const acquittes: string[] = [];
        let rang = 0;

        for (const joue of coups) {
          if ('depose' in joue) {
            rang += 1;
            const envoi = buildEnvoiReponse({
              questionId: joue.depose,
              horodatage: `2026-09-20T00:00:${String(rang).padStart(2, '0')}.000Z`,
            });
            enqueue(envoi);
            soumis.push(marque(envoi));
          } else {
            await flush((envoi) => {
              if (!joue.reseau) {
                return false;
              }
              acquittes.push(marque(envoi));
              return true;
            });
          }
        }

        const restants = pending().map(marque);

        expect(new Set(acquittes).size).toBe(acquittes.length);
        expect(new Set(restants).size).toBe(restants.length);
        expect([...acquittes, ...restants].sort((a, b) => a.localeCompare(b))).toEqual(
          [...soumis].sort((a, b) => a.localeCompare(b)),
        );
      }),
      TOURS,
    );
  });

  it('garde l’ordre de dépôt des envois qui restent en file après un réseau coupé', async () => {
    await verifierLaProprieteAsynchrone(
      fc.asyncProperty(
        fc.uniqueArray(fc.stringMatching(/^Q-\d{1,3}$/), { minLength: 1, maxLength: 20 }),
        async (questions) => {
          removeKey(CLE);
          for (const questionId of questions) {
            enqueue(buildEnvoiReponse({ questionId }));
          }

          await flush(() => false);

          expect(pending().map((envoi) => envoi.questionId)).toEqual(questions);
        },
      ),
      TOURS,
    );
  });

  it('retire exactement les envois acquittés quand le réseau ne revient qu’à moitié', async () => {
    await verifierLaProprieteAsynchrone(
      fc.asyncProperty(
        fc.uniqueArray(fc.stringMatching(/^Q-\d{1,3}$/), { minLength: 2, maxLength: 16 }),
        fc.array(fc.boolean(), { minLength: 2, maxLength: 16 }),
        async (questions, reussites) => {
          removeKey(CLE);
          for (const questionId of questions) {
            enqueue(buildEnvoiReponse({ questionId }));
          }
          let visite = 0;
          const attendus = questions.filter((_, rang) => !(reussites[rang] ?? false));

          await flush(() => {
            const reussi = reussites[visite] ?? false;
            visite += 1;
            return reussi;
          });

          expect(visite).toBe(questions.length);
          expect(pending().map((envoi) => envoi.questionId)).toEqual(attendus);
        },
      ),
      TOURS,
    );
  });
});
