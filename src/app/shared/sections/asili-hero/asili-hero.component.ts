import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

/**
 * Hero Asili : section d'ouverture pleine hauteur (`100svh`) avec puce live,
 * titre serif geant a accent italique teal, accroche, slots CTA et meta
 * (statistiques serif), voile gradient et indication de scroll.
 * Portee de `.hero` / `.hero-inner` / `.hero-grid` de la maquette
 * `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via inputs ou
 * projection (l'i18n est delegue aux pages appelantes). Standalone, OnPush,
 * SSR-safe (la revelation au scroll passe par `appReveal`, browser-only et
 * fail-open ; aucun acces `window`/`document` au rendu).
 *
 * Le fond constellation est global (Lot 0, `#asili-field`) : le hero ne
 * re-cree aucun canvas, il superpose seulement un voile (`.hero-veil`) pour
 * preserver la lisibilite.
 *
 * Titre — deux strategies au choix de la page appelante :
 *  - projection `[title]` : controle total du markup (recommande pour placer
 *    l'accent `.accent` au bon mot) ;
 *  - inputs `titlePre` / `accent` / `titlePost` : le composant assemble le
 *    `<h1>` et entoure `accent` d'un `<span class="accent">` (italique teal).
 *
 * Slots de projection :
 *  - `[cta]` : boutons d'action (ex. `.btn.btn-teal` + `.btn.btn-ghost`) ;
 *  - `[meta]` : statistiques serif (ex. `.hero-meta div > .n / .l`).
 *
 * Niveaux de titre : le hero utilise `<h1>` — il doit etre l'unique `<h1>`
 * de la page hote.
 */
@Component({
  selector: 'app-asili-hero',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-hero.component.html',
  styleUrls: ['./asili-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliHeroComponent {
  /** Puce mono surmontant le titre (ex. `"Studio digital & IA · Bordeaux"`). Optionnel. */
  readonly kicker = input<string | null>(null);

  /**
   * Texte de la puce live (`.live-chip`, point pulsant teal). Optionnel.
   * Prend le pas sur l'eventuelle puce `kicker` quand fourni.
   */
  readonly liveChip = input<string | null>(null);

  /** Debut du titre, avant l'accent. Utilise quand aucun `[title]` n'est projete. */
  readonly titlePre = input<string | null>(null);

  /** Mot/segment accentue (italique teal), insere entre `titlePre` et `titlePost`. */
  readonly accent = input<string | null>(null);

  /** Fin du titre, apres l'accent. Utilise quand aucun `[title]` n'est projete. */
  readonly titlePost = input<string | null>(null);

  /** Accroche (`.lead`) sous le titre. Optionnel. */
  readonly lead = input<string | null>(null);

  /**
   * Libelle de l'indication de scroll (ex. `"Defiler"`). Masquee si vide.
   * Optionnel.
   */
  readonly scrollHint = input<string | null>(null);
}
