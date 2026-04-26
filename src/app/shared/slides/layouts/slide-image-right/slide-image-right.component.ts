import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { RichListItem } from "../slide-image-left/slide-image-left.component";

/**
 * Slide contenu gauche / image droite. Symetrique de `slide-image-left` —
 * partage le type `RichListItem` et accepte les memes inputs structures.
 */
@Component({
  selector: "app-slide-image-right",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-image-right.component.html",
  styleUrl: "./slide-image-right.component.scss",
})
export class SlideImageRightComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly title = input<string>("");
  readonly subtitle = input<string>("");
  readonly paragraphs = input<string[]>([]);
  readonly items = input<string[]>([]);
  readonly richItems = input<RichListItem[]>([]);
  readonly accent = input<string>("default");

  protected initial(label: string): string {
    return label.trim().charAt(0).toUpperCase();
  }
}
