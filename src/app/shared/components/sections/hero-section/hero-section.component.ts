import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ContenuDuHero {
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  template: `
    <section class="px-[5%] pb-12 md:pb-18 lg:pb-22">
      <div class="container" data-testid="hero-section">
        <div class="w-full grid grid-cols-12 sm:px-6 md:px-10 lg:px-16">
          <p class="mb-3 col-span-full font-semibold md:mb-4">{{ contenu().label }}</p>
          <h1
            class="col-span-full font-heading md:heading-h2 md:text-h2 heading-h3 text-h3 mb-5 md:mb-6"
            data-testid="hero-title"
          >
            {{ contenu().title }}
          </h1>
          <p class="col-start-4 col-end-10 text-xs md:text-base lg:text-medium">
            {{ contenu().description }}
          </p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
  readonly contenu = input.required<ContenuDuHero>();
}
