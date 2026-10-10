import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, signal, type Signal } from '@angular/core';
import { FullscreenAdapter } from './fullscreen.adapter';

export interface PleinEcranDeLaPage {
  readonly actif: Signal<boolean>;
  basculer(): Promise<void>;
}

export function pleinEcranDeLaPage(): PleinEcranDeLaPage {
  const adapter = inject(FullscreenAdapter);
  const document = inject(DOCUMENT);
  const actif = signal(false);
  if (adapter.isBrowser()) {
    const suivre = (): void => actif.set(adapter.isFullscreen());
    document.addEventListener('fullscreenchange', suivre);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('fullscreenchange', suivre));
  }
  return {
    actif: actif.asReadonly(),
    basculer: async () => actif.set(await adapter.basculer(document.documentElement)),
  };
}
