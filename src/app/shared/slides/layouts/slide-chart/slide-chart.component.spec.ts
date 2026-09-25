import type { ComponentFixture } from '@angular/core/testing';
import { fondEffectif, rapportDeContraste } from '../../../../../testing/contraste';
import { monterLeGraphique, preparerLeGraphique } from '../../../../../testing/graphique-monte';
import { textes } from '../../../../../testing/textes-dom';
import type { SlideChartKind, SlideChartSeries } from './slide-chart.component';
import { SlideChartComponent } from './slide-chart.component';

const LIBELLES = ['2023', '2024', '2025'];

const SERIES: readonly SlideChartSeries[] = [
  { label: 'Chiffre d’affaires', values: [120, 132.5, 150], tone: 'teal' },
  { label: 'Charges', values: [80, 90, 95], tone: 'gold' },
];

const MARGE_BRUTE: readonly SlideChartSeries[] = [
  { label: 'Marge brute', values: [285000, 288000, 289800, 291000], tone: 'teal' },
];

const ANNEES_MARGE = ['2022', '2023', '2024', '2025'];

const CANAUX: readonly SlideChartSeries[] = [
  { label: 'Sur-mesure', values: [120, 95, 102, 80], tone: 'ink' },
  { label: 'Entretien', values: [58, 61, 49, 62], tone: 'gold' },
  { label: 'Marketplace', values: [98, 131, 167, 127], tone: 'teal' },
];

const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];

const SEUIL_TEXTE = 4.5;
const SEUIL_TRAIT = 3;

function monter(
  entrees: Readonly<Record<string, unknown>> = {},
): ComponentFixture<SlideChartComponent> {
  return monterLeGraphique({
    title: 'Une évolution à contrôler',
    caption: 'Exercice',
    labels: LIBELLES,
    series: SERIES,
    ...entrees,
  });
}

