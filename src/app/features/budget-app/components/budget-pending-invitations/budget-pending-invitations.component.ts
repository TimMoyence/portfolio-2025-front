import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { PendingInvitation } from "../../../../core/ports/budget.port";

/**
 * Affiche la liste des invitations magic-link en attente d'acceptation pour un
 * groupe de budget. Vue purement read-only (la revocation viendra dans un
 * itera suivante).
 */
@Component({
  selector: "app-budget-pending-invitations",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./budget-pending-invitations.component.html",
  styleUrls: ["./budget-pending-invitations.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetPendingInvitationsComponent {
  readonly invitations = input.required<PendingInvitation[]>();

  /**
   * Enrichit chaque invitation avec le nombre de jours restants avant
   * expiration. Calcul cote front pour eviter un round-trip serveur dedie.
   */
  readonly enriched = computed(() => {
    const now = Date.now();
    return this.invitations().map((inv) => ({
      ...inv,
      daysLeft: Math.max(
        0,
        Math.ceil((new Date(inv.expiresAt).getTime() - now) / 86_400_000),
      ),
    }));
  });
}
