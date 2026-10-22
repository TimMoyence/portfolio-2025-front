import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../core/config/textes-legaux';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { dateDuSite } from '../../shared/pipes/date-du-site.pipe';

export interface LegalTocItem {
  readonly anchor: string;
  readonly label: string;
}

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RevealOnScrollDirective, RouterLink],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly kicker = input.required<string>();

  readonly texte = input.required<keyof typeof VERSIONS_DES_TEXTES_LEGAUX>();

  readonly toc = input.required<readonly LegalTocItem[]>();

  protected readonly misAJour = computed(
    () =>
      $localize`:legal.hero.updated@@legalMetaLastUpdated:Dernière mise à jour : ${dateDuSite(VERSIONS_DES_TEXTES_LEGAUX[this.texte()], this.locale)}:date:`,
  );
}

export const LEGAL_PAGE_IMPORTS = [RouterModule, RevealOnScrollDirective, LegalPageComponent];
