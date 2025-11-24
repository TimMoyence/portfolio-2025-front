import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class A11yDialogService {
  /**
   * Remember the element that had focus before opening a dialog / mobile menu.
   */
  private lastFocusedElement: HTMLElement | null = null;

  /**
   * Save the currently focused element so we can restore focus after closing.
   */
  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement) {
      this.lastFocusedElement = activeElement;
    }
  }

  /**
   * Restore focus to the element that was focused before the dialog opened.
   */
  restoreFocus(): void {
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  /**
   * Move focus to the first focusable descendant of the container.
   * Useful when a dialog / menu opens.
   */
  focusFirstDescendant(container?: HTMLElement | null): void {
    if (!container) return;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, ' +
      '[tabindex]:not([tabindex="-1"])';

    const firstFocusable =
      container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
  }

  /**
   * Trap focus within a container: when Tab/Shift+Tab reach the end,
   * cycle focus back to the first / last focusable element.
   *
   * Call this from a keydown handler on the dialog container.
   */
  trapFocus(event: KeyboardEvent, container?: HTMLElement | null): void {
    if (!container) return;
    if (event.key !== 'Tab') return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, ' +
      '[tabindex]:not([tabindex="-1"])';

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
    );

    if (!focusableElements.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      // Shift + Tab: go backwards
      if (current === first || !focusableElements.includes(current!)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab forwards
      if (current === last || !focusableElements.includes(current!)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
