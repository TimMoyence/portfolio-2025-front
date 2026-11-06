import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  cadreDuTexte,
  cadreDuTrace,
  decale,
  memesReculs,
  mesurerAChaqueRendu,
  reculDansLeTrace,
  reculDe,
} from '../garder-dans-le-trace';
import { DonneesDeFigureComponent } from '../../../donnees-de-figure/donnees-de-figure.component';
import { enFrancais } from '../../../../../../cours/runtime/core/texte/typographie';
import { graduer, position, type Plage } from '../../axe-gradue';
import { generateurDIdentifiants } from '../../identifiant-de-description';

export interface SlideScatterPoint {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
}

export interface SlideScatterLine {
  readonly slope: number;
  readonly intercept: number;
  readonly label?: string;
}

interface PointPlace {
  readonly point: SlideScatterPoint;
  readonly x: number;
  readonly y: number;
}

interface SegmentTrace {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

const prochainIdentifiantDeDescription = generateurDIdentifiants('slide-scatter');

function abscissesDansLeCadre(
  { slope, intercept }: SlideScatterLine,
  [xMin, xMax]: Plage,
  [yMin, yMax]: Plage,
): Plage | null {
  if (slope === 0) {
    return intercept >= yMin && intercept <= yMax ? [xMin, xMax] : null;
  }
  const auPlancher = (yMin - intercept) / slope;
  const auPlafond = (yMax - intercept) / slope;
  const debut = Math.max(xMin, Math.min(auPlancher, auPlafond));
  const fin = Math.min(xMax, Math.max(auPlancher, auPlafond));
  return debut < fin ? [debut, fin] : null;
}

function segmentDansLeCadre(
  droite: SlideScatterLine,
  plageX: Plage,
  plageY: Plage,
): SegmentTrace | null {
  const abscisses = abscissesDansLeCadre(droite, plageX, plageY);
  if (abscisses === null) {
    return null;
  }
  const [debut, fin] = abscisses;
  const hauteur = (x: number): number =>
    100 - position(droite.slope * x + droite.intercept, plageY);
  return {
    x1: position(debut, plageX),
    y1: hauteur(debut),
    x2: position(fin, plageX),
    y2: hauteur(fin),
  };
}

@Component({
  selector: 'app-slide-scatter',
  standalone: true,
  imports: [DonneesDeFigureComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-scatter.component.html',
  styleUrl: './slide-scatter.component.scss',
})
export class SlideScatterComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly description = input.required<string>();
  readonly reading = input<string>('');
  readonly source = input<string>('');
  readonly xLabel = input.required<string>();
  readonly yLabel = input.required<string>();
  readonly xRange = input.required<Plage>();
  readonly yRange = input.required<Plage>();
  readonly points = input.required<readonly SlideScatterPoint[]>();
  readonly meanPoint = input<{ readonly x: number; readonly y: number } | null>(null);
  readonly line = input<SlideScatterLine | null>(null);

  protected readonly graduationsX = computed(() => graduer(this.xRange()));
  protected readonly graduationsY = computed(() => graduer(this.yRange()));
  protected readonly idDescription = prochainIdentifiantDeDescription();

  protected readonly places = computed<readonly PointPlace[]>(() =>
    this.points().map((point) => this.placer(point)),
  );

  protected readonly moyen = computed<PointPlace | null>(() => {
    const point = this.meanPoint();
    return point === null ? null : this.placer(point);
  });

  protected readonly segment = computed<SegmentTrace | null>(() => {
    const droite = this.line();
    return droite === null ? null : segmentDansLeCadre(droite, this.xRange(), this.yRange());
  });

  protected readonly formater = enFrancais;

  protected readonly reculsDesEtiquettes = signal<ReadonlyMap<number, number>>(new Map(), {
    equal: memesReculs,
  });

  private readonly elementRef = inject(ElementRef);

  constructor() {
    afterRenderEffect((onCleanup) => {
      this.places();
      mesurerAChaqueRendu(
        this.elementRef.nativeElement as HTMLElement,
        () => this.degagerLesEtiquettes(),
        onCleanup,
      );
    });
  }

  private degagerLesEtiquettes(): void {
    const rendu: HTMLElement = this.elementRef.nativeElement;
    const trace = cadreDuTrace(rendu, '.slide-scatter__plot');
    const reculs = new Map<number, number>();
    for (const etiquette of rendu.querySelectorAll<HTMLElement>(
      '.slide-scatter__point-label[data-rang]',
    )) {
      const brut = decale(cadreDuTexte(etiquette), -reculDe(etiquette), trace);
      const recul = reculDansLeTrace(brut, trace);
      if (recul !== 0) {
        reculs.set(Number(etiquette.dataset['rang']), recul);
      }
    }
    this.reculsDesEtiquettes.set(reculs);
  }

  private placer(point: SlideScatterPoint): PointPlace {
    return { point, x: position(point.x, this.xRange()), y: position(point.y, this.yRange()) };
  }
}
