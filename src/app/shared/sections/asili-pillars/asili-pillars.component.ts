import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RevealOnScrollDirective } from "../../directives/reveal-on-scroll.directive";

/**
 * Variante visuelle d'un pilier Asili.
 *
 * - `services` : fond `--ink`, texte ivoire, orbe teal en haut a droite.
 * - `formations` : fond `--sand`, bordure `--sand-deep`, orbe blanc en bas
 *   a droite.
 */
export type AsiliPillarVariant = "services" | "formations";

/**
 * Lien de pied de pilier (rendu en `.link-arrow`).
 */
export interface AsiliPillarLink {
  /** Libelle du lien (ex. `"Decouvrir l'offre"`). */
  label: string;
  /** URL cible. */
  href: string;
}

/**
 * Un pilier Asili.
 *
 * - `variant` : pilote le theme visuel (fond, orbe, couleur des coches).
 * - `tag` : sur-titre mono (ex. `"01 — Services premium"`).
 * - `title` : titre du pilier, rendu en `<h3>`.
 * - `desc` : paragraphe de presentation.
 * - `items` : points cles listes, chacun precede d'une coche `.tick`.
 * - `link` : lien de pied de carte (optionnel).
 */
export interface AsiliPillar {
  variant: AsiliPillarVariant;
  tag: string;
  title: string;
  desc: string;
  items: readonly string[];
  link?: AsiliPillarLink;
}

/**
 * Section « Piliers » Asili : deux cartes cote a cote opposant deux facons de
 * travailler (services vs formations). Portee de `.pillars` / `.pillar` de la
 * maquette `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via inputs ou
 * projection (l'i18n est delegue aux pages appelantes). Standalone, OnPush,
 * SSR-safe (la revelation au scroll passe par `appReveal`, browser-only et
 * fail-open).
 *
 * Entete : `kicker` / `heading` / `intro` peuvent etre fournis en inputs, ou
 * remplaces/enrichis par projection via les slots `[kicker]`, `[heading]` et
 * `[intro]` (pour les titres riches avec accent serif `<em>`).
 *
 * Niveaux de titre : l'entete utilise `<h2>`, chaque pilier `<h3>` — la page
 * appelante doit garantir la coherence de la hierarchie (un `<h1>` en amont).
 */
@Component({
  selector: "app-asili-pillars",
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: "./asili-pillars.component.html",
  styleUrls: ["./asili-pillars.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliPillarsComponent {
  /** Piliers a afficher (deux attendus : services puis formations). */
  readonly pillars = input.required<readonly AsiliPillar[]>();

  /** Sur-titre mono de l'entete (ex. `"Deux facons de travailler"`). */
  readonly kicker = input<string | null>(null);

  /** Titre principal de la section, rendu en `<h2>`. Optionnel. */
  readonly heading = input<string | null>(null);

  /** Paragraphe d'introduction (`.lead`) sous le titre. Optionnel. */
  readonly intro = input<string | null>(null);
}
