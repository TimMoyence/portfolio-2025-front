import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

export type BudgetTransactionView = {
  id: string;
  dateLabel: string;
  description: string;
  type: string;
  state: string;
  amountLabel: string;
  isExpense: boolean;
  category: string;
};

@Component({
  selector: "app-budget-transactions-table",
  standalone: true,
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f7b65]">
            Transactions
          </p>
          <h2 class="mt-3 text-2xl font-black text-slate-950">
            Review and correct categories
          </h2>
        </div>
        <p class="max-w-md text-sm leading-6 text-slate-500">
          Every transaction can be reassigned manually. Totals update
          immediately.
        </p>
      </div>

      <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-[#ddd5c7]">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-[#f7f1e8] text-left text-sm text-slate-500">
              <tr>
                <th class="px-4 py-3 font-semibold">Date</th>
                <th class="px-4 py-3 font-semibold">Description</th>
                <th class="px-4 py-3 font-semibold">Type</th>
                <th class="px-4 py-3 font-semibold">State</th>
                <th class="px-4 py-3 font-semibold">Amount</th>
                <th class="px-4 py-3 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#ebe3d6] bg-white text-sm text-slate-700">
              @for (transaction of transactions(); track transaction.id) {
                <tr class="align-top">
                  <td class="px-4 py-4 whitespace-nowrap">{{ transaction.dateLabel }}</td>
                  <td class="px-4 py-4 min-w-[18rem]">{{ transaction.description }}</td>
                  <td class="px-4 py-4 whitespace-nowrap">{{ transaction.type }}</td>
                  <td class="px-4 py-4 whitespace-nowrap">{{ transaction.state }}</td>
                  <td
                    class="px-4 py-4 whitespace-nowrap font-bold"
                    [class.text-[#b4533d]]="transaction.isExpense"
                    [class.text-[#0f7b65]]="!transaction.isExpense"
                  >
                    {{ transaction.amountLabel }}
                  </td>
                  <td class="px-4 py-4">
                    <label class="sr-only" [for]="'category-' + transaction.id">
                      Change category
                    </label>
                    <select
                      class="min-w-[14rem] rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-sm text-slate-900"
                      [id]="'category-' + transaction.id"
                      (change)="categoryChanged.emit({ id: transaction.id, category: readValue($event) })"
                    >
                      @for (category of categories(); track category) {
                        <option [value]="category" [selected]="category === transaction.category">
                          {{ category }}
                        </option>
                      }
                    </select>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-10 text-center text-slate-500">
                    No transactions match the current filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetTransactionsTableComponent {
  readonly transactions = input.required<BudgetTransactionView[]>();
  readonly categories = input.required<string[]>();
  readonly categoryChanged = output<{ id: string; category: string }>();

  readValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
