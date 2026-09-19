import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { ClientReport } from '../../../../core/models/audit-client-report.model';
import { EngineCoverageMatrixComponent } from '../engine-coverage-matrix/engine-coverage-matrix.component';
import { PillarScorecardComponent } from '../pillar-scorecard/pillar-scorecard.component';

@Component({
  selector: 'app-audit-client-report-section',
  standalone: true,
  imports: [CommonModule, EngineCoverageMatrixComponent, PillarScorecardComponent],
  templateUrl: './audit-client-report-section.component.html',
  styleUrl: './audit-client-report-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditClientReportSectionComponent {
  @Input({ required: true }) clientReport!: ClientReport;

  effortLabel(effort: 'low' | 'medium' | 'high'): string {
    switch (effort) {
      case 'low':
        return $localize`:@@auditEffortLow:Effort faible`;
      case 'medium':
        return $localize`:@@auditEffortMedium:Effort moyen`;
      case 'high':
        return $localize`:@@auditEffortHigh:Effort élevé`;
    }
  }

  effortClass(effort: 'low' | 'medium' | 'high'): string {
    return `quick-win-card__effort quick-win-card__effort--${effort}`;
  }
}
