import {
  attendreAucunEffet,
  attendreChaqueClasseCouverte,
  attendreLaCorrectionNicheeEffacee,
} from '../../../testing/assertions-briques';
import { classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildPlotDefinition, buildPlotEnBarres } from '../../../testing/factories/cours.factory';
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

function sansEspaces(texte: string): string {
  return texte.replace(/\s/g, '');
}

function prereglage(hote: FpPlot, libelle: string): void {
  const bouton = reperes(hote, 'prereglage').find(
    (candidat) => candidat.textContent?.trim() === libelle,
  );
  if (!(bouton instanceof HTMLButtonElement)) {
    throw new Error(`aucun préréglage ${libelle}`);
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

  it('G2 · projette les curseurs réglables et la lecture du poste étudiant', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    const curseur = repere(hote, 'curseur') as HTMLInputElement | null;
    const avant = texteDe(hote, 'tableau');

    expect(reperes(hote, 'animer').length).toBe(1);
    expect(repere(hote, 'synthese')?.classList.contains('fp-prose')).toBe(true);
    if (curseur !== null) {
      curseur.value = '3000';
      curseur.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(repere(hote, 'valeur')?.textContent?.trim()).toBe('3000');
    expect(texteDe(hote, 'tableau')).not.toBe(avant);
  });

  it('E13 · trace une barre par année, étiquetée, avec ses montants en euros', () => {
    hote.definition = buildPlotEnBarres();

    expect(reperes(hote, 'barre').length).toBe(4);
    expect(reperes(hote, 'trace').length).toBe(0);
    expect(textesDe(hote, 'graduation-x')).toEqual(['2022', '2023', '2024', '2025']);
    expect(textesDe(hote, 'montant-barre').map(sansEspaces)).toEqual([
      '285000€',
      '288000€',
      '289800€',
      '291000€',
    ]);
    expect(sansEspaces(valeurAffichee(hote, 'origine'))).toBe('284000€');
  });

  it('E13 · confronte le rapport des hauteurs à l évolution réelle selon le préréglage', () => {
    hote.definition = buildPlotEnBarres();

    expect(texteDe(hote, 'rapport-hauteurs')).toBe('×7');
    expect(sansEspaces(texteDe(hote, 'evolution-reelle'))).toBe('+2,1%');

    prereglage(hote, 'Axe à zéro');

    expect(texteDe(hote, 'rapport-hauteurs')).toBe('×1,02');
    expect(sansEspaces(texteDe(hote, 'evolution-reelle'))).toBe('+2,1%');
    expect(sansEspaces(valeurAffichee(hote, 'origine'))).toBe('0€');
    expect((repere(hote, 'curseur') as HTMLInputElement | null)?.value).toBe('0');

    prereglage(hote, 'Axe de Samir');

    expect(texteDe(hote, 'rapport-hauteurs')).toBe('×7');
  });

  it('E13 · refuse un rapport des hauteurs ou une évolution sans base significative', () => {
    hote.definition = buildPlotEnBarres({
      series: [{ id: 'marge', libelle: 'Marge brute', trait: 'plein', calcul: '290000-3000*x' }],
    });

    expect(texteDe(hote, 'rapport-hauteurs')).toBe('—');

    hote.definition = buildPlotEnBarres({
      id: 'K-BARRES-NULLE',
      series: [{ id: 'marge', libelle: 'Marge brute', trait: 'plein', calcul: '1000*x' }],
    });
    prereglage(hote, 'Axe à zéro');

    expect(texteDe(hote, 'evolution-reelle')).toBe('—');
  });

  it('E13 · décrit les barres par leurs années et annonce le préréglage actif et le rapport', () => {
    hote.definition = buildPlotEnBarres();
    const pressions = (): (string | null)[] =>
      reperes(hote, 'prereglage').map((bouton) => bouton.getAttribute('aria-pressed'));

    expect(texteDe(hote, 'description-svg')).toContain('2022');
    expect(texteDe(hote, 'description-svg')).toContain('2025');
    expect(repere(hote, 'rapport')?.getAttribute('aria-live')).toBe('polite');
    expect(pressions()).toEqual(['true', 'false']);

    prereglage(hote, 'Axe à zéro');

    expect(pressions()).toEqual(['false', 'true']);
  });

  it('G06 · en barres, laisse la lecture au rapport et à la description du graphique sans phrase redondante', () => {
    hote.definition = buildPlotEnBarres();

    expect(repere(hote, 'synthese')).toBeNull();
    expect(repere(hote, 'rapport')).not.toBeNull();
    expect(texteDe(hote, 'description-svg')).toContain('Marge brute');
  });

  describe('F13 · diapositive de référence figée à côté de l axe réglable', () => {
    function vue(nom: string): Element | null {
      return hote.shadowRoot?.querySelector(`[data-testid="figure"][data-vue="${nom}"]`) ?? null;
    }

    function rapportDe(nom: string): string {
      return vue(nom)?.querySelector('[data-testid="rapport-hauteurs"]')?.textContent?.trim() ?? '';
    }

    beforeEach(() => {
      hote.definition = buildPlotEnBarres({ reference: 'Axe de Samir' });
    });

    it('rend les deux graphiques côte à côte, chacun avec son rapport des hauteurs', () => {
      expect(repere(hote, 'comparaison')).not.toBeNull();
      expect(vue('reference')?.querySelectorAll('[data-testid="barre"]').length).toBe(4);
      expect(vue('reglable')?.querySelectorAll('[data-testid="barre"]').length).toBe(4);
      expect(rapportDe('reference')).toBe('×7');
      expect(rapportDe('reglable')).toBe('×7');
      expect(vue('reference')?.querySelector('[data-testid="vue"]')?.textContent).toContain(
        'Axe de Samir',
      );
    });

    it('garde la référence figée quand l axe réglable change', () => {
      prereglage(hote, 'Axe à zéro');

      expect(rapportDe('reference')).toBe('×7');
      expect(rapportDe('reglable')).toBe('×1,02');
      expect(
        sansEspaces(
          vue('reference')?.querySelectorAll('[data-testid="graduation-y"]')[0]?.textContent ?? '',
        ),
      ).not.toBe('0€');
    });

    it('n annonce en direct que le rapport de l axe réglable', () => {
      expect(
        vue('reference')?.querySelector('[data-testid="rapport"]')?.getAttribute('aria-live'),
      ).toBe('off');
      expect(
        vue('reglable')?.querySelector('[data-testid="rapport"]')?.getAttribute('aria-live'),
      ).toBe('polite');
    });

    it('donne à chaque graphique des identifiants accessibles uniques', () => {
      const ids = [...(hote.shadowRoot?.querySelectorAll('[id]') ?? [])].map((noeud) => noeud.id);

      expect(new Set(ids).size).toBe(ids.length);
      for (const graphique of reperes(hote, 'graphique')) {
        for (const id of (graphique.getAttribute('aria-labelledby') ?? '').split(' ')) {
          expect(graphique.querySelector(`#${id}`)).not.toBeNull();
        }
      }
    });

    it('rend un seul graphique quand la référence ne nomme aucun préréglage', () => {
      hote.definition = buildPlotEnBarres({ reference: 'Axe inconnu' });

      expect(repere(hote, 'comparaison')).toBeNull();
      expect(reperes(hote, 'figure').length).toBe(1);
    });

    it('couvre par une règle de la feuille chaque classe fp de la comparaison', () => {
      expect(classesOrphelines(hote, 'plot')).toEqual([]);
    });
  });

  it('rend la meme figure et les memes reglages pour l etudiant et le presentateur', () => {
    const structure = (): Readonly<Record<string, number>> => ({
      traces: reperes(hote, 'trace').length,
      curseurs: reperes(hote, 'curseur').length,
      animer: reperes(hote, 'animer').length,
      lignes: reperes(hote, 'ligne').length,
    });
    const etudiant = structure();
    const synthese = texteDe(hote, 'synthese');

    hote.setAttribute('data-cours-role', 'presentateur');

    expect(structure()).toEqual(etudiant);
    expect(etudiant['curseurs']).toBe(DEFINITION.parametres.length);
    expect(texteDe(hote, 'synthese')).toBe(synthese);
    expect(repere(hote, 'modalite')).toBeNull();
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe(
      'presentateur',
    );
  });

  describe('synchronisation du pupitre vers la projection', () => {
    function reglagesEmis(): unknown[] {
      const emis: unknown[] = [];
      hote.addEventListener('fp-plot-reglage', (evenement) =>
        emis.push((evenement as CustomEvent).detail),
      );
      return emis;
    }

    function relacherCurseur(valeur: string): void {
      const curseur = repere(hote, 'curseur') as HTMLInputElement;
      curseur.value = valeur;
      curseur.dispatchEvent(new Event('input', { bubbles: true }));
      curseur.dispatchEvent(new Event('change', { bubbles: true }));
    }

    it('RET-21 · au pupitre, emet les reglages une fois le curseur relache', () => {
      hote.setAttribute('data-cours-role', 'presentateur');
      const emis = reglagesEmis();

      relacherCurseur('3000');

      expect(emis).toEqual([{ reglages: { C: 3000, i: 4 } }]);
    });

    it('RET-21 · au pupitre, emet les reglages au clic d un prereglage', () => {
      hote.definition = buildPlotEnBarres();
      hote.setAttribute('data-cours-role', 'presentateur');
      const emis = reglagesEmis();

      prereglage(hote, 'Axe à zéro');

      expect(emis).toEqual([{ reglages: { origine: 0 } }]);
    });

    it('RET-21 · chez l etudiant, ni curseur ni prereglage n emet de reglage', () => {
      const emis = reglagesEmis();

      relacherCurseur('3000');
      hote.definition = buildPlotEnBarres();
      prereglage(hote, 'Axe à zéro');

      expect(emis).toEqual([]);
      expect(hote.valeurs).toEqual({ origine: 0 });
    });

    it('RET-21 · en apercu, le pupitre n emet jamais de reglage', () => {
      hote.setAttribute('data-cours-role', 'presentateur');
      hote.setAttribute('data-apercu', '');
      const emis = reglagesEmis();

      relacherCurseur('3000');
      hote.definition = buildPlotEnBarres();
      prereglage(hote, 'Axe à zéro');

      expect(emis).toEqual([]);
    });

    it('RET-21 · la projection suit les reglages pilotes, bornes au graphique', () => {
      hote.setAttribute('data-cours-role', 'presentateur');

      hote.reglages = { C: 3000, i: 99, inconnu: 1 };

      expect(hote.valeurs).toEqual({ C: 3000, i: 10 });
      expect(valeurAffichee(hote, 'C')).toBe('3000');
      expect(valeurAffichee(hote, 'i')).toBe('10');
    });

    describe('R9 · animation de l écran', () => {
      const SIMULATEUR = buildPlotDefinition({
        id: 'K-SIMULATEUR-MIX',
        abscisse: { libelle: 'Part de la marketplace (%)', min: 0, max: 80 },
        parametres: [
          { cle: 'taux', libelle: 'Taux marketplace (%)', min: 10, max: 30, pas: 1, defaut: 16 },
        ],
        series: [
          { id: 'global', libelle: 'Taux global', trait: 'plein', calcul: 'x * taux / 100' },
        ],
        animation: [{ taux: 16 }, { taux: 20 }, { taux: 24 }],
      });

      beforeEach(() => {
        jasmine.clock().install();
        hote.definition = SIMULATEUR;
      });

      afterEach(() => {
        jasmine.clock().uninstall();
      });

      it('passe d une valeur à la suivante toutes les trois secondes', () => {
        animer(hote);
        expect(hote.valeurs).toEqual({ taux: 16 });

        jasmine.clock().tick(2999);
        expect(valeurAffichee(hote, 'taux')).toBe('16');

        jasmine.clock().tick(1);
        expect(valeurAffichee(hote, 'taux')).toBe('20');

        jasmine.clock().tick(3000);
        expect(hote.valeurs).toEqual({ taux: 24 });
      });

      it('relaie au pupitre chaque valeur jouée, pour que la projection la suive', () => {
        hote.setAttribute('data-cours-role', 'presentateur');
        const emis = reglagesEmis();

        animer(hote);
        jasmine.clock().tick(6000);

        expect(emis).toEqual([
          { reglages: { taux: 16 } },
          { reglages: { taux: 20 } },
          { reglages: { taux: 24 } },
        ]);
      });

      it('poursuit l animation quand le pupitre reçoit en écho la valeur qu il affiche', () => {
        animer(hote);
        hote.reglages = { taux: 16 };
        jasmine.clock().tick(3000);

        expect(hote.valeurs).toEqual({ taux: 20 });
      });

      it('s arrête dès qu un curseur est réglé à la main', () => {
        animer(hote);
        relacherCurseur('12');
        jasmine.clock().tick(6000);

        expect(hote.valeurs).toEqual({ taux: 12 });
      });

      it('va directement à la dernière valeur quand le mouvement est réduit', () => {
        spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);

        animer(hote);

        expect(hote.valeurs).toEqual({ taux: 24 });
      });
    });
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    attendreLaCorrectionNicheeEffacee(buildPlotDefinition({ id: 'K-COURBE-02' }), (contamine) => {
      hote.definition = contamine;
      return hote.definition;
    });
  });

  it('explore sans rien emettre vers la seance ni ecrire dans un stockage', () => {
    animer(hote);
    attendreAucunEffet(traces);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    attendreChaqueClasseCouverte(hote, 'plot', CLASSES_ATTENDUES);
  });
});
