import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-slide-comparison",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-comparison.component.html",
  styleUrl: "./slide-comparison.component.scss",
})
export class SlideComparisonComponent {
  readonly title = input<string>("");
  readonly leftLabel = input.required<string>();
  readonly rightLabel = input.required<string>();
  readonly leftItems = input.required<string[]>();
  readonly rightItems = input.required<string[]>();
}
