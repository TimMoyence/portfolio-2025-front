import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RevealOnScrollDirective } from "../../../../shared/directives/reveal-on-scroll.directive";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page de capture email du toolkit « Audit SEO DIY » — refonte Asili (Lot 3e).
 *
 * Reprend la structure de carte centree de `AsiliNewDesign/toolkit.html`,
 * adaptee aux 7 checks SEO de la formation. Le formulaire de capture
 * lead-magnet (`<app-toolkit-form formationSlug="audit-seo-diy">`) declenche
 * l'envoi du PDF « Checklist audit SEO + rapport type » via le pipeline
 * lead-magnet. Le contenu editorial (« ce que contient », FAQ) est conserve
 * pour eviter la penalite « thin content » et maximiser les signaux AEO
 * (H2-questions + reponses 50-100 mots), restyle aux tokens Asili.
 *
 * Le restyle est purement visuel : la logique de capture (port
 * `LEAD_MAGNET_PORT`, `requestToolkit`) vit dans `ToolkitFormComponent`,
 * inchangee. Le slug `audit-seo-diy` (cle metier d'attribution back-end) est
 * transmis a l'identique. Routes et `seoKey` inchanges ; fond constellation
 * global. Texte localise via `$localize`.
 */
@Component({
  selector: "app-toolkit-audit-seo",
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: "./toolkit-audit-seo.component.html",
  styleUrl: "./toolkit-audit-seo.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitAuditSeoComponent {}
