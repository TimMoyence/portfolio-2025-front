import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-slide-image-left",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-image-left.component.html",
  styleUrl: "./slide-image-left.component.scss",
})
export class SlideImageLeftComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly title = input<string>("");
  readonly accent = input<string>("default");
}
