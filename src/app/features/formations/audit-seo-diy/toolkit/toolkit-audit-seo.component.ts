import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolkitGatePageComponent } from '../../shared/toolkit-gate-page.component';

@Component({
  selector: 'app-toolkit-audit-seo',
  standalone: true,
  imports: [ToolkitGatePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolkit-gate-page formationSlug="audit-seo-diy">
      <ng-container title i18n="@@formations.audit-seo.toolkit.title"
        >Votre checklist<br /><em>audit SEO</em>.</ng-container
      >
    </app-toolkit-gate-page>
  `,
})
export class ToolkitAuditSeoComponent {}
