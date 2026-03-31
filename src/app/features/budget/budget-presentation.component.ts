import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { HeroAction } from "../../shared/components/hero-section/hero-section.component";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

/**
 * Page de presentation de l'app budget pour les utilisateurs non authentifies.
 * Affiche un hero et un CTA vers la connexion.
 */
@Component({
  selector: "app-budget-presentation",
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
            budget.presentation.section.title|@@budgetPresentationSectionTitle"
        >
          Gérez vos finances à deux
        </h2>
        <p
          class="text-scheme-text-muted mb-8"
          i18n="
            budget.presentation.section.desc|@@budgetPresentationSectionDesc"
        >
          Importez vos relevés CSV, visualisez les dépenses par catégorie et
          suivez les contributions de chaque membre du couple.
          Auto-catégorisation intelligente et tableau éditable inclus.
        </p>
        <a
          routerLink="/login"
          class="inline-flex items-center justify-center rounded-button bg-scheme-accent px-6 py-3 font-semibold text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
          i18n="budget.presentation.cta|@@budgetPresentationCta"
        >
          Se connecter
        </a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetPresentationComponent {
  readonly hero = {
    label: $localize`:budget.hero.label|@@budgetHeroLabel:Side-project`,
    title: $localize`:budget.hero.title|@@budgetHeroTitle:Budget`,
    description: $localize`:budget.hero.description|@@budgetHeroDescription:Un outil de gestion de budget partagé pour couple, avec import CSV, catégorisation automatique et suivi des contributions.`,
    actions: [
      {
        label: $localize`:budget.hero.action.login|@@budgetHeroActionLogin:Se connecter`,
        variant: "primary" as HeroAction["variant"],
        href: "/login",
      },
    ],
  };
}
