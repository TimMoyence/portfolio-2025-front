import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

export type BudgetCategoryTotal = {
  name: string;
  plan: string;
  fact: string;
  left: string;
  isLeftNegative: boolean;
  budgetType: "FIXED" | "VARIABLE";
};

@Component({
  selector: "app-budget-category-totals",
  standalone: true,
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
          >
            Categories
          </p>
          <h2 class="mt-3 text-2xl font-black text-slate-950">
            Total per category
          </h2>
        </div>
        <p class="max-w-md text-sm leading-6 text-slate-500">
          Categories are split into fixed and variable spending so the month is
          easier to scan.
        </p>
      </div>

      <div class="mt-6 grid gap-6">
        <div class="overflow-hidden rounded-[1.5rem] border border-[#ddd5c7]">
          <div class="border-b border-[#ebe3d6] bg-[#eef6f2] px-4 py-3">
            <p
              class="text-xs font-bold uppercase tracking-[0.18em] text-[#0f7b65]"
            >
              Fixed
            </p>
          </div>
          <div
            class="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] gap-4 bg-[#f7f1e8] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            <span>Category</span>
            <span>Plan</span>
            <span>Fact</span>
            <span>Left</span>
          </div>
          <div class="grid gap-0">
            @for (item of fixedTotals(); track item.name) {
              <div
                class="grid cursor-pointer grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] items-center gap-4 border-t border-[#ebe3d6] bg-white px-4 py-3 transition hover:bg-[#f8fdfb]"
                role="button"
                tabindex="0"
                (click)="categorySelected.emit(item.name)"
                (keydown.enter)="categorySelected.emit(item.name)"
                (keydown.space)="categorySelected.emit(item.name)"
              >
                <div class="flex items-center gap-3">
                  <span class="font-medium text-slate-700">{{
                    displayName(item.name)
                  }}</span>
                  <span
                    class="rounded-full bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em] text-white"
                  >
                    {{ item.budgetType }}
                  </span>
                </div>
                <span class="text-base text-slate-500">{{ item.plan }}</span>
                <strong class="text-base text-slate-950">{{
                  item.fact
                }}</strong>
                <strong
                  class="text-base"
                  [class.text-slate-950]="!item.isLeftNegative"
                  [class.text-[#b4533d]]="item.isLeftNegative"
                >
                  {{ item.left }}
                </strong>
              </div>
            } @empty {
              <p class="px-4 py-6 text-sm text-slate-500">
                No fixed categories yet.
              </p>
            }
            @if (fixedTotals().length) {
              <div
                class="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] items-center gap-4 border-t-2 border-[#d9cfbe] bg-[#f8f4ec] px-4 py-3"
              >
                <strong
                  class="text-sm uppercase tracking-[0.12em] text-slate-600"
                  >Total fixed</strong
                >
                <strong class="text-base text-slate-950">{{
                  sectionPlanTotal(fixedTotals())
                }}</strong>
                <strong class="text-base text-slate-950">{{
                  sectionFactTotal(fixedTotals())
                }}</strong>
                <strong
                  class="text-base"
                  [class.text-slate-950]="!isSectionLeftNegative(fixedTotals())"
                  [class.text-[#b4533d]]="isSectionLeftNegative(fixedTotals())"
                >
                  {{ sectionLeftTotal(fixedTotals()) }}
                </strong>
              </div>
            }
          </div>
        </div>

        <div class="overflow-hidden rounded-[1.5rem] border border-[#ddd5c7]">
          <div class="border-b border-[#ebe3d6] bg-[#fff4da] px-4 py-3">
            <p
              class="text-xs font-bold uppercase tracking-[0.18em] text-[#9a5a10]"
            >
              Variable
            </p>
          </div>
          <div
            class="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] gap-4 bg-[#f7f1e8] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            <span>Category</span>
            <span>Plan</span>
            <span>Fact</span>
            <span>Left</span>
          </div>
          <div class="grid gap-0">
            @for (item of variableTotals(); track item.name) {
              <div
                class="grid cursor-pointer grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] items-center gap-4 border-t border-[#ebe3d6] bg-white px-4 py-3 transition hover:bg-[#fffaf0]"
                role="button"
                tabindex="0"
                (click)="categorySelected.emit(item.name)"
                (keydown.enter)="categorySelected.emit(item.name)"
                (keydown.space)="categorySelected.emit(item.name)"
              >
                <div class="flex items-center gap-3">
                  <span class="font-medium text-slate-700">{{
                    displayName(item.name)
                  }}</span>
                  <span
                    class="rounded-full bg-[#dff3ec] px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em] text-[#0f7b65]"
                  >
                    {{ item.budgetType }}
                  </span>
                </div>
                <span class="text-base text-slate-500">{{ item.plan }}</span>
                <strong class="text-base text-slate-950">{{
                  item.fact
                }}</strong>
                <strong
                  class="text-base"
                  [class.text-slate-950]="!item.isLeftNegative"
                  [class.text-[#b4533d]]="item.isLeftNegative"
                >
                  {{ item.left }}
                </strong>
              </div>
            } @empty {
              <p class="px-4 py-6 text-sm text-slate-500">
                No variable categories yet.
              </p>
            }
            @if (variableTotals().length) {
              <div
                class="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] items-center gap-4 border-t-2 border-[#d9cfbe] bg-[#f8f4ec] px-4 py-3"
              >
                <strong
                  class="text-sm uppercase tracking-[0.12em] text-slate-600"
                  >Total variable</strong
                >
                <strong class="text-base text-slate-950">{{
                  sectionPlanTotal(variableTotals())
                }}</strong>
                <strong class="text-base text-slate-950">{{
                  sectionFactTotal(variableTotals())
                }}</strong>
                <strong
                  class="text-base"
                  [class.text-slate-950]="
                    !isSectionLeftNegative(variableTotals())
                  "
                  [class.text-[#b4533d]]="
                    isSectionLeftNegative(variableTotals())
                  "
                >
                  {{ sectionLeftTotal(variableTotals()) }}
                </strong>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetCategoryTotalsComponent {
  readonly fixedTotals = input.required<BudgetCategoryTotal[]>();
  readonly variableTotals = input.required<BudgetCategoryTotal[]>();
  readonly categorySelected = output<string>();

  displayName(name: string): string {
    if (name === "Loyer") {
      return "🏠 Loyer";
    }

    if (name === "Voiture utilisation") {
      return "Voiture 🚗";
    }

    if (name === "Forfait telephone Tim & Maria") {
      return "FREE Tim & Maria";
    }

    if (name === "Netflix & Amazon & Ororo") {
      return "Subscriptions";
    }

    return name;
  }

  sectionPlanTotal(items: BudgetCategoryTotal[]): string {
    return this.formatCurrency(
      items.reduce((sum, item) => sum + this.parseCurrency(item.plan), 0),
    );
  }

  sectionFactTotal(items: BudgetCategoryTotal[]): string {
    return this.formatCurrency(
      items.reduce((sum, item) => sum + this.parseCurrency(item.fact), 0),
    );
  }

  sectionLeftTotal(items: BudgetCategoryTotal[]): string {
    return this.formatCurrency(
      items.reduce((sum, item) => sum + this.parseCurrency(item.left), 0),
    );
  }

  isSectionLeftNegative(items: BudgetCategoryTotal[]): boolean {
    return (
      items.reduce((sum, item) => sum + this.parseCurrency(item.left), 0) < 0
    );
  }

  private parseCurrency(value: string): number {
    if (value === "-") {
      return 0;
    }

    return (
      Number.parseFloat(
        value
          .replace(/[^\d,-]/g, "")
          .replace(/\./g, "")
          .replace(",", "."),
      ) || 0
    );
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
}
