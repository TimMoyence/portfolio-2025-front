import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import type { BudgetMember } from "../../../../core/models/budget.model";

/**
 * Panneau de gestion des membres d'un groupe budget.
 * Affiche la liste des membres avec options d'invitation et de retrait selon le role owner.
 */
@Component({
  selector: "app-budget-members-panel",
  standalone: true,
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div class="flex items-center justify-between">
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
            i18n="@@budgetMembersPanelEyebrow"
          >
            Membres
          </p>
          <h2
            class="mt-3 text-2xl font-black text-slate-950"
            i18n="@@budgetMembersPanelTitle"
          >
            Groupe partagé
          </h2>
        </div>
        @if (isCurrentUserOwner()) {
          <button
            class="rounded-xl bg-budget-accent px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
            (click)="onInviteClick()"
            i18n="@@budgetMembersPanelInviteBtn"
          >
            Inviter
          </button>
        }
      </div>

      <ul class="mt-6 divide-y divide-slate-100">
        @for (member of members(); track member.userId) {
          <li class="flex items-center gap-3 py-3">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-900 truncate">
                {{ member.displayName }}
              </p>
              <p class="text-sm text-slate-500 truncate">{{ member.email }}</p>
            </div>
            @if (member.isOwner) {
              <span
                class="rounded-full bg-budget-accent/10 px-2.5 py-0.5 text-xs font-semibold text-budget-accent"
                i18n="@@budgetMembersPanelOwnerBadge"
              >
                Owner
              </span>
            }
            @if (canRemove(member)) {
              <button
                class="rounded-lg px-3 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                (click)="onRemoveClick(member.userId)"
                i18n="@@budgetMembersPanelRemoveBtn"
              >
                Retirer
              </button>
            }
          </li>
        } @empty {
          <li
            class="py-6 text-sm text-slate-500"
            i18n="@@budgetMembersPanelEmpty"
          >
            Aucun membre dans ce groupe.
          </li>
        }
      </ul>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetMembersPanelComponent {
  /** Liste des membres du groupe budget. */
  readonly members = input.required<BudgetMember[]>();

  /** Identifiant de l'utilisateur courant. */
  readonly currentUserId = input.required<string>();

  /** Emis avec le userId du membre a retirer. */
  readonly removeMember = output<string>();

  /** Emis avec l'email a inviter. */
  readonly inviteMember = output<string>();

  /** Indique si l'utilisateur courant est owner du groupe. */
  readonly isCurrentUserOwner = computed<boolean>(() => {
    const current = this.members().find(
      (m) => m.userId === this.currentUserId(),
    );
    return current?.isOwner ?? false;
  });

  /** Verifie si le bouton Retirer doit etre affiche pour un membre donne. */
  canRemove(member: BudgetMember): boolean {
    return (
      this.isCurrentUserOwner() &&
      member.userId !== this.currentUserId() &&
      !member.isOwner
    );
  }

  /** Ouvre une boite de dialogue native pour inviter un membre par email. */
  onInviteClick(): void {
    const email = window.prompt("Email du membre a inviter :");
    if (email && email.trim()) {
      this.inviteMember.emit(email.trim());
    }
  }

  /** Ouvre une boite de confirmation native avant de retirer un membre. */
  onRemoveClick(userId: string): void {
    const confirmed = window.confirm(
      "Confirmer le retrait de ce membre du groupe ?",
    );
    if (confirmed) {
      this.removeMember.emit(userId);
    }
  }
}
