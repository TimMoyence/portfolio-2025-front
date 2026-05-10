import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { BUDGET_PORT } from "../../../../core/ports/budget.port";

/**
 * Composant bouton d'export PDF du budget mensuel.
 * Declenche le telechargement d'un fichier PDF genere cote serveur.
 * SSR-safe : le telechargement n'est effectue que cote navigateur.
 */
@Component({
  selector: "app-budget-export",
  standalone: true,
  template: `
    <div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
        [disabled]="exporting()"
        (click)="exportPdf()"
      >
        @if (exporting()) {
          <span i18n="@@budgetExportInProgress">Export en cours...</span>
        } @else {
          <span i18n="@@budgetExportBtn">Exporter en PDF</span>
        }
      </button>
      @if (errorMessage()) {
        <p class="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetExportComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly budgetPort = inject(BUDGET_PORT);

  readonly groupId = input.required<string>();
  readonly month = input.required<number>();
  readonly year = input.required<number>();

  readonly exporting = signal(false);
  readonly errorMessage = signal("");

  /** Appelle le port pour recuperer le PDF et declenche le telechargement. */
  async exportPdf(): Promise<void> {
    this.errorMessage.set("");
    this.exporting.set(true);
    try {
      const blob = await firstValueFrom(
        this.budgetPort.exportPdf(this.groupId(), this.month(), this.year()),
      );

      if (this.isBrowser && blob) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `budget-${this.year()}-${String(this.month()).padStart(2, "0")}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      this.errorMessage.set("Erreur lors de l'export PDF.");
    } finally {
      this.exporting.set(false);
    }
  }
}
