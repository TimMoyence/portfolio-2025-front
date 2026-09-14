import { creerAnalyseurFlux, type EvenementFlux } from './sync';

function collecter(morceaux: readonly string[]): EvenementFlux[] {
  const recus: EvenementFlux[] = [];
  const analyseur = creerAnalyseurFlux((evenement) => recus.push(evenement));
  for (const morceau of morceaux) {
    analyseur(morceau);
  }
  return recus;
}

describe('analyseur du flux temps reel', () => {
  it('reassemble une ligne data coupee entre deux morceaux', () => {
    const recus = collecter(['data: {"etat":"en_', 'cours","ecran":2}\n\n']);

    expect(recus).toEqual([{ nom: '', donnees: '{"etat":"en_cours","ecran":2}' }]);
  });

  it('coupe une ligne au milieu du mot data sans perdre le champ', () => {
    const recus = collecter(['da', 'ta: {"a":1}\n\n']);

    expect(recus).toEqual([{ nom: '', donnees: '{"a":1}' }]);
  });

  it('rend deux evenements quand un seul morceau en porte deux', () => {
    const recus = collecter(['event: etat\ndata: {"a":1}\n\nevent: etat\ndata: {"b":2}\n\n']);

    expect(recus).toEqual([
      { nom: 'etat', donnees: '{"a":1}' },
      { nom: 'etat', donnees: '{"b":2}' },
    ]);
  });

  it('nomme l evenement porte par le champ event', () => {
    const recus = collecter(['event: heartbeat\ndata: {"ts":"x"}\n\n']);

    expect(recus[0].nom).toBe('heartbeat');
  });

  it('concatene deux lignes data du meme evenement', () => {
    const recus = collecter(['data: un\ndata: deux\n\n']);

    expect(recus).toEqual([{ nom: '', donnees: 'un\ndeux' }]);
  });

  it('ne rend rien tant que la ligne vide de fin n est pas arrivee', () => {
    expect(collecter(['event: etat\ndata: {"a":1}\n'])).toEqual([]);
  });

  it('tolere les fins de ligne windows', () => {
    const recus = collecter(['event: etat\r\ndata: {"a":1}\r\n\r\n']);

    expect(recus).toEqual([{ nom: 'etat', donnees: '{"a":1}' }]);
  });

  it('ignore les lignes de commentaire du protocole', () => {
    const recus = collecter([': battement\ndata: {"a":1}\n\n']);

    expect(recus).toEqual([{ nom: '', donnees: '{"a":1}' }]);
  });

  it('ne rend aucun evenement vide sur une suite de lignes vides', () => {
    expect(collecter(['\n\n\n\n'])).toEqual([]);
  });
});
