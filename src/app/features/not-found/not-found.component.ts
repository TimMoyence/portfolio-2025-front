import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="px-[5%] py-24">
      <div class="container max-w-2xl text-center space-y-6">
        <p class="text-sm font-semibold" i18n="@@notFoundLabel">Erreur 404</p>
        <h1
          class="font-heading md:heading-h2 md:text-h2 heading-h1 text-h1 mb-5 md:mb-6"
          i18n="@@notFoundTitle"
          data-testid="not-found-title"
        >
          Page introuvable
        </h1>
        <p i18n="@@notFoundDescription">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div class="flex justify-center gap-4">
          <a
            routerLink="/"
            class="inline-flex items-center justify-center rounded-button
                bg-scheme-accent px-5 py-2
                font-semibold text-scheme-on-accent
                transition-colors
                hover:bg-scheme-accent-hover
                active:bg-scheme-accent-active
                focus:outline-none
                focus:ring-4 focus:ring-scheme-accent-focus"
            i18n="@@notFoundCta"
          >
            Retour à l'accueil
          </a>
        </div>
        <img
          src="/assets/images/404.gif"
          class="size-full rounded-image object-cover"
          i18n-alt="notFound.imageAlt|Image d'erreur 404@@notFoundImageAlt"
          loading="lazy"
        />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
