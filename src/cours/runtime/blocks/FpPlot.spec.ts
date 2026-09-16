import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildPlotDefinition } from '../../../testing/factories/cours.factory';
import {
  FpPlot,
  HAUTEUR,
  LARGEUR,
  MARGE_BAS,
  MARGE_DROITE,
  MARGE_GAUCHE,
  MARGE_HAUT,
  type PlotDefinition,
} from './FpPlot';

const DEFINITION = buildPlotDefinition();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 27;
const GRADUATIONS_ATTENDUES = 5;
const ECHANTILLONS_ATTENDUS = 25;
const SEPT_CHIFFRES = 5_000_000;

function lineaire(): PlotDefinition {
  return buildPlotDefinition({
    id: 'K-COURBE-LINEAIRE',
    abscisse: { libelle: 'Rang', min: 0, max: 10 },
    parametres: [],
    series: [{ id: 'rampe', libelle: 'Rampe', trait: 'plein', calcul: 'x' }],
  });
}

function repere(hote: FpPlot, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function reperes(hote: FpPlot, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function texteDe(hote: FpPlot, nom: string): string {
  return repere(hote, nom)?.textContent?.trim() ?? '';
}

function textesDe(hote: FpPlot, nom: string): string[] {
  return reperes(hote, nom).map((noeud) => noeud.textContent?.trim() ?? '');
}

function points(hote: FpPlot, serie: string): string[] {
  const trace = hote.shadowRoot?.querySelector(`[data-testid="trace"][data-serie="${serie}"]`);
  return (trace?.getAttribute('points') ?? '').split(' ').filter((point) => point.length > 0);
}

function tousLesPoints(hote: FpPlot): string[] {
  return reperes(hote, 'trace').flatMap((trace) =>
    (trace.getAttribute('points') ?? '').split(' ').filter((point) => point.length > 0),
  );
}

function horsZoneDeTrace(hote: FpPlot): string[] {
  return tousLesPoints(hote).filter((point) => {
    const abscisse = Number(point.split(',')[0]);
    const ordonnee = Number(point.split(',')[1]);
    const dedansX = abscisse >= MARGE_GAUCHE && abscisse <= LARGEUR - MARGE_DROITE;
    const dedansY = ordonnee >= MARGE_HAUT && ordonnee <= HAUTEUR - MARGE_BAS;
    return !dedansX || !dedansY;
  });
}

function glissiere(hote: FpPlot, cle: string): HTMLInputElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLInputElement>(
    `[data-testid="curseur"][data-cle="${cle}"]`,
  );
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error(`aucun curseur pour ${cle}`);
  }
  return trouvee;
}

function regler(hote: FpPlot, cle: string, valeur: number): void {
  const curseur = glissiere(hote, cle);
  curseur.value = String(valeur);
  curseur.dispatchEvent(new Event('input', { bubbles: true }));
}

function reglerSansBornageDuNavigateur(hote: FpPlot, cle: string, valeur: number): void {
  const curseur = glissiere(hote, cle);
  curseur.min = String(Math.min(valeur, 0));
  curseur.max = String(Math.max(valeur, 0));
  curseur.step = 'any';
  curseur.value = String(valeur);
  curseur.dispatchEvent(new Event('input', { bubbles: true }));
}

function toucher(hote: FpPlot, cle: string, touche: string): void {
  glissiere(hote, cle).dispatchEvent(
    new KeyboardEvent('keydown', { key: touche, bubbles: true, cancelable: true }),
  );
}

function valeurAffichee(hote: FpPlot, cle: string): string {
  const sortie = hote.shadowRoot?.querySelector(`[data-testid="valeur"][data-cle="${cle}"]`);
  return sortie?.textContent?.trim() ?? '';
}

