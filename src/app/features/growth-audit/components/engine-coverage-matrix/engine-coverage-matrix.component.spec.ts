import { buildClientReport } from '../../../../../testing/factories/audit-request.factory';
import { monterAvecRouteur } from '../../../../../testing/montage-page';
import type { ClientReport } from '../../../../core/models/audit-client-report.model';
import { EngineCoverageMatrixComponent } from './engine-coverage-matrix.component';

describe('EngineCoverageMatrixComponent', () => {
  const rendreLaMatrice = (
    matrix: ClientReport['googleVsAiMatrix'] = buildClientReport().googleVsAiMatrix,
  ): HTMLElement =>
    monterAvecRouteur(EngineCoverageMatrixComponent, { matrix }).nativeElement as HTMLElement;

  it('devrait afficher les deux scores Google et IA', () => {
    const text = rendreLaMatrice().textContent as string;
    expect(text).toContain('72');
    expect(text).toContain('34');
    expect(text).toContain('Visibilité Google');
    expect(text).toContain('Visibilité IA');
  });

  it('devrait afficher les summaries Google et IA', () => {
    const text = rendreLaMatrice({
      googleVisibility: {
        score: 80,
        summary: 'Summary Google ici',
        status: 'ok',
        statusLabel: 'Objectif atteint',
      },
      aiVisibility: {
        score: 45,
        summary: 'Summary IA ici',
        status: 'critical',
        statusLabel: 'Critique',
      },
    }).textContent as string;

    expect(text).toContain('Summary Google ici');
    expect(text).toContain('Summary IA ici');
  });

  it('colore chaque score selon le statut servi par le back, sans le recalculer', () => {
    const barres = rendreLaMatrice({
      googleVisibility: {
        score: 90,
        summary: 'Google',
        status: 'critical',
        statusLabel: 'Critique',
      },
      aiVisibility: { score: 10, summary: 'IA', status: 'ok', statusLabel: 'Objectif atteint' },
    }).querySelectorAll('.engine-card__bar-fill');

    expect(
      Array.from(barres, (barre) => barre.classList.contains('engine-card__score--critical')),
    ).toEqual([true, false]);
    expect(
      Array.from(barres, (barre) => barre.classList.contains('engine-card__score--ok')),
    ).toEqual([false, true]);
  });

  it('affiche le libellé du statut de chaque moteur tel que le back le sert', () => {
    const libelles = rendreLaMatrice({
      googleVisibility: {
        score: 90,
        summary: 'Google',
        status: 'ok',
        statusLabel: 'Target reached',
      },
      aiVisibility: { score: 60, summary: 'IA', status: 'warning', statusLabel: 'Needs work' },
    }).querySelectorAll("[data-testid='engine-status']");

    expect(Array.from(libelles, (libelle) => libelle.textContent?.trim())).toEqual([
      'Target reached',
      'Needs work',
    ]);
  });

  it('devrait rendre exactement deux cards moteur', () => {
    const cards = rendreLaMatrice().querySelectorAll("[data-testid='engine-card']");
    expect(cards.length).toBe(2);
  });
});
