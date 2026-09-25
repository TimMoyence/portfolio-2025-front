import { monterLeGraphique, preparerLeGraphique } from '../../../../../testing/graphique-monte';
import { melangeur } from '../../../../../testing/melangeur';
import type { SlideChartKind, SlideChartSeries } from './slide-chart.component';

const GRAINE = 20260920;
const TIRAGES = 60;
const TONS = ['teal', 'gold', 'ink'] as const;
const FORMES = ['rond', 'carre', 'losange'];
const ECART_DES_ETIQUETTES = 7.5;
const PRECISION = 0.01;

interface Tirage {
  readonly kind: SlideChartKind;
  readonly labels: readonly string[];
  readonly series: readonly SlideChartSeries[];
  readonly axisRanges: readonly (readonly [number, number])[];
  readonly plage: readonly [number, number];
}

function tirer(hasard: () => number): Tirage {
  const kind: SlideChartKind = hasard() < 0.5 ? 'bars' : 'line';
  const periodes = 2 + Math.floor(hasard() * 7);
  const nombreDeSeries = 1 + Math.floor(hasard() * 3);
  const min = Math.round((hasard() * 2 - 1) * 1000);
  const etendue = 1 + Math.round(hasard() * 300000);
  const plage: readonly [number, number] = [min, min + etendue];
  const series = Array.from({ length: nombreDeSeries }, (_, rang) => ({
    label: `Série ${rang + 1}`,
    values: Array.from(
      { length: periodes },
      () => Math.round((min + hasard() * etendue) * 100) / 100,
    ),
    tone: TONS[rang % TONS.length],
  }));
  return {
    kind,
    labels: Array.from({ length: periodes }, (_, rang) => `P${rang + 1}`),
    series,
    axisRanges: [plage],
    plage,
  };
}

function monter(tirage: Tirage): HTMLElement {
  return monterLeGraphique({
    title: 'Simulation',
    labels: tirage.labels,
    series: tirage.series,
    kind: tirage.kind,
    axisRanges: tirage.axisRanges,
  }).nativeElement as HTMLElement;
}

function variables(racine: HTMLElement, selecteur: string, variable: string): number[] {
  return Array.from(racine.querySelectorAll<HTMLElement>(selecteur)).map((noeud) =>
    Number.parseFloat(noeud.style.getPropertyValue(variable)),
  );
}

function attendue(valeur: number, [min, max]: readonly [number, number]): number {
  return Math.min(Math.max(((valeur - min) / (max - min)) * 100, 0), 100);
}

function verifierLesGraduations(rendu: HTMLElement, contexte: string): void {
  const graduations = variables(rendu, '[data-testid="slide-chart-graduation"]', '--y');
  expect(graduations.length).withContext(contexte).toBeGreaterThanOrEqual(3);
  expect(graduations[0]).withContext(contexte).toBe(100);
  expect(graduations.at(-1)).withContext(contexte).toBe(0);
  const decroissantes = graduations.every(
    (hauteur, rang) => rang === 0 || graduations[rang - 1] > hauteur,
  );
  expect(decroissantes).withContext(`${contexte} · repères décroissants`).toBeTrue();
  const aLaFrancaise = Array.from(
    rendu.querySelectorAll('[data-testid="slide-chart-graduation"]'),
  ).every((repere) => !(repere.textContent ?? '').includes('.'));
  expect(aLaFrancaise).withContext(`${contexte} · nombres à la française`).toBeTrue();
}

function valeursDansLOrdreDuRendu(tirage: Tirage): number[] {
  return tirage.kind === 'line'
    ? tirage.series.flatMap((serie) => [...serie.values])
    : tirage.labels.flatMap((_, index) => tirage.series.map((serie) => serie.values[index]));
}

function verifierLesMarques(rendu: HTMLElement, tirage: Tirage, contexte: string): void {
  const valeurs = valeursDansLOrdreDuRendu(tirage);
  const marques =
    tirage.kind === 'line'
      ? variables(rendu, '.slide-chart__point', '--y')
      : variables(rendu, '.slide-chart__bar', '--hauteur');

  expect(marques.length).withContext(contexte).toBe(valeurs.length);
  const surLEchelle = marques.every(
    (hauteur, rang) =>
      hauteur >= 0 &&
      hauteur <= 100 &&
      Math.abs(hauteur - attendue(valeurs[rang], tirage.plage)) <= PRECISION,
  );
  expect(surLEchelle).withContext(`${contexte} · marques sur l échelle`).toBeTrue();

  const formes = Array.from(
    rendu.querySelectorAll(
      tirage.kind === 'line' ? '.slide-chart__point' : '.slide-chart__marqueur--barre',
    ),
  ).map((marque) => marque.getAttribute('data-marqueur'));
  const connues = formes.every((forme) => forme !== null && FORMES.includes(forme));
  expect(connues).withContext(`${contexte} · formes connues`).toBeTrue();
}

function verifierLesEtiquettes(rendu: HTMLElement, tirage: Tirage, contexte: string): void {
  const etiquettes = variables(rendu, '[data-testid="slide-chart-etiquette"]', '--y');
  expect(etiquettes.length).withContext(contexte).toBe(tirage.series.length);
  const triees = [...etiquettes].sort((a, b) => a - b);
  const degagees = triees.every(
    (hauteur, rang) => rang === 0 || hauteur - triees[rang - 1] >= ECART_DES_ETIQUETTES - PRECISION,
  );
  expect(degagees).withContext(`${contexte} · étiquettes dégagées`).toBeTrue();
}

describe('Graphique v2 (F13, simulation)', () => {
  preparerLeGraphique();

  it(`tient ses invariants d échelle et d étiquetage sur ${TIRAGES} jeux de données tirés au sort`, () => {
    const hasard = melangeur(GRAINE);

    for (let essai = 0; essai < TIRAGES; essai += 1) {
      const tirage = tirer(hasard);
      const contexte = `tirage ${essai} · ${tirage.kind} · ${tirage.plage.join(' à ')}`;
      const rendu = monter(tirage);

      verifierLesGraduations(rendu, contexte);
      verifierLesMarques(rendu, tirage, contexte);
      if (tirage.kind === 'line') {
        verifierLesEtiquettes(rendu, tirage, contexte);
      }
    }
  });
});
