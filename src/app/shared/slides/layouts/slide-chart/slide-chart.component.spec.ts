import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { SlideChartKind, SlideChartSeries } from './slide-chart.component';
import { SlideChartComponent } from './slide-chart.component';

const LIBELLES = ['2023', '2024', '2025'];

const SERIES: readonly SlideChartSeries[] = [
  { label: 'Chiffre d’affaires', values: [120, 132.5, 150], tone: 'teal' },
  { label: 'Charges', values: [80, 90, 95], tone: 'gold' },
];

function monter(
  entrees: Readonly<Record<string, unknown>> = {},
): ComponentFixture<SlideChartComponent> {
  const fixture = TestBed.createComponent(SlideChartComponent);
  fixture.componentRef.setInput('title', 'Une évolution à contrôler');
  fixture.componentRef.setInput('caption', 'Exercice');
  fixture.componentRef.setInput('labels', LIBELLES);
  fixture.componentRef.setInput('series', SERIES);
  for (const [nom, valeur] of Object.entries(entrees)) {
    fixture.componentRef.setInput(nom, valeur);
  }
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<SlideChartComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('SlideChartComponent', () => {
  it('rend le titre, le contexte, l unité et la légende de chaque série', () => {
    const fixture = monter({ context: 'Deux séries sur trois ans', unit: 'k€' });

    const rendu = element(fixture);
    expect(rendu.querySelector('h2')?.textContent).toContain('Une évolution à contrôler');
    expect(rendu.querySelector('.slide-chart__context')?.textContent).toContain('trois ans');
    expect(rendu.querySelector('.slide-chart__unit')?.textContent).toContain('k€');
    const legende = Array.from(rendu.querySelectorAll('.slide-chart__legend li')).map((li) =>
      li.textContent?.trim(),
    );
    expect(legende).toEqual(['Chiffre d’affaires', 'Charges']);
  });

  it('résume toutes les valeurs dans le libellé accessible du graphique', () => {
    const fixture = monter();

    const libelle = element(fixture).querySelector('[role="img"]')?.getAttribute('aria-label');
    expect(libelle).toContain('Une évolution à contrôler');
    expect(libelle).toContain('Chiffre d’affaires: 120, 132.5, 150');
    expect(libelle).toContain('Charges: 80, 90, 95');
  });

  it('expose les données dans un tableau, décimales écrites à la française', () => {
    const fixture = monter();

    const tableau = element(fixture).querySelector('.slide-chart__data table');
    const entetes = Array.from(tableau?.querySelectorAll('thead th') ?? []).map((th) =>
      th.textContent?.trim(),
    );
    expect(entetes).toEqual(['Exercice', ...LIBELLES]);
    expect(tableau?.querySelector('tbody tr')?.textContent).toContain('132,50');
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
