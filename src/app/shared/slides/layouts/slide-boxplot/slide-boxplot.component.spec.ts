import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { SlideBoxplotComponent, type SlideBoxplotSeries } from './slide-boxplot.component';

const DELAIS_2024: SlideBoxplotSeries = {
  label: '2024',
  min: 25,
  q1: 38,
  median: 46.5,
  q3: 57,
  max: 78,
  mean: 48.23,
  tone: 'ink',
};
const DELAIS_2025: SlideBoxplotSeries = {
  label: '2025',
  min: 18,
  q1: 33,
  median: 42.5,
  q3: 58,
  max: 152,
  mean: 48.85,
};

function monter(surcharges: Readonly<Record<string, unknown>> = {}): HTMLElement {
  setupTestBed({ http: false, imports: [SlideBoxplotComponent] });
  const fixture = TestBed.createComponent(SlideBoxplotComponent);
  const entrees: Readonly<Record<string, unknown>> = {
    title: 'Délais de paiement des clients (jours)',
    unit: 'jours',
    axisRange: [0, 160],
    series: [DELAIS_2024, DELAIS_2025],
    description: 'Deux boîtes à moustaches des délais de paiement, 2024 et 2025.',
    ...surcharges,
  };
  for (const [nom, valeur] of Object.entries(entrees)) {
    fixture.componentRef.setInput(nom, valeur);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function pourcent(element: Element | null, propriete: string): number {
  return Number.parseFloat(
    (element as HTMLElement | null)?.style.getPropertyValue(propriete) ?? '',
  );
}

describe('SlideBoxplotComponent', () => {
  it('rend une boite par serie, placee sur l axe commun', () => {
    const racine = monter();
    const boites = racine.querySelectorAll('[data-testid="slide-boxplot-boite"]');
    expect(boites.length).toBe(2);
    expect(pourcent(boites[1], '--debut')).toBeCloseTo((33 / 160) * 100, 4);
    expect(pourcent(boites[1], '--fin')).toBeCloseTo((58 / 160) * 100, 4);
    const medianes = racine.querySelectorAll('[data-testid="slide-boxplot-mediane"]');
    expect(pourcent(medianes[0], '--x')).toBeCloseTo((46.5 / 160) * 100, 4);
  });

  it('trace les moustaches du minimum au maximum', () => {
    const racine = monter();
    const moustaches = racine.querySelectorAll('[data-testid="slide-boxplot-moustache"]');
    expect(pourcent(moustaches[1], '--debut')).toBeCloseTo((18 / 160) * 100, 4);
    expect(pourcent(moustaches[1], '--fin')).toBeCloseTo(95, 4);
  });

  it('marque la moyenne seulement quand elle est fournie', () => {
    const racine = monter({ series: [DELAIS_2024, { ...DELAIS_2025, mean: undefined }] });
    expect(racine.querySelectorAll('[data-testid="slide-boxplot-moyenne"]').length).toBe(1);
  });

  it('gradue l axe avec un pas rond et des nombres a la francaise', () => {
    const racine = monter({ axisRange: [1400, 6400] });
    const graduations = Array.from(
      racine.querySelectorAll('[data-testid="slide-boxplot-graduation"]'),
      (element) => element.textContent?.trim(),
    );
    expect(graduations[0]).toBe('1 400');
    expect(graduations.length).toBeGreaterThanOrEqual(3);
    expect(graduations.length).toBeLessThanOrEqual(11);
  });

  it('donne les cinq valeurs de chaque serie en tableau lisible par tous', () => {
    const racine = monter();
    const lignes = racine.querySelectorAll('.slide-boxplot__data tbody tr');
    expect(lignes.length).toBe(2);
    expect(lignes[1].textContent).toContain('42,5');
    expect(lignes[1].textContent).toContain('152');
    expect(lignes[0].textContent).toContain('48,23');
  });

  it('decrit le graphique aux lecteurs d ecran', () => {
    const racine = monter();
    const trace = racine.querySelector('[role="img"]');
    const description = racine.querySelector('[data-testid="slide-boxplot-description"]');
    expect(description?.textContent).toContain('Deux boîtes à moustaches');
    expect(trace?.getAttribute('aria-describedby')).toBe(description?.id ?? 'absent');
  });

  it('affiche la phrase de lecture et la source quand elles existent', () => {
    const racine = monter({
      reading: 'La médiane baisse de 46,5 à 42,5 jours.',
      source: 'Atelier Rivage (données fictives).',
    });
    expect(racine.querySelector('.slide-boxplot__reading')?.textContent).toContain('42,5 jours');
    expect(racine.querySelector('.slide-boxplot__source')?.textContent).toContain('Atelier Rivage');
  });
});
