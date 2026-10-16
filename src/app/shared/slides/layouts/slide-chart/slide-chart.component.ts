import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { prefereMouvementReduit } from '../../../../../cours/runtime/core/mouvement';
import { DefileurDeTableauComponent } from '../../defileur-de-tableau/defileur-de-tableau.component';
import { enFrancais } from '../../../../../cours/runtime/core/typographie';
import { DonneesDeFigureComponent } from '../../donnees-de-figure/donnees-de-figure.component';
import {
  INTERVALLES_VISES,
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
  readonly cle: string;
  readonly x: number;
  readonly y: number;
  readonly libelle: string;
  readonly dessous: boolean;
  readonly doublon: boolean;
}

interface Trace {
  readonly serie: SlideChartSeries;
  readonly marqueur: MarqueurDeSerie;
  readonly points: readonly PointDeTrace[];
  readonly ligne: string;
  readonly etiquette: { readonly x: number; readonly y: number } | null;
}

interface Barre {
  readonly cle: string;
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
const ECART_LISIBLE_PX = 4;
const ECART_EMPILE_PX = 2;
const ECART_AUX_FORMES_PX = 3;
const FORMES = '.slide-chart__bar, .slide-chart__marqueur--barre, .slide-chart__point';
const VALEURS = '.slide-chart__value, .slide-chart__point-value';
const TEXTES_DU_TRACE = '.slide-chart__tick, .slide-chart__axis-title, .slide-chart__serie-label';

interface Cadre {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

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

function degager(hauteurs: readonly number[], ecart: number): readonly number[] {
  const ordre = hauteurs
    .map((hauteur, rang) => ({ hauteur, rang }))
    .sort((a, b) => a.hauteur - b.hauteur);
  const placees = new Array<number>(hauteurs.length);
  let plancher = -Infinity;
  for (const { hauteur, rang } of ordre) {
    placees[rang] = Math.max(hauteur, plancher);
    plancher = placees[rang] + ecart;
  }
  const debordement = Math.max(0, ...placees) - 100;
  return placees.map((hauteur) => arrondir(debordement > 0 ? hauteur - debordement : hauteur));
}

function valeurSousLePoint(hauteurs: readonly number[], rang: number): boolean {
  const hauteur = hauteurs[rang];
  const autres = hauteurs.filter((autre) => autre !== hauteur);
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

function seGenent(un: Cadre, autre: Cadre, echelle: number): boolean {
  return (
    Math.min(un.right, autre.right) - Math.max(un.left, autre.left) > -ECART_LISIBLE_PX * echelle &&
    Math.min(un.bottom, autre.bottom) - Math.max(un.top, autre.top) > -ECART_EMPILE_PX * echelle
  );
}

function pasQuiDegage(colonnes: readonly (readonly Cadre[])[], echelle: number): number {
  const degage = (pas: number): boolean => {
    const gardes = colonnes.flatMap((cadres, rang) =>
      rang % pas === 0 ? cadres.map((cadre) => ({ rang, cadre })) : [],
    );
    return gardes.every(({ rang, cadre }, index) =>
      gardes
        .slice(index + 1)
        .every((autre) => autre.rang === rang || !seGenent(cadre, autre.cadre, echelle)),
    );
  };
  return Array.from({ length: colonnes.length }, (_, rang) => rang + 1).find(degage) ?? 1;
}

function cadreDuTexte(texte: HTMLElement): Cadre {
  const plage = document.createRange();
  plage.selectNodeContents(texte);
  return plage.getBoundingClientRect();
}

function cadresParRang(textes: Iterable<HTMLElement>): Cadre[][] {
  const colonnes: Cadre[][] = [];
  for (const texte of textes) {
    const rang = Number(texte.dataset['rang']);
    colonnes[rang] = [...(colonnes[rang] ?? []), cadreDuTexte(texte)];
  }
  return colonnes;
}

function cadreDeLaForme(forme: HTMLElement): Cadre {
  const socle = forme.parentElement?.getBoundingClientRect();
  if (!forme.classList.contains('slide-chart__bar') || socle === undefined) {
    return forme.getBoundingClientRect();
  }
  const hauteur = Number.parseFloat(forme.style.getPropertyValue('--hauteur')) || 0;
  return { ...cadreFixe(socle), top: socle.bottom - (socle.height * hauteur) / 100 };
}

function cadreFixe({ left, right, top, bottom }: Cadre): Cadre {
  return { left, right, top, bottom };
}

function touchent(valeur: Cadre, forme: Cadre, echelle: number): boolean {
  return (
    Math.min(valeur.right, forme.right) - Math.max(valeur.left, forme.left) >
      -ECART_AUX_FORMES_PX * echelle &&
    Math.min(valeur.bottom, forme.bottom) - Math.max(valeur.top, forme.top) >
      -ECART_AUX_FORMES_PX * echelle
  );
}

function cotesDuPoint(valeur: HTMLElement, point: Cadre | undefined, dessous: boolean): Cadre[] {
  const ici = cadreFixe(cadreDuTexte(valeur));
  if (point === undefined) {
    return [ici];
  }
  const boite = valeur.getBoundingClientRect();
  const decalage = point.top + point.bottom - boite.top - boite.bottom;
  const enFace = { ...ici, top: ici.top + decalage, bottom: ici.bottom + decalage };
  return valeur.classList.contains('is-below') === dessous ? [ici, enFace] : [enFace, ici];
}

function plusLarge(rendu: HTMLElement, selecteur: string): number {
  return Math.max(
    0,
    ...Array.from(rendu.querySelectorAll<HTMLElement>(selecteur), (texte) => texte.offsetWidth),
  );
}

function memesCles(une: ReadonlySet<string>, autre: ReadonlySet<string>): boolean {
  return une.size === autre.size && [...une].every((cle) => autre.has(cle));
}

function memesReculs<Cle>(un: ReadonlyMap<Cle, number>, autre: ReadonlyMap<Cle, number>): boolean {
  return un.size === autre.size && [...un].every(([cle, recul]) => autre.get(cle) === recul);
}

interface CadreDuTrace {
  readonly cadre: Cadre;
  readonly echelle: number;
}

function cadreDuTrace(rendu: HTMLElement): CadreDuTrace | undefined {
  const plot = rendu.querySelector<HTMLElement>('.slide-chart__plot');
  if (plot === null) {
    return undefined;
  }
  const cadre = plot.getBoundingClientRect();
  return { cadre, echelle: plot.offsetWidth === 0 ? 1 : cadre.width / plot.offsetWidth };
}

function decale({ left, right, top, bottom }: Cadre, recul: number, trace?: CadreDuTrace): Cadre {
  const aLEcran = recul * (trace?.echelle ?? 1);
  return { left: left + aLEcran, right: right + aLEcran, top, bottom };
}

function reculDe(texte: HTMLElement): number {
  return Number.parseFloat(texte.style.getPropertyValue('--recul')) || 0;
}

function reculDansLeTrace(cadre: Cadre, trace: CadreDuTrace | undefined): number {
  if (trace === undefined) {
    return 0;
  }
  const { cadre: limite, echelle } = trace;
  if (cadre.right > limite.right) {
    return Math.floor((limite.right - cadre.right) / echelle);
  }
  return cadre.left < limite.left ? Math.ceil((limite.left - cadre.left) / echelle) : 0;
}

@Component({
  selector: 'app-slide-chart',
  standalone: true,
  imports: [DefileurDeTableauComponent, DonneesDeFigureComponent],
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
  protected readonly pasDesAbscisses = signal(1);
  protected readonly pasDesGraduations = signal(1);
  protected readonly pasDesValeurs = signal(1);
  protected readonly largeurDuTrace = signal(0);
  protected readonly largeurDesEtiquettes = signal(0);
  private readonly ecartDesEtiquettes = signal(ECART_DES_ETIQUETTES);
  protected readonly valeursRetournees = signal<ReadonlySet<string>>(new Set(), {
    equal: memesCles,
  });
  protected readonly valeursHorsPlace = signal<ReadonlySet<string>>(new Set(), {
    equal: memesCles,
  });
  protected readonly reculsDesValeurs = signal<ReadonlyMap<string, number>>(new Map(), {
    equal: memesReculs,
  });
  protected readonly reculsDesAbscisses = signal<ReadonlyMap<number, number>>(new Map(), {
    equal: memesReculs,
  });
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
        cle: `${rang}-${index}`,
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
    const finales = degager(
      hauteursParSerie.map((hauteurs) => hauteurs.at(-1) ?? 0),
      this.ecartDesEtiquettes(),
    );
    return this.series().map((serie, rang) => {
      const points = serie.values.map((valeur, index) => ({
        cle: `${rang}-${index}`,
        x: this.abscisse(index),
        y: hauteursParSerie[rang][index],
        libelle: this.formatValue(valeur),
        dessous: valeurSousLePoint(colonnes[index] ?? [], rang),
        doublon: this.series()
          .slice(0, rang)
          .some((autre) => autre.values[index] === valeur),
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
    afterRenderEffect((onCleanup) => {
      this.labels();
      this.series();
      this.kind();
      const degager = (): void => this.degagerLesLibelles();
      degager();
      document.fonts.addEventListener('loadingdone', degager);
      onCleanup(() => document.fonts.removeEventListener('loadingdone', degager));
      if (typeof ResizeObserver !== 'undefined') {
        const observateur = new ResizeObserver(degager);
        const rendu: HTMLElement = this.elementRef.nativeElement;
        observateur.observe(rendu);
        const zone = rendu.querySelector('.slide-chart__zone');
        if (zone !== null) {
          observateur.observe(zone);
        }
        onCleanup(() => observateur.disconnect());
      }
    });
  }

  protected ariaLabel(): string {
    const data = this.series()
      .map((serie) => `${serie.label}: ${serie.values.map((v) => this.formatValue(v)).join(' ; ')}`)
      .join('. ');
    return `${this.title()}: ${this.caption()}: ${data}`.trim();
  }

  protected readonly formatValue = enFrancais;

  protected marqueur(seriesIndex: number): MarqueurDeSerie {
    return MARQUEURS[seriesIndex % MARQUEURS.length];
  }

  protected play(): void {
    this.stop();
    const lastStep = Math.max(0, this.labels().length - 1);
    if (prefereMouvementReduit()) {
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

  private degagerLesLibelles(): void {
    const rendu: HTMLElement = this.elementRef.nativeElement;
    const trace = cadreDuTrace(rendu);
    const echelle = trace?.echelle ?? 1;
    const reculs = new Map<number, number>();
    const abscisses: Cadre[][] = [];
    for (const texte of rendu.querySelectorAll<HTMLElement>('.slide-chart__labels [data-rang]')) {
      const rang = Number(texte.dataset['rang']);
      const brut = decale(cadreDuTexte(texte), -reculDe(texte), trace);
      const recul = reculDansLeTrace(brut, trace);
      if (recul !== 0) {
        reculs.set(rang, recul);
      }
      abscisses[rang] = [decale(brut, recul, trace)];
    }
    this.reculsDesAbscisses.set(reculs);
    this.pasDesAbscisses.set(pasQuiDegage(abscisses, echelle));
    this.pasDesGraduations.set(
      pasQuiDegage(
        cadresParRang(
          rendu.querySelectorAll<HTMLElement>('.slide-chart__axis--left .slide-chart__tick'),
        ),
        echelle,
      ),
    );
    const formesParAbscisse = this.kind() === 'line' ? 1 : this.series().length;
    this.largeurDuTrace.set(
      this.labels().length * formesParAbscisse * (plusLarge(rendu, VALEURS) + 2 * ECART_LISIBLE_PX),
    );
    this.largeurDesEtiquettes.set(plusLarge(rendu, '.slide-chart__serie-label'));
    const zone = rendu.querySelector('.slide-chart__zone')?.getBoundingClientRect().height ?? 0;
    if (zone > 0) {
      const etiquette = Math.max(
        0,
        ...Array.from(
          rendu.querySelectorAll<HTMLElement>('.slide-chart__serie-label'),
          (texte) => cadreDuTexte(texte).bottom - cadreDuTexte(texte).top,
        ),
      );
      this.ecartDesEtiquettes.set(
        Math.max(ECART_DES_ETIQUETTES, ((etiquette + ECART_LISIBLE_PX * echelle) / zone) * 100),
      );
    }
    this.placerLesValeurs(rendu);
  }

  private placerLesValeurs(rendu: HTMLElement): void {
    const formes = Array.from(rendu.querySelectorAll<HTMLElement>(FORMES), (forme) => ({
      cle: forme.dataset['cle'],
      cadre: cadreDeLaForme(forme),
    }));
    const textes = Array.from(rendu.querySelectorAll<HTMLElement>(TEXTES_DU_TRACE), cadreDuTexte);
    const points = new Map(
      (this.kind() === 'line' ? this.traces() : []).flatMap((trace) =>
        trace.points.map((point) => [point.cle, point] as const),
      ),
    );
    const trace = cadreDuTrace(rendu);
    const echelle = trace?.echelle ?? 1;
    const retournees = new Set<string>();
    const horsPlace = new Set<string>();
    const reculs = new Map<string, number>();
    const colonnes: Cadre[][] = [];
    for (const valeur of rendu.querySelectorAll<HTMLElement>(VALEURS)) {
      const cle = valeur.dataset['cle'] ?? '';
      const rang = Number(valeur.dataset['rang']);
      const point = points.get(cle);
      const enPlace = cotesDuPoint(
        valeur,
        point === undefined ? undefined : formes.find((forme) => forme.cle === cle)?.cadre,
        point?.dessous ?? false,
      ).map((cadre) => decale(cadre, -reculDe(valeur), trace));
      const recul = reculDansLeTrace(enPlace[0], trace);
      if (recul !== 0) {
        reculs.set(cle, recul);
      }
      const cotes = enPlace.map((cadre) => decale(cadre, recul, trace));
      const place = cotes.find(
        (cadre) =>
          formes.every((forme) => forme.cle === cle || !touchent(cadre, forme.cadre, echelle)) &&
          [...textes, ...(colonnes[rang] ?? [])].every(
            (voisin) => !seGenent(cadre, voisin, echelle),
          ),
      );
      if (place === undefined) {
        horsPlace.add(cle);
      } else {
        if (place !== cotes[0]) {
          retournees.add(cle);
        }
        colonnes[rang] = [...(colonnes[rang] ?? []), place];
      }
    }
    this.valeursRetournees.set(retournees);
    this.valeursHorsPlace.set(horsPlace);
    this.reculsDesValeurs.set(reculs);
    this.pasDesValeurs.set(pasQuiDegage(colonnes, echelle));
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
