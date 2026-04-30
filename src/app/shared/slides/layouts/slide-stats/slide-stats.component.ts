import { ChangeDetectionStrategy, Component, input } from "@angular/core";

export interface SlideStat {
  value: string;
  label: string;
  source?: string;
}

@Component({
  selector: "app-slide-stats",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-stats.component.html",
  styleUrl: "./slide-stats.component.scss",
})
export class SlideStatsComponent {
  readonly title = input<string>("");
  readonly stats = input.required<SlideStat[]>();
}
