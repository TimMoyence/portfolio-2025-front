import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../../shared/directives/reveal-on-scroll.directive';
import { ToolkitFormComponent } from '../../../shared/components/toolkit-form/toolkit-form.component';
import { TOOLKIT_IA_SOLO } from './toolkits-formations.data';

@Component({
  selector: 'app-toolkit-gate-page',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: './toolkit-gate-page.component.html',
  styleUrl: './toolkit-gate-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitGatePageComponent {
  protected readonly data = TOOLKIT_IA_SOLO;
}
