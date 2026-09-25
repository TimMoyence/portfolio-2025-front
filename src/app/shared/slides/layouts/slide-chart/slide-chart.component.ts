import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  INTERVALLES_VISES,
  NOMBRE_FRANCAIS,
  PRECISION,
  arrondir,
  position,
  valeursGraduees,
  type Graduation,
  type Plage,
} from '../axe-gradue';

export interface SlideChartSeries {
  readonly label: string;
  readonly values: readonly number[];
  readonly tone?: 'teal' | 'gold' | 'ink';
}

export type SlideChartKind = 'bars' | 'line';

type MarqueurDeSerie = 'rond' | 'carre' | 'losange';

interface PointDeTrace {
  readonly x: number;
  readonly y: number;
  readonly libelle: string;
  readonly dessous: boolean;
}

interface Trace {
  readonly serie: SlideChartSeries;
  readonly marqueur: MarqueurDeSerie;
  readonly points: readonly PointDeTrace[];
  readonly ligne: string;
  readonly etiquette: { readonly x: number; readonly y: number } | null;
}

interface Barre {
  readonly serie: SlideChartSeries;
  readonly marqueur: MarqueurDeSerie;
  readonly hauteur: number;
  readonly libelle: string;
}

interface GroupeDeBarres {
  readonly libelle: string;
  readonly barres: readonly Barre[];
}

const MARQUEURS: readonly MarqueurDeSerie[] = ['rond', 'carre', 'losange'];
const PAS_AUTOMATIQUES = [1, 2, 2.5, 5, 10];
const ECART_DES_ETIQUETTES = 7.5;
const BAS_DE_ZONE = 12;

let compteurDeGraphiques = 0;

function prochainIdentifiantDeDescription(): string {
  compteurDeGraphiques += 1;
  return `slide-chart-description-${compteurDeGraphiques}`;
}

function pasAutomatique(brut: number): number {
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const facteur = PAS_AUTOMATIQUES.find((candidat) => candidat * puissance >= brut - PRECISION);
  return (facteur ?? 10) * puissance;
}

function plageAutomatique(valeurs: readonly number[], depuisZero: boolean): Plage {
  if (valeurs.length === 0) {
    return [0, 1];
  }
  const min = depuisZero ? Math.min(0, ...valeurs) : Math.min(...valeurs);
  const max = Math.max(...valeurs, min + 1);
  const pas = pasAutomatique((max - min) / INTERVALLES_VISES);
  return [Math.floor(min / pas + PRECISION) * pas, Math.ceil(max / pas - PRECISION) * pas];
}

function degager(hauteurs: readonly number[]): readonly number[] {
  const ordre = hauteurs
    .map((hauteur, rang) => ({ hauteur, rang }))
    .sort((a, b) => a.hauteur - b.hauteur);
  const placees = new Array<number>(hauteurs.length);
  let plancher = -Infinity;
  for (const { hauteur, rang } of ordre) {
    placees[rang] = Math.max(hauteur, plancher);
    plancher = placees[rang] + ECART_DES_ETIQUETTES;
  }
  const debordement = Math.max(0, ...placees) - 100;
  return placees.map((hauteur) => arrondir(debordement > 0 ? hauteur - debordement : hauteur));
}

function valeurSousLePoint(hauteurs: readonly number[], rang: number): boolean {
  const hauteur = hauteurs[rang];
  const autres = hauteurs.filter((_, autre) => autre !== rang);
  const audessus = autres.filter((autre) => autre >= hauteur);
  const audessous = autres.filter((autre) => autre < hauteur);
  if (audessus.length === 0) {
    return false;
  }
  if (audessous.length === 0) {
    return hauteur >= BAS_DE_ZONE;
  }
  return hauteur - Math.max(...audessous) > Math.min(...audessus) - hauteur;
}

@Component({
  selector: 'app-slide-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-chart.component.html',
  styleUrl: './slide-chart.component.scss',
})
export class SlideChartComponent {
  readonly title = input.required<string>();
  readonly caption = input<string>('');
  readonly context = input<string>('');
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly SlideChartSeries[]>();
  readonly formula = input<string>('');
  readonly source = input<string>('');
  readonly unit = input<string>('');
  readonly kind = input<SlideChartKind>('bars');
  readonly axisRanges = input<readonly (readonly [number, number])[]>([]);
  readonly axisLabels = input<readonly [string, string]>(['A', 'B']);
  readonly reading = input<string>('');
  readonly description = input<string>('');

