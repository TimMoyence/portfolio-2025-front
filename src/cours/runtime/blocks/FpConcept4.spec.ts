import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildConcept4Definition } from '../../../testing/factories/cours.factory';
import { evaluerExpression, remplirGabarit } from '../core/formula';
import { type Concept4Definition, FpConcept4 } from './FpConcept4';

const DEFINITION = buildConcept4Definition();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 27;
const POINTS_ATTENDUS = 25;

function tous(hote: FpConcept4, selecteur: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(selecteur) ?? [])];
}

function un(hote: FpConcept4, repere: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${repere}"]`) ?? null;
}

function lu(hote: FpConcept4, repere: string): string {
  return un(hote, repere)?.textContent?.trim() ?? '';
}

function valeurDe(hote: FpConcept4, repere: string): string {
  return un(hote, repere)?.getAttribute('data-valeur') ?? '';
}

function quatreFaces(hote: FpConcept4): Readonly<Record<string, string>> {
  return {
    formule: valeurDe(hote, 'formule'),
    graphique: valeurDe(hote, 'graphique'),
    tableau: valeurDe(hote, 'tableau'),
    phrase: valeurDe(hote, 'phrase'),
  };
}

function animer(hote: FpConcept4): void {
  const bouton = hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="animer"]');
  if (bouton === null || bouton === undefined) {
    throw new Error('aucun bouton d animation');
  }
  bouton.click();
}

function resultatsDuTableau(hote: FpConcept4): string[] {
  return tous(hote, '[data-testid="resultat-ligne"]').map((cellule) => cellule.textContent ?? '');
}

function formaterEsperee(valeur: number): string {
  return Number.isFinite(valeur) ? String(Math.round(valeur * 100) / 100).replace('.', ',') : '—';
}

function resultatAttendu(valeurs: Readonly<Record<string, number>>): number {
  return evaluerExpression(DEFINITION.calcul, valeurs).valeur ?? Number.NaN;
}

function avecDefaut(cle: string, defaut: number): Concept4Definition {
  return buildConcept4Definition({
    id: 'K-QUATRE-FACES-02',
    parametres: DEFINITION.parametres.map((parametre) =>
      parametre.cle === cle ? { ...parametre, defaut } : parametre,
    ),
  });
}

