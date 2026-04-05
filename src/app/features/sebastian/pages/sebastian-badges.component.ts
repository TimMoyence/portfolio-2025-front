import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import type { SebastianBadgeStatus } from "../../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../../core/ports/sebastian.port";
import { SebastianBadgeCardComponent } from "../components/sebastian-badge-card.component";

/**
 * Page Badges Sebastian.
 * Affiche la grille de tous les badges avec leur statut (debloque/verrouille).
 */
@Component({
  selector: "app-sebastian-badges",
  standalone: true,
  imports: [SebastianBadgeCardComponent],
  template: `
    <div
      data-testid="badges-grid"
      class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      @for (badge of badges(); track badge.key) {
        <app-sebastian-badge-card [badge]="badge" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianBadgesComponent {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);

  /** Liste des badges avec leur statut. */
  readonly badges = signal<SebastianBadgeStatus[]>([]);

  constructor() {
    this.port.getBadges().subscribe((badges) => this.badges.set(badges));
  }
}
