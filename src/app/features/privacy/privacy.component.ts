import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LEGAL_PAGE_IMPORTS, type LegalTocItem } from '../legal/legal-page.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [LEGAL_PAGE_IMPORTS],
  templateUrl: './privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  readonly hero = {
    kicker: $localize`:privacy.hero.kicker@@privacyHeroLabel:Vos données`,
    updated: $localize`:privacy.hero.updated@@privacyMetaLastUpdated:Dernière mise à jour : 4 juin 2026`,
  };

  readonly toc: readonly LegalTocItem[] = [
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
