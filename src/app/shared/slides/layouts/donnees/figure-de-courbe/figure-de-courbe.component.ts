import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PresentationServie } from '../../../../../../../contrat';
import {
  SlideScatterComponent,
  type TangenteServie,
} from '../slide-scatter/slide-scatter.component';

type FigureDeCourbe = Extract<PresentationServie, { renderer: 'courbe' }>['props']['figure'];

@Component({
  selector: 'app-figure-de-courbe',
  standalone: true,
  imports: [SlideScatterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './figure-de-courbe.component.html',
  styleUrl: './figure-de-courbe.component.scss',
})
export class FigureDeCourbeComponent {
  readonly figure = input.required<FigureDeCourbe>();
  readonly tangentes = input<readonly TangenteServie[]>([]);

  protected readonly toutesLesTangentes = computed(() => [
    ...(this.figure().tangents ?? []),
    ...this.tangentes(),
  ]);
}
