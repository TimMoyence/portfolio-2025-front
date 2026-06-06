import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RevealOnScrollDirective } from "../../directives/reveal-on-scroll.directive";

/**
 * Bande d'appel a l'action Asili : bloc fond encre (`--ink`) avec halo radial
 * teal en bas, titre serif geant centre, paragraphe d'accroche et CTA projetes.
 * Portee de `.cta` / `.cta-inner` de la maquette
 * `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via inputs ou
 * projection (l'i18n est delegue aux pages appelantes). Standalone, OnPush,
 * SSR-safe (la revelation au scroll passe par `appReveal`, browser-only et
 * fail-open).
 *
 * Le contenu est centre. Les boutons d'action sont fournis par la page via le
 * slot de projection `[cta]` (ex. `.btn.btn-teal` + `.btn.btn-ghost`), ce qui
 * laisse l'appelant choisir libelles, liens et variantes.
 *
 * Niveaux de titre : la bande utilise `<h2>` — la page appelante doit garantir
 * la coherence de la hierarchie (un `<h1>` en amont).
 */
@Component({
  selector: "app-asili-cta-band",
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: "./asili-cta-band.component.html",
  styleUrls: ["./asili-cta-band.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliCtaBandComponent {
  /** Titre principal de la bande, rendu en `<h2>`. */
  readonly title = input.required<string>();

  /** Sur-titre mono teal au-dessus du titre (ex. `"Parlons-en"`). Optionnel. */
  readonly kicker = input<string | null>(null);

  /** Paragraphe d'accroche (`.cta-lead`) sous le titre. Optionnel. */
  readonly lead = input<string | null>(null);
}
