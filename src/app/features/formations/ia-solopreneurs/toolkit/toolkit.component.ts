import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolkitGatePageComponent } from '../../shared/toolkit-gate-page.component';

@Component({
  selector: 'app-toolkit',
  standalone: true,
  imports: [ToolkitGatePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolkit-gate-page>
      <ng-container title i18n="@@formations.toolkit.title"
        >Le toolkit IA<br />pour <em>solopreneurs</em>.</ng-container
      >
    </app-toolkit-gate-page>
  `,
})
export class ToolkitComponent {}
