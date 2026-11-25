import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FiletDeSectionDirective } from '../../../directives/filet-de-section.directive';
import { AsiliEnTeteDirective, EN_TETE_ASILI } from '../../asili-en-tete.directive';

export interface AsiliMethodStep {
  num: string;
  index?: string;
  title: string;
  desc: string;
  livrable?: string;
  duree?: string;
}

@Component({
  selector: 'app-asili-method',
  standalone: true,
  imports: [EN_TETE_ASILI, FiletDeSectionDirective],
  templateUrl: './asili-method.component.html',
  styleUrls: ['./asili-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliMethodComponent extends AsiliEnTeteDirective {
  readonly steps = input.required<readonly AsiliMethodStep[]>();
}