describe('FpPlot', () => {
  let hote: FpPlot;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-plot')) {
      customElements.define('fp-plot', FpPlot);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-plot') as FpPlot;
    traces = surveillerEffets(hote);
    hote.definition = DEFINITION;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('trace une polyligne par serie en svg produit par la brique sans bibliotheque', () => {
    expect(repere(hote, 'graphique')).toBeInstanceOf(SVGSVGElement);
    expect(reperes(hote, 'trace').length).toBe(DEFINITION.series.length);
    for (const trace of reperes(hote, 'trace')) {
      expect(trace).toBeInstanceOf(SVGPolylineElement);
    }
    expect(points(hote, 'compose').length).toBe(ECHANTILLONS_ATTENDUS);
    expect(hote.shadowRoot?.querySelectorAll('img, canvas, iframe, object, script').length).toBe(0);
  });

  it('projette une serie lineaire connue sur les coordonnees attendues', () => {
    hote.definition = lineaire();
    const traces = points(hote, 'rampe');
    expect(traces.length).toBe(ECHANTILLONS_ATTENDUS);
    expect(traces[0]).toBe('64,218');
    expect(traces[12]).toBe('203,119');
    expect(traces[ECHANTILLONS_ATTENDUS - 1]).toBe('342,20');
  });

  it('distingue les deux series par le trait et par une legende en toutes lettres', () => {
    const traits = reperes(hote, 'trace').map((trace) => trace.getAttribute('data-trait'));
    expect(traits).toEqual(['plein', 'tirets']);
    expect(textesDe(hote, 'serie')).toEqual([
      'Interets composes — trait plein',
      'Interets simples — trait en pointillés',
    ]);
    for (const trace of reperes(hote, 'trace')) {
      expect(trace.getAttribute('stroke')).toBeNull();
    }
  });

  it('gradue les deux axes avec des reperes chiffres lisibles', () => {
    expect(textesDe(hote, 'graduation-x')).toEqual(['0', '5', '10', '15', '20']);
    expect(textesDe(hote, 'graduation-y').length).toBe(GRADUATIONS_ATTENDUES);
    expect(textesDe(hote, 'graduation-y')[0]).toBe('1000');
    expect(textesDe(hote, 'graduation-y')[GRADUATIONS_ATTENDUES - 1]).toBe('2191,12');
  });

  it('rend une definition sans aucune serie sans casser la figure', () => {
    hote.definition = buildPlotDefinition({ id: 'K-COURBE-VIDE', series: [] });
    expect(repere(hote, 'graphique')).toBeInstanceOf(SVGSVGElement);
    expect(reperes(hote, 'trace')).toEqual([]);
    expect(reperes(hote, 'ligne')).toEqual([]);
    expect(texteDe(hote, 'vide')).toContain('Aucune courbe');
    expect(texteDe(hote, 'synthese')).toContain('Aucune courbe');
  });

  it('rend une serie sans point calculable sans casser la figure', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-COURBE-NAN',
      series: [{ id: 'nulle', libelle: 'Serie sans point', trait: 'plein', calcul: 'z' }],
    });
    expect(reperes(hote, 'trace')).toEqual([]);
    expect(reperes(hote, 'ligne').length).toBe(1);
    expect(textesDe(hote, 'arrivee')).toEqual(['—']);
    expect(texteDe(hote, 'vide')).toContain('Aucune courbe');
  });

  it('garde les valeurs extremes dans la zone de trace pour un capital a sept chiffres', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-COURBE-MILLIONS',
      parametres: [
        {
          cle: 'C',
          libelle: 'Capital place en euros',
          min: SEPT_CHIFFRES,
          max: SEPT_CHIFFRES * 2,
          pas: SEPT_CHIFFRES,
          defaut: SEPT_CHIFFRES,
        },
        { cle: 'i', libelle: 'Taux annuel en pourcent', min: 1, max: 10, pas: 0.5, defaut: 10 },
      ],
    });
    expect(tousLesPoints(hote).length).toBe(ECHANTILLONS_ATTENDUS * 2);
    expect(horsZoneDeTrace(hote)).toEqual([]);
    expect(texteDe(hote, 'arrivee')).toBe('33637499,75');
  });

  it('decrit le graphique par un titre et une description pour un lecteur d ecran', () => {
    expect(texteDe(hote, 'titre-svg')).toBe(
      'Capital acquis en euros en fonction de Duree en annees',
    );
    const description = texteDe(hote, 'description-svg');
    expect(description).toContain('Duree en annees de 0 à 20');
    expect(description).toContain('Interets composes (trait plein)');
    expect(description).toContain('Interets simples (trait en pointillés)');
    expect(repere(hote, 'graphique')?.getAttribute('role')).toBe('img');
  });

  it('donne les valeurs cles en tableau equivalent a la courbe', () => {
    expect(textesDe(hote, 'depart')).toEqual(['1000', '1000']);
    expect(textesDe(hote, 'arrivee')).toEqual(['2191,12', '1800']);
    expect(texteDe(hote, 'synthese')).toContain('Écart entre les deux courbes : 391,12');
  });

  it('redessine la courbe et la synthese quand un curseur bouge', () => {
    const avant = points(hote, 'compose');
    regler(hote, 'i', 10);
    expect(hote.valeurs).toEqual({ C: 1000, i: 10 });
    expect(points(hote, 'compose')).not.toEqual(avant);
    expect(textesDe(hote, 'arrivee')).toEqual(['6727,5', '3000']);
    expect(valeurAffichee(hote, 'i')).toBe('10');
  });

  it('ramene dans les bornes une valeur poussee au-dela du maximum par l entree', () => {
    reglerSansBornageDuNavigateur(hote, 'C', 99999);
    expect(hote.valeurs['C']).toBe(5000);
    expect(valeurAffichee(hote, 'C')).toBe('5000');
    expect(textesDe(hote, 'depart')).toEqual(['5000', '5000']);
    reglerSansBornageDuNavigateur(hote, 'C', -400);
    expect(hote.valeurs['C']).toBe(100);
    expect(valeurAffichee(hote, 'C')).toBe('100');
  });

  it('ramene dans les bornes un defaut hors plage et la fleche qui depasse', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-COURBE-DEFAUT',
      parametres: DEFINITION.parametres.map((parametre) =>
        parametre.cle === 'C' ? { ...parametre, defaut: 99999 } : parametre,
      ),
    });
    expect(hote.valeurs['C']).toBe(5000);
    expect(valeurAffichee(hote, 'C')).toBe('5000');
    toucher(hote, 'C', 'ArrowRight');
    expect(hote.valeurs['C']).toBe(5000);
    expect(valeurAffichee(hote, 'C')).toBe('5000');
  });

  it('deplace les curseurs au clavier par pas et rend le focus a celui qui bouge', () => {
    toucher(hote, 'i', 'ArrowUp');
    expect(hote.valeurs['i']).toBe(4.5);
    toucher(hote, 'i', 'ArrowLeft');
    expect(hote.valeurs['i']).toBe(4);
    expect(valeurAffichee(hote, 'i')).toBe('4');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-cle')).toBe('i');
  });

  it('annonce chaque curseur en francais lisible et pas par un nombre nu', () => {
    for (const curseur of reperes(hote, 'curseur')) {
      const enonce = curseur.getAttribute('aria-valuetext') ?? '';
      expect(enonce).not.toMatch(/^[\s\d,.]*$/);
      expect(enonce).toContain(' : ');
    }
    expect(glissiere(hote, 'C').getAttribute('aria-valuetext')).toBe(
      'Capital place en euros : 1000 (de 100 à 5000)',
    );
  });

  it('echappe le html injecte dans les libelles des axes et des series', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-COURBE-XSS',
      abscisse: { libelle: CHARGE_XSS, min: 0, max: 20 },
      ordonnee: CHARGE_XSS,
      series: DEFINITION.series.map((serie) => ({ ...serie, libelle: CHARGE_XSS })),
      parametres: DEFINITION.parametres.map((parametre) => ({ ...parametre, libelle: CHARGE_XSS })),
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(texteDe(hote, 'titre-svg')).toContain(CHARGE_XSS);
    expect(texteDe(hote, 'description-svg')).toContain(CHARGE_XSS);
    expect(glissiere(hote, 'C').getAttribute('aria-valuetext')).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('retire les curseurs en projection et affiche les reperes au tableau', () => {
    hote.setAttribute('render', 'stage');
    expect(reperes(hote, 'curseur')).toEqual([]);
    expect(repere(hote, 'synthese')?.classList.contains('fp-enonce')).toBe(true);
    hote.setAttribute('render', 'board');
    expect(texteDe(hote, 'modalite')).toBe(DEFINITION.metadonnees.modalite);
    expect(texteDe(hote, 'duree')).toContain(String(DEFINITION.metadonnees.dureeMinutes));
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildPlotDefinition({ id: 'K-COURBE-02' });
    const contamine = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.definition = { ...piege, metadonnees: contamine };
    expect(JSON.stringify(hote.definition)).not.toContain('bonneReponse');
  });

  it('n ecrit dans aucun stockage et n annonce que l exploration', () => {
    regler(hote, 'i', 6);
    toucher(hote, 'C', 'ArrowDown');
    expect(traces.evenements).toEqual(['fp-plot-explore', 'fp-plot-explore']);
    expect(traces.ecritures).toEqual([]);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'plot')).toEqual([]);
  });
});
