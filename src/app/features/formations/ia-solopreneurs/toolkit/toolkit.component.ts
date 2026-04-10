import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page standalone pour la capture d'email via QR code.
 * Epuree, mobile-first, focus sur la conversion.
 */
@Component({
  selector: "app-toolkit",
  standalone: true,
  imports: [ToolkitFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-scheme-background px-4 py-12"
    >
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="font-heading text-h3 text-scheme-text">
            Recevez votre boite a outils IA
          </h1>
          <p class="mt-3 text-sm text-scheme-text-muted leading-relaxed">
            Les meilleurs outils, les prix, les budgets — dans votre inbox en 30
            secondes.
          </p>
        </div>

        <div
          class="bg-white rounded-xl border border-scheme-border p-6 shadow-sm"
        >
          <app-toolkit-form />
        </div>

        <p class="mt-6 text-center text-xs text-scheme-text-muted">
          Asili Design — asilidesign.fr
        </p>
      </div>
    </div>
  `,
})
export class ToolkitComponent {}
