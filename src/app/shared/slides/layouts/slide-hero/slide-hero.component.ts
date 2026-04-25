import { ChangeDetectionStrategy, Component, input } from "@angular/core";

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
  readonly bgImage = input.required<string>();
  readonly bgImageAlt = input.required<string>();
  readonly accent = input<string>("default");
}
