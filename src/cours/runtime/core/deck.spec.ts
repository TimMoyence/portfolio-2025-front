import { buildCoursContent, buildDeckState } from '../../../testing/factories/cours.factory';
import { saturationDuStockage } from '../../../testing/sans-stockage';
import { createDeck } from './deck';
import { clearDeckState, saveDeckState, type DeckState } from './state';

describe('createDeck', () => {
  beforeEach(() => {
    clearDeckState('b1-09-interets-composes');
  });

  it('demarre au premier ecran', () => {
    const deck = createDeck(buildCoursContent());
    expect(deck.current()).toBe(0);
  });

  it('avance et recule', () => {
    const deck = createDeck(buildCoursContent());
    deck.next();
    expect(deck.current()).toBe(1);
    deck.previous();
    expect(deck.current()).toBe(0);
  });

  it('ne recule pas avant le premier ecran', () => {
    const deck = createDeck(buildCoursContent());
    expect(deck.previous()).toBe(false);
    expect(deck.current()).toBe(0);
  });

  it('ne depasse pas le dernier ecran', () => {
    const deck = createDeck(buildCoursContent());
    deck.goTo(3);
    expect(deck.next()).toBe(false);
    expect(deck.current()).toBe(3);
  });

  it('en rythme pilote, l etudiant ne navigue pas librement', () => {
    const deck = createDeck(buildCoursContent(), { role: 'etudiant' });
    deck.setPacing('pilote', null);
    expect(deck.canNavigate(2)).toBe(false);
  });

  it('en rythme libre, l etudiant navigue dans l intervalle', () => {
    const deck = createDeck(buildCoursContent(), { role: 'etudiant' });
    deck.setPacing('libre', { premier: 1, dernier: 2 });
    expect(deck.canNavigate(1)).toBe(true);
    expect(deck.canNavigate(2)).toBe(true);
    expect(deck.canNavigate(3)).toBe(false);
  });

  it('le presentateur navigue toujours librement', () => {
    const deck = createDeck(buildCoursContent(), { role: 'presentateur' });
    deck.setPacing('pilote', null);
    expect(deck.canNavigate(3)).toBe(true);
  });

  it('notifie les abonnes a chaque changement', () => {
    const deck = createDeck(buildCoursContent());
    const recus: number[] = [];
    deck.subscribe((etat) => recus.push(etat.ecranCourant));
    deck.next();
    deck.next();
    expect(recus).toEqual([1, 2]);
  });

  it('cesse de notifier apres desabonnement', () => {
    const deck = createDeck(buildCoursContent());
    const recus: number[] = [];
    const stop = deck.subscribe((etat) => recus.push(etat.ecranCourant));
    deck.next();
    stop();
    deck.next();
    expect(recus).toEqual([1]);
  });

  it('force l ecran impose par le presentateur en rythme pilote', () => {
    const deck = createDeck(buildCoursContent(), { role: 'etudiant' });
    deck.setPacing('pilote', null);
    deck.applyRemote(2);
    expect(deck.current()).toBe(2);
  });

  it('snapshot ne permet pas de corrompre l etat interne du deck', () => {
    const deck = createDeck(buildCoursContent());
    deck.recordAnswer('Q-CAP-03', 1338.23);
    const instantane = deck.snapshot();
    instantane.ecranCourant = 99;
    instantane.reponses['triche'] = true;
    expect(deck.current()).toBe(0);
    expect(deck.snapshot().reponses).toEqual({ 'Q-CAP-03': 1338.23 });
  });

  it('les abonnes recoivent une copie qui ne peut pas corrompre l etat interne', () => {
    const deck = createDeck(buildCoursContent());
    const recus: DeckState[] = [];
    deck.subscribe((etat) => recus.push(etat));
    deck.next();
    const [recu] = recus;
    recu.ecranCourant = 99;
    recu.reponses['triche'] = true;
    expect(deck.current()).toBe(1);
    expect(deck.snapshot().reponses).toEqual({});
  });

  it('reprend la progression sauvegardee quand la reprise est demandee', () => {
    saveDeckState(buildDeckState({ ecranCourant: 2 }));
    const deck = createDeck(buildCoursContent(), { reprise: true });
    expect(deck.current()).toBe(2);
  });

  it('repart du debut quand l ecran repris depasse le nombre d ecrans du cours', () => {
    saveDeckState(buildDeckState({ ecranCourant: 9 }));
    const deck = createDeck(buildCoursContent(), { reprise: true });
    expect(deck.current()).toBe(0);
    expect(deck.next()).toBe(true);
    expect(deck.current()).toBe(1);
  });

  it('repart du debut quand l etat repris a perdu un champ du schema', () => {
    const ampute = {
      ...buildDeckState({ ecranCourant: 2, modeRythme: 'libre' }),
      intervalleLibre: undefined,
    };
    saveDeckState(ampute as unknown as DeckState);
    const deck = createDeck(buildCoursContent(), { role: 'etudiant', reprise: true });
    expect(deck.current()).toBe(0);
    expect(() => deck.canNavigate(1)).not.toThrow();
  });

  it('demarre au premier ecran sans reprise meme si un etat existe', () => {
    saveDeckState(buildDeckState({ ecranCourant: 2 }));
    const deck = createDeck(buildCoursContent());
    expect(deck.current()).toBe(0);
  });

  it('notifie les ecoutes avant de persister, et malgre un stockage sature', () => {
    const ordre: string[] = [];
    spyOn(globalThis.localStorage, 'setItem').and.callFake(() => {
      ordre.push('persistance');
      throw saturationDuStockage();
    });
    const deck = createDeck(buildCoursContent());
    deck.subscribe((etat) => ordre.push(`ecoute:${etat.ecranCourant}`));
    expect(deck.next()).toBe(true);
    deck.recordAnswer('Q-CAP-03', 1338.23);
    expect(ordre).toEqual(['ecoute:1', 'persistance', 'ecoute:1', 'persistance']);
    expect(deck.snapshot().reponses).toEqual({ 'Q-CAP-03': 1338.23 });
  });
});
