import type { ComponentFixture } from '@angular/core/testing';

export function lireMarque<T>(fixture: ComponentFixture<T>, marque: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    `[data-testid='${marque}']`,
  );
}

export function cibleMarque<T>(
  fixture: ComponentFixture<T>,
  marque: string,
  lieu: string,
): HTMLElement {
  const element = lireMarque(fixture, marque);
  if (element === null) {
    throw new Error(`Aucun element « ${marque} » dans ${lieu}`);
  }
  return element;
}
