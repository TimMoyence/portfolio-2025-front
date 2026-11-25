import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { ClientReport, StatutScore } from '../../../../core/models/audit-client-report.model';
import { nomDuPilier } from '../../piliers';

@Component({
  selector: 'app-pillar-scorecard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pillar-scorecard.component.html',
  styleUrl: './pillar-scorecard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillarScorecardComponent {
  @Input({ required: true }) scorecard!: ClientReport['pillarScorecard'];

  protected readonly formatPillarName = nomDuPilier;

  statusClass(status: StatutScore): string {
    return `pillar-card__status pillar-card__status--${status}`;
  }
}
