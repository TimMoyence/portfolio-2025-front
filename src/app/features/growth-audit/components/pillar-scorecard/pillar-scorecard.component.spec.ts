import { buildClientReport } from '../../../../../testing/factories/audit-request.factory';
import { monterAvecRouteur } from '../../../../../testing/montage-page';
import type { ClientReport } from '../../../../core/models/audit-client-report.model';
import { PillarScorecardComponent } from './pillar-scorecard.component';

describe('PillarScorecardComponent', () => {
  const rendreLaScorecard = (
    scorecard: ClientReport['pillarScorecard'] = buildClientReport().pillarScorecard,
  ): HTMLElement =>
    monterAvecRouteur(PillarScorecardComponent, { scorecard }).nativeElement as HTMLElement;

  it('devrait rendre une carte par pilier de la scorecard', () => {
    const cards = rendreLaScorecard().querySelectorAll("[data-testid='pillar-card']");
    expect(cards.length).toBe(7);
  });

  it('devrait afficher le score et la cible de chaque pilier', () => {
    const text = rendreLaScorecard([
      { pillar: 'seo', score: 72, target: 85, status: 'warning', statusLabel: 'À améliorer' },
    ]).textContent as string;

    expect(text).toContain('72');
    expect(text).toContain('85');
  });

  it('devrait appliquer la classe de statut critical/warning/ok', () => {
    const badges = rendreLaScorecard([
      { pillar: 'seo', score: 10, target: 80, status: 'critical', statusLabel: 'Critique' },
      {
        pillar: 'performance',
        score: 50,
        target: 80,
        status: 'warning',
        statusLabel: 'À améliorer',
      },
      { pillar: 'tech', score: 90, target: 80, status: 'ok', statusLabel: 'Objectif atteint' },
    ]).querySelectorAll("[data-testid='pillar-status']");

    expect(badges[0].className).toContain('critical');
    expect(badges[1].className).toContain('warning');
    expect(badges[2].className).toContain('ok');
  });

  it('affiche le libellé du statut tel que le back le sert, sans le réécrire', () => {
    const badge = rendreLaScorecard([
      { pillar: 'seo', score: 90, target: 80, status: 'ok', statusLabel: 'Target reached' },
    ]).querySelector("[data-testid='pillar-status']") as HTMLElement;

    expect(badge.textContent?.trim()).toBe('Target reached');
    expect(badge.getAttribute('aria-label')).toBe('Target reached');
  });

  it('devrait traduire en français les noms techniques des piliers', () => {
    const text = rendreLaScorecard([
      {
        pillar: 'aiVisibility',
        score: 30,
        target: 70,
        status: 'critical',
        statusLabel: 'Critique',
      },
      { pillar: 'seo', score: 80, target: 80, status: 'ok', statusLabel: 'Objectif atteint' },
    ]).textContent as string;

    expect(text).toContain('Visibilité IA');
    expect(text).toContain('SEO');
  });
});
