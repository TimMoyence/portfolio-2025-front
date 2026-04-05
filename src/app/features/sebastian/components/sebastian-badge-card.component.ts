import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { SebastianBadgeStatus } from "../../../core/models/sebastian.model";

/**
 * Carte affichant un badge Sebastian.
 * Affiche le badge en couleur s'il est debloque, en grise sinon.
 */
@Component({
  selector: "app-sebastian-badge-card",
  standalone: true,
  template: `
    <div
      data-testid="badge-card"
      class="rounded-card border bg-scheme-surface p-4 shadow-xs transition-all"
      [class.border-scheme-accent]="badge().unlocked"
      [class.border-scheme-border]="!badge().unlocked"
      [class.opacity-50]="!badge().unlocked"
    >
      <!-- Icone placeholder -->
      <div class="mb-3 flex items-center gap-3">
        <div
          data-testid="badge-icon"
          class="flex h-[50px] w-[50px] items-center justify-center rounded-full text-medium font-bold"
          [class.bg-scheme-accent]="badge().unlocked"
          [class.text-scheme-on-accent]="badge().unlocked"
          [class.bg-scheme-border]="!badge().unlocked"
          [class.text-scheme-text-muted]="!badge().unlocked"
        >
          {{ initials() }}
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="font-heading text-small font-semibold text-scheme-text">
            {{ badge().name }}
          </h4>
          <p class="text-xs text-scheme-text-muted">
            {{ badge().description }}
          </p>
        </div>
      </div>

      <!-- Date de deblocage ou categorie -->
      @if (badge().unlocked && badge().unlockedAt) {
        <p data-testid="badge-date" class="text-xs text-scheme-accent">
          {{ formattedDate() }}
        </p>
      } @else if (!badge().unlocked) {
        <p class="text-xs text-scheme-text-muted">
          {{ badge().category }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianBadgeCardComponent {
  /** Statut du badge a afficher. */
  readonly badge = input.required<SebastianBadgeStatus>();

  /** Initiales du nom du badge pour le placeholder d'icone. */
  readonly initials = computed(() => {
    const words = this.badge().name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return this.badge().name.slice(0, 2).toUpperCase();
  });

  /** Date de deblocage formatee en dd/MM/yyyy. */
  readonly formattedDate = computed(() => {
    const raw = this.badge().unlockedAt;
    if (!raw) return "";
    const d = new Date(raw);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });
}
