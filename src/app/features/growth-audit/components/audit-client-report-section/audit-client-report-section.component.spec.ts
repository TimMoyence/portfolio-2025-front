import { TestBed } from '@angular/core/testing';
import { buildClientReport } from '../../../../../testing/factories/audit-request.factory';
import { monterAvecRouteur } from '../../../../../testing/montage-page';
import type { ClientReport } from '../../../../core/models/audit-client-report.model';
import { AuditClientReportSectionComponent } from './audit-client-report-section.component';

describe('AuditClientReportSectionComponent', () => {
  const rendreLeRapport = (): HTMLElement =>
    monterAvecRouteur(AuditClientReportSectionComponent, { clientReport: buildClientReport() })
      .nativeElement as HTMLElement;

  it('devrait rendre le résumé exécutif, la matrice et la scorecard', () => {
    const root = rendreLeRapport();
    const text = root.textContent ?? '';

    expect(text).toContain('Votre site présente');
    expect(root.querySelector('app-engine-coverage-matrix')).toBeTruthy();
    expect(root.querySelector('app-pillar-scorecard')).toBeTruthy();
  });

  it('devrait afficher la liste des quick wins', () => {
    const cards = rendreLeRapport().querySelectorAll("[data-testid='quick-win-card']");
    expect(cards.length).toBe(3);
  });

  it('devrait afficher la card CTA avec un bouton accessible', () => {
    const button = rendreLeRapport().querySelector<HTMLButtonElement>("[data-testid='cta-button']");
    expect(button).toBeTruthy();
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent).toContain('Réserver');
  });

  it('ne crashe pas si quickWins et topFindings sont vides', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AuditClientReportSectionComponent],
    }).createComponent(AuditClientReportSectionComponent);
    const empty: ClientReport = {
      ...buildClientReport(),
      quickWins: [],
      topFindings: [],
      pillarScorecard: [],
    };
    fixture.componentInstance.clientReport = empty;
    expect(() => fixture.detectChanges()).not.toThrow();
    const cards = fixture.nativeElement.querySelectorAll("[data-testid='quick-win-card']");
    expect(cards.length).toBe(0);
  });
});
