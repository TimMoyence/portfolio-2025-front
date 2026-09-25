import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';

export interface LegalTocItem {
  readonly anchor: string;
  readonly label: string;
}

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  readonly kicker = input.required<string>();

  readonly updated = input.required<string>();

  readonly toc = input.required<readonly LegalTocItem[]>();
}

export const LEGAL_PAGE_IMPORTS = [RouterModule, RevealOnScrollDirective, LegalPageComponent];
