import { ChangeDetectionStrategy, Component, input } from "@angular/core";

export interface SlideGridItem {
  title: string;
  description: string;
  icon?: string;
  href?: string;
}

@Component({
  selector: "app-slide-grid",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-grid.component.html",
  styleUrl: "./slide-grid.component.scss",
})
export class SlideGridComponent {
  readonly title = input<string>("");
  readonly items = input.required<SlideGridItem[]>();
}
