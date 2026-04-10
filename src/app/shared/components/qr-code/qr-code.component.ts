import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  viewChild,
} from "@angular/core";

/**
 * Composant QR code stylise avec dots arrondis et couleur personnalisable.
 * SSR-safe : le rendu ne se fait que cote client via afterNextRender.
 */
@Component({
  selector: "app-qr-code",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div data-qr-container #qrContainer></div>`,
})
export class QrCodeComponent {
  readonly data = input.required<string>();
  readonly size = input<number>(200);
  readonly color = input<string>("#4fb3a2");
  readonly logo = input<string | undefined>(undefined);

  private readonly container = viewChild<ElementRef>("qrContainer");

  constructor() {
    afterNextRender(() => this.renderQrCode());
  }

  private async renderQrCode(): Promise<void> {
    const { default: QRCodeStyling } = await import("qr-code-styling");

    const qrCode = new QRCodeStyling({
      width: this.size(),
      height: this.size(),
      data: this.data(),
      dotsOptions: {
        color: this.color(),
        type: "rounded",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: this.color(),
      },
      cornersDotOptions: {
        color: this.color(),
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      imageOptions: this.logo()
        ? { crossOrigin: "anonymous", margin: 6, hideBackgroundDots: true }
        : { hideBackgroundDots: false },
      image: this.logo() || undefined,
    });

    const containerEl = this.container()?.nativeElement;
    if (containerEl) {
      qrCode.append(containerEl);
    }
  }
}
