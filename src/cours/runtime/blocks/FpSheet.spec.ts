import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildSheetPlan } from '../../../testing/factories/cours.factory';
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
    expect([...(racine?.querySelectorAll('thead th') ?? [])].map((th) => th.getAttribute('scope')))
      .withContext('la lettre de colonne doit etre un entete portant scope="col"')
      .toEqual(['col', 'col', 'col', 'col', 'col']);
    expect(reperes(hote, 'colonne').map((th) => th.textContent)).toEqual(['A', 'B', 'C', 'D']);
    expect(racine?.querySelectorAll('tbody tr').length).toBe(PLAN.lignes);
    expect(
      [...(racine?.querySelectorAll('tbody tr th') ?? [])].map((th) => th.getAttribute('scope')),
    ).toEqual(['row', 'row', 'row', 'row', 'row', 'row']);
    expect(racine?.querySelector('[role="grid"]')).toBeNull();
  });

  it('relie chaque cellule a la lettre de sa colonne et au numero de sa ligne', () => {
    const portes = (cellule(hote, 'C3').closest('td')?.getAttribute('headers') ?? '').split(' ');
    expect(hote.shadowRoot?.querySelector(`#${portes[0]}`)?.textContent).toBe('C');
    expect(hote.shadowRoot?.querySelector(`#${portes[1]}`)?.textContent).toBe('3');
    expect(cellule(hote, 'C3').getAttribute('aria-label')).toBe('Cellule C3');
  });

  it('evalue la formule saisie et affiche le resultat dans les cellules non selectionnees', () => {
    chiffrer(hote);
    expect(cellule(hote, 'C3').value)
      .withContext('C3 n est plus selectionnee : elle montre son resultat')
      .toBe('54');
    expect(cellule(hote, 'D3').value)
      .withContext('D3 est selectionnee : elle montre sa formule')
      .toBe(MONTANT_TTC);
    expect(hote.saisies['C3']).toBe(MONTANT_HT);
  });

  it('montre la formule de la cellule selectionnee dans la barre de formule', () => {
    chiffrer(hote);
    expect(texteDe(hote, 'reference')).toBe('D3');
    expect(barre(hote).value).toBe(MONTANT_TTC);
    cellule(hote, 'C3').dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    expect(texteDe(hote, 'reference')).toBe('C3');
    expect(barre(hote).value).toBe(MONTANT_HT);
    expect(cellule(hote, 'D3').value).toBe('64,8');
  });

  it('ecrit dans la cellule selectionnee depuis la barre de formule', () => {
    cellule(hote, 'C3').dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    const champ = barre(hote);
    champ.value = '=1+1';
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    expect(hote.saisies['C3']).toBe('=1+1');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-testid')).toBe('barre');
  });

  it('descend d une ligne a la touche Entree et garde le parcours de lecture au Tab', () => {
    cellule(hote, 'C3').dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    entrer(hote, 'C3');
    expect(texteDe(hote, 'reference')).toBe('C4');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-nom')).toBe('C4');
    entrer(hote, 'C6');
    expect(texteDe(hote, 'reference'))
      .withContext('la derniere ligne ne doit pas sortir de la grille')
      .toBe('C6');
    expect(reperes(hote, 'cellule').some((noeud) => noeud.hasAttribute('tabindex')))
      .withContext('un tabindex reordonnerait le parcours au clavier hors de l ordre de lecture')
      .toBe(false);
  });

  it('decale les references relatives a la recopie vers le bas et fige les ancrees', () => {
    chiffrer(hote);
    cellule(hote, 'C3').dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    cliquer(hote, 'recopier');
    expect(hote.saisies['C4']).toBe('=A4*B4');
    expect(texteDe(hote, 'reference')).toBe('C4');
    cellule(hote, 'D3').dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    cliquer(hote, 'recopier');
    expect(hote.saisies['D4'])
      .withContext('$B$1 est ancree : la recopie ne la decale pas')
      .toBe('=C4*(1+$B$1)');
    expect(cellule(hote, 'C4').value).toBe('360');
  });

  it('refuse de recopier depuis la derniere ligne sans casser la grille', () => {
    saisir(hote, 'C6', '=A3*2');
    cliquer(hote, 'recopier');
    expect(texteDe(hote, 'retour')).toContain('rien où aller');
    expect(hote.saisies['C6']).toBe('=A3*2');
  });

  it('signale une cellule en erreur autrement que par la couleur seule', () => {
    saisir(hote, 'C3', '=A3/0');
    const fautive = cellule(hote, 'C3');
    expect(fautive.getAttribute('aria-invalid')).toBe('true');
    expect(fautive.getAttribute('data-erreur')).toBe('#DIV/0!');
    expect(fautive.getAttribute('title')).toContain('refusée');
    expect(texteDe(hote, 'erreurs')).toContain('C3');
    saisir(hote, 'D3', '=1');
    expect(cellule(hote, 'C3').value)
      .withContext('le code d erreur doit se lire en clair dans la cellule')
      .toBe('#DIV/0!');
  });

  it('rend #REF! sans boucler quand deux cellules se citent en rond', () => {
    const debut = Date.now();
    saisir(hote, 'C3', '=D3+1');
    saisir(hote, 'D3', '=C3+1');
    expect(cellule(hote, 'C3').value).toBe('#REF!');
    expect(cellule(hote, 'D3').getAttribute('data-erreur')).toBe('#REF!');
    expect(texteDe(hote, 'erreurs')).toContain('C3');
    expect(Date.now() - debut)
      .withContext('un cycle doit etre coupe par la brique, pas parcouru')
      .toBeLessThan(DELAI_MAX_MS);
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
    expect(donnee.hasAttribute('readonly')).toBe(true);
    expect(donnee.readOnly).toBe(true);
    donnee.value = '999';
    donnee.dispatchEvent(new Event('input', { bubbles: true }));
    expect(hote.saisies['A3']).toBe('12');
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(false);
  });

  it('refuse de valider tant qu aucune formule n a ete ecrite', () => {
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toContain('Écrivez au moins une formule');
    expect(traces.evenements).toEqual([]);
    chiffrer(hote);
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe('Réponse enregistrée');
    expect(traces.evenements).toEqual(['fp-sheet-submit']);
  });

  it('n ecrit dans aucun stockage et n annonce la validation qu une fois', () => {
    chiffrer(hote);
    cliquer(hote, 'valider');
    cliquer(hote, 'valider');
    expect(traces.evenements).toEqual(['fp-sheet-submit']);
    expect(traces.ecritures).toEqual([]);
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
  });

  it('efface les valeurs attendues pour le poste etudiant comme pour le presentateur', () => {
    expect(JSON.stringify(hote.plan)).not.toContain('attendus');
    expect(JSON.stringify(hote.plan)).not.toContain(ATTENDU_CACHE_MACHINE);
    hote.setAttribute('role', 'presentateur');
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-PRES' });
    expect(JSON.stringify(hote.plan)).not.toContain('attendus');
    expect(JSON.stringify(hote.plan)).not.toContain(ATTENDU_CACHE_MACHINE);
  });

  it('ne publie dans le dom aucune valeur attendue tant qu elle n est pas calculee', () => {
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE_MACHINE);
    }
  });

  it('echappe le html de l intitule et de la formule tapee par l etudiant', () => {
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-XSS', intitule: CHARGE_XSS });
    saisir(hote, 'C3', CHARGE_XSS);
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(cellule(hote, 'C3').value).toBe(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
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
    expect(texteDe(hote, 'modalite')).toBe(PLAN.metadonnees.modalite);
    expect(texteDe(hote, 'duree')).toContain(String(PLAN.metadonnees.dureeMinutes));
    expect(texteDe(hote, 'progression')).toContain('écrites : 2');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'sheet')).toEqual([]);
  });
});
