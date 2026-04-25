import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-slide-cta",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-cta.component.html",
  styleUrl: "./slide-cta.component.scss",
})
export class SlideCtaComponent {
  readonly title = input.required<string>();
  readonly description = input<string>("");
  readonly ctaLabel = input.required<string>();
  readonly ctaHref = input.required<string>();
}
