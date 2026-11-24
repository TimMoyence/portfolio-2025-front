import { Directive, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FiletDeSectionDirective } from '../directives/filet-de-section.directive';
import { AsiliKickerComponent } from './tete/asili-kicker/asili-kicker.component';

export const EN_TETE_ASILI = [AsiliKickerComponent, FiletDeSectionDirective] as const;

export const LIENS_ASILI = [...EN_TETE_ASILI, RouterLink] as const;

@Directive()
export abstract class AsiliEnTeteDirective {
  readonly kicker = input<string | null>(null);

  readonly heading = input<string | null>(null);
}
