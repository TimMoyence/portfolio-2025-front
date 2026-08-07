import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  signal,
} from '@angular/core';
import { WeatherLevelService } from '../../services/weather-level.service';

@Component({
  selector: 'app-learning-tooltip',
  standalone: true,
  template: `
    <span class="relative inline-block">
      <button
        type="button"
        class="flex h-5 w-5 items-center justify-center rounded-full border border-teal/30 bg-white/5 text-xs text-white/70 backdrop-blur-sm transition-colors hover:border-teal/50 hover:text-white"
        [attr.aria-label]="title()"
        [attr.aria-expanded]="visible()"
        (click)="toggle($event)"
      >
        ?
      </button>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningTooltipComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  readonly title = input.required<string>();

  readonly content = input.required<string>();

  readonly visible = signal(false);

  private readonly levelService = inject(WeatherLevelService);
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private portalEl: HTMLElement | null = null;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    if (!this.levelService.isTooltipSeen(this.id())) {
      this.visible.set(true);
      requestAnimationFrame(() => this.showPortal());
      setTimeout(() => {
        this.hidePortal();
        this.levelService.markTooltipSeen(this.id());
      }, 3000);
    }
  }

  ngOnDestroy(): void {
    this.destroyPortal();
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.visible.update((v) => !v);

    if (this.visible()) {
      requestAnimationFrame(() => this.showPortal());
    } else {
      this.hidePortal();
    }

    if (!this.levelService.isTooltipSeen(this.id())) {
      this.levelService.markTooltipSeen(this.id());
    }
  }

  private showPortal(): void {
    if (!this.isBrowser) return;

    if (!this.portalEl) {
      this.portalEl = this.renderer.createElement('div');
      this.renderer.setAttribute(this.portalEl, 'role', 'tooltip');
      this.renderer.setStyle(this.portalEl, 'position', 'fixed');
      this.renderer.setStyle(this.portalEl, 'z-index', '9999');
      this.renderer.setStyle(this.portalEl, 'width', '16rem');
      this.renderer.setStyle(this.portalEl, 'max-width', 'min(16rem, calc(100vw - 2rem))');
      this.renderer.addClass(this.portalEl, 'rounded-[20px]');
      this.renderer.addClass(this.portalEl, 'border');
      this.renderer.addClass(this.portalEl, 'border-teal/20');
      this.renderer.addClass(this.portalEl, 'bg-white/[0.07]');
      this.renderer.addClass(this.portalEl, 'p-4');
      this.renderer.addClass(this.portalEl, 'shadow-xl');
      this.renderer.addClass(this.portalEl, 'backdrop-blur-xl');
      this.doc.body.appendChild(this.portalEl!);
    }

    this.portalEl!.innerHTML = `
      <p class="mb-1 text-sm font-semibold text-white">${this.escapeHtml(this.title())}</p>
      <p class="text-xs leading-relaxed text-white/80">${this.escapeHtml(this.content())}</p>
    `;
    this.renderer.setStyle(this.portalEl, 'display', 'block');
    this.positionPortal();
  }

  private hidePortal(): void {
    this.visible.set(false);
    if (this.portalEl) {
      this.renderer.setStyle(this.portalEl, 'display', 'none');
    }
  }

  private destroyPortal(): void {
    if (this.portalEl) {
      this.portalEl.remove();
      this.portalEl = null;
    }
  }

  private positionPortal(): void {
    if (!this.portalEl) return;

    const button = this.elementRef.nativeElement.querySelector('button');
    if (!button) return;

    const btnRect = button.getBoundingClientRect();
    const panelWidth = this.portalEl.offsetWidth;
    const panelHeight = this.portalEl.offsetHeight;
    const viewportWidth = window.innerWidth;
    const margin = 8;

    let left = btnRect.left + btnRect.width / 2 - panelWidth / 2;
    let top = btnRect.top - panelHeight - 8;

    if (left < margin) left = margin;
    if (left + panelWidth > viewportWidth - margin) {
      left = viewportWidth - margin - panelWidth;
    }
    if (top < margin) {
      top = btnRect.bottom + 8;
    }

    this.renderer.setStyle(this.portalEl, 'left', `${left}px`);
    this.renderer.setStyle(this.portalEl, 'top', `${top}px`);
  }

  private escapeHtml(text: string): string {
    const div = this.doc.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      !this.elementRef.nativeElement.contains(event.target) &&
      !this.portalEl?.contains(event.target as Node)
    ) {
      this.hidePortal();
    }
  }
}
