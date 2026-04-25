import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";

/**
 * Adapter SSR-safe pour l'API Fullscreen + chargement lazy de Swiper Element.
 * En environnement serveur, toutes les méthodes sont des no-ops.
 */
@Injectable({ providedIn: "root" })
export class FullscreenAdapter {
  private readonly platformId = inject(PLATFORM_ID);
  private swiperLoaded = false;

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async enter(element: HTMLElement): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }
    if (typeof element.requestFullscreen !== "function") {
      return;
    }
    try {
      await element.requestFullscreen();
    } catch {
      /* user cancellation ou navigateur non supporté */
    }
  }

  async exit(): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }
    if (!document.fullscreenElement) {
      return;
    }
    try {
      await document.exitFullscreen();
    } catch {
      /* déjà sorti */
    }
  }

  isFullscreen(): boolean {
    if (!this.isBrowser()) {
      return false;
    }
    return document.fullscreenElement !== null;
  }

  /**
   * Charge dynamiquement Swiper Element. Idempotent.
   * Côté serveur : no-op.
   */
  async loadSwiperElement(): Promise<void> {
    if (!this.isBrowser() || this.swiperLoaded) {
      return;
    }
    const mod = await import("swiper/element/bundle");
    if (typeof mod.register === "function") {
      mod.register();
    }
    this.swiperLoaded = true;
  }
}
