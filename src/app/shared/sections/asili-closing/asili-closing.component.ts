import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  AsiliCtaBandComponent,
  type AsiliCtaAction,
} from '../asili-cta-band/asili-cta-band.component';
import { AsiliFaqComponent, type AsiliFaqItem } from '../asili-faq/asili-faq.component';

export interface AsiliClosing {
  readonly faq: {
    readonly kicker: string;
    readonly title: string;
    readonly items: readonly AsiliFaqItem[];
  };
  readonly cta: {
    readonly kicker: string;
    readonly title: string;
    readonly actions: readonly AsiliCtaAction[];
  };
}

@Component({
  selector: 'app-asili-closing',
  standalone: true,
  imports: [AsiliFaqComponent, AsiliCtaBandComponent],
  template: `
    @let faq = contenu().faq;
    <app-asili-faq [kicker]="faq.kicker" [title]="faq.title" [items]="faq.items" />
    @let cta = contenu().cta;
    <app-asili-cta-band [kicker]="cta.kicker" [title]="cta.title" [actions]="cta.actions" />
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliClosingComponent {
  readonly contenu = input.required<AsiliClosing>();
}
