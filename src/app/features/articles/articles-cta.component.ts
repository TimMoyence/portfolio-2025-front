import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AsiliCtaBandComponent, type AsiliCtaAction } from '../../shared/sections';

@Component({
  selector: 'app-articles-cta',
  standalone: true,
  imports: [AsiliCtaBandComponent],
  template: `
    <app-asili-cta-band [kicker]="kicker()" [title]="title()" [lead]="lead()" [actions]="actions" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesCtaComponent {
  readonly kicker = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input.required<string>();

  protected readonly actions: readonly AsiliCtaAction[] = [
    {
      libelle: $localize`:@@articlesCtaStart:Démarrer la conversation`,
      lien: '/contact',
      variante: 'principale',
    },
  ];
}