describe('FpConcept4', () => {
  let hote: FpConcept4;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-concept4')) {
      customElements.define('fp-concept4', FpConcept4);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-concept4') as FpConcept4;
    traces = surveillerEffets(hote);
    hote.definition = DEFINITION;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('reflete la meme valeur dans les quatre faces apres une animation', () => {
    animer(hote);
    const attendue = String(resultatAttendu(hote.valeurs));
    expect(hote.valeurs['n']).toBeGreaterThan(10);
    expect(quatreFaces(hote)).toEqual({
      formule: attendue,
      graphique: attendue,
      tableau: attendue,
      phrase: attendue,
    });
  });

  it('surligne dans la formule le terme du parametre pilote et lui seul', () => {
    animer(hote);
    const surlignes = tous(hote, '[data-testid="terme"][data-actif="true"]');
    expect(tous(hote, '[data-testid="terme"]').length).toBe(DEFINITION.parametres.length);
    expect(surlignes.map((terme) => terme.textContent)).toEqual(['n']);
    expect(lu(hote, 'formule')).toContain('C × (1 + i)^n');
  });

  it('rend les fractions et les multiplications en notation lisible, sans exposer le LaTeX brut', () => {
    hote.definition = buildConcept4Definition({
      id: 'K-PROPORTION-FORMULE',
      parametres: [
        { cle: 'partie', libelle: 'partie', min: 10, max: 90, pas: 10, defaut: 30 },
        { cle: 'total', libelle: 'total', min: 100, max: 900, pas: 100, defaut: 100 },
      ],
      formuleLatexSimplifie: '\\dfrac{partie}{total} \\times 100',
      calcul: '(partie/total)*100',
      phrase: '{partie} représente {resultat} % de {total}.',
    });

    const formule = lu(hote, 'formule');
    expect(formule).toContain('partie');
    expect(formule).toContain('total');
    const fraction = hote.shadowRoot?.querySelector('[data-testid="fraction"]');
    expect(fraction).not.toBeNull();
    expect(fraction?.getAttribute('aria-label')).toBe('partie divisé par total');
    expect(formule).not.toContain('\\dfrac');
    expect(formule).not.toContain('\\times');
  });

  it('recalcule le tableau de valeurs et marque la seule ligne courante', () => {
    const avant = resultatsDuTableau(hote);
    animer(hote);
    const apres = resultatsDuTableau(hote);
    const courantes = tous(hote, '[data-testid="ligne"][data-courant="true"]');
    expect(apres).not.toEqual(avant);
    expect(courantes.length).toBe(1);
    expect(lu(hote, 'tableau')).toContain('Duree en annees');
  });

  it('regenere la phrase en langage courant a chaque mouvement', () => {
    const avant = lu(hote, 'phrase-texte');
    animer(hote);
    const valeurs = hote.valeurs;
    const resultat = resultatAttendu(valeurs);
    expect(lu(hote, 'phrase-texte')).toBe(
      remplirGabarit(DEFINITION.phrase, { ...valeurs, resultat }, formaterEsperee),
    );
    expect(lu(hote, 'phrase-texte')).not.toBe(avant);
  });

  it('dessine le graphique en svg produit par la brique sans bibliotheque', () => {
    const courbe = un(hote, 'courbe');
    const trace = un(hote, 'trace');
    expect(courbe).toBeInstanceOf(SVGSVGElement);
    expect(trace).toBeInstanceOf(SVGPolylineElement);
    expect((trace?.getAttribute('points') ?? '').split(' ').length).toBe(POINTS_ATTENDUS);
    expect(un(hote, 'point')).toBeInstanceOf(SVGCircleElement);
    expect(tous(hote, 'img, canvas, iframe, object, script')).toEqual([]);
  });

  it('ramene un defaut hors bornes dans les bornes au lieu de l ignorer', () => {
    hote.definition = avecDefaut('n', 99);
    expect(hote.valeurs['n']).toBe(30);
    expect(lu(hote, 'phrase-texte')).toContain('30 an(s)');
    expect(valeurDe(hote, 'formule')).toBe(String(resultatAttendu({ C: 1000, i: 4, n: 30 })));
  });

  it('annonce chaque parametre en francais lisible et pas par un nombre nu', () => {
    for (const valeur of tous(hote, '[data-testid="valeur"]')) {
      const enonce = valeur.getAttribute('aria-label') ?? '';
      expect(enonce).not.toMatch(/^[\s\d,.]*$/);
      expect(enonce).toContain(' : ');
    }
    expect(
      hote.shadowRoot
        ?.querySelector('[data-testid="valeur"][data-cle="n"]')
        ?.getAttribute('aria-label'),
    ).toBe('Duree en annees : 10 (de 1 à 30)');
    expect(hote.shadowRoot?.querySelector('input[type="range"]')).toBeNull();
  });

  it('echappe le html injecte dans la formule, les libelles et la phrase', () => {
    hote.definition = buildConcept4Definition({
      id: 'K-QUATRE-FACES-03',
      formuleLatexSimplifie: CHARGE_XSS,
      phrase: CHARGE_XSS,
      parametres: DEFINITION.parametres.map((parametre) => ({ ...parametre, libelle: CHARGE_XSS })),
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(lu(hote, 'phrase-texte')).toBe(CHARGE_XSS);
    expect(lu(hote, 'formule')).toContain(CHARGE_XSS);
    expect(
      hote.shadowRoot
        ?.querySelector('[data-testid="valeur"][data-cle="n"]')
        ?.getAttribute('aria-label'),
    ).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('affiche un tiret quand la formule de calcul est invalide sans casser la brique', () => {
    hote.definition = buildConcept4Definition({ id: 'K-QUATRE-FACES-05', calcul: 'C+' });
    expect(lu(hote, 'resultat-formule')).toBe('—');
    expect(resultatsDuTableau(hote).every((resultat) => resultat === '—')).toBe(true);
    expect(lu(hote, 'phrase-texte')).toContain('— €.');
    expect(un(hote, 'courbe')).toBeInstanceOf(SVGSVGElement);
  });

  it('passe la phrase a la grande typographie de projection en rendu stage seulement', () => {
    expect(un(hote, 'phrase-texte')?.classList.contains('fp-enonce')).toBe(false);
    hote.setAttribute('render', 'stage');
    expect(un(hote, 'phrase-texte')?.classList.contains('fp-enonce')).toBe(true);
    expect(tous(hote, '[data-testid="animer"]')).toEqual([]);
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildConcept4Definition({ id: 'K-QUATRE-FACES-04' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.definition = { ...piege, metadonnees };
    expect(JSON.stringify(hote.definition)).not.toContain('bonneReponse');
  });

  it('n ecrit dans aucun stockage et n annonce que l exploration', () => {
    animer(hote);
    expect(traces.evenements).toContain('fp-concept4-explore');
    expect(traces.ecritures).toEqual([]);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'concept4')).toEqual([]);
  });
});
