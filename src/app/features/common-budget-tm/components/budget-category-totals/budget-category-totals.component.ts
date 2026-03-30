import { ChangeDetectionStrategy, Component, input } from "@angular/core";

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
            class="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f7b65]"
          >
            Categories
          </p>
          <h2 class="mt-3 text-2xl font-black text-slate-950">
            Total per category
          </h2>
        </div>
        <p class="max-w-md text-sm leading-6 text-slate-500">
          Only expense transactions are included here so the spending picture
          stays easy to read.
        </p>
      </div>

      <div
        class="mt-6 overflow-hidden rounded-[1.5rem] border border-[#ddd5c7]"
      >
        <div
          class="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] gap-4 bg-[#f7f1e8] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
        >
          <span>Category</span>
          <span>Plan</span>
          <span>Fact</span>
          <span>Left</span>
        </div>
        <div class="grid gap-0">
          @for (item of totals(); track item.name) {
            <div
              class="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] items-center gap-4 border-t border-[#ebe3d6] bg-white px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <span class="font-medium text-slate-700">{{
                  displayName(item.name)
                }}</span>
                <span
                  class="rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em]"
                  [class.bg-slate-900]="item.budgetType === 'FIXED'"
                  [class.text-white]="item.budgetType === 'FIXED'"
                  [class.bg-[#dff3ec]]="item.budgetType === 'VARIABLE'"
                  [class.text-[#0f7b65]]="item.budgetType === 'VARIABLE'"
                >
                  {{ item.budgetType }}
                </span>
              </div>
              <span class="text-base text-slate-500">{{ item.plan }}</span>
              <strong class="text-base text-slate-950">{{ item.fact }}</strong>
              <strong
                class="text-base"
                [class.text-slate-950]="!item.isLeftNegative"
                [class.text-[#b4533d]]="item.isLeftNegative"
              >
                {{ item.left }}
              </strong>
            </div>
          } @empty {
            <p
              class="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500"
            >
              No expense rows available yet.
            </p>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetCategoryTotalsComponent {
  readonly totals = input.required<BudgetCategoryTotal[]>();

  displayName(name: string): string {
    if (name === "Loyer") {
      return "🏠 Loyer";
    }

    if (name === "Voiture utilisation") {
      return "🚗 Voiture utilisation";
    }

    return name;
  }
}
