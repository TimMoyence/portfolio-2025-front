import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';

/** Entrée du sommaire (TOC) reliant une ancre à son libellé. */
interface PrivacyTocItem {
  readonly anchor: string;
  readonly label: string;
}

/**
 * Page « Politique de confidentialité ».
 *
 * Restyle Asili (layout TOC) porté de la maquette `AsiliNewDesign/privacy.html`
 * + `asili-legal.css` (`.lg-hero`, `.lg-layout`, `.lg-toc`, `.lg-body`,
 * `.lg-note`). Contenu statique : 8 sections verbatim, ancres natives
 * `<a href="#id">` (SSR-safe), liens internes via `routerLink`.
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterModule, RevealOnScrollDirective],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  readonly hero = {
    kicker: $localize`:privacy.hero.kicker@@privacyHeroLabel:Vos données`,
    updated: $localize`:privacy.hero.updated@@privacyMetaLastUpdated:Dernière mise à jour : 4 juin 2026`,
  };

  /** Sommaire (TOC) : ancres + libellés des 8 sections. */
  readonly toc: readonly PrivacyTocItem[] = [
    {
      anchor: 'principe',
      label: $localize`:privacy.toc.principe@@privacyTocPrincipe:Notre principe`,
    },
    {
      anchor: 'collecte',
      label: $localize`:privacy.toc.collecte@@privacyTocCollecte:Données collectées`,
    },
    {
      anchor: 'usage',
      label: $localize`:privacy.toc.usage@@privacyTocUsage:Usage des données`,
    },
    {
      anchor: 'base',
      label: $localize`:privacy.toc.base@@privacyTocBase:Base légale`,
    },
    {
      anchor: 'partage',
      label: $localize`:privacy.toc.partage@@privacyTocPartage:Partage`,
    },
    {
      anchor: 'conservation',
      label: $localize`:privacy.toc.conservation@@privacyTocConservation:Conservation`,
    },
    {
      anchor: 'droits',
      label: $localize`:privacy.toc.droits@@privacyTocDroits:Vos droits`,
    },
    {
      anchor: 'contact',
      label: $localize`:privacy.toc.contact@@privacyTocContact:Nous contacter`,
    },
  ];
}
