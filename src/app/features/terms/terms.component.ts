import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LEGAL_PAGE_IMPORTS, type LegalTocItem } from '../legal/legal-page.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [LEGAL_PAGE_IMPORTS],
  templateUrl: './terms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  readonly hero = {
    kicker: $localize`:terms.hero.kicker@@termsHeroLabel:Mentions légales`,
    updated: $localize`:terms.hero.updated@@termsMetaLastUpdated:Dernière mise à jour : 4 juin 2026`,
  };

  readonly toc: readonly LegalTocItem[] = [
    {
      anchor: 'editeur',
      label: $localize`:terms.toc.editeur@@termsTocEditeur:Éditeur du site`,
    },
    {
      anchor: 'objet',
      label: $localize`:terms.toc.objet@@termsTocObjet:Objet`,
    },
    {
      anchor: 'services',
      label: $localize`:terms.toc.services@@termsTocServices:Services & formations`,
    },
    {
      anchor: 'paiement',
      label: $localize`:terms.toc.paiement@@termsTocPaiement:Paiement & accès`,
    },
    {
      anchor: 'retractation',
      label: $localize`:terms.toc.retractation@@termsTocRetractation:Rétractation`,
    },
    {
      anchor: 'propriete',
      label: $localize`:terms.toc.propriete@@termsTocPropriete:Propriété intellectuelle`,
    },
    {
      anchor: 'responsabilite',
      label: $localize`:terms.toc.responsabilite@@termsTocResponsabilite:Responsabilité`,
    },
    {
      anchor: 'droit',
      label: $localize`:terms.toc.droit@@termsTocDroit:Droit applicable`,
    },
  ];
}
