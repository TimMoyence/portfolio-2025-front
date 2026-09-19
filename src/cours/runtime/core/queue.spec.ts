import { buildEnvoiReponse } from '../../../testing/factories/queue.factory';
import { sansStockageLocal, saturationDuStockage } from '../../../testing/sans-stockage';
import { removeKey } from './storage';
import { enqueue, flush, pending, type EnvoiReponse } from './queue';

const CLE = 'fp.file-reponses';

describe('queue', () => {
  beforeEach(() => {
    removeKey(CLE);
  });

  it('demarre vide', () => {
    expect(pending()).toEqual([]);
  });

  it('ecrit une reponse mise en file dans localStorage avec un identifiant', () => {
    enqueue(buildEnvoiReponse());
    const brut = globalThis.localStorage.getItem(CLE);
    expect(brut).not.toBeNull();
    expect(JSON.parse(brut ?? '[]')).toEqual([{ ...buildEnvoiReponse(), id: 1 }]);
  });

  it('une reponse mise en file survit a une relecture depuis le stockage', () => {
    enqueue(buildEnvoiReponse({ questionId: 'Q-1' }));
    const relue = JSON.parse(globalThis.localStorage.getItem(CLE) ?? '[]') as EnvoiReponse[];
    expect(relue).toEqual([{ ...buildEnvoiReponse({ questionId: 'Q-1' }), id: 1 }]);
    expect(pending()).toEqual(relue);
  });

  it('garde la nature de chaque envoi et lit une entree ancienne comme une reponse', () => {
    enqueue(buildEnvoiReponse({ nature: 'production', questionId: 'b2-01-a4-feuille-canaux' }));
    enqueue(buildEnvoiReponse({ nature: 'jalon', questionId: 'b2-01-jalon-1', valeur: 'perdu' }));
    const ancienne = { ...buildEnvoiReponse({ questionId: 'Q-ANCIENNE' }), id: 3 };
    const stockee = JSON.parse(globalThis.localStorage.getItem(CLE) ?? '[]') as object[];
    globalThis.localStorage.setItem(
      CLE,
      JSON.stringify([...stockee, { ...ancienne, nature: undefined }]),
    );
    expect(pending().map((envoi) => envoi.nature)).toEqual(['production', 'jalon', 'reponse']);
  });

  it('flush vide la file quand l envoi reussit', async () => {
    enqueue(buildEnvoiReponse());
    await flush(() => true);
    expect(pending()).toEqual([]);
  });

  it('un envoi en echec est conserve et retente', async () => {
    enqueue(buildEnvoiReponse());
    await flush(() => false);
    expect(pending().length).toBe(1);
    await flush(() => true);
    expect(pending()).toEqual([]);
  });

  it('preserve l ordre des envois qui restent apres un echec partiel', async () => {
    enqueue(buildEnvoiReponse({ questionId: 'Q-1' }));
    enqueue(buildEnvoiReponse({ questionId: 'Q-2' }));
    enqueue(buildEnvoiReponse({ questionId: 'Q-3' }));
    await flush((envoi) => envoi.questionId === 'Q-2');
    expect(pending().map((envoi) => envoi.questionId)).toEqual(['Q-1', 'Q-3']);
  });

  it('rejoue les envois dans leur ordre de soumission', async () => {
    const ordreAppels: string[] = [];
    enqueue(buildEnvoiReponse({ questionId: 'Q-1' }));
    enqueue(buildEnvoiReponse({ questionId: 'Q-2' }));
    enqueue(buildEnvoiReponse({ questionId: 'Q-3' }));
    await flush((envoi) => {
      ordreAppels.push(envoi.questionId);
      return true;
    });
    expect(ordreAppels).toEqual(['Q-1', 'Q-2', 'Q-3']);
  });

  it('refuse une nouvelle entree au plafond de 200 et le signale au lieu d evincer', () => {
    for (let indice = 0; indice < 200; indice += 1) {
      enqueue(buildEnvoiReponse({ questionId: `Q-${indice}` }));
    }
    expect(() => enqueue(buildEnvoiReponse({ questionId: 'Q-200' }))).toThrow();
    const file = pending();
    expect(file.length).toBe(200);
    expect(file[0].questionId).toBe('Q-0');
    expect(file[199].questionId).toBe('Q-199');
  });

  it('signale l echec d ecriture du stockage au lieu de perdre la reponse en silence', () => {
    spyOn(globalThis.localStorage, 'setItem').and.throwError(saturationDuStockage());
    let refus: unknown = null;
    try {
      enqueue(buildEnvoiReponse());
    } catch (erreur) {
      refus = erreur;
    }
    expect((refus as Error).message).toMatch(/la réponse n'a pas été mise en file/);
    expect(((refus as Error).cause as Error).message).toBe('quota de stockage depasse');
    expect(pending()).toEqual([]);
  });

  it('refuse aussi bruyamment quand le stockage local est absent', () => {
    sansStockageLocal(() => {
      expect(() => enqueue(buildEnvoiReponse())).toThrowError(
        /la réponse n'a pas été mise en file/,
      );
      expect(pending()).toEqual([]);
    });
  });

  it('une reponse ajoutee pendant un flush en cours n est pas perdue', async () => {
    enqueue(buildEnvoiReponse({ questionId: 'Q-1' }));
    enqueue(buildEnvoiReponse({ questionId: 'Q-2' }));
    const barriere: { debloquer: () => void } = { debloquer: () => undefined };
    const enAttente = new Promise<void>((resolve) => {
      barriere.debloquer = resolve;
    });
    const flushEnCours = flush(async (envoi) => {
      if (envoi.questionId === 'Q-1') {
        enqueue(buildEnvoiReponse({ questionId: 'Q-3' }));
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
