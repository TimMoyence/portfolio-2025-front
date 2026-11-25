import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { etapesDeLaMethode } from '../../../offre/socle-et-elan';
import { AsiliMethodComponent } from '../asili-method/asili-method.component';

@Component({
  selector: 'app-socle-et-elan',
  standalone: true,
  imports: [AsiliMethodComponent],
  template: `
    <app-asili-method [steps]="etapes" [kicker]="kicker()">
      <h2 heading class="h-lg method-head__title" i18n="@@homePlanTitre">
        Socle &amp; Élan : votre site en ligne, puis plus fort.
      </h2>
    </app-asili-method>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocleEtElanComponent {
  readonly kicker = input.required<string>();

  protected readonly etapes = etapesDeLaMethode();
}
