import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildSheetPlan, buildVerdictDeProduction } from '../../../testing/factories/cours.factory';
import { FpSheet } from './FpSheet';

const PLAN = buildSheetPlan();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 26;
const RENDUS = ['stage', 'hand', 'board'] as const;
const MONTANT_HT = '=A3*B3';
const MONTANT_TTC = '=C3*(1+$B$1)';
const ATTENDU_CACHE = '64,8';
const ATTENDU_CACHE_MACHINE = '64.8';
const DELAI_MAX_MS = 300;
const CELLULES_DEBORDANTES = 2500;
const ATTENDUS_FORMATEUR = {
  type: 'feuille',
  attendus: [{ reference: 'D3', formuleReference: '=C3*(1+$B$1)', valeur: 64.8 }],
};

function repere(hote: FpSheet, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function reperes(hote: FpSheet, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function texteDe(hote: FpSheet, nom: string): string {
  return repere(hote, nom)?.textContent?.trim() ?? '';
}

function cellule(hote: FpSheet, nom: string): HTMLInputElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLInputElement>(
    `[data-testid="cellule"][data-nom="${nom}"]`,
  );
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error(`aucune cellule ${nom} dans la grille`);
  }
  return trouvee;
}

function barre(hote: FpSheet): HTMLInputElement {
  const trouvee = repere(hote, 'barre');
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error('aucune barre de formule');
  }
  return trouvee;
}

function selectionner(hote: FpSheet, nom: string): void {
  cellule(hote, nom).dispatchEvent(new FocusEvent('focus', { bubbles: true }));
}

function formuleDe(hote: FpSheet, nom: string): string {
  selectionner(hote, nom);
  return barre(hote).value;
}

