import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { statutDuScore } from 'portfolio-2025-partage/score';
import type { ClientReport } from '../../../../core/models/audit-client-report.model';

@Component({
  selector: 'app-engine-coverage-matrix',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './engine-coverage-matrix.component.html',
  styleUrl: './engine-coverage-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineCoverageMatrixComponent {
  @Input({ required: true }) matrix!: ClientReport['googleVsAiMatrix'];

  scoreClass(score: number): string {
    return `engine-card__score--${statutDuScore(score)}`;
  }
}
