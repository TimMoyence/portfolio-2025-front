import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class A11yDialogService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  private lastFocusedElement: HTMLElement | null = null;

  saveFocus(): void {
    if (!this.isBrowser) return;
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement) {
      this.lastFocusedElement = activeElement;
    }
  }

  restoreFocus(): void {
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  focusFirstDescendant(container?: HTMLElement | null): void {
    if (!container) return;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, ' +
      '[tabindex]:not([tabindex="-1"])';

    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
  }

  trapFocus(event: KeyboardEvent, container?: HTMLElement | null): void {
    if (!container) return;
    if (event.key !== 'Tab') return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, ' +
      '[tabindex]:not([tabindex="-1"])';

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    if (!focusableElements.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (!this.isBrowser) return;
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (current === first || !focusableElements.includes(current!)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (current === last || !focusableElements.includes(current!)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
