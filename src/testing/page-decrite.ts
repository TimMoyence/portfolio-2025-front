import type { Type } from '@angular/core';
import { montagePage } from './montage-page';

export interface PageDecrite<T> {
  readonly rendu: () => HTMLElement;
  readonly composant: () => T;
}

export function decrirePage<T>(composant: Type<T>): PageDecrite<T> {
  const page = montagePage(composant);
  const decrite: PageDecrite<T> = {
    rendu: () => page().nativeElement as HTMLElement,
    composant: () => page().componentInstance,
  };

  it('should create', () => {
    expect(decrite.composant()).toBeTruthy();
  });

  return decrite;
}
