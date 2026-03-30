import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import type { OnChanges, SimpleChanges } from "@angular/core";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Inject,
  Input,
  PLATFORM_ID,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import type { SafeHtml } from "@angular/platform-browser";
import { of } from "rxjs";
import { catchError, map, take, tap } from "rxjs/operators";

@Component({
  selector: "app-svg-icon",
  standalone: true,
  template: "",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SvgIconComponent implements OnChanges {
  private static cache = new Map<string, string>();

  /**
   * Vide le cache statique d'icones SVG.
   * Utile pour le nettoyage entre tests ou pour forcer le rechargement de toutes les icones.
   */
  static clearCache(): void {
    SvgIconComponent.cache.clear();
  }
  private readonly isBrowser: boolean;

  @Input({ required: true }) name!: string;
  @Input() size?: number;
  @Input() width?: number;
  @Input() height?: number;
  @Input() fill?: number | string;
  @Input("aria-label") ariaLabel?: string;

  @HostBinding("innerHTML") svgContent: SafeHtml | null = null;
  @HostBinding("attr.role") role = "img";
  @HostBinding("style.display") display = "inline-flex";
  @HostBinding("style.width") hostWidth: string | null = null;
  @HostBinding("style.height") hostHeight: string | null = null;
  @HostBinding("attr.aria-label") get hostAriaLabel(): string | null {
    return this.ariaLabel ?? null;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes["name"] ||
      changes["size"] ||
      changes["width"] ||
      changes["height"] ||
      changes["fill"]
    ) {
      this.loadIcon();
    }
  }

  private loadIcon(): void {
    this.size = Number(this.size);

    if (!this.name || !this.isBrowser) {
      this.svgContent = null;
      return;
    }

    const cached = SvgIconComponent.cache.get(this.name);
    const source$ = cached ? of(cached) : this.httpGetIcon(this.name);

    source$
      .pipe(
        take(1),
        map((raw) => this.prepareSvg(raw)),
        tap((html) => {
          this.svgContent = this.sanitizer.bypassSecurityTrustHtml(html);
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.svgContent = null;
          this.cdr.markForCheck();
          return of(null);
        }),
      )
      .subscribe();
  }

  private httpGetIcon(name: string) {
    const url = `assets/icons/${name}.svg`;
    return this.http
      .get(url, { responseType: "text" })
      .pipe(tap((raw) => SvgIconComponent.cache.set(name, raw)));
  }

  /**
   * Supprime les elements et attributs dangereux d'un SVG parse
   * (scripts, event handlers, iframes, etc.) pour prevenir les attaques XSS.
   */
  private sanitizeSvgElement(root: Element): void {
    const dangerousTags = [
      "script",
      "iframe",
      "object",
      "embed",
      "foreignobject",
      "use",
    ];
    for (const tag of dangerousTags) {
      root.querySelectorAll(tag).forEach((el) => el.remove());
    }

    const allElements = root.querySelectorAll("*");
    const eventHandlerPattern = /^on/i;
    allElements.forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        if (eventHandlerPattern.test(attr.name)) {
          el.removeAttribute(attr.name);
        }
        if (
          attr.name === "href" &&
          attr.value.trim().toLowerCase().startsWith("javascript:")
        ) {
          el.removeAttribute(attr.name);
        }
        if (
          attr.name === "xlink:href" &&
          attr.value.trim().toLowerCase().startsWith("javascript:")
        ) {
          el.removeAttribute(attr.name);
        }
      }
    });
  }

  private prepareSvg(raw: string | null): string {
    if (!raw) {
      return "";
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw.trim(), "image/svg+xml");
    const svgElement = doc.querySelector("svg");

    if (!svgElement || doc.querySelector("parsererror")) {
      return "";
    }

    this.sanitizeSvgElement(svgElement);

    if (this.fill != "keep") {
      const targetFill = (this.fill ?? "currentColor").toString();

      svgElement.setAttribute("fill", targetFill);

      const elementsWithFill = svgElement.querySelectorAll("[fill]");
      elementsWithFill.forEach((el) => {
        const value = el.getAttribute("fill");
        if (value && value !== "none") {
          el.setAttribute("fill", targetFill);
        }
      });

      const elementsWithStroke = svgElement.querySelectorAll("[stroke]");
      elementsWithStroke.forEach((el) => {
        const value = el.getAttribute("stroke");
        if (value && value !== "none") {
          el.setAttribute("stroke", targetFill);
        }
      });
    }

    if (!svgElement.getAttribute("viewBox")) {
      const width = parseFloat(svgElement.getAttribute("width") || "0");
      const height = parseFloat(svgElement.getAttribute("height") || "0");
      if (width > 0 && height > 0) {
        svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }
    }

    const computedWidth = this.dimensionToRem(this.size ?? this.width);
    const computedHeight = this.dimensionToRem(this.size ?? this.height);

    if (computedWidth) {
      svgElement.setAttribute("width", computedWidth);
    }

    if (computedHeight) {
      svgElement.setAttribute("height", computedHeight);
    }

    this.hostWidth = computedWidth;
    this.hostHeight = computedHeight;

    svgElement.removeAttribute("xmlns:a");

    return svgElement.outerHTML;
  }

  private dimensionToRem(value?: number): string | null {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return `${value}rem`;
    }
    return null;
  }
}
