import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RevealOnScrollDirective } from "../../directives/reveal-on-scroll.directive";

/**
 * Une etape de la methode de travail avec l'IA.
 *
 * - `num` : numero d'ordre mono teal (ex. `"01"`). Affiche tel quel, non
 *   calcule, pour conserver le formatage de la maquette (`01`, `02`...).
 * - `title` : intitule court de l'etape (ex. `"Un agent par tache"`).
 * - `desc` : phrase de description de l'etape.
 */
export interface AsiliAiMethodStep {
  num: string;
  title: string;
  desc: string;
}

/**
 * Section « Ma maniere de travailler avec l'IA » Asili : bloc immersif sombre
 * (theme night) opposant une colonne narrative (kicker / titre serif / lead) a
 * une liste d'etapes en cartes translucides, puis cloture par une regle d'or
 * (citation serif geante centree + signature). Portee de `.ai-method` de la
 * maquette `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via inputs ou projection
 * (l'i18n est delegue aux pages appelantes). Standalone, OnPush, SSR-safe (la
 * revelation au scroll passe par `appReveal`, browser-only et fail-open ; aucun
 * acces a `window`/`document` au rendu). Le fond constellation global du Lot 0
 * n'est pas re-cree ici : le bloc applique seulement son halo radial local.
 *
 * Entete : `kicker`, `heading` et `lead` peuvent etre fournis en inputs, ou
 * remplaces/enrichis par projection via les slots `[kicker]`, `[heading]` et
 * `[lead]` (pour un titre riche avec accent serif `<em>` teal, comme la
 * maquette : « Elle ne la <em>remplace pas</em>. »).
 *
 * Regle d'or : `rule` est du contenu de confiance (statique, fourni par la page)
 * pouvant contenir un accent teal italique via `<em>` et des sauts `<br>` ; il
 * est injecte via `[innerHTML]` (assaini par Angular). `ruleWho` est la
 * signature mono sous la citation.
 *
 * Niveaux de titre : l'entete utilise `<h2>` ; la page appelante doit garantir
 * la coherence de la hierarchie (un `<h1>` en amont). La regle d'or est une
 * `<blockquote>` purement textuelle, sans titre.
 */
@Component({
  selector: "app-asili-ai-method",
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: "./asili-ai-method.component.html",
  styleUrls: ["./asili-ai-method.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliAiMethodComponent {
  /** Etapes de la methode, affichees dans l'ordre en cartes translucides. */
  readonly steps = input.required<readonly AsiliAiMethodStep[]>();

  /** Sur-titre mono de l'entete (ex. `"Ma maniere de travailler avec l'IA"`). */
  readonly kicker = input<string | null>(null);

  /** Titre principal de la section, rendu en `<h2>`. Optionnel. */
  readonly heading = input<string | null>(null);

  /** Paragraphe d'introduction (`.lead`) sous le titre. Optionnel. */
  readonly lead = input<string | null>(null);

  /**
   * Citation « regle d'or » : contenu de confiance (statique) pouvant contenir
   * `<em>` (accent teal italique) et `<br>`. Injecte via `[innerHTML]`.
   * Optionnel : si absent, la regle d'or n'est pas rendue.
   */
  readonly rule = input<string | null>(null);

  /** Signature sous la citation (ex. `"La regle d'or"`). Optionnel. */
  readonly ruleWho = input<string | null>(null);
}
