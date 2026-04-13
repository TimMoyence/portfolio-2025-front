import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PresentationEngineComponent } from "../../../shared/components/presentation-engine/presentation-engine.component";
import { InteractionCollectorService } from "../../../shared/services/interaction-collector.service";
import { IA_SOLOPRENEURS_SLIDES } from "./ia-solopreneurs.data";

@Component({
  selector: "app-ia-solopreneurs",
  standalone: true,
  imports: [PresentationEngineComponent],
  providers: [InteractionCollectorService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only" i18n="@@iaSolopreneursPageTitle">
      Formation IA Solopreneurs — maîtriser l'intelligence artificielle pour
      indépendants
    </h1>
    <app-presentation-engine [slides]="slides" />
  `,
})
export class IaSolopreneursComponent {
  readonly slides = IA_SOLOPRENEURS_SLIDES;
}
