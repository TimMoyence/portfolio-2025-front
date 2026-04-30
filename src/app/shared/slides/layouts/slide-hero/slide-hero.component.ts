import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Slide hero plein ecran : image de fond, titre, sous-titre optionnel et
 * liste ordonnee de bullets optionnelle.
 *
 * - `subtitle` : texte simple sur une ligne.
 * - `bullets` : si fourni, rend une `<ol>` avec un item par ligne. Permet
 *   d'afficher une enumeration "1. ... 2. ... 3. ..." en colonne au lieu
 *   d'une seule ligne plate.
 *
 * Les deux peuvent etre combines : subtitle au-dessus, bullets en dessous.
 */
@Component({
  selector: "app-slide-hero",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-hero.component.html",
  styleUrl: "./slide-hero.component.scss",
})
export class SlideHeroComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>("");
  readonly bullets = input<string[]>([]);
  readonly bgImage = input.required<string>();
  readonly bgImageAlt = input.required<string>();
  readonly accent = input<string>("default");
}
