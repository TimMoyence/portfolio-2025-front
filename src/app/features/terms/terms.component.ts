import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";

/** Entrée du sommaire (TOC) reliant une ancre à son libellé. */
interface TermsTocItem {
  readonly anchor: string;
  readonly label: string;
}

/**
 * Page « Conditions générales & mentions légales ».
 *
 * Restyle Asili (layout TOC) porté de la maquette `AsiliNewDesign/terms.html`
 * + `asili-legal.css` (`.lg-hero`, `.lg-layout`, `.lg-toc`, `.lg-body`,
 * `.lg-note`). Contenu statique : 8 sections verbatim, ancres natives
 * `<a href="#id">` (SSR-safe), liens internes via `routerLink`.
 */
@Component({
  selector: "app-terms",
  standalone: true,
  imports: [CommonModule, RouterModule, RevealOnScrollDirective],
  templateUrl: "./terms.component.html",
  styleUrl: "./terms.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  readonly hero = {
    kicker: $localize`:terms.hero.kicker@@termsHeroLabel:Mentions légales`,
    updated: $localize`:terms.hero.updated@@termsMetaLastUpdated:Dernière mise à jour : 4 juin 2026`,
  };

  /** Sommaire (TOC) : ancres + libellés des 8 sections. */
  readonly toc: readonly TermsTocItem[] = [
    {
      anchor: "editeur",
      label: $localize`:terms.toc.editeur@@termsTocEditeur:Éditeur du site`,
    },
    {
      anchor: "objet",
      label: $localize`:terms.toc.objet@@termsTocObjet:Objet`,
    },
    {
      anchor: "services",
      label: $localize`:terms.toc.services@@termsTocServices:Services & formations`,
    },
    {
      anchor: "paiement",
      label: $localize`:terms.toc.paiement@@termsTocPaiement:Paiement & accès`,
    },
    {
      anchor: "retractation",
      label: $localize`:terms.toc.retractation@@termsTocRetractation:Rétractation`,
    },
    {
      anchor: "propriete",
      label: $localize`:terms.toc.propriete@@termsTocPropriete:Propriété intellectuelle`,
    },
    {
      anchor: "responsabilite",
      label: $localize`:terms.toc.responsabilite@@termsTocResponsabilite:Responsabilité`,
    },
    {
      anchor: "droit",
      label: $localize`:terms.toc.droit@@termsTocDroit:Droit applicable`,
    },
  ];
}
