import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export interface EnTeteDeSlide {
  readonly bloc: string;
  readonly titre: string;
  readonly sousTitre: string;
}

@Component({
  selector: '[appSlideEnTete]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (appSlideEnTete().titre) {
      <h2>{{ appSlideEnTete().titre }}</h2>
    }
    @if (appSlideEnTete().sousTitre) {
      <p [class]="appSlideEnTete().bloc + '__subtitle'">{{ appSlideEnTete().sousTitre }}</p>
    }
    <ng-content />
  `,
})
export class SlideEnTeteComponent {
  readonly appSlideEnTete = input.required<EnTeteDeSlide>();
}
