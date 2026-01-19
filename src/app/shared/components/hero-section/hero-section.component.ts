import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";

type HeroActionVariant = "primary" | "secondary" | "ghost";

export interface HeroAction {
  label: string;
  href?: string;
  variant?: HeroActionVariant;
}

@Component({
  selector: "app-hero-section",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="bg-scheme-background px-[5%] py-12 md:py-18 lg:py-22">
      <div
        class="container"
        [ngClass]="
          align === 'center' ? 'max-w-lg text-center' : 'max-w-6xl text-left'
        "
        data-testid="hero-section"
      >
        @if (label) {
          <p class="mb-3 font-semibold md:mb-4">{{ label }}</p>
        }
        @if (titleLevel === "h1") {
          <h1
            class="mb-5 font-heading heading-h1 text-h1 md:mb-6"
            data-testid="hero-title"
          >
            {{ title }}
          </h1>
        } @else {
          <h2
            class="mb-5 font-heading heading-h1 text-h1 md:mb-6"
            data-testid="hero-title"
          >
            {{ title }}
          </h2>
        }
        @if (description) {
          <p class="md:text-md">{{ description }}</p>
        }
        @if (actions.length) {
          <div
            class="mt-6 flex flex-wrap items-center gap-4 md:mt-8"
            [ngClass]="align === 'center' ? 'justify-center' : 'justify-start'"
          >
            @for (action of actions; track $index) {
              <a
                [routerLink]="action.href || null"
                [attr.href]="!action.href ? '#' : null"
                class="rounded-button px-5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                [ngClass]="{
                  'bg-black text-white border border-black':
                    action.variant !== 'secondary',
                  'bg-background-secondary text-black border border-border-primary':
                    action.variant === 'secondary',
                  'bg-transparent border border-transparent text-black underline underline-offset-2':
                    action.variant === 'ghost',
                }"
              >
                {{ action.label }}
              </a>
            }
          </div>
        }
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
