import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import {
  buildCardsortPlan,
  buildVerdictDeProduction,
} from '../../../testing/factories/cours.factory';
import { FpCardsort } from './FpCardsort';

const PLAN = buildCardsortPlan();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 23;
const ROLES = ['etudiant', 'presentateur'] as const;
const PIOCHE = '';
const FIXE = 'fixe';
const VARIABLE = 'variable';
const LOYER = 'loyer';
const MATIERES = 'matieres';
const TOUS_LES_IDS = PLAN.cartes.map((carte) => carte.id);
const ATTENDUS_FORMATEUR = {
  type: 'classement',
  attendus: [
    { carteId: LOYER, categorieId: FIXE, justification: 'Le loyer ne suit pas le volume' },
  ],
};
const DEBUT = new Date('2026-09-14T09:00:00.000Z');

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

function ordreAffiche(hote: FpCardsort): string[] {
  return noeuds(hote, 'carte').map((element) => element.getAttribute('data-carte') ?? '');
}

function toutClasser(hote: FpCardsort): void {
  for (const id of TOUS_LES_IDS) {
    deplacerAuClavier(hote, id, FIXE);
  }
}

function envois(hote: FpCardsort): Record<string, unknown>[] {
  const recus: Record<string, unknown>[] = [];
  hote.addEventListener('fp-cardsort-submit', (evenement) =>
    recus.push((evenement as CustomEvent<Record<string, unknown>>).detail),
  );
  return recus;
}

