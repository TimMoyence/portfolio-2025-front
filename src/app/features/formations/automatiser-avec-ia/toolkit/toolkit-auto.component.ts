import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RevealOnScrollDirective } from "../../../../shared/directives/reveal-on-scroll.directive";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page de capture email du toolkit « Automatiser avec l'IA » — refonte Asili
 * (Lot 3e).
 *
 * Reprend la structure de carte centree de `AsiliNewDesign/toolkit.html`,
 * adaptee aux 5 workflows de la formation. Le formulaire de capture
 * lead-magnet (`<app-toolkit-form formationSlug="automatiser-avec-ia">`)
 * declenche l'envoi du PDF « 5 workflows prets a l'emploi » via le pipeline
 * lead-magnet. Le contenu editorial (« ce que contient », FAQ) est conserve
 * pour eviter la penalite « thin content », restyle aux tokens Asili.
 *
 * Le restyle est purement visuel : la logique de capture (port
 * `LEAD_MAGNET_PORT`, `requestToolkit`) vit dans `ToolkitFormComponent`,
 * inchangee. Le slug `automatiser-avec-ia` (cle metier d'attribution back-end)
 * est transmis a l'identique. Routes et `seoKey` inchanges ; fond constellation
 * global. Texte localise via `$localize`.
 */
@Component({
  selector: "app-toolkit-auto",
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: "./toolkit-auto.component.html",
  styleUrl: "./toolkit-auto.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitAutoComponent {}
