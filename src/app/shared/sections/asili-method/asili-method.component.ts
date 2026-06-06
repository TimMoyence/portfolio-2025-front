import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RevealOnScrollDirective } from "../../directives/reveal-on-scroll.directive";

/**
 * Une etape de la methode Asili.
 *
 * - `num` : numero affiche dans le rond mono teal (ex. `"01"`).
 * - `index` : court intitule d'etape rendu en mono teal au-dessus du titre
 *   (ex. `"— Clarifier"`). Optionnel.
 * - `title` : titre de l'etape, rendu en `<h3>`.
 * - `desc` : description courte de l'etape.
 */
export interface AsiliMethodStep {
  num: string;
  index?: string;
  title: string;
  desc: string;
}

/**
 * Section « Methode » Asili : une grille d'etapes reliees par une ligne
 * pointillee. Portee de `.method` / `.method-steps` / `.step` de la maquette
 * `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via inputs ou
 * projection (l'i18n est delegue aux pages appelantes). Standalone, OnPush,
 * SSR-safe (la revelation au scroll passe par `appReveal`, browser-only et
 * fail-open).
 *
 * Entete : `heading` / `kicker` / `intro` peuvent etre fournis en inputs, ou
 * remplaces/enrichis par projection via les slots `[kicker]`, `[heading]` et
 * `[intro]` (pour les titres riches avec accent serif `<em>`).
 *
 * Niveaux de titre : l'entete utilise `<h2>`, chaque etape `<h3>` — la page
 * appelante doit garantir la coherence de la hierarchie (un `<h1>` en amont).
 */
@Component({
  selector: "app-asili-method",
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: "./asili-method.component.html",
  styleUrls: ["./asili-method.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliMethodComponent {
  /** Etapes de la methode (au moins une attendue). */
  readonly steps = input.required<readonly AsiliMethodStep[]>();

  /** Sur-titre mono de l'entete (ex. `"La methode"`). Optionnel. */
  readonly kicker = input<string | null>(null);

  /** Titre principal de la section, rendu en `<h2>`. Optionnel. */
  readonly heading = input<string | null>(null);

  /** Paragraphe d'introduction (`.lead`) a droite de l'entete. Optionnel. */
  readonly intro = input<string | null>(null);

  /** Delai d'echelonnement de la revelation au scroll d'une etape (1..4). */
  protected revealDelay(index: number): 1 | 2 | 3 | 4 | null {
    const delay = index % 4;
    return delay === 0 ? null : (delay as 1 | 2 | 3);
  }
}
