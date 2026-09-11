import { removeKey } from './storage';
import { enqueue, flush, pending, type EnvoiReponse } from './queue';

const CLE = 'fp.file-reponses';

function buildEnvoi(overrides: Partial<Omit<EnvoiReponse, 'id'>> = {}): Omit<EnvoiReponse, 'id'> {
  return {
    sessionId: 'b1-09-interets-composes',
    studentKey: 'etu-1',
    questionId: 'Q-CAP-03',
    valeur: 'b',
    dureeMs: 4200,
    horodatage: '2026-09-11T08:00:00.000Z',
    ...overrides,
  };
}

describe('queue', () => {
  beforeEach(() => {
    removeKey(CLE);
  });

  it('demarre vide', () => {
    expect(pending()).toEqual([]);
  });

  it('ecrit une reponse mise en file dans localStorage avec un identifiant', () => {
    enqueue(buildEnvoi());
    const brut = globalThis.localStorage.getItem(CLE);
    expect(brut).not.toBeNull();
    expect(JSON.parse(brut ?? '[]')).toEqual([{ ...buildEnvoi(), id: 1 }]);
  });

  it('une reponse mise en file survit a une relecture depuis le stockage', () => {
    enqueue(buildEnvoi({ questionId: 'Q-1' }));
    const relue = JSON.parse(globalThis.localStorage.getItem(CLE) ?? '[]') as EnvoiReponse[];
    expect(relue).toEqual([{ ...buildEnvoi({ questionId: 'Q-1' }), id: 1 }]);
    expect(pending()).toEqual(relue);
  });

  it('flush vide la file quand l envoi reussit', async () => {
    enqueue(buildEnvoi());
    await flush(() => true);
    expect(pending()).toEqual([]);
  });

  it('un envoi en echec est conserve et retente', async () => {
    enqueue(buildEnvoi());
    await flush(() => false);
    expect(pending().length).toBe(1);
    await flush(() => true);
    expect(pending()).toEqual([]);
  });

  it('preserve l ordre des envois qui restent apres un echec partiel', async () => {
    enqueue(buildEnvoi({ questionId: 'Q-1' }));
    enqueue(buildEnvoi({ questionId: 'Q-2' }));
    enqueue(buildEnvoi({ questionId: 'Q-3' }));
    await flush((envoi) => envoi.questionId === 'Q-2');
    expect(pending().map((envoi) => envoi.questionId)).toEqual(['Q-1', 'Q-3']);
  });

  it('rejoue les envois dans leur ordre de soumission', async () => {
    const ordreAppels: string[] = [];
    enqueue(buildEnvoi({ questionId: 'Q-1' }));
    enqueue(buildEnvoi({ questionId: 'Q-2' }));
    enqueue(buildEnvoi({ questionId: 'Q-3' }));
    await flush((envoi) => {
      ordreAppels.push(envoi.questionId);
      return true;
    });
    expect(ordreAppels).toEqual(['Q-1', 'Q-2', 'Q-3']);
  });

  it('refuse une nouvelle entree au plafond de 200 et le signale au lieu d evincer', () => {
    for (let indice = 0; indice < 200; indice += 1) {
      enqueue(buildEnvoi({ questionId: `Q-${indice}` }));
    }
    expect(() => enqueue(buildEnvoi({ questionId: 'Q-200' }))).toThrow();
    const file = pending();
    expect(file.length).toBe(200);
    expect(file[0].questionId).toBe('Q-0');
    expect(file[199].questionId).toBe('Q-199');
  });

  it('une reponse ajoutee pendant un flush en cours n est pas perdue', async () => {
    enqueue(buildEnvoi({ questionId: 'Q-1' }));
    enqueue(buildEnvoi({ questionId: 'Q-2' }));
    const barriere: { debloquer: () => void } = { debloquer: () => undefined };
    const enAttente = new Promise<void>((resolve) => {
      barriere.debloquer = resolve;
    });
    const flushEnCours = flush(async (envoi) => {
      if (envoi.questionId === 'Q-1') {
        enqueue(buildEnvoi({ questionId: 'Q-3' }));
        await enAttente;
      }
      return true;
    });
    expect(pending().map((envoi) => envoi.questionId)).toEqual(['Q-1', 'Q-2', 'Q-3']);
    barriere.debloquer();
    await flushEnCours;
    expect(pending().map((envoi) => envoi.questionId)).toEqual(['Q-3']);
  });
});