  protected readonly libellePeriode = $localize`:@@slideChartPeriode:Période`;
  protected readonly idDescription = prochainIdentifiantDeDescription();
  protected readonly step = signal(-1);
  protected readonly echelle = computed<Plage>(
    () =>
      this.axisRanges().at(0) ??
      plageAutomatique(
        this.series().flatMap((serie) => serie.values),
        this.kind() === 'bars',
      ),
  );
  protected readonly graduations = computed<readonly Graduation[]>(() =>
    valeursGraduees(this.echelle())
      .map((valeur) => ({
        libelle: this.formatValue(valeur),
        position: position(valeur, this.echelle()),
      }))
      .reverse(),
  );
  protected readonly graduationsDroites = computed<readonly Graduation[]>(() => {
    const plage = this.axisRanges().at(1);
    if (plage === undefined) {
      return [];
    }
    const [min, max] = plage;
    return this.graduations().map(({ position: hauteur }) => ({
      libelle: this.formatValue(arrondir(min + ((max - min) * hauteur) / 100)),
      position: hauteur,
    }));
  });
  protected readonly groupes = computed<readonly GroupeDeBarres[]>(() =>
    this.labels().map((libelle, index) => ({
      libelle,
      barres: this.series().map((serie, rang) => ({
        serie,
        marqueur: this.marqueur(rang),
        hauteur: position(serie.values[index] ?? 0, this.axisRanges().at(rang) ?? this.echelle()),
        libelle: this.formatValue(serie.values[index] ?? 0),
      })),
    })),
  );
  protected readonly traces = computed<readonly Trace[]>(() => {
    const hauteursParSerie = this.series().map((serie) =>
      serie.values.map((valeur) => position(valeur, this.echelle())),
    );
    const colonnes = this.labels().map((_, index) =>
      hauteursParSerie.map((hauteurs) => hauteurs[index] ?? 0),
    );
    const finales = degager(hauteursParSerie.map((hauteurs) => hauteurs.at(-1) ?? 0));
    return this.series().map((serie, rang) => {
      const points = serie.values.map((valeur, index) => ({
        x: this.abscisse(index),
        y: hauteursParSerie[rang][index],
        libelle: this.formatValue(valeur),
        dessous: valeurSousLePoint(colonnes[index] ?? [], rang),
      }));
      const dernier = points.at(-1);
      return {
        serie,
        marqueur: this.marqueur(rang),
        points,
        ligne: points.map(({ x, y }) => `${x},${arrondir(100 - y)}`).join(' '),
        etiquette: dernier === undefined ? null : { x: dernier.x, y: finales[rang] },
      };
    });
  });
  private readonly hasPlayed = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private timer: ReturnType<typeof setInterval> | null = null;
  private observer: IntersectionObserver | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stop();
      this.observer?.disconnect();
    });

    afterNextRender(() => this.observeVisibility());
  }

  protected ariaLabel(): string {
    const data = this.series()
      .map((serie) => `${serie.label}: ${serie.values.join(', ')}`)
      .join('; ');
    return `${this.title()}: ${this.caption()}: ${data}`.trim();
  }

  protected formatValue(value: number): string {
    return NOMBRE_FRANCAIS.format(value);
  }

  protected marqueur(seriesIndex: number): MarqueurDeSerie {
    return MARQUEURS[seriesIndex % MARQUEURS.length];
  }

  protected play(): void {
    this.stop();
    const lastStep = Math.max(0, this.labels().length - 1);
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.step.set(lastStep);
      return;
    }

    this.step.set(0);
    this.timer = setInterval(() => {
      const next = this.step() + 1;
      if (next >= lastStep) {
        this.step.set(lastStep);
        this.stop();
        return;
      }
      this.step.set(next);
    }, 560);
  }

  private abscisse(index: number): number {
    return arrondir(((index + 0.5) / Math.max(1, this.labels().length)) * 100);
  }

  private observeVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.hasPlayed.set(true);
      this.play();
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !this.hasPlayed()) {
          this.hasPlayed.set(true);
          this.play();
          this.observer?.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    this.observer.observe(this.elementRef.nativeElement);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
