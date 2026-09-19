import type { ComponentFixture } from '@angular/core/testing';

const ESSAIS = 200;
const PAUSE_MS = 5;

export async function attendreQue(
  fixture: ComponentFixture<unknown>,
  condition: () => boolean,
  attente: string,
): Promise<void> {
  for (let essai = 0; essai < ESSAIS; essai += 1) {
    fixture.detectChanges();
    await fixture.whenStable();
    if (condition()) {
      return;
    }
    await new Promise((suite) => setTimeout(suite, PAUSE_MS));
  }
  throw new Error(`delai depasse en attendant ${attente}`);
}

export async function briqueMontee(
  fixture: ComponentFixture<unknown>,
  selecteur: string,
): Promise<HTMLElement> {
  const racine = fixture.nativeElement as HTMLElement;
  const trouver = (): HTMLElement | null => {
    const brique = racine.querySelector<HTMLElement>(selecteur);
    return (brique?.shadowRoot?.childElementCount ?? 0) > 0 ? brique : null;
  };
  await attendreQue(fixture, () => trouver() !== null, `la brique ${selecteur}`);
  const brique = trouver();
  if (brique === null) {
    throw new Error(`la brique ${selecteur} n a pas ete montee`);
  }
  return brique;
}
