import { ChangeDetectionStrategy, Component, input } from "@angular/core";

type SummaryLine = {
  label: string;
  value: string;
};

@Component({
  selector: "app-budget-summary-card",
  standalone: true,
  template: `
    <article
      class="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)] backdrop-blur"
    >
      <p
        class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
      >
        {{ eyebrow() }}
      </p>
      <h3 class="mt-3 text-lg font-semibold text-slate-900">{{ title() }}</h3>
      @if (lines().length) {
        <div class="mt-5 grid gap-3">
          @for (line of lines(); track line.label) {
            <div class="rounded-2xl bg-[#f7f2e8] px-4 py-3">
              <p
                class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
              >
                {{ line.label }}
              </p>
              <p class="mt-1 text-2xl font-black text-slate-950 md:text-3xl">
                {{ line.value }}
              </p>
            </div>
          }
        </div>
      } @else {
        <p class="mt-5 text-3xl font-black text-slate-950 md:text-4xl">
          {{ value() }}
        </p>
      }
      @if (caption()) {
        <p class="mt-3 text-sm leading-6 text-slate-500">{{ caption() }}</p>
      }
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetSummaryCardComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly value = input<string>("");
  readonly lines = input<SummaryLine[]>([]);
  readonly caption = input<string>("");
}
