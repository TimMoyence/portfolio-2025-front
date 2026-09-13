import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildTableBuildPlan } from '../../../testing/factories/cours.factory';
import { FpTableBuild } from './FpTableBuild';

const PLAN = buildTableBuildPlan();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 14;
const RENDUS = ['stage', 'hand', 'board'] as const;
const INTERETS_JUSTES = ['300', '243,49', '185,29', '125,34', '63,60'];
const CRD_ATTENDUS = ['10000,00', '8116,45', '6176,39', '4178,13', '2119,92'];
const AMORTISSEMENTS_ATTENDUS = ['1883,55', '1940,06', '1998,26', '2058,21', '2119,92'];
const ANNUITES_ATTENDUES = ['2183,55', '2183,55', '2183,55', '2183,55', '2183,52'];
const CLE_SAISIE = 'interets';
const CLE_AMORTISSEMENT = 'amortissement';
const CLE_CRD = 'crd';
const CLE_ANNUITE = 'annuite';
const ATTENDU_CACHE = '243,49';
const ATTENDU_CACHE_MACHINE = '243.49';

function repere(hote: FpTableBuild, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function reperes(hote: FpTableBuild, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function texteDe(hote: FpTableBuild, nom: string): string {
  return repere(hote, nom)?.textContent?.trim() ?? '';
}

function cellule(hote: FpTableBuild, rang: number, cle: string): HTMLInputElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLInputElement>(
    `[data-testid="cellule"][data-rang="${rang}"][data-cle="${cle}"]`,
  );
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error(`aucune cellule ${cle} a l echeance ${rang}`);
  }
  return trouvee;
}

function affichee(hote: FpTableBuild, rang: number, cle: string): string {
  return cellule(hote, rang, cle).value;
}

function colonneAffichee(hote: FpTableBuild, cle: string): string[] {
  return reperes(hote, 'cellule')
    .filter((noeud) => noeud.getAttribute('data-cle') === cle)
    .map((noeud) => (noeud instanceof HTMLInputElement ? noeud.value : (noeud.textContent ?? '')));
}

