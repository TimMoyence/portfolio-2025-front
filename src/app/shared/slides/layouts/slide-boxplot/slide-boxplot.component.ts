import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NOMBRE_FRANCAIS,
  position,
  valeursGraduees,
  type Graduation,
  type Plage,
} from '../axe-gradue';

export interface SlideBoxplotSeries {
  readonly label: string;
  readonly min: number;
  readonly q1: number;
  readonly median: number;
  readonly q3: number;
  readonly max: number;
  readonly mean?: number;
  readonly tone?: 'teal' | 'gold' | 'ink';
}

interface BoiteTracee {
  readonly serie: SlideBoxplotSeries;
  readonly moustache: { readonly debut: number; readonly fin: number };
  readonly boite: { readonly debut: number; readonly fin: number };
  readonly mediane: number;
  readonly moyenne: number | null;
}

let compteurDeBoites = 0;

function prochainIdentifiantDeDescription(): string {
  compteurDeBoites += 1;
  return `slide-boxplot-description-${compteurDeBoites}`;
}

@Component({
  selector: 'app-slide-boxplot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-boxplot.component.html',
  styleUrl: './slide-boxplot.component.scss',
})
export class SlideBoxplotComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly unit = input<string>('');
  readonly axisRange = input.required<Plage>();
  readonly series = input.required<readonly SlideBoxplotSeries[]>();
  readonly reading = input<string>('');
  readonly source = input<string>('');
  readonly description = input.required<string>();

  protected readonly idDescription = prochainIdentifiantDeDescription();

  protected readonly graduations = computed<readonly Graduation[]>(() => {
    const plage = this.axisRange();
    return valeursGraduees(plage).map((valeur) => ({
      libelle: NOMBRE_FRANCAIS.format(valeur),
      position: position(valeur, plage),
    }));
  });

  protected readonly boites = computed<readonly BoiteTracee[]>(() => {
    const plage = this.axisRange();
    return this.series().map((serie) => ({
      serie,
      moustache: { debut: position(serie.min, plage), fin: position(serie.max, plage) },
      boite: { debut: position(serie.q1, plage), fin: position(serie.q3, plage) },
      mediane: position(serie.median, plage),
      moyenne: serie.mean === undefined ? null : position(serie.mean, plage),
    }));
  });

  protected formater(valeur: number | undefined): string {
    return valeur === undefined ? '—' : NOMBRE_FRANCAIS.format(valeur);
  }
}
