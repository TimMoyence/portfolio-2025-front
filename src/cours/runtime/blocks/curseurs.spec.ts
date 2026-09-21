import { brancherCurseurs, curseur } from './curseurs';

const PARAMETRE = {
  cle: 'taux',
  libelle: 'Taux de marge',
  min: 0,
  max: 100,
  pas: 5,
  defaut: 20,
};

function racineAvec(html: string): ShadowRoot {
  const hote = document.createElement('div');
  const racine = hote.attachShadow({ mode: 'open' });
  racine.innerHTML = html;
  return racine;
}

function saisir(racine: ShadowRoot, selecteur: string, valeur: string): void {
  const champ = racine.querySelector<HTMLInputElement>(selecteur);
  if (champ === null) {
    throw new Error(`aucun champ ${selecteur}`);
  }
  champ.value = valeur;
  champ.dispatchEvent(new Event('input'));
}

describe('curseur', () => {
  it('rend un champ marqué, borné et étiqueté par l’énoncé', () => {
    const racine = racineAvec(String(curseur('fp-plot', PARAMETRE, 35, 'Réglez le taux')));
    const champ = racine.querySelector<HTMLInputElement>('input[data-testid="curseur"]');

    expect(champ?.getAttribute('data-cle')).toBe('taux');
    expect(champ?.getAttribute('step')).toBe('5');
    expect([champ?.min, champ?.max, champ?.value]).toEqual(['0', '100', '35']);
    expect(champ?.getAttribute('aria-label')).toBe('Réglez le taux');
    expect(champ?.className).toBe('fp-plot__curseur');
  });

  it('laisse le pas libre quand aucun pas n’est imposé', () => {
    const racine = racineAvec(
      String(curseur('fp-plot', { ...PARAMETRE, pas: 0 }, 35, 'Réglez le taux')),
    );

    expect(racine.querySelector('input')?.getAttribute('step')).toBe('any');
  });
});

describe('brancherCurseurs', () => {
  it('annonce la clé et la valeur de chaque curseur déplacé', () => {
    const changements: [string, number][] = [];
    const racine = racineAvec(
      [
        String(curseur('fp-plot', PARAMETRE, 35, 'Taux')),
        String(curseur('fp-plot', { ...PARAMETRE, cle: 'volume', pas: 0 }, 10, 'Volume')),
      ].join(''),
    );

    brancherCurseurs(racine, (cle, valeur) => changements.push([cle, valeur]));
    saisir(racine, '[data-cle="taux"]', '45');
    saisir(racine, '[data-cle="volume"]', '12.5');

    expect(changements).toEqual([
      ['taux', 45],
      ['volume', 12.5],
    ]);
  });

  it('n’annonce rien pour une valeur que le navigateur ne rend pas finie', () => {
    const changements: [string, number][] = [];
    const racine = racineAvec(
      '<input data-testid="curseur" data-cle="taux" type="text" value="0">',
    );

    brancherCurseurs(racine, (cle, valeur) => changements.push([cle, valeur]));
    saisir(racine, '[data-cle="taux"]', 'abc');

    expect(changements).toEqual([]);
  });

  it('annonce une clé vide plutôt que de lever sur un curseur sans clé', () => {
    const changements: [string, number][] = [];
    const racine = racineAvec('<input data-testid="curseur" type="range" min="0" max="9">');

    brancherCurseurs(racine, (cle, valeur) => changements.push([cle, valeur]));
    saisir(racine, 'input[data-testid="curseur"]', '4');

    expect(changements).toEqual([['', 4]]);
  });

  it('ignore les champs qui ne sont pas des curseurs', () => {
    const changements: [string, number][] = [];
    const racine = racineAvec('<input data-cle="taux" type="range" min="0" max="9">');

    brancherCurseurs(racine, (cle, valeur) => changements.push([cle, valeur]));
    saisir(racine, '[data-cle="taux"]', '4');

    expect(changements).toEqual([]);
  });
});
