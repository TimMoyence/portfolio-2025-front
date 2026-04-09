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
    <div class="max-w-5xl mx-auto px-4 py-16">
      <div class="text-center mb-16">
        <span
          class="inline-block text-xs font-medium uppercase tracking-wider text-scheme-accent mb-4"
          i18n="@@formationsListLabel"
        >
          Ressources
        </span>
        <h1
          class="font-heading text-h2 text-scheme-text mb-4"
          i18n="@@formationsListTitle"
        >
          Formations gratuites
        </h1>
        <p
          class="text-medium text-scheme-text-muted max-w-2xl mx-auto"
          i18n="@@formationsListSubtitle"
        >
          Des présentations concrètes et pratiques pour tirer le meilleur de
          l'IA dans votre activité.
        </p>
      </div>

      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        @for (formation of formations; track formation.slug) {
          <a
            [routerLink]="['/formations', formation.slug]"
            class="group rounded-card border border-scheme-border bg-scheme-surface p-6 shadow-xs transition-all hover:shadow-md hover:border-scheme-accent/40"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="rounded-full bg-scheme-accent/10 p-2.5">
                <app-svg-icon
                  [name]="formation.icon"
                  [size]="1.3"
                ></app-svg-icon>
              </div>
              <span
                class="rounded-full bg-scheme-accent/10 px-3 py-0.5 text-xs font-medium text-scheme-accent"
              >
                {{ formation.badge }}
              </span>
            </div>
            <h2
              class="font-heading text-h5 text-scheme-text mb-2 group-hover:text-scheme-accent transition-colors"
            >
              {{ formation.title }}
            </h2>
            <p class="text-small text-scheme-text-muted mb-4">
              {{ formation.description }}
            </p>
            <div class="flex items-center gap-4 text-xs text-scheme-text-muted">
              <span>{{ formation.duration }}</span>
              <span>{{ formation.slidesCount }} slides</span>
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
