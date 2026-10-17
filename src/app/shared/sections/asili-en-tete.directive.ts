import { Directive, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { estCheminInterne } from '../../core/seo/chemins';
import { RevealOnScrollDirective } from '../directives/reveal-on-scroll.directive';
import { AsiliKickerComponent } from './asili-kicker/asili-kicker.component';

export const EN_TETE_ASILI = [RevealOnScrollDirective, AsiliKickerComponent] as const;

export const LIENS_ASILI = [...EN_TETE_ASILI, RouterLink] as const;

@Directive()
export abstract class AsiliEnTeteDirective {
  readonly kicker = input<string | null>(null);

  readonly heading = input<string | null>(null);
}

@Directive()
export abstract class AsiliLiensDirective extends AsiliEnTeteDirective {
  protected readonly estCheminInterne = estCheminInterne;
}
