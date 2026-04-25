import { ChangeDetectionStrategy, Component, input } from "@angular/core";

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
  readonly accent = input<string>("default");
}
