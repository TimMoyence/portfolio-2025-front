import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SvgIconComponent } from "../../shared/components/svg-icon.component";
import { FORMATIONS } from "./formations-list.data";

@Component({
  selector: "app-formations-list",
  standalone: true,
  imports: [RouterModule, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero avec gradient -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-scheme-accent/5 via-scheme-background to-purple-500/5"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-scheme-accent/10 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl"
      ></div>

      <div class="relative mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <span
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-scheme-accent/20 bg-scheme-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-scheme-accent"
          i18n="@@formationsListLabel"
        >
          <app-svg-icon name="sparkles" [size]="0.85"></app-svg-icon>
          Ressources gratuites
        </span>
        <h1
          class="mx-auto mb-6 max-w-3xl font-heading text-h1 text-scheme-text"
          i18n="@@formationsListTitle"
        >
          Formations & Présentations
        </h1>
        <p
          class="mx-auto max-w-2xl text-large text-scheme-text-muted"
          i18n="@@formationsListSubtitle"
        >
          Des présentations concrètes et pratiques pour tirer le meilleur de
          l'IA dans votre activité. Consultables en ligne ou en mode
          présentation.
        </p>
      </div>
    </div>

    <!-- Grille de cartes -->
    <div class="mx-auto -mt-8 max-w-5xl px-6 pb-20">
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        @for (formation of formations; track formation.slug) {
          <a
            [routerLink]="['/formations', formation.slug]"
            class="group relative overflow-hidden rounded-2xl border border-scheme-border bg-scheme-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-scheme-accent/30"
          >
            <!-- Gradient header -->
            <div
              class="flex items-center justify-between bg-gradient-to-r from-scheme-accent/10 to-purple-500/10 px-6 py-5"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl bg-scheme-background shadow-xs text-2xl"
              >
                <app-svg-icon
                  [name]="formation.icon"
                  [size]="1.5"
                ></app-svg-icon>
              </div>
              <span
                class="rounded-full bg-scheme-accent px-3 py-1 text-xs font-bold text-scheme-on-accent"
              >
                {{ formation.badge }}
              </span>
            </div>

            <!-- Contenu -->
            <div class="p-6">
              <h2
                class="mb-3 font-heading text-h5 text-scheme-text transition-colors group-hover:text-scheme-accent"
              >
                {{ formation.title }}
              </h2>
              <p class="mb-5 text-small leading-relaxed text-scheme-text-muted">
                {{ formation.description }}
              </p>

              <!-- Meta -->
              <div
                class="flex items-center justify-between border-t border-scheme-border pt-4"
              >
                <div
                  class="flex items-center gap-3 text-xs text-scheme-text-muted"
                >
                  <span class="flex items-center gap-1">
                    <span
                      class="inline-block h-1.5 w-1.5 rounded-full bg-scheme-accent"
                    ></span>
                    {{ formation.duration }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span
                      class="inline-block h-1.5 w-1.5 rounded-full bg-purple-400"
                    ></span>
                    {{ formation.slidesCount }} slides
                  </span>
                </div>
                <span
                  class="text-xs font-medium text-scheme-accent transition-transform duration-200 group-hover:translate-x-1"
                  i18n="@@formationsListViewCta"
                >
                  Consulter &rarr;
                </span>
              </div>
            </div>
          </a>
        }
      </div>
    </div>
  `,
})
export class FormationsListComponent {
  readonly formations = FORMATIONS;
}
