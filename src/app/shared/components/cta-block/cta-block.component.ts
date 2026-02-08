import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeroAction } from "../hero-section/hero-section.component";

@Component({
  selector: "app-cta-block",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="px-[5%] py-6 md:py-8 lg:py-12">
      <div class="container" [ngClass]="backgroundImage ? 'relative' : ''">
        <div
          class="relative z-10 flex flex-col items-center p-8 md:p-12 lg:p-16"
          [ngClass]="{
            'border border-border-primary': bordered && !backgroundImage,
            'text-text-alternative': textOnDark,
          }"
        >
          <div class="max-w-lg text-center">
            <h2
              class="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl"
              data-testid="cta-title"
            >
              {{ title }}
            </h2>
            @if (description) {
              <p class="md:text-md">{{ description }}</p>
            }
          </div>
          @if (actions.length) {
            <div
              class="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8"
            >
              @for (action of actions; track $index) {
                <a
                  [routerLink]="action.href || null"
                  [attr.href]="!action.href ? '#' : null"
                  class="rounded-button px-5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  [ngClass]="{
                    'bg-black text-white border border-black':
                      !action.variant || action.variant === 'primary',
                    'bg-background-secondary text-black border border-border-primary':
                      action.variant === 'secondary',
                    'bg-white/90 text-black border border-transparent':
                      textOnDark && action.variant !== 'secondary',
                  }"
                >
                  {{ action.label }}
                </a>
              }
            </div>
          }
        </div>
        @if (backgroundImage) {
          <div class="absolute inset-0 z-0">
            <img
              [src]="backgroundImage"
              class="size-full object-cover"
              [alt]="backgroundAlt || 'CTA background'"
            />
            @if (overlay) {
              <div class="absolute inset-0 bg-black/50"></div>
            }
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaBlockComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() actions: HeroAction[] = [];
  @Input() backgroundImage?: string;
  @Input() backgroundAlt?: string;
  @Input() overlay = false;
  @Input() bordered = false;
  @Input() textOnDark = false;
}