function saisir(hote: FpTableBuild, rang: number, cle: string, texte: string): void {
  const champ = cellule(hote, rang, cle);
  champ.value = texte;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

function remplirLesInterets(hote: FpTableBuild): void {
  INTERETS_JUSTES.forEach((montant, rang) => saisir(hote, rang, CLE_SAISIE, montant));
}

function total(hote: FpTableBuild, cle: string): string {
  const trouve = hote.shadowRoot?.querySelector(`[data-testid="total"][data-cle="${cle}"]`);
  return trouve?.textContent?.trim() ?? '';
}

function cliquer(hote: FpTableBuild, nom: string): void {
  repere(hote, nom)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function ordreDeLecture(hote: FpTableBuild): string[] {
  return reperes(hote, 'cellule').map(
    (noeud) => `${noeud.getAttribute('data-rang')}:${noeud.getAttribute('data-cle')}`,
  );
}

describe('FpTableBuild', () => {
  let hote: FpTableBuild;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-table-build')) {
      customElements.define('fp-table-build', FpTableBuild);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-table-build') as FpTableBuild;
    traces = surveillerEffets(hote);
    hote.plan = buildTableBuildPlan();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('batit un vrai tableau avec des entetes de colonne et de ligne portees', () => {
    const racine = hote.shadowRoot;
    expect(racine?.querySelectorAll('table').length).toBe(1);
    expect(racine?.querySelector('caption')?.textContent?.trim()).toBe(PLAN.intitule);
    expect([...(racine?.querySelectorAll('thead th') ?? [])].map((th) => th.getAttribute('scope')))
      .withContext('chaque entete de colonne doit porter scope="col"')
      .toEqual(['col', 'col', 'col', 'col', 'col']);
    expect(racine?.querySelectorAll('tbody tr').length).toBe(PLAN.echeances);
    expect(
      [...(racine?.querySelectorAll('tbody tr') ?? [])].map((ligne) =>
        ligne.querySelector('th')?.getAttribute('scope'),
      ),
    ).toEqual(['row', 'row', 'row', 'row', 'row']);
    expect(racine?.querySelector('[role="grid"]')).toBeNull();
    expect(reperes(hote, 'cellule').every((noeud) => noeud.closest('td') !== null)).toBe(true);
  });

  it('relie chaque cellule a son entete de colonne et a son entete de ligne', () => {
    const champ = cellule(hote, 2, CLE_SAISIE);
    const portes = (champ.closest('td')?.getAttribute('headers') ?? '').split(' ');
    const enteteColonne = hote.shadowRoot?.querySelector(`#${portes[0]}`);
    const enteteLigne = hote.shadowRoot?.querySelector(`#${portes[1]}`);
    expect(enteteColonne?.textContent).toContain('Interets');
    expect(enteteLigne?.textContent?.trim()).toBe('3');
    expect(champ.getAttribute('aria-label')).toBe('Interets — Échéance 3');
  });

  it('recalcule les cellules deduites quand une cellule saisie change', () => {
    saisir(hote, 0, CLE_SAISIE, '300');
    expect(affichee(hote, 0, CLE_AMORTISSEMENT)).toBe('1883,55');
    expect(affichee(hote, 0, CLE_ANNUITE)).toBe('2183,55');
    expect(affichee(hote, 1, CLE_CRD)).toBe('8116,45');
    saisir(hote, 0, CLE_SAISIE, '250');
    expect(affichee(hote, 0, CLE_AMORTISSEMENT)).toBe('1933,55');
    expect(affichee(hote, 0, CLE_ANNUITE)).toBe('2183,55');
    expect(affichee(hote, 1, CLE_CRD)).toBe('8066,45');
  });

  it('solde exactement le capital restant du sur la derniere echeance', () => {
    remplirLesInterets(hote);
    expect(colonneAffichee(hote, CLE_CRD)).toEqual(CRD_ATTENDUS);
    expect(colonneAffichee(hote, CLE_AMORTISSEMENT)).toEqual(AMORTISSEMENTS_ATTENDUS);
    expect(colonneAffichee(hote, CLE_ANNUITE)).toEqual(ANNUITES_ATTENDUES);
    expect(texteDe(hote, 'solde')).toContain('0,00');
    expect(total(hote, CLE_AMORTISSEMENT)).toBe('10000,00');
    expect(total(hote, CLE_ANNUITE)).toBe('10917,72');
    expect(total(hote, CLE_SAISIE)).toBe('917,72');
  });

  it('laisse la cellule deduite hors de toute saisie', () => {
    const deduite = cellule(hote, 0, CLE_CRD);
    expect(deduite.hasAttribute('readonly')).toBe(true);
    expect(deduite.readOnly).toBe(true);
    deduite.value = '99999';
    deduite.dispatchEvent(new Event('input', { bubbles: true }));
    expect(hote.saisies).toEqual({});
    saisir(hote, 0, CLE_SAISIE, '300');
    expect(affichee(hote, 0, CLE_CRD)).toBe('10000,00');
    expect(hote.saisies).toEqual({ '0:interets': '300' });
    expect(cellule(hote, 0, CLE_SAISIE).hasAttribute('readonly')).toBe(false);
  });

  it('presente les cellules au clavier dans l ordre de lecture du tableau', () => {
    expect(ordreDeLecture(hote).slice(0, 8)).toEqual([
      '0:crd',
      '0:interets',
      '0:amortissement',
      '0:annuite',
      '1:crd',
      '1:interets',
      '1:amortissement',
      '1:annuite',
    ]);
    expect(reperes(hote, 'cellule').length).toBe(PLAN.echeances * PLAN.colonnes.length);
    expect(reperes(hote, 'cellule').some((noeud) => noeud.hasAttribute('tabindex')))
      .withContext('un tabindex reordonnerait le parcours au clavier hors de l ordre de lecture')
      .toBe(false);
  });

  it('rend le focus a la cellule saisie sans perdre le texte deja tape', () => {
    saisir(hote, 3, CLE_SAISIE, '125,3');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-rang')).toBe('3');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-cle')).toBe(CLE_SAISIE);
    expect(affichee(hote, 3, CLE_SAISIE)).toBe('125,3');
  });

  it('garde la saisie non numerique telle quelle et ne deduit rien a partir d elle', () => {
    saisir(hote, 0, CLE_SAISIE, 'trois cents');
    expect(affichee(hote, 0, CLE_SAISIE)).toBe('trois cents');
    expect(affichee(hote, 0, CLE_AMORTISSEMENT)).toBe('—');
    expect(affichee(hote, 1, CLE_CRD)).toBe('—');
    expect(total(hote, CLE_AMORTISSEMENT)).toBe('—');
  });

  it('accepte la virgule decimale et les espaces des montants francais', () => {
    saisir(hote, 0, CLE_SAISIE, ' 300,00 ');
    expect(affichee(hote, 0, CLE_AMORTISSEMENT)).toBe('1883,55');
    saisir(hote, 1, CLE_SAISIE, '243,49');
    expect(affichee(hote, 1, CLE_AMORTISSEMENT)).toBe('1940,06');
  });

  it('arrete la deduction apres une echeance restee vide sans casser le tableau', () => {
    saisir(hote, 0, CLE_SAISIE, '300');
    expect(affichee(hote, 1, CLE_CRD)).toBe('8116,45');
    expect(affichee(hote, 1, CLE_AMORTISSEMENT)).toBe('—');
    expect(affichee(hote, 2, CLE_CRD)).toBe('—');
    expect(texteDe(hote, 'solde')).toContain('—');
  });

  it('bati un plan sans echeance sans casser le tableau', () => {
    hote.plan = buildTableBuildPlan({ id: 'K-AMORTISSEMENT-VIDE', echeances: 0 });
    expect(hote.shadowRoot?.querySelectorAll('tbody tr').length).toBe(0);
    expect(reperes(hote, 'cellule')).toEqual([]);
    expect(texteDe(hote, 'vide')).toContain('Aucune ligne');
  });

  it('refuse de valider tant qu une cellule a saisir reste vide', () => {
    saisir(hote, 0, CLE_SAISIE, '300');
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toContain('Complétez chaque cellule');
    expect(traces.evenements).toEqual([]);
    remplirLesInterets(hote);
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe('Réponse enregistrée');
    expect(traces.evenements).toEqual(['fp-table-build-submit']);
  });

  it('n ecrit dans aucun stockage et n annonce que la validation', () => {
    remplirLesInterets(hote);
    cliquer(hote, 'valider');
    cliquer(hote, 'valider');
    expect(traces.evenements).toEqual(['fp-table-build-submit']);
    expect(traces.ecritures).toEqual([]);
  });

  it('efface les valeurs attendues et la tolerance pour le poste etudiant', () => {
    const recu = JSON.stringify(hote.plan);
    expect(recu).not.toContain('attendus');
    expect(recu).not.toContain('tolerance');
    expect(recu).not.toContain(ATTENDU_CACHE_MACHINE);
  });

  it('efface les valeurs attendues meme pour le poste presentateur', () => {
    hote.setAttribute('role', 'presentateur');
    hote.plan = buildTableBuildPlan({ id: 'K-AMORTISSEMENT-PRES' });
    const recu = JSON.stringify(hote.plan);
    expect(recu).not.toContain('attendus');
    expect(recu).not.toContain(ATTENDU_CACHE_MACHINE);
  });

  it('efface une valeur attendue nichee dans les metadonnees', () => {
    const piege = buildTableBuildPlan({ id: 'K-AMORTISSEMENT-PIEGE' });
    const metadonnees = { ...piege.metadonnees, valeurAttendue: 243.49 };
    hote.plan = { ...piege, metadonnees };
    expect(JSON.stringify(hote.plan)).not.toContain(ATTENDU_CACHE_MACHINE);
  });

  it('ne publie dans le dom aucune valeur attendue', () => {
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE_MACHINE);
    }
  });

  it('echappe le html injecte dans l intitule du tableau et des colonnes', () => {
    hote.plan = buildTableBuildPlan({
      id: 'K-AMORTISSEMENT-XSS',
      intitule: CHARGE_XSS,
      colonnes: PLAN.colonnes.map((colonne) => ({ ...colonne, intitule: CHARGE_XSS })),
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(cellule(hote, 0, CLE_SAISIE).getAttribute('aria-label')).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('retire les champs en projection et affiche les reperes au tableau', () => {
    hote.setAttribute('render', 'stage');
    expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
    expect(hote.shadowRoot?.querySelectorAll('tbody tr').length).toBe(PLAN.echeances);
    hote.setAttribute('render', 'board');
    expect(texteDe(hote, 'modalite')).toBe(PLAN.metadonnees.modalite);
    expect(texteDe(hote, 'duree')).toContain(String(PLAN.metadonnees.dureeMinutes));
    expect(texteDe(hote, 'progression')).toContain('0 / 5');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'table-build')).toEqual([]);
  });
});
