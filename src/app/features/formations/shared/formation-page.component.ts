import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  LOCALE_ID,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { PresentationEngineComponent } from "../../../shared/components/presentation-engine/presentation-engine.component";
import { InteractionCollectorService } from "../../../shared/services/interaction-collector.service";
import { findFormationBySlug } from "./formations.registry";
import {
  normalizeLocale,
  selectLocalizedString,
} from "./formation-locale.util";
import type { FormationConfig } from "./formation.types";

/**
 * Composant generique servant toutes les formations sur la route
 * `formations/:slug`. Resout la `FormationConfig` correspondante via la
 * registry et delegue le rendu des slides a `PresentationEngineComponent`.
 *
 * Expose via `route.paramMap` (signal-first pour respecter la strategie
 * OnPush) le slug courant. Un slug inconnu deleve un message explicite —
 * la detection 404 SEO se fait cote SSR via `isKnownRoute` dans
 * `seo-injector`.
 */
@Component({
  selector: "app-formation-page",
  standalone: true,
  imports: [PresentationEngineComponent, RouterLink],
  providers: [InteractionCollectorService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (formation(); as config) {
      <h1 class="sr-only">{{ localizedTitle() }}</h1>
      <app-presentation-engine [slides]="config.slides" />
    } @else {
      <section
        class="mx-auto max-w-3xl px-6 py-20 text-center"
        aria-labelledby="formation-unknown-heading"
      >
        <h1
          id="formation-unknown-heading"
          class="mb-4 font-heading text-h2 text-scheme-text"
          i18n="@@formations.unknown.title"
        >
          Formation introuvable
        </h1>
        <p
          class="mb-6 text-base text-scheme-text-muted"
          i18n="@@formations.unknown.description"
        >
          Cette formation n'existe pas ou a ete archivee. Vous pouvez parcourir
          les formations disponibles depuis la page principale.
        </p>
        <a
          routerLink="/formations"
          class="inline-flex items-center rounded-full bg-scheme-accent px-6 py-3 font-semibold text-scheme-on-accent"
          i18n="@@formations.unknown.cta"
        >
          Voir les formations
        </a>
      </section>
    }
  `,
})
export class FormationPageComponent {
  private readonly route = inject(ActivatedRoute);
  /**
   * `LOCALE_ID` est fourni par Angular aussi bien en rendu navigateur
   * qu'en SSR (via `APP_BASE_HREF` + build i18n). Utiliser ce token evite
   * tout acces direct a `globalThis.location` ou `window`, interdit par
   * la SSR-safety du projet (cf. CLAUDE.md).
   */
  private readonly locale = normalizeLocale(inject(LOCALE_ID));

  /**
   * Resolution du slug : priorite a `data.formationSlug` (routes statiques
   * generees via `buildFormationRoutes`), fallback sur `paramMap.slug`
   * pour une eventuelle route parametree future. Combine les deux sources
   * pour garantir la reactivite SSR sans violation des guards OnPush.
   */
  protected readonly slug = toSignal(
    combineLatest([this.route.data, this.route.paramMap]).pipe(
      map(([data, params]) => {
        const fromData = data["formationSlug"];
        if (typeof fromData === "string" && fromData.length > 0) {
          return fromData;
        }
        return params.get("slug") ?? "";
      }),
    ),
    { initialValue: "" },
  );

  protected readonly formation = computed<FormationConfig | undefined>(() =>
    findFormationBySlug(this.slug()),
  );

  protected readonly localizedTitle = computed(() => {
    const config = this.formation();
    if (!config) return "";
    return selectLocalizedString(config.metadata.title, this.locale);
  });
}