function saisir(hote: FpSheet, nom: string, texte: string): void {
  const champ = cellule(hote, nom);
  champ.value = texte;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

function cliquer(hote: FpSheet, nom: string): void {
  repere(hote, nom)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function entrer(hote: FpSheet, nom: string): void {
  cellule(hote, nom).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
}

function chiffrer(hote: FpSheet): void {
  saisir(hote, 'C3', MONTANT_HT);
  saisir(hote, 'D3', MONTANT_TTC);
}

function envois(hote: FpSheet): Record<string, unknown>[] {
  const recus: Record<string, unknown>[] = [];
  hote.addEventListener('fp-sheet-submit', (evenement) =>
    recus.push((evenement as CustomEvent<Record<string, unknown>>).detail),
  );
  return recus;
}

describe('FpSheet', () => {
  let hote: FpSheet;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-sheet')) {
      customElements.define('fp-sheet', FpSheet);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-sheet') as FpSheet;
    traces = surveillerEffets(hote);
    hote.plan = buildSheetPlan();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('presente un vrai tableau a entetes de colonne et de ligne portees', () => {
    const racine = hote.shadowRoot;
    expect(racine?.querySelectorAll('table').length).toBe(1);
    expect(racine?.querySelector('caption')?.textContent?.trim()).toBe(PLAN.intitule);
    expect(
      [...(racine?.querySelectorAll('thead th') ?? [])].map((th) => th.getAttribute('scope')),
    ).toEqual(['col', 'col', 'col', 'col', 'col']);
    expect(reperes(hote, 'colonne').map((th) => th.textContent)).toEqual(['A', 'B', 'C', 'D']);
    expect(racine?.querySelectorAll('tbody tr').length).toBe(PLAN.lignes);
    expect(racine?.querySelector('[role="grid"]')).toBeNull();
  });

  it('enonce les consignes numerotees du plan', () => {
    expect(reperes(hote, 'consignes')[0]?.querySelectorAll('li').length).toBe(2);
    expect(texteDe(hote, 'consignes')).toContain('En C3, calculez le montant HT.');
  });

  it('relie chaque cellule a la lettre de sa colonne et au numero de sa ligne', () => {
    const portes = (cellule(hote, 'C3').closest('td')?.getAttribute('headers') ?? '').split(' ');
    expect(hote.shadowRoot?.querySelector(`#${portes[0]}`)?.textContent).toBe('C');
    expect(hote.shadowRoot?.querySelector(`#${portes[1]}`)?.textContent).toBe('3');
    expect(cellule(hote, 'C3').getAttribute('aria-label')).toBe('Cellule C3');
  });

  it('evalue la formule saisie et affiche le resultat dans les cellules non selectionnees', () => {
    chiffrer(hote);
    expect(cellule(hote, 'C3').value).toBe('54');
    expect(cellule(hote, 'D3').value).toBe(MONTANT_TTC);
    expect(formuleDe(hote, 'C3')).toBe(MONTANT_HT);
  });

  it('montre la formule de la cellule selectionnee dans la barre de formule', () => {
    chiffrer(hote);
    expect(texteDe(hote, 'reference')).toBe('D3');
    expect(barre(hote).value).toBe(MONTANT_TTC);
    selectionner(hote, 'C3');
    expect(texteDe(hote, 'reference')).toBe('C3');
    expect(cellule(hote, 'D3').value).toBe('64,8');
  });

  it('ecrit dans la cellule selectionnee depuis la barre de formule', () => {
    selectionner(hote, 'C3');
    const champ = barre(hote);
    champ.value = '=1+1';
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-testid')).toBe('barre');
    selectionner(hote, 'D3');
    expect(cellule(hote, 'C3').value).toBe('2');
  });

  it('descend d une ligne a la touche Entree et garde le parcours de lecture au Tab', () => {
    selectionner(hote, 'C3');
    entrer(hote, 'C3');
    expect(texteDe(hote, 'reference')).toBe('C4');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-nom')).toBe('C4');
    entrer(hote, 'C6');
    expect(texteDe(hote, 'reference')).toBe('C6');
    expect(reperes(hote, 'cellule').some((noeud) => noeud.hasAttribute('tabindex'))).toBe(false);
  });

  it('decale les references relatives a la recopie vers le bas et fige les ancrees', () => {
    chiffrer(hote);
    selectionner(hote, 'C3');
    cliquer(hote, 'recopier');
    expect(texteDe(hote, 'reference')).toBe('C4');
    expect(barre(hote).value).toBe('=A4*B4');
    selectionner(hote, 'D3');
    cliquer(hote, 'recopier');
    expect(barre(hote).value).toBe('=C4*(1+$B$1)');
    expect(cellule(hote, 'C4').value).toBe('360');
  });

  it('refuse de recopier depuis la derniere ligne sans casser la grille', () => {
    saisir(hote, 'C6', '=A3*2');
    cliquer(hote, 'recopier');
    expect(texteDe(hote, 'retour')).toContain('rien où aller');
    expect(barre(hote).value).toBe('=A3*2');
  });

  it('signale une cellule en erreur autrement que par la couleur seule', () => {
    saisir(hote, 'C3', '=A3/0');
    const fautive = cellule(hote, 'C3');
    expect(fautive.getAttribute('aria-invalid')).toBe('true');
    expect(fautive.getAttribute('data-erreur')).toBe('#DIV/0!');
    expect(fautive.getAttribute('title')).toContain('refusée');
    expect(texteDe(hote, 'erreurs')).toContain('C3');
    saisir(hote, 'D3', '=1');
    expect(cellule(hote, 'C3').value).toBe('#DIV/0!');
  });

  it('rend #REF! sans boucler quand deux cellules se citent en rond', () => {
    const debut = Date.now();
    saisir(hote, 'C3', '=D3+1');
    saisir(hote, 'D3', '=C3+1');
    expect(cellule(hote, 'C3').value).toBe('#REF!');
    expect(cellule(hote, 'D3').getAttribute('data-erreur')).toBe('#REF!');
    expect(Date.now() - debut).toBeLessThan(DELAI_MAX_MS);
  });

  it('refuse une formule qui ressemble a du code sans jamais l executer', () => {
    saisir(hote, 'C3', '=constructor(1)');
    expect(cellule(hote, 'C3').getAttribute('data-erreur')).toBe('#NOM?');
    saisir(hote, 'D3', '=__proto__');
    expect(cellule(hote, 'D3').getAttribute('data-erreur')).toBe('#VALEUR!');
    expect(texteDe(hote, 'erreurs')).toContain('D3');
  });

  it('tient les cellules verrouillees hors de toute saisie', () => {
    const donnee = cellule(hote, 'A3');
    expect(donnee.readOnly).toBe(true);
    donnee.value = '999';
    donnee.dispatchEvent(new Event('input', { bubbles: true }));
    expect(formuleDe(hote, 'A3')).toBe('12');
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(false);
  });

  it('refuse de valider tant qu aucune formule n a ete ecrite, puis envoie les seules saisies', () => {
    const recus = envois(hote);
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe(
      'Saisissez au moins une valeur ou choisissez « Je ne sais pas »',
    );
    expect(recus).toEqual([]);
    chiffrer(hote);
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe('Réponse enregistrée');
    expect(recus).toEqual([
      {
        planId: PLAN.id,
        cellules: { C3: MONTANT_HT, D3: MONTANT_TTC },
        dureeMs: jasmine.any(Number),
      },
    ]);
  });

  it('envoie je ne sais pas sans cellule', () => {
    const recus = envois(hote);
    cliquer(hote, 'je-ne-sais-pas');
    expect(recus.map((detail) => detail['neSaitPas'])).toEqual([true]);
    expect(recus[0]['cellules']).toBeUndefined();
  });

  it('n ecrit dans aucun stockage et n envoie la validation qu une fois', () => {
    const recus = envois(hote);
    chiffrer(hote);
    cliquer(hote, 'valider');
    cliquer(hote, 'valider');
    expect(recus.length).toBe(1);
    expect(traces.ecritures).toEqual([]);
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
  });

  it('confie les saisies au brouillon de l hote et les restaure sans toucher aux cellules verrouillees', () => {
    const brouillons: unknown[] = [];
    hote.addEventListener('fp-brouillon', (evenement) =>
      brouillons.push((evenement as CustomEvent).detail),
    );
    saisir(hote, 'C3', MONTANT_HT);
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { C3: MONTANT_HT } }]);

    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-RECHARGE' });
    hote.brouillon = { c3: MONTANT_HT, A3: '999', Z99: '=1' };

    expect(formuleDe(hote, 'C3')).toBe(MONTANT_HT);
    expect(formuleDe(hote, 'A3')).toBe('12');
    expect(texteDe(hote, 'brouillon-restaure')).toBe('Brouillon restauré');
  });

  it('marque les cellules selon le verdict recu', () => {
    chiffrer(hote);
    cliquer(hote, 'valider');
    hote.verdict = buildVerdictDeProduction({ questionId: PLAN.id });

    const marquees = reperes(hote, 'cellule-verdict');
    expect(marquees.map((td) => td.getAttribute('data-etat'))).toEqual(['confirme', 'a-revoir']);
    expect(marquees[1].getAttribute('title')).toBe('Référence relative non figée');
    expect(texteDe(hote, 'decompte')).toBe('Cellules justes : 1/2');
  });

  it('ne publie dans aucun rendu etudiant une valeur attendue non calculee', () => {
    hote.corrige = ATTENDUS_FORMATEUR;
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE_MACHINE);
    }
  });

  it('montre au pupitre les formules de reference', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.corrige = ATTENDUS_FORMATEUR;
    expect(texteDe(hote, 'attendu')).toBe('D3 =C3*(1+$B$1) 64,8');
  });

  it('RET-31 · projette les formules de correction au niveau 1 puis les valeurs au niveau 2', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.corrige = ATTENDUS_FORMATEUR;
    expect(repere(hote, 'correction-feuille')).toBeNull();

    hote.etayage = 1;
    const formule = hote.shadowRoot?.querySelector(
      '[data-testid="correction-feuille"][data-nom="D3"]',
    );
    expect(formule?.textContent?.trim()).toBe('=C3*(1+$B$1)');

    hote.etayage = 2;
    const valeur = hote.shadowRoot?.querySelector(
      '[data-testid="correction-feuille"][data-nom="D3"]',
    );
    expect(valeur?.textContent?.trim()).toBe('=C3*(1+$B$1) 64,8');
  });

  it('RET-31 · laisse reprendre les seules cases fausses apres verdict, sans renvoyer', () => {
    const recus = envois(hote);
    const brouillons: unknown[] = [];
    chiffrer(hote);
    cliquer(hote, 'valider');
    hote.verdict = buildVerdictDeProduction({ questionId: PLAN.id });
    hote.addEventListener('fp-brouillon', (evenement) =>
      brouillons.push((evenement as CustomEvent).detail),
    );

    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
    expect(cellule(hote, 'D3').hasAttribute('readonly')).toBe(false);
    saisir(hote, 'D3', '=C3*(1+$B$2)');
    expect(formuleDe(hote, 'D3')).toBe('=C3*(1+$B$2)');
    expect(cellule(hote, 'D3').closest('td')?.getAttribute('data-etat')).toBe('reprise');
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { C3: MONTANT_HT, D3: '=C3*(1+$B$2)' } }]);
    expect((repere(hote, 'valider') as HTMLButtonElement).disabled).toBe(true);
    expect(recus.length).toBe(1);
  });

  it('RET-31 · ferme la feuille aux reponses des que sa correction est revelee', () => {
    const recus = envois(hote);
    hote.etayage = 1;

    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
    expect((repere(hote, 'valider') as HTMLButtonElement).disabled).toBe(true);
    expect((repere(hote, 'je-ne-sais-pas') as HTMLButtonElement).disabled).toBe(true);
    cliquer(hote, 'je-ne-sais-pas');
    expect(recus).toEqual([]);
  });

  it('echappe le html de l intitule et de la formule tapee par l etudiant', () => {
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-XSS', intitule: CHARGE_XSS });
    saisir(hote, 'C3', CHARGE_XSS);
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(cellule(hote, 'C3').value).toBe(CHARGE_XSS);
  });

  it('ne garde du plan servi que les cellules de sa grille, hors de portee du moteur', () => {
    const debordantes: Record<string, string> = {};
    for (let rang = 1; rang <= CELLULES_DEBORDANTES; rang += 1) {
      debordantes[`Z${rang}`] = '=1+1';
    }

    hote.plan = buildSheetPlan({
      id: 'K-TABLEUR-DEBORDANT',
      cellules: { ...buildSheetPlan().cellules, ...debordantes },
    });
    chiffrer(hote);

    expect(cellule(hote, 'C3').value).toBe('54');
    expect(hote.shadowRoot?.querySelector('[data-nom="Z1"]')).toBeNull();
  });

  it('bati une grille sans ligne sans casser le tableau', () => {
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-VIDE', lignes: 0, cellules: {} });
    expect(hote.shadowRoot?.querySelectorAll('tbody tr').length).toBe(0);
    expect(reperes(hote, 'cellule')).toEqual([]);
    expect(texteDe(hote, 'vide')).toContain('Aucune cellule');
  });

  it('retire les champs en projection et affiche les reperes au tableau', () => {
    chiffrer(hote);
    hote.setAttribute('render', 'stage');
    expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
    expect(hote.shadowRoot?.querySelector('[data-nom="C3"]')?.textContent).toBe('54');
    hote.setAttribute('render', 'board');
    expect(texteDe(hote, 'modalite')).toBe('Individuel');
    expect(texteDe(hote, 'duree')).toBe('15 min');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = ATTENDUS_FORMATEUR;
    saisir(hote, 'C3', '=A3/0');
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'sheet')).toEqual([]);
  });
});
