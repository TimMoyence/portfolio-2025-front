import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-svg-icon',
  standalone: true,
  template: '',
})
export class SvgIconComponent implements OnChanges {
  private static cache = new Map<string, string>();

  @Input({ required: true }) name!: string;
  @Input() size?: number;
  @Input() width?: number;
  @Input() height?: number;
  @Input() fill?: number | string;
  @Input('aria-label') ariaLabel?: string;

  @HostBinding('innerHTML') svgContent: SafeHtml | null = null;
  @HostBinding('attr.role') role = 'img';
  @HostBinding('style.display') display = 'inline-flex';
  @HostBinding('style.width') hostWidth: string | null = null;
  @HostBinding('style.height') hostHeight: string | null = null;
  @HostBinding('attr.aria-hidden') get ariaHidden(): string | null {
    return this.ariaLabel ? null : 'true';
  }

  @HostBinding('attr.aria-label') get ariaLabelBinding(): string | null {
    return this.ariaLabel ?? null;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['name'] ||
      changes['size'] ||
      changes['width'] ||
      changes['height'] ||
      changes['fill']
    ) {
      this.loadIcon();
    }
  }

  private loadIcon(): void {
    if (!this.name) {
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
        }),
        catchError(() => {
          this.svgContent = null;
          return of(null);
        }),
      )
      .subscribe();
  }

  private httpGetIcon(name: string) {
    const url = `assets/icons/${name}.svg`;
    return this.http
      .get(url, { responseType: 'text' })
      .pipe(tap((raw) => SvgIconComponent.cache.set(name, raw)));
  }

  private prepareSvg(raw: string | null): string {
    if (!raw) {
      return '';
    }

    const container = this.document.createElement('div');
    container.innerHTML = raw.trim();
    const svgElement = container.querySelector('svg');

    if (!svgElement) {
      return '';
    }

    const targetFill = this.fill ?? 'currentColor';
    svgElement.setAttribute('fill', targetFill.toString());

    if (!svgElement.getAttribute('viewBox')) {
      const width = parseFloat(svgElement.getAttribute('width') || '0');
      const height = parseFloat(svgElement.getAttribute('height') || '0');
      if (width > 0 && height > 0) {
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    }

    const computedWidth = this.dimensionToRem(this.size ?? this.width);
    const computedHeight = this.dimensionToRem(this.size ?? this.height);

    if (computedWidth) {
      svgElement.setAttribute('width', computedWidth);
    }

    if (computedHeight) {
      svgElement.setAttribute('height', computedHeight);
    }

    this.hostWidth = computedWidth;
    this.hostHeight = computedHeight;

    svgElement.removeAttribute('xmlns:a');

    return svgElement.outerHTML;
  }

  private dimensionToRem(value?: number): string | null {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return `${value}rem`;
    }
    return null;
  }
}