function element(fixture: ComponentFixture<SlideChartComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function variables(racine: HTMLElement, selecteur: string, variable: string): string[] {
  return Array.from(racine.querySelectorAll<HTMLElement>(selecteur)).map((noeud) =>
    noeud.style.getPropertyValue(variable).trim(),
  );
}

function marqueurs(racine: HTMLElement, selecteur: string): (string | null)[] {
  return Array.from(racine.querySelectorAll(selecteur)).map((noeud) =>
    noeud.getAttribute('data-marqueur'),
  );
}

function pourcentages(valeurs: readonly string[]): number[] {
  return valeurs.map((valeur) => Number.parseFloat(valeur));
}

describe('SlideChartComponent', () => {
  preparerLeGraphique();

  it('rend le titre, le contexte, l unité et la légende de chaque série', () => {
    const fixture = monter({ context: 'Deux séries sur trois ans', unit: 'k€' });

    const rendu = element(fixture);
    expect(rendu.querySelector('h2')?.textContent).toContain('Une évolution à contrôler');
    expect(rendu.querySelector('.slide-chart__context')?.textContent).toContain('trois ans');
    expect(rendu.querySelector('.slide-chart__unit')?.textContent).toContain('k€');
    expect(textes(rendu, '.slide-chart__legend li')).toEqual(['Chiffre d’affaires', 'Charges']);
  });

  it('résume toutes les valeurs dans le libellé accessible du graphique', () => {
    const fixture = monter();

    const libelle = element(fixture).querySelector('[role="img"]')?.getAttribute('aria-label');
    expect(libelle).toContain('Une évolution à contrôler');
    expect(libelle).toContain('Chiffre d’affaires: 120, 132.5, 150');
    expect(libelle).toContain('Charges: 80, 90, 95');
  });

  it('expose les données dans un tableau, nombres écrits à la française', () => {
    const rendu = element(monter());
    const marge = element(monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE }));

    expect(textes(rendu, '.slide-chart__data thead th')).toEqual(['Exercice', ...LIBELLES]);
    expect(textes(rendu, '.slide-chart__data tbody tr td')).toContain('132,5');
    expect(textes(marge, '.slide-chart__data tbody tr td')).toEqual([
      '285 000',
      '288 000',
      '289 800',
      '291 000',
    ]);
  });

  it('dessine une barre par série et par période en mode barres', () => {
    const fixture = monter();

    expect(element(fixture).querySelectorAll('.slide-chart__bar')).toHaveSize(
      LIBELLES.length * SERIES.length,
    );
    expect(element(fixture).querySelector('svg.slide-chart__svg')).toBeNull();
  });

  it('trace une courbe par série en mode ligne', () => {
    const kind: SlideChartKind = 'line';
    const fixture = monter({ kind });

    const rendu = element(fixture);
    expect(rendu.querySelectorAll('polyline.slide-chart__line')).toHaveSize(SERIES.length);
    expect(rendu.querySelectorAll('.slide-chart__labels span')).toHaveSize(LIBELLES.length);
    expect(rendu.querySelector('.slide-chart__bars')).toBeNull();
  });

  it('relie la description textuelle au graphique et garde le bouton Voir les données (AC-29)', () => {
    const fixture = monter({
      description: 'Le chiffre d’affaires progresse plus vite que les charges.',
    });

    const rendu = element(fixture);
    const description = rendu.querySelector('[data-testid="slide-chart-description"]');
    expect(description?.textContent?.trim()).toBe(
      'Le chiffre d’affaires progresse plus vite que les charges.',
    );
    expect(rendu.querySelector('[role="img"]')?.getAttribute('aria-describedby')).toBe(
      description?.id ?? 'sans description',
    );
    expect(rendu.querySelector('.slide-chart__data summary')?.textContent?.trim()).toBe(
      'Voir les données',
    );
  });

  it('gradue un axe calculé en valeurs rondes, barres partant de zéro', () => {
    expect(textes(element(monter()), '[data-testid="slide-chart-graduation"]')).toEqual([
      '150',
      '120',
      '90',
      '60',
      '30',
      '0',
    ]);
  });

  it('gradue exactement la plage axisRanges, courbes comprises, chaque repère à sa hauteur (AC-26)', () => {
    const indice = element(
      monter({
        kind: 'line',
        labels: ['2019', '2020'],
        series: [{ label: 'Indice des prix', values: [100, 115.97], tone: 'gold' }],
        axisRanges: [[95, 120]],
      }),
    );
    const marge = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[0, 300000]] }),
    );

    expect(textes(indice, '[data-testid="slide-chart-graduation"]')).toEqual([
      '120',
      '115',
      '110',
      '105',
      '100',
      '95',
    ]);
    expect(variables(indice, '[data-testid="slide-chart-graduation"]', '--y')).toEqual([
      '100%',
      '80%',
      '60%',
      '40%',
      '20%',
      '0%',
    ]);
    expect(textes(marge, '[data-testid="slide-chart-graduation"]')).toEqual([
      '300 000',
      '250 000',
      '200 000',
      '150 000',
      '100 000',
      '50 000',
      '0',
    ]);
  });

  it('place chaque point d une courbe sur l échelle axisRanges (AC-26)', () => {
    const rendu = element(
      monter({
        kind: 'line',
        series: [{ label: 'Indice', values: [100, 107.5, 120], tone: 'gold' }],
        axisRanges: [[95, 120]],
      }),
    );

    expect(variables(rendu, '.slide-chart__point', '--y')).toEqual(['20%', '50%', '100%']);
    expect(
      pourcentages(variables(rendu, '.slide-chart__point', '--x')).map(
        (abscisse) => Math.round(abscisse * 100) / 100,
      ),
    ).toEqual([16.67, 50, 83.33]);
  });

  it('dessine des barres proportionnelles quand l axe part de zéro (AC-26)', () => {
    const depuisZero = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[0, 300000]] }),
    );
    const tronque = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[284000, 292000]] }),
    );

    expect(variables(depuisZero, '.slide-chart__bar', '--hauteur')).toEqual([
      '95%',
      '96%',
      '96.6%',
      '97%',
    ]);
    expect(variables(tronque, '.slide-chart__bar', '--hauteur')).toEqual([
      '12.5%',
      '50%',
      '72.5%',
      '87.5%',
    ]);
  });

  it('écrit la valeur de chaque barre au-dessus d elle, jamais dans la barre', () => {
    const rendu = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[0, 300000]] }),
    );

    expect(textes(rendu, '.slide-chart__value')).toEqual([
      '285 000',
      '288 000',
      '289 800',
      '291 000',
    ]);
    expect(variables(rendu, '.slide-chart__value', '--hauteur')).toEqual(
      variables(rendu, '.slide-chart__bar', '--hauteur'),
    );
  });

  it('distingue les séries d une courbe par la forme du marqueur et une étiquette directe', () => {
    const rendu = element(monter({ kind: 'line' }));

    expect(marqueurs(rendu, '.slide-chart__point')).toEqual([
      'rond',
      'rond',
      'rond',
      'carre',
      'carre',
      'carre',
    ]);
    expect(textes(rendu, '[data-testid="slide-chart-etiquette"]')).toEqual([
      'Chiffre d’affaires',
      'Charges',
    ]);
    expect(rendu.querySelector('.slide-chart__legend')).toBeNull();
  });

  it('écarte les étiquettes directes de deux courbes qui finissent côte à côte', () => {
    const rendu = element(
      monter({
        kind: 'line',
        labels: ['T3', 'T4'],
        series: [
          { label: 'Sur-mesure', values: [102, 80], tone: 'ink' },
          { label: 'Entretien', values: [49, 82], tone: 'gold' },
        ],
        axisRanges: [[0, 180]],
      }),
    );

    const [surMesure, entretien] = pourcentages(
      variables(rendu, '[data-testid="slide-chart-etiquette"]', '--y'),
    );
    expect(Math.abs(entretien - surMesure)).toBeGreaterThanOrEqual(7);
  });

  it('écrit la valeur de la courbe la plus haute au-dessus du point et la plus basse au-dessous', () => {
    const rendu = element(
      monter({ kind: 'line', labels: TRIMESTRES, series: CANAUX, axisRanges: [[0, 180]] }),
    );

    const dessous = Array.from(rendu.querySelectorAll('.slide-chart__point-value')).map((valeur) =>
      valeur.classList.contains('is-below'),
    );
    expect(dessous).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it('marque chaque barre d un graphique à plusieurs séries par la forme de sa série (AC-30)', () => {
    const rendu = element(monter());

    expect(marqueurs(rendu, '.slide-chart__bar-wrap .slide-chart__marqueur')).toEqual([
      'rond',
      'carre',
      'rond',
      'carre',
      'rond',
      'carre',
    ]);
    expect(marqueurs(rendu, '.slide-chart__legend .slide-chart__marqueur')).toEqual([
      'rond',
      'carre',
    ]);
  });

  it('mesure des contrastes d au moins 4,5:1 pour les textes et 3:1 pour les traits (AC-30)', () => {
    const configurations: readonly Readonly<Record<string, unknown>>[] = [
      { unit: 'k€' },
      { kind: 'line', labels: TRIMESTRES, series: CANAUX, axisRanges: [[0, 180]] },
    ];

    for (const configuration of configurations) {
      const rendu = element(monter(configuration));
      rendu.style.backgroundColor = 'var(--cream)';
      const textesMesures = Array.from(
        rendu.querySelectorAll(
          '.slide-chart__eyebrow, .slide-chart__unit, [data-testid="slide-chart-graduation"], .slide-chart__labels span, .slide-chart__value, .slide-chart__point-value, .slide-chart__serie-label, .slide-chart__legend li, .slide-chart__data summary',
        ),
      );
      const traits = Array.from(
        rendu.querySelectorAll(
          '.slide-chart__bar, .slide-chart__point, .slide-chart__marqueur, .slide-chart__base',
        ),
      );
      const lignes = Array.from(rendu.querySelectorAll('.slide-chart__line'));

      expect(textesMesures.length).toBeGreaterThan(0);
      expect(traits.length).toBeGreaterThan(0);
      for (const texte of textesMesures) {
        expect(rapportDeContraste(getComputedStyle(texte).color, fondEffectif(texte)))
          .withContext(`${texte.className} « ${texte.textContent?.trim()} »`)
          .toBeGreaterThanOrEqual(SEUIL_TEXTE);
      }
      for (const trait of traits) {
        const couleur = getComputedStyle(trait).backgroundColor;
        expect(rapportDeContraste(couleur, fondEffectif(trait.parentElement ?? rendu)))
          .withContext(trait.className)
          .toBeGreaterThanOrEqual(SEUIL_TRAIT);
      }
      for (const ligne of lignes) {
        expect(rapportDeContraste(getComputedStyle(ligne).stroke, fondEffectif(rendu)))
          .withContext(ligne.getAttribute('class') ?? 'courbe')
          .toBeGreaterThanOrEqual(SEUIL_TRAIT);
      }
    }
  });

  it('affiche la lecture professionnelle et la source seulement quand elles sont fournies', () => {
    const sansLecture = monter();
    expect(element(sansLecture).querySelector('.slide-chart__reading')).toBeNull();
    expect(element(sansLecture).querySelector('.slide-chart__source')).toBeNull();

    const avecLecture = monter({ reading: 'La marge progresse', source: 'Comptes annuels' });
    expect(element(avecLecture).querySelector('.slide-chart__reading')?.textContent).toContain(
      'La marge progresse',
    );
    expect(element(avecLecture).querySelector('.slide-chart__source')?.textContent).toContain(
      'Comptes annuels',
    );
  });
});
