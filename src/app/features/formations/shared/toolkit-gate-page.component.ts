import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../../shared/directives/reveal-on-scroll.directive';
import { ToolkitFormComponent } from '../../../shared/components/toolkit-form/toolkit-form.component';
import type { ToolkitGatePageData } from './toolkit-gate-page.model';

@Component({
  selector: 'app-toolkit-gate-page',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: './toolkit-gate-page.component.html',
  styleUrl: './toolkit-gate-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitGatePageComponent {
  readonly data = input.required<ToolkitGatePageData>();

  readonly formationSlug = input<string | null>(null);

  readonly headingKey = computed(() => this.formationSlug() ?? 'ia-solo');

  protected get contentsHeadingId(): string {
    return `toolkit-${this.headingKey()}-contents-heading`;
  }

  protected get faqHeadingId(): string {
    return `toolkit-${this.headingKey()}-faq-heading`;
  }
}
