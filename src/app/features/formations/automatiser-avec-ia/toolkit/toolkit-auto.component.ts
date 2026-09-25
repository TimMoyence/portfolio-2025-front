import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolkitGatePageComponent } from '../../shared/toolkit-gate-page.component';

@Component({
  selector: 'app-toolkit-auto',
  standalone: true,
  imports: [ToolkitGatePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolkit-gate-page formationSlug="automatiser-avec-ia">
      <ng-container title i18n="@@formations.auto.toolkit.title"
        >Vos 5 workflows<br />prêts à <em>l'emploi</em>.</ng-container
      >
    </app-toolkit-gate-page>
  `,
})
export class ToolkitAutoComponent {}
