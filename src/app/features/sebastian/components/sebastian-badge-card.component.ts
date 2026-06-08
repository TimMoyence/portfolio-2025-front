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
    <!--
      Carte badge App Sebastian — thème "dark lounge ambré" Asili (cohérence avec
      les autres panneaux, le badge n'existe pas dans la maquette ; cf. .bcard de
      asili-app.css). Glass gold : bordure ambrée + accent gold-soft si débloqué,
      opacité réduite + grayscale si verrouillé. Restyle 100 % visuel : iconPath
      (assets/icons/badges/{key}.png), formattedDate, unlocked/unlockedAt et tous
      les data-testid (badge-card/badge-icon/badge-date) conservés.
    -->
    <div
      data-testid="badge-card"
      class="rounded-[18px] border bg-white/[0.04] p-4 transition-transform duration-300 hover:-translate-y-1"
      [class.border-gold]="badge().unlocked"
      [class.border-[rgba(230,170,70,0.14)]]="!badge().unlocked"
      [class.opacity-50]="!badge().unlocked"
    >
      <!-- Icone badge PNG -->
      <div class="mb-3 flex items-center gap-3">
        <img
          data-testid="badge-icon"
          [src]="iconPath()"
          [alt]="badge().name"
          class="h-[50px] w-[50px] object-contain"
          [class.grayscale]="!badge().unlocked"
          [class.opacity-40]="!badge().unlocked"
        />
        <div class="min-w-0 flex-1">
          <h4 class="font-display text-small font-semibold text-white">
            {{ badge().name }}
          </h4>
          <p class="text-xs text-white/50">
            {{ badge().description }}
          </p>
        </div>
      </div>

      <!-- Date de deblocage ou categorie -->
      @if (badge().unlocked && badge().unlockedAt) {
        <p
          data-testid="badge-date"
          class="inline-block rounded-full bg-[rgba(230,170,70,0.18)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#f4d18a]"
        >
          {{ formattedDate() }}
        </p>
      } @else if (!badge().unlocked) {
        <p
          class="inline-block rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white/50"
        >
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

  /** Chemin vers l'icone PNG du badge. */
  readonly iconPath = computed(
    () => `assets/icons/badges/${this.badge().key}.png`,
  );

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
