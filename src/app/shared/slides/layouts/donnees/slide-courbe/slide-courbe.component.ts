import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { PresentationServie } from '../../../../../../../contrat';
import { FigureDeCourbeComponent } from '../figure-de-courbe/figure-de-courbe.component';

type Courbe = Extract<PresentationServie, { renderer: 'courbe' }>['props'];
type Tangente = NonNullable<Courbe['steps'][number]['tangent']>;

function tangentesDe(etapes: Courbe['steps']): readonly Tangente[] {
  return etapes.flatMap(({ tangent }) => (tangent === undefined ? [] : [tangent]));
}

@Component({
  selector: 'app-slide-courbe',
  standalone: true,
  imports: [FigureDeCourbeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-courbe.component.html',
  styleUrl: './slide-courbe.component.scss',
})
export class SlideCourbeComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly figure = input.required<Courbe['figure']>();
  readonly steps = input.required<Courbe['steps']>();

  protected readonly rang = signal(0);
  protected readonly etape = computed(() => this.steps()[this.rang()]);
  protected readonly dernier = computed(() => this.steps().length - 1);
  protected readonly tangentesDevoilees = computed(() =>
    tangentesDe(this.steps().slice(0, this.rang() + 1)),
  );
  protected readonly toutesLesTangentes = computed(() => tangentesDe(this.steps()));

  protected avancer(pas: 1 | -1): void {
    this.rang.update((rang) => Math.min(Math.max(rang + pas, 0), this.dernier()));
  }
}
