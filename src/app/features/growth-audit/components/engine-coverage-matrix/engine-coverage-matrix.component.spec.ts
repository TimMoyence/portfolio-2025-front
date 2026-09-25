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
      googleVisibility: { score: 80, summary: 'Summary Google ici' },
      aiVisibility: { score: 45, summary: 'Summary IA ici' },
    }).textContent as string;

    expect(text).toContain('Summary Google ici');
    expect(text).toContain('Summary IA ici');
  });

  it('devrait rendre exactement deux cards moteur', () => {
    const cards = rendreLaMatrice().querySelectorAll("[data-testid='engine-card']");
    expect(cards.length).toBe(2);
  });
});
