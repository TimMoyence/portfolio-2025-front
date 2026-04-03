import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/**
 * Mini graphique SVG en ligne (sparkline) pour visualiser
 * l'evolution d'une metrique horaire dans une carte compacte.
 * Aucune dependance externe (pas de Chart.js).
 */
@Component({
  selector: "app-sparkline",
  standalone: true,
  template: `
    @if (points().length > 1) {
      <svg
        [attr.viewBox]="viewBox()"
        class="h-8 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <!-- Zone de remplissage sous la courbe -->
        <path [attr.d]="areaPath()" [attr.fill]="color()" fill-opacity="0.15" />
        <!-- Ligne de la courbe -->
        <polyline
          [attr.points]="polylinePoints()"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineComponent {
  /** Donnees a tracer (tableau de nombres). */
  readonly data = input<number[]>([]);

  /** Couleur de la courbe (CSS). */
  readonly color = input("rgba(255, 255, 255, 0.6)");

  /** Points normalises pour le SVG. */
  readonly points = computed(() => {
    const raw = this.data();
    if (!raw || raw.length < 2) return [];

    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const step = width / (raw.length - 1);

    return raw.map((val, i) => ({
      x: Math.round(i * step * 100) / 100,
      y: Math.round((1 - (val - min) / range) * height * 100) / 100,
    }));
  });

  /** ViewBox du SVG. */
  readonly viewBox = computed(() => "0 0 100 30");

  /** Attribut points de la polyline SVG. */
  readonly polylinePoints = computed(() =>
    this.points()
      .map((p) => `${p.x},${p.y}`)
      .join(" "),
  );

  /** Chemin SVG de la zone de remplissage sous la courbe. */
  readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return "";
    const line = pts.map((p) => `${p.x},${p.y}`).join(" L ");
    return `M ${pts[0].x},30 L ${line} L ${pts[pts.length - 1].x},30 Z`;
  });
}
