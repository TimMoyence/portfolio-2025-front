import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { HeroAction } from "../../shared/components/hero-section/hero-section.component";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

/**
 * Page de presentation de l'app meteo pour les utilisateurs non authentifies.
 * Affiche un hero et un CTA vers la connexion.
 */
@Component({
  selector: "app-weather-presentation",
  standalone: true,
  imports: [RouterModule, HeroSectionComponent],
  template: `
    <app-hero-section
      [label]="hero.label"
      [title]="hero.title"
      [description]="hero.description"
      [actions]="hero.actions"
    ></app-hero-section>

    <section class="bg-scheme-background px-[5%] pb-12 md:pb-18 lg:pb-22">
      <div class="container max-w-3xl text-center">
        <h2
          class="font-heading heading-h4 text-h4 md:heading-h3 md:text-h3 mb-4"
          i18n="
            weather.presentation.section.title|@@weatherPresentationSectionTitle"
        >
          Consultez la météo en temps réel
        </h2>
        <p
          class="text-scheme-text-muted mb-8"
          i18n="
            weather.presentation.section.desc|@@weatherPresentationSectionDesc"
        >
          Accédez à des prévisions détaillées, des données en direct et une
          interface élégante inspirée d'Apple Weather. Connectez-vous pour
          débloquer l'application.
        </p>
        <a
          routerLink="/login"
          class="inline-flex items-center justify-center rounded-button bg-scheme-accent px-6 py-3 font-semibold text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
          i18n="weather.presentation.cta|@@weatherPresentationCta"
        >
          Se connecter
        </a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherPresentationComponent {
  readonly hero = {
    label: $localize`:weather.hero.label|@@weatherHeroLabel:Side-project`,
    title: $localize`:weather.hero.title|@@weatherHeroTitle:Météo`,
    description: $localize`:weather.hero.description|@@weatherHeroDescription:Une application météo minimaliste avec des données en temps réel, conçue comme un exercice de style Angular.`,
    actions: [
      {
        label: $localize`:weather.hero.action.login|@@weatherHeroActionLogin:Se connecter`,
        variant: "primary" as HeroAction["variant"],
        href: "/login",
      },
    ],
  };
}
