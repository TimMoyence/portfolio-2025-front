import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RevealOnScrollDirective } from "../../../../shared/directives/reveal-on-scroll.directive";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page de capture email du toolkit IA solopreneurs — refonte Asili (Lot 3e).
 *
 * Compose la maquette `AsiliNewDesign/toolkit.html` : carte centree (`.tk-card`)
 * avec icone, titre a accent italique, accroche, trois items inclus et le
 * formulaire de capture lead-magnet (`<app-toolkit-form>`). Le contenu editorial
 * (« ce que contient », FAQ) est conserve sous la carte pour lever la penalite
 * « thin content » et maximiser les signaux AEO, restyle aux tokens Asili.
 *
 * Le restyle est purement visuel : la logique de capture lead-magnet vit
 * entierement dans `ToolkitFormComponent` (port `LEAD_MAGNET_PORT`,
 * `requestToolkit`), inchangee. La page n'instancie aucun service, ne touche
 * ni au slug par defaut ni a la soumission. Routes et `seoKey` inchanges ; le
 * fond constellation est global (Lot 0). Texte localise via `$localize`.
 */
@Component({
  selector: "app-toolkit",
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: "./toolkit.component.html",
  styleUrl: "./toolkit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitComponent {}