function brouillonsDe(hote: FpCardsort): unknown[] {
  const recus: unknown[] = [];
  hote.addEventListener('fp-brouillon', (evenement) =>
    recus.push((evenement as CustomEvent).detail),
  );
  return recus;
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
    jasmine.clock().install();
    jasmine.clock().mockDate(DEBUT);
    hote = document.createElement('fp-cardsort') as FpCardsort;
    traces = surveillerEffets(hote);
    hote.plan = buildCardsortPlan();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
    jasmine.clock().uninstall();
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
    expect(TOUS_LES_IDS.every((id) => zoneDe(hote, id) === PIOCHE)).toBe(true);
  });

  it('garde l ordre des cartes servi par le serveur, sans melange local', () => {
    expect(ordreAffiche(hote)).toEqual(TOUS_LES_IDS);
  });

  it('offre chaque carte au clavier comme un bouton pressable etiquete par sa zone', () => {
    const premiere = carte(hote, LOYER);
    expect(premiere.tagName).toBe('BUTTON');
    expect(premiere.getAttribute('aria-pressed')).toBe('false');
    expect(premiere.getAttribute('aria-label')).toBe('Loyer de l atelier — Cartes à trier');
    expect(noeuds(hote, 'carte').some((element) => element.hasAttribute('tabindex'))).toBe(false);
  });

  it('deplace une carte sans le moindre pointeur : choix, destination, validation du geste', () => {
    activerAuClavier(carte(hote, LOYER));
    expect(carte(hote, LOYER).getAttribute('aria-pressed')).toBe('true');
    expect(hote.shadowRoot?.activeElement).toBe(cible(hote));
    viserAuClavier(hote, FIXE);
    activerAuClavier(noeud(hote, 'deplacer'));
    expect(zoneDe(hote, LOYER)).toBe(FIXE);
    expect(carte(hote, LOYER).getAttribute('aria-pressed')).toBe('false');
    expect(hote.shadowRoot?.activeElement).toBe(carte(hote, LOYER));
  });

  it('annonce chaque deplacement dans une region aria-live', () => {
    expect(noeud(hote, 'annonce')?.getAttribute('aria-live')).toBe('polite');
    activerAuClavier(carte(hote, MATIERES));
    expect(libelleDe(hote, 'annonce')).toBe('Carte choisie : Achat de matieres premieres');
    viserAuClavier(hote, VARIABLE);
    activerAuClavier(noeud(hote, 'deplacer'));
    expect(libelleDe(hote, 'annonce')).toBe(
      'Achat de matieres premieres déplacée vers Charges variables',
    );
  });

  it('ramene une carte a la pioche par le meme chemin au clavier', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    deplacerAuClavier(hote, LOYER, PIOCHE);
    expect(zoneDe(hote, LOYER)).toBe(PIOCHE);
    expect(libelleDe(hote, 'annonce')).toBe('Loyer de l atelier déplacée vers Cartes à trier');
  });

  it('relache la carte deja choisie et refuse de deplacer sans carte', () => {
    activerAuClavier(carte(hote, LOYER));
    activerAuClavier(carte(hote, LOYER));
    expect(carte(hote, LOYER).getAttribute('aria-pressed')).toBe('false');
    activerAuClavier(noeud(hote, 'deplacer'));
    expect(libelleDe(hote, 'annonce')).toBe('Choisissez d’abord une carte à déplacer');
    expect(zoneDe(hote, LOYER)).toBe(PIOCHE);
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
    expect(libelleDe(hote, 'annonce')).toBe(
      'Achat de matieres premieres déplacée vers Charges variables',
    );
  });

  it('ramene a sa place une carte lachee hors d une zone', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    carte(hote, LOYER).dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
    carte(hote, LOYER).dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    expect(zoneDe(hote, LOYER)).toBe(FIXE);
    expect(libelleDe(hote, 'annonce')).toBe(
      'Dépôt hors d’une catégorie : la carte est revenue à sa place',
    );
  });

  it('refuse de valider tant qu une carte reste a trier, puis envoie le classement complet', () => {
    const recus = envois(hote);
    deplacerAuClavier(hote, LOYER, FIXE);
    activerAuClavier(noeud(hote, 'valider'));
    expect(libelleDe(hote, 'annonce')).toBe(
      'Placez chaque carte dans une catégorie avant de valider',
    );
    expect(recus).toEqual([]);

    jasmine.clock().tick(6000);
    toutClasser(hote);
    activerAuClavier(noeud(hote, 'valider'));

    expect(libelleDe(hote, 'annonce')).toBe('Réponse enregistrée');
    expect(recus).toEqual([
      {
        planId: PLAN.id,
        classement: Object.fromEntries(TOUS_LES_IDS.map((id) => [id, FIXE])),
        dureeMs: 6000,
      },
    ]);
  });

  it('envoie je ne sais pas sans classement', () => {
    const recus = envois(hote);
    activerAuClavier(noeud(hote, 'je-ne-sais-pas'));
    expect(recus).toEqual([{ planId: PLAN.id, neSaitPas: true, dureeMs: 0 }]);
  });

  it('n ecrit dans aucun stockage et n envoie qu une seule fois le classement', () => {
    const recus = envois(hote);
    toutClasser(hote);
    activerAuClavier(noeud(hote, 'valider'));
    activerAuClavier(noeud(hote, 'valider'));
    expect(recus.length).toBe(1);
    expect(traces.ecritures).toEqual([]);
    expect(carte(hote, LOYER).hasAttribute('disabled')).toBe(true);
  });

  it('confie chaque placement au brouillon de l hote, puis le restaure', () => {
    const brouillons = brouillonsDe(hote);
    deplacerAuClavier(hote, LOYER, FIXE);
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { [LOYER]: FIXE } }]);

    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-RECHARGE' });
    hote.brouillon = { [MATIERES]: VARIABLE, inconnue: FIXE, [LOYER]: 'categorie-inconnue' };

    expect(zoneDe(hote, MATIERES)).toBe(VARIABLE);
    expect(zoneDe(hote, LOYER)).toBe(PIOCHE);
    expect(libelleDe(hote, 'brouillon-restaure')).toBe('Brouillon restauré');
  });

  it('n emet aucun brouillon en apercu hors seance', () => {
    hote.setAttribute('data-apercu', '');
    const brouillons = brouillonsDe(hote);
    deplacerAuClavier(hote, LOYER, FIXE);
    expect(brouillons).toEqual([]);
  });

  function validerPuisRecevoirLeVerdict(confusionSurMatieres: string | null): void {
    toutClasser(hote);
    activerAuClavier(noeud(hote, 'valider'));
    hote.verdict = buildVerdictDeProduction({
      questionId: PLAN.id,
      details: [
        { cle: LOYER, juste: true, libelleConfusion: null },
        { cle: MATIERES, juste: false, libelleConfusion: confusionSurMatieres },
      ],
    });
  }

  it('marque chaque carte selon le verdict recu et garde le classement affiche', () => {
    validerPuisRecevoirLeVerdict('Charge liée au volume');

    expect(carte(hote, LOYER).getAttribute('data-etat')).toBe('confirme');
    expect(carte(hote, MATIERES).getAttribute('data-etat')).toBe('a-revoir');
    expect(carte(hote, LOYER).getAttribute('data-correction')).toBe('juste');
    expect(carte(hote, MATIERES).getAttribute('data-correction')).toBe('fausse');
    expect(carte(hote, 'assurance').hasAttribute('data-correction')).toBeFalse();
    expect(libelleDe(hote, 'confusion')).toBe('Charge liée au volume');
    expect(libelleDe(hote, 'decompte')).toBe('Cartes bien placées : 1/6');
    expect(zoneDe(hote, MATIERES)).toBe(FIXE);
  });

  it('R7 · entoure de vert la carte bien placee et de rouge la carte mal placee', () => {
    validerPuisRecevoirLeVerdict(null);
    const contour = (
      id: string,
    ): { rouge: number; vert: number; bleu: number; epaisseur: number } => {
      const style = getComputedStyle(carte(hote, id));
      const [rouge = 0, vert = 0, bleu = 0] = (style.borderTopColor.match(/\d+/g) ?? []).map(
        Number,
      );
      return { rouge, vert, bleu, epaisseur: parseFloat(style.borderTopWidth) };
    };
    const juste = contour(LOYER);
    const fausse = contour(MATIERES);

    expect(juste.vert).toBeGreaterThan(juste.rouge + 60);
    expect(juste.vert).toBeGreaterThan(juste.bleu + 30);
    expect(fausse.rouge).toBeGreaterThan(fausse.vert + 60);
    expect(fausse.rouge).toBeGreaterThan(fausse.bleu + 60);
    expect(Math.min(juste.epaisseur, fausse.epaisseur)).toBeGreaterThanOrEqual(2);
  });

  it('ignore un verdict adresse a un autre plan', () => {
    hote.verdict = buildVerdictDeProduction({ questionId: 'K-AUTRE' });
    expect(noeud(hote, 'verdict')).toBeNull();
  });

  it('decompte le temps de jeu quand le plan en fixe un, sans bloquer l envoi a echeance', () => {
    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-CHRONO', dureeJeuMs: 90_000 });
    expect(libelleDe(hote, 'chrono')).toBe('Temps restant : 1:30');
    jasmine.clock().tick(31_000);
    expect(libelleDe(hote, 'chrono')).toBe('Temps restant : 0:59');
    jasmine.clock().tick(60_000);
    expect(libelleDe(hote, 'chrono')).toBe('Le temps est écoulé : vous pouvez encore envoyer');
    expect(noeud(hote, 'valider')?.hasAttribute('disabled')).toBeFalse();
  });

  it('trie un plan sans carte sans casser le plateau', () => {
    const recus = envois(hote);
    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-VIDE', cartes: [] });
    expect(noeuds(hote, 'carte')).toEqual([]);
    expect(libelleDe(hote, 'vide')).toContain('Aucune carte à trier');
    activerAuClavier(noeud(hote, 'valider'));
    expect(recus).toEqual([]);
  });

  it('efface un regroupement attendu niche dans les metadonnees', () => {
    const piege = buildCardsortPlan({ id: 'K-CHARGES-PIEGE' });
    const metadonnees = { ...piege.metadonnees, categorieAttendue: 'fixe-pour-le-loyer' };
    hote.plan = { ...piege, metadonnees };
    expect(JSON.stringify(hote.plan)).not.toContain('fixe-pour-le-loyer');
  });

  it('projette au presentateur le classement de reference, seules les cartes attendues marquees', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(TOUS_LES_IDS.every((id) => zoneDe(hote, id) === PIOCHE)).toBe(true);

    hote.corrige = ATTENDUS_FORMATEUR;

    expect(zoneDe(hote, LOYER)).toBe(FIXE);
    expect(zoneDe(hote, MATIERES)).toBe(PIOCHE);
    expect(carte(hote, LOYER).getAttribute('data-correction')).toBe('juste');
    expect(carte(hote, MATIERES).hasAttribute('data-correction')).toBe(false);
  });

  it('T6 · laisse l etudiant a son classement, colore en vert et rouge d apres le corrige', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    deplacerAuClavier(hote, MATIERES, FIXE);
    hote.corrige = {
      type: 'classement',
      attendus: [
        ...ATTENDUS_FORMATEUR.attendus,
        { carteId: MATIERES, categorieId: VARIABLE, justification: 'Suit le volume produit' },
      ],
    };

    expect(zoneDe(hote, LOYER)).toBe(FIXE);
    expect(zoneDe(hote, MATIERES)).toBe(FIXE);
    expect(carte(hote, LOYER).getAttribute('data-correction')).toBe('juste');
    expect(carte(hote, MATIERES).getAttribute('data-correction')).toBe('fausse');
  });

  it('T6 · affiche aux deux roles le meme corrige justifie, jamais avant sa pose', () => {
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      hote.corrige = null;
      expect(noeud(hote, 'cardsort-correction')).withContext(role).toBeNull();

      hote.corrige = ATTENDUS_FORMATEUR;

      expect(noeuds(hote, 'cardsort-justification').map((ligne) => ligne.textContent?.trim()))
        .withContext(role)
        .toEqual(['Loyer de l atelier — Charges fixes Le loyer ne suit pas le volume']);
    }
  });

  it('R1 · laisse les justifications a l ecran de correction qui suit, sans perdre la coloration', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    hote.resoluAilleurs = true;
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      hote.corrige = ATTENDUS_FORMATEUR;

      expect(noeud(hote, 'cardsort-correction')).withContext(role).toBeNull();
      expect(carte(hote, LOYER).getAttribute('data-correction')).withContext(role).toBe('juste');
    }
  });

  it('ignore un corrige d un autre type', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = { ...ATTENDUS_FORMATEUR, type: 'tableau' };
    expect(zoneDe(hote, LOYER)).toBe(PIOCHE);
    expect(noeuds(hote, 'carte').some((element) => element.hasAttribute('data-correction'))).toBe(
      false,
    );
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
  });

  it('partage le meme plateau entre les roles et retire toute commande au presentateur', () => {
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(noeuds(hote, 'zone').map((zone) => titreDeZone(hote, zone)))
        .withContext(role)
        .toEqual(['Cartes à trier', 'Charges fixes', 'Charges variables']);
      expect(ordreAffiche(hote)).withContext(role).toEqual(TOUS_LES_IDS);
      expect(hote.shadowRoot?.querySelector('.fp-cardsort__intitule')?.textContent?.trim())
        .withContext(role)
        .toBe(PLAN.intitule);
    }
    expect(hote.shadowRoot?.querySelectorAll('button').length).toBe(0);
    expect(hote.shadowRoot?.querySelectorAll('select').length).toBe(0);
    expect(hote.shadowRoot?.querySelector('.fp-cardsort__consigne')).toBeNull();
    expect(noeud(hote, 'annonce')).toBeNull();
    expect(noeud(hote, 'modalite')).toBeNull();
    expect(carte(hote, LOYER).tagName).toBe('SPAN');
  });

  it('ne projette pas au presentateur le classement en cours d un poste', () => {
    deplacerAuClavier(hote, LOYER, FIXE);
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(zoneDe(hote, LOYER)).toBe(PIOCHE);
  });

  it('decompte aussi le temps de jeu en projection', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-CHRONO-SCENE', dureeJeuMs: 90_000 });
    expect(libelleDe(hote, 'chrono')).toBe('Temps restant : 1:30');
    jasmine.clock().tick(31_000);
    expect(libelleDe(hote, 'chrono')).toBe('Temps restant : 0:59');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.plan = buildCardsortPlan({ id: 'K-CHARGES-CLASSES', dureeJeuMs: 60_000 });
    toutClasser(hote);
    activerAuClavier(noeud(hote, 'valider'));
    hote.verdict = buildVerdictDeProduction({
      questionId: 'K-CHARGES-CLASSES',
      details: [{ cle: MATIERES, juste: false, libelleConfusion: 'Charge liée au volume' }],
    });
    hote.corrige = ATTENDUS_FORMATEUR;
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'cardsort')).toEqual([]);
  });
});
