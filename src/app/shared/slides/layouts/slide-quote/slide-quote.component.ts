import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-slide-quote",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-quote.component.html",
  styleUrl: "./slide-quote.component.scss",
})
export class SlideQuoteComponent {
  readonly quote = input.required<string>();
  readonly author = input<string>("");
  readonly role = input<string>("");
}
