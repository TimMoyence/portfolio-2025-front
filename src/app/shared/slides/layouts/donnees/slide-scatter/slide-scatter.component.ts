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
  cotesDuPoint,
  decale,
  memesReculs,
  mesurerAChaqueRendu,
  pasQuiDegage,
  reculDansLeTrace,
  reculDe,
  seGenent,
  touchent,
  type Cadre,
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

const TEXTES_FIXES =
  '.slide-scatter__y-tick, .slide-scatter__y-label, .slide-scatter__x-label, .slide-scatter__mean-label';

function memesRangs(un: ReadonlySet<number>, autre: ReadonlySet<number>): boolean {
  return un.size === autre.size && [...un].every((rang) => autre.has(rang));
}

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
  protected readonly etiquettesRetournees = signal<ReadonlySet<number>>(new Set(), {
    equal: memesRangs,
  });
  protected readonly etiquettesHorsPlace = signal<ReadonlySet<number>>(new Set(), {
    equal: memesRangs,
  });
  protected readonly pasDesGraduationsX = signal(1);

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
    const echelle = trace?.echelle ?? 1;
    const graduations = Array.from(
      rendu.querySelectorAll<HTMLElement>('.slide-scatter__x-tick'),
      (graduation) => [cadreDuTexte(graduation)],
    );
    const pas = pasQuiDegage(graduations, echelle);
    const poses: Cadre[] = [
      ...graduations.flatMap((cadres, rang) => (rang % pas === 0 ? cadres : [])),
      ...Array.from(rendu.querySelectorAll<HTMLElement>(TEXTES_FIXES), cadreDuTexte),
    ];
    const points = Array.from(rendu.querySelectorAll<HTMLElement>('.slide-scatter__point'));
    const reculs = new Map<number, number>();
    const retournees = new Set<number>();
    const horsPlace = new Set<number>();
    for (const etiquette of rendu.querySelectorAll<HTMLElement>(
      '.slide-scatter__point-label[data-rang]',
    )) {
      const rang = Number(etiquette.dataset['rang']);
      const sonPoint = etiquette.parentElement;
      const cotes = cotesDuPoint(etiquette, sonPoint?.getBoundingClientRect(), false).map((cadre) =>
        decale(cadre, -reculDe(etiquette), trace),
      );
      const recul = reculDansLeTrace(cotes[0], trace);
      if (recul !== 0) {
        reculs.set(rang, recul);
      }
      const place = cotes
        .map((cadre) => decale(cadre, recul, trace))
        .find(
          (cadre) =>
            points.every(
              (point) =>
                point === sonPoint || !touchent(cadre, point.getBoundingClientRect(), echelle),
            ) && poses.every((voisin) => !seGenent(cadre, voisin, echelle)),
        );
      if (place === undefined) {
        horsPlace.add(rang);
        continue;
      }
      if (place.top > cotes[0].top) {
        retournees.add(rang);
      }
      poses.push(place);
    }
    this.pasDesGraduationsX.set(pas);
    this.reculsDesEtiquettes.set(reculs);
    this.etiquettesRetournees.set(retournees);
    this.etiquettesHorsPlace.set(horsPlace);
  }

  private placer(point: SlideScatterPoint): PointPlace {
    return { point, x: position(point.x, this.xRange()), y: position(point.y, this.yRange()) };
  }
}
