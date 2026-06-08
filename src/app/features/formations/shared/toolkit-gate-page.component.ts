import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { RevealOnScrollDirective } from "../../../shared/directives/reveal-on-scroll.directive";
import { ToolkitFormComponent } from "../../../shared/components/toolkit-form/toolkit-form.component";
import type { ToolkitGatePageData } from "./toolkit-gate-page.model";

/**
 * Composant de page gate toolkit partage (capture email) — refonte Asili.
 *
 * Mutualise le scaffold strictement identique des trois pages de capture
 * (`ia-solopreneurs`, `automatiser-avec-ia`, `audit-seo-diy`) : carte centree,
 * icone, titre projete, items inclus, formulaire de capture lead-magnet et
 * contenu editorial (« ce que contient », FAQ). Seuls le texte, le
 * `formationSlug` et les IDs i18n different : les pages shell fournissent leurs
 * chaines deja localisees (`$localize`) via `data`, et le titre (a accent
 * `<em>` propre a chaque maquette) via la projection `[title]`.
 *
 * Composant de presentation : il embarque `<app-toolkit-form>` sans toucher a
 * la logique de capture (port `LEAD_MAGNET_PORT`, `requestToolkit`). Le
 * `formationSlug` est transmis verbatim quand fourni ; sinon le formulaire
 * applique son slug par defaut (`ia-solopreneurs`). Standalone, OnPush,
 * SSR-safe (revelation au scroll via `appReveal`, fail-open).
 *
 * Niveaux de titre : le composant emet l'unique `<h1>` de la page hote.
 */
@Component({
  selector: "app-toolkit-gate-page",
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, ToolkitFormComponent],
  templateUrl: "./toolkit-gate-page.component.html",
  styleUrl: "./toolkit-gate-page.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitGatePageComponent {
  /** Contenu textuel localise de la page (accroche, items, FAQ, marque…). */
  readonly data = input.required<ToolkitGatePageData>();

  /**
   * Slug de la formation transmis a `<app-toolkit-form>` (cle metier
   * d'attribution back-end). Optionnel : si absent, le formulaire applique son
   * slug par defaut (`ia-solopreneurs`).
   */
  readonly formationSlug = input<string | null>(null);

  /**
   * Cle stable servant a deriver des `id`/`aria-labelledby` uniques pour les
   * en-tetes editoriaux (evite toute collision d'`id` entre instances). Par
   * defaut, le `formationSlug` ; `ia-solo` en repli.
   */
  readonly headingKey = computed(() => this.formationSlug() ?? "ia-solo");

  /** `id` de l'en-tete « ce que contient le toolkit ». */
  protected get contentsHeadingId(): string {
    return `toolkit-${this.headingKey()}-contents-heading`;
  }

  /** `id` de l'en-tete FAQ. */
  protected get faqHeadingId(): string {
    return `toolkit-${this.headingKey()}-faq-heading`;
  }
}
