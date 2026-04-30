import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
  selector: "app-slide-video",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-video.component.html",
  styleUrl: "./slide-video.component.scss",
})
export class SlideVideoComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly src = input.required<string>();
  readonly type = input<"native" | "iframe">("native");
  readonly poster = input<string>("");
  readonly caption = input<string>("");
  readonly autoplay = input<boolean>(false);

  readonly safeIframeSrc = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.src()),
  );
}
