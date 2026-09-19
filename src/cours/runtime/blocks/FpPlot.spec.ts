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

function animer(hote: FpPlot): void {
  const bouton = hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="animer"]');
  if (bouton === null || bouton === undefined) {
    throw new Error('aucun bouton d animation');
  }
  bouton.click();
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

  it('rend la source du graphique comme un lien quand elle est fournie', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-SOURCE-06',
      source: 'Données recréées pour le cours',
      sourceUrl: 'https://example.com/source',
    });

    const source = hote.shadowRoot?.querySelector('[data-testid="source"]');
    expect(source?.querySelector('a')?.getAttribute('href')).toBe('https://example.com/source');
  });

  it('donne les valeurs cles en tableau equivalent a la courbe', () => {
    expect(textesDe(hote, 'depart')).toEqual(['1000', '1000']);
    expect(textesDe(hote, 'arrivee')).toEqual(['2191,12', '1800']);
    expect(texteDe(hote, 'synthese')).toContain('Écart entre les deux courbes : 391,12');
  });

  it('redessine la courbe et la synthese quand la demonstration est lancée', () => {
    const avant = points(hote, 'compose');
    animer(hote);
    expect(hote.valeurs['i']).toBeGreaterThan(4);
    expect(points(hote, 'compose')).not.toEqual(avant);
    expect(Number(valeurAffichee(hote, 'i').replace(',', '.'))).toBeGreaterThan(4);
  });

  it('respecte des bornes verticales pilotées par un parametre anime', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-AXE-PILOTE',
      abscisse: { libelle: 'Période', min: 1, max: 4 },
      bornesOrdonnee: { minParametre: 'origine', max: 120 },
      parametres: [
        { cle: 'origine', libelle: 'Origine de l’axe', min: 0, max: 98, pas: 1, defaut: 0 },
      ],
      series: [{ id: 'serie', libelle: 'Série', trait: 'plein', calcul: '100 + x * 2' }],
    });

    const avant = textesDe(hote, 'graduation-y');
    animer(hote);
    const apres = textesDe(hote, 'graduation-y');

    expect(avant[0]).toBe('0');
    expect(apres).not.toEqual(avant);
  });

  it('ramene dans les bornes un defaut hors plage', () => {
    hote.definition = buildPlotDefinition({
      id: 'K-COURBE-DEFAUT',
      parametres: DEFINITION.parametres.map((parametre) =>
        parametre.cle === 'C' ? { ...parametre, defaut: 99999 } : parametre,
      ),
    });
    expect(hote.valeurs['C']).toBe(5000);
    expect(valeurAffichee(hote, 'C')).toBe('5000');
  });

  it('annonce chaque parametre en francais lisible et pas par un nombre nu', () => {
    for (const valeur of reperes(hote, 'valeur')) {
      const enonce = valeur.getAttribute('aria-label') ?? '';
      expect(enonce).not.toMatch(/^[\s\d,.]*$/);
      expect(enonce).toContain(' : ');
    }
    expect(repere(hote, 'valeur')?.getAttribute('aria-label')).toBe(
      'Capital place en euros : 1000 (de 100 à 5000)',
    );
    expect(repere(hote, 'curseur')?.getAttribute('aria-label')).toBe(
      'Capital place en euros : 1000 (de 100 à 5000)',
    );
  });

  it('regle un parametre au curseur et redessine sans remplacer le curseur', () => {
    const curseur = repere(hote, 'curseur') as HTMLInputElement;
    const avant = texteDe(hote, 'tableau');
    curseur.value = '3000';
    curseur.dispatchEvent(new Event('input', { bubbles: true }));

    expect(repere(hote, 'curseur')).toBe(curseur);
    expect(repere(hote, 'valeur')?.textContent?.trim()).toBe('3000');
    expect(texteDe(hote, 'tableau')).not.toBe(avant);
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
    expect(
      hote.shadowRoot
        ?.querySelector('[data-testid="valeur"][data-cle="C"]')
        ?.getAttribute('aria-label'),
    ).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('retire les curseurs en projection et affiche les reperes au tableau', () => {
    hote.setAttribute('render', 'stage');
    expect(reperes(hote, 'animer')).toEqual([]);
    expect(repere(hote, 'synthese')?.classList.contains('fp-enonce')).toBe(true);
    hote.setAttribute('render', 'board');
    expect(texteDe(hote, 'modalite')).toBe('En binôme');
    expect(texteDe(hote, 'duree')).toContain(String(DEFINITION.metadonnees.dureeMinutes));
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildPlotDefinition({ id: 'K-COURBE-02' });
    const contamine = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.definition = { ...piege, metadonnees: contamine };
    expect(JSON.stringify(hote.definition)).not.toContain('bonneReponse');
  });

  it('explore sans rien emettre vers la seance ni ecrire dans un stockage', () => {
    animer(hote);
    expect(traces.evenements).toEqual([]);
    expect(traces.ecritures).toEqual([]);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'plot')).toEqual([]);
  });
});
