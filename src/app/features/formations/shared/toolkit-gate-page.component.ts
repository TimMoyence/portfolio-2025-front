import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../../shared/directives/reveal-on-scroll.directive';
import { ToolkitFormComponent } from '../../../shared/components/toolkit-form/toolkit-form.component';
import { TOOLKITS_FORMATIONS, type ToolkitFormation } from './toolkits-formations.data';

@Component({
  selector: 'app-toolkit-gate-page',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: './toolkit-gate-page.component.html',
  styleUrl: './toolkit-gate-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitGatePageComponent {
  readonly formationSlug = input<Exclude<ToolkitFormation, 'ia-solo'> | null>(null);

  readonly headingKey = computed((): ToolkitFormation => this.formationSlug() ?? 'ia-solo');

  protected readonly data = computed(() => TOOLKITS_FORMATIONS[this.headingKey()]);

  protected get contentsHeadingId(): string {
    return `toolkit-${this.headingKey()}-contents-heading`;
  }

  protected get faqHeadingId(): string {
    return `toolkit-${this.headingKey()}-faq-heading`;
  }
}
