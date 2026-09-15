import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildCardsortPlan } from '../../../testing/factories/cours.factory';
import { FpCardsort } from './FpCardsort';

const PLAN = buildCardsortPlan();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 23;
const RENDUS = ['stage', 'hand', 'board'] as const;
const PIOCHE = '';
const FIXE = 'fixe';
const VARIABLE = 'variable';
const LOYER = 'loyer';
const MATIERES = 'matieres';
const GRAINE_UNE = '1001';
const GRAINE_AUTRE = '7';
const TOUS_LES_IDS = PLAN.cartes.map((carte) => carte.id);

function noeud(hote: FpCardsort, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function noeuds(hote: FpCardsort, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function libelleDe(hote: FpCardsort, nom: string): string {
  return noeud(hote, nom)?.textContent?.trim() ?? '';
}

function carte(hote: FpCardsort, id: string): HTMLElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLElement>(
    `[data-testid="carte"][data-carte="${id}"]`,
  );
  if (trouvee === null || trouvee === undefined) {
    throw new Error(`aucune carte ${id} sur le plateau`);
  }
  return trouvee;
}

function zoneDe(hote: FpCardsort, id: string): string {
  const pile = carte(hote, id).closest('ul');
  if (pile === null) {
    throw new Error(`la carte ${id} n est posee dans aucune pile`);
  }
  return pile.getAttribute('data-zone') ?? 'pile sans zone';
}

function titreDeZone(hote: FpCardsort, zone: Element): string {
  return (
    hote.shadowRoot
      ?.querySelector(`#${zone.getAttribute('aria-labelledby')}`)
      ?.firstChild?.textContent?.trim() ?? ''
  );
}

function cible(hote: FpCardsort): HTMLSelectElement {
  const trouvee = noeud(hote, 'cible');
  if (!(trouvee instanceof HTMLSelectElement)) {
    throw new Error('aucun selecteur de destination');
  }
  return trouvee;
}

function activerAuClavier(element: Element | null): void {
  element?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
}

function viserAuClavier(hote: FpCardsort, zone: string): void {
  const selecteur = cible(hote);
  selecteur.value = zone;
  selecteur.dispatchEvent(new Event('change', { bubbles: true }));
}

function deplacerAuClavier(hote: FpCardsort, id: string, zone: string): void {
  activerAuClavier(carte(hote, id));
  viserAuClavier(hote, zone);
  activerAuClavier(noeud(hote, 'deplacer'));
}

function glisser(hote: FpCardsort, id: string, zone: string): void {
  carte(hote, id).dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
  const pile = hote.shadowRoot?.querySelector(`[data-testid="pile"][data-zone="${zone}"]`);
  pile?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
  carte(hote, id).dispatchEvent(new DragEvent('dragend', { bubbles: true }));
}

function rangees(ids: readonly string[]): string[] {
  return [...ids].sort((gauche, droite) => gauche.localeCompare(droite));
}

function ordreAffiche(hote: FpCardsort): string[] {
  return noeuds(hote, 'carte').map((element) => element.getAttribute('data-carte') ?? '');
}

function toutClasser(hote: FpCardsort): void {
  for (const id of TOUS_LES_IDS) {
    deplacerAuClavier(hote, id, FIXE);
  }
}

describe('FpCardsort', () => {
  let hote: FpCardsort;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-cardsort')) {
      customElements.define('fp-cardsort', FpCardsort);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-cardsort') as FpCardsort;
    traces = surveillerEffets(hote);
    hote.setAttribute('seed', GRAINE_UNE);
    hote.plan = buildCardsortPlan();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('pose une zone nommee par carte a trier et par categorie', () => {
    const zones = noeuds(hote, 'zone');
    expect(zones.length).toBe(PLAN.categories.length + 1);
    expect(zones.map((zone) => titreDeZone(hote, zone))).toEqual([
      'Cartes à trier',
      'Charges fixes',
      'Charges variables',
    ]);
    expect(noeuds(hote, 'carte').length).toBe(PLAN.cartes.length);
    expect(noeuds(hote, 'carte').every((element) => element.closest('li') !== null)).toBe(true);
    expect(TOUS_LES_IDS.every((id) => zoneDe(hote, id) === PIOCHE)).toBe(true);
  });

  it('offre chaque carte au clavier comme un bouton pressable etiquete par sa zone', () => {
    const premiere = carte(hote, LOYER);
    expect(premiere.tagName).toBe('BUTTON');
    expect(premiere.getAttribute('aria-pressed')).toBe('false');
    expect(premiere.getAttribute('aria-label')).toBe('Loyer de l atelier — Cartes à trier');
    expect(noeuds(hote, 'carte').some((element) => element.hasAttribute('tabindex')))
      .withContext('un tabindex reordonnerait le parcours au clavier hors de l ordre de lecture')
      .toBe(false);
  });

  it('deplace une carte sans le moindre pointeur : choix, destination, validation du geste', () => {
    activerAuClavier(carte(hote, LOYER));
    expect(carte(hote, LOYER).getAttribute('aria-pressed')).toBe('true');
    expect(hote.shadowRoot?.activeElement)
      .withContext('le choix d une carte doit porter le foyer sur le selecteur de destination')
      .toBe(cible(hote));
    viserAuClavier(hote, FIXE);
    activerAuClavier(noeud(hote, 'deplacer'));
    expect(zoneDe(hote, LOYER)).toBe(FIXE);
    expect(hote.classement).toEqual({ [LOYER]: FIXE });
    expect(carte(hote, LOYER).getAttribute('aria-pressed'))
      .withContext('la carte posee doit etre relachee, prete a etre choisie de nouveau')
      .toBe('false');
    expect(hote.shadowRoot?.activeElement)
      .withContext('le foyer doit revenir sur la carte deplacee, dans sa nouvelle zone')
      .toBe(carte(hote, LOYER));
  });

  it('annonce chaque deplacement dans une region aria-live', () => {
    const region = noeud(hote, 'annonce');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    activerAuClavier(carte(hote, MATIERES));
    expect(libelleDe(hote, 'annonce')).toBe('Carte choisie : Achat de matieres premieres');
    viserAuClavier(hote, VARIABLE);
    activerAuClavier(noeud(hote, 'deplacer'));
    expect(libelleDe(hote, 'annonce')).toBe(
      'Achat de matieres premieres déplacée vers Charges variables',
    );
    expect(noeud(hote, 'annonce')?.getAttribute('aria-live')).toBe('polite');
  });

  it('ramene une carte a la pioche par le meme chemin au clavier', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    deplacerAuClavier(hote, LOYER, PIOCHE);
    expect(zoneDe(hote, LOYER)).toBe(PIOCHE);
    expect(hote.classement).toEqual({});
    expect(libelleDe(hote, 'annonce')).toBe('Loyer de l atelier déplacée vers Cartes à trier');
  });

  it('relache la carte deja choisie et refuse de deplacer sans carte', () => {
    activerAuClavier(carte(hote, LOYER));
    activerAuClavier(carte(hote, LOYER));
    expect(carte(hote, LOYER).getAttribute('aria-pressed')).toBe('false');
    activerAuClavier(noeud(hote, 'deplacer'));
    expect(libelleDe(hote, 'annonce')).toBe('Choisissez d’abord une carte à déplacer');
    expect(hote.classement).toEqual({});
  });

  it('garde la destination choisie visible dans le selecteur apres un deplacement', () => {
    deplacerAuClavier(hote, LOYER, VARIABLE);
    expect(cible(hote).querySelector('option[selected]')?.getAttribute('value')).toBe(VARIABLE);
    expect([...cible(hote).options].map((option) => option.value)).toEqual([
      PIOCHE,
      FIXE,
      VARIABLE,
    ]);
  });

  it('deplace aussi une carte a la souris par glisser deposer', () => {
    glisser(hote, MATIERES, VARIABLE);
    expect(zoneDe(hote, MATIERES)).toBe(VARIABLE);
    expect(hote.classement).toEqual({ [MATIERES]: VARIABLE });
    expect(libelleDe(hote, 'annonce')).toBe(
      'Achat de matieres premieres déplacée vers Charges variables',
    );
  });

  it('ramene a sa place une carte lachee hors d une zone', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    carte(hote, LOYER).dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
    carte(hote, LOYER).dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    expect(zoneDe(hote, LOYER)).toBe(FIXE);
    expect(hote.classement).toEqual({ [LOYER]: FIXE });
    expect(libelleDe(hote, 'annonce')).toBe(
      'Dépôt hors d’une catégorie : la carte est revenue à sa place',
    );
  });

  it('melange l ordre initial des cartes selon la graine de l etudiant', () => {
    const premier = ordreAffiche(hote);
    hote.setAttribute('seed', GRAINE_AUTRE);
    const second = ordreAffiche(hote);
    expect(premier)
      .withContext('deux graines voisines doivent donner deux ordres differents')
      .not.toEqual(second);
    expect(rangees(second)).toEqual(rangees(premier));
    expect(premier)
      .withContext('la graine doit deranger l ordre ecrit dans le plan')
      .not.toEqual(TOUS_LES_IDS);
  });

  it('rend le meme ordre a graine egale', () => {
    const premier = ordreAffiche(hote);
    hote.setAttribute('seed', GRAINE_AUTRE);
    hote.setAttribute('seed', GRAINE_UNE);
    expect(ordreAffiche(hote)).toEqual(premier);
  });

  it('refuse de valider tant qu une carte reste a trier', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    activerAuClavier(noeud(hote, 'valider'));
    expect(libelleDe(hote, 'annonce')).toBe(
      'Placez chaque carte dans une catégorie avant de valider',
    );
    expect(traces.evenements).toEqual([]);
    toutClasser(hote);
    activerAuClavier(noeud(hote, 'valider'));
    expect(libelleDe(hote, 'annonce')).toBe('Réponse enregistrée');
    expect(traces.evenements).toEqual(['fp-cardsort-submit']);
  });

  it('n ecrit dans aucun stockage et n annonce qu une seule fois le classement', () => {
    toutClasser(hote);
    activerAuClavier(noeud(hote, 'valider'));
    activerAuClavier(noeud(hote, 'valider'));
    expect(traces.evenements).toEqual(['fp-cardsort-submit']);
    expect(traces.ecritures).toEqual([]);
    expect(carte(hote, LOYER).hasAttribute('disabled')).toBe(true);
  });

  it('trie un plan sans carte sans casser le plateau', () => {
    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-VIDE', cartes: [] });
    expect(noeuds(hote, 'carte')).toEqual([]);
    expect(libelleDe(hote, 'vide')).toContain('Aucune carte à trier');
    activerAuClavier(noeud(hote, 'valider'));
    expect(traces.evenements).toEqual([]);
  });

  it('efface le regroupement attendu pour le poste etudiant', () => {
    const recu = JSON.stringify(hote.plan);
    expect(recu).not.toContain('attendus');
    expect(recu).not.toContain('carteId');
    expect(recu).not.toContain('categorieId');
  });

  it('efface le regroupement attendu meme pour le poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-PRES' });
    expect(JSON.stringify(hote.plan)).not.toContain('carteId');
  });

  it('efface un regroupement attendu niche dans les metadonnees', () => {
    const piege = buildCardsortPlan({ id: 'K-CHARGES-PIEGE' });
    const metadonnees = { ...piege.metadonnees, categorieAttendue: 'fixe-pour-le-loyer' };
    hote.plan = { ...piege, metadonnees };
    expect(JSON.stringify(hote.plan)).not.toContain('fixe-pour-le-loyer');
  });

  it('echappe le html injecte dans les libelles des cartes et des categories', () => {
    hote.plan = buildCardsortPlan({
      id: 'K-CHARGES-XSS',
      intitule: CHARGE_XSS,
      cartes: [{ id: LOYER, libelle: CHARGE_XSS }],
      categories: [{ id: FIXE, libelle: CHARGE_XSS }],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(carte(hote, LOYER).textContent?.trim()).toBe(CHARGE_XSS);
    expect(carte(hote, LOYER).getAttribute('aria-label')).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('retire toute commande en projection et affiche les reperes au tableau', () => {
    hote.setAttribute('render', 'stage');
    expect(hote.shadowRoot?.querySelectorAll('button').length).toBe(0);
    expect(hote.shadowRoot?.querySelectorAll('select').length).toBe(0);
    expect(noeuds(hote, 'carte').length).toBe(PLAN.cartes.length);
    hote.setAttribute('render', 'board');
    expect(libelleDe(hote, 'modalite')).toBe(PLAN.metadonnees.modalite);
    expect(libelleDe(hote, 'duree')).toContain(String(PLAN.metadonnees.dureeMinutes));
    expect(libelleDe(hote, 'progression')).toContain('0 / 6');
  });

  it('ne publie dans aucun rendu le regroupement attendu', () => {
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain('carteId');
    }
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'cardsort')).toEqual([]);
  });
});
