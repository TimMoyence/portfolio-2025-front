import { buildCoursContent } from '../../../testing/factories/cours.factory';
import { createDeck, type DeckState } from './deck';

describe('createDeck', () => {
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

  it('en rythme libre, l etudiant navigue dans l intervalle, en avant comme en arriere', () => {
    const deck = createDeck(buildCoursContent(), { role: 'etudiant' });
    deck.setPacing('libre', { premier: 1, dernier: 2 });
    deck.applyRemote(2);
    expect(deck.canNavigate(1)).toBe(true);
    expect(deck.canNavigate(2)).toBe(true);
    expect(deck.canNavigate(3)).toBe(false);
    expect(deck.previous()).toBe(true);
    expect(deck.current()).toBe(1);
    expect(deck.previous()).toBe(false);
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

  it('les abonnes recoivent une copie qui ne peut pas corrompre l etat interne', () => {
    const deck = createDeck(buildCoursContent());
    const recus: DeckState[] = [];
    deck.subscribe((etat) => recus.push(etat));
    deck.next();
    const [recu] = recus;
    recu.ecranCourant = 99;
    expect(deck.current()).toBe(1);
  });

  it('n ecrit rien dans le stockage local : seule la seance fait autorite sur l ecran', () => {
    const ecriture = spyOn(globalThis.localStorage, 'setItem').and.callThrough();
    const deck = createDeck(buildCoursContent(), { role: 'etudiant' });
    deck.setPacing('libre', null);
    deck.next();
    deck.applyRemote(3);
    expect(ecriture).not.toHaveBeenCalled();
  });
});
