import { Directive, input } from '@angular/core';
import { RevealOnScrollDirective } from '../directives/reveal-on-scroll.directive';
import { AsiliKickerComponent } from './asili-kicker/asili-kicker.component';

export const EN_TETE_ASILI = [RevealOnScrollDirective, AsiliKickerComponent] as const;

@Directive()
export abstract class AsiliEnTeteDirective {
  readonly kicker = input<string | null>(null);

  readonly heading = input<string | null>(null);
}
