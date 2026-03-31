import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { HeroAction } from "../../shared/components/hero-section/hero-section.component";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

/**
 * Page de presentation de Sebastian pour les utilisateurs non authentifies.
 * Affiche un hero et un CTA vers la connexion.
 */
@Component({
  selector: "app-sebastian-presentation",
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
            sebastian.presentation.section.title|@@sebastianPresentationSectionTitle"
        >
          Votre majordome personnel
        </h2>
        <p
          class="text-scheme-text-muted mb-8"
          i18n="
            sebastian.presentation.section.desc|@@sebastianPresentationSectionDesc"
        >
          Suivez votre consommation personnelle (café, alcool), définissez des
          objectifs et visualisez vos progrès avec des graphiques interactifs.
          Sebastian vous aide à garder le contrôle.
        </p>
        <a
          routerLink="/login"
          class="inline-flex items-center justify-center rounded-button bg-scheme-accent px-6 py-3 font-semibold text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
          i18n="sebastian.presentation.cta|@@sebastianPresentationCta"
        >
          Se connecter
        </a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianPresentationComponent {
  readonly hero = {
    label: $localize`:sebastian.hero.label|@@sebastianHeroLabel:Side-project`,
    title: $localize`:sebastian.hero.title|@@sebastianHeroTitle:Sebastian`,
    description: $localize`:sebastian.hero.description|@@sebastianHeroDescription:Un tracker de consommation personnel avec objectifs, graphiques et suivi dans le temps. Votre majordome numérique.`,
    actions: [
      {
        label: $localize`:sebastian.hero.action.login|@@sebastianHeroActionLogin:Se connecter`,
        variant: "primary" as HeroAction["variant"],
        href: "/login",
      },
    ],
  };
}
