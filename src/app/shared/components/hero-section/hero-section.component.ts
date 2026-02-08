import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SvgIconComponent } from "../svg-icon.component";

type HeroActionVariant = "primary" | "secondary" | "ghost";

export interface HeroAction {
  label: string;
  href?: string;
  variant?: HeroActionVariant;
}

@Component({
  selector: "app-hero-section",
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  template: `
    <section class="bg-scheme-background px-[5%] pb-12 md:pb-18 lg:pb-22">
      <div class="container" data-testid="hero-section">
        <div class="w-full grid grid-cols-12 sm:px-6 md:px-10 lg:px-16">
          @if (label) {
            <p class="mb-3 col-span-full font-semibold md:mb-4">{{ label }}</p>
          }
          @if (titleLevel === "h1") {
            <h1
              class="col-span-full font-heading md:heading-h2 md:text-h2 heading-h3 text-h3 mb-5 md:mb-6"
              data-testid="hero-title"
            >
              {{ title }}
            </h1>
          } @else {
            <h2
              class="col-span-full font-heading md:heading-h2 md:text-h2 heading-h3 text-h3 mb-5 md:mb-6"
              data-testid="hero-title"
            >
              {{ title }}
            </h2>
          }
          @if (description) {
            <p
              class="col-start-4 col-end-10 text-xs md:text-base lg:text-medium"
            >
              {{ description }}
            </p>
          }
          @if (actions.length) {
            <div
              class="mt-6 col-span-full flex flex-wrap items-center gap-4 md:mt-8"
              [ngClass]="
                align === 'center' ? 'justify-center' : 'justify-start'
              "
            >
              @for (action of actions; track action.href ?? action.label) {
                <button
                  [routerLink]="action.href ?? null"
                  [attr.type]="'button'"
                  class="px-5 py-2 text-sm transition-colors"
                  [ngClass]="[
                    action.variant === 'primary'
                      ? 'inline-flex items-center justify-center bg-scheme-accent rounded-button font-semibold text-scheme-on-accent hover:bg-scheme-accent-hover active:bg-scheme-accent-active focus:outline-none focus:ring-4 focus:ring-scheme-accent-focus'
                      : '',
                    action.variant === 'secondary'
                      ? 'hidden md:inline-flex items-center justify-center rounded-button border border-scheme-border small bg-white hover:bg-scheme-accent-hover active:bg-scheme-accent-active focus:outline-none focus:ring-4 focus:ring-scheme-accent-focus'
                      : '',
                    action.variant === 'ghost' || !action.variant
                      ? 'inline-flex items-center justify-center gap-2 font-semibold underline rounded-button hover:text-scheme-accent-hover focus:outline-none focus:ring-4 focus:ring-scheme-accent-focus'
                      : '',
                  ]"
                >
                  {{ action.label }}
                </button>

                @if (action.variant === "ghost") {
                  <app-svg-icon
                    aria-hidden="true"
                    [name]="'chevron-right'"
                    [size]="1.5"
                  ></app-svg-icon>
                }
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
  @Input() label?: string;
  @Input() description?: string;
  @Input({ required: true }) title!: string;
  @Input() align: "center" | "left" = "center";
  @Input() titleLevel: "h1" | "h2" = "h1";
  @Input() actions: HeroAction[] = [];
}
