import { PLATFORM_ID, type Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { isolateAnimReady } from './anim-ready';
import { setupTestBed, type SetupTestBedOptions } from './setup-test-bed';

export function montagePage<T>(
  composant: Type<T>,
  options: SetupTestBedOptions = {},
): () => ComponentFixture<T> {
  let fixture: ComponentFixture<T>;

  isolateAnimReady();

  beforeEach(async () => {
    await setupTestBed({ router: true, ...options, imports: [composant] }).compileComponents();
    fixture = TestBed.createComponent(composant);
    fixture.detectChanges();
  });

  return () => fixture;
}

export function rendreLHoteNavigateur<T>(hote: Type<T>): HTMLElement {
  const fixture = TestBed.configureTestingModule({
    imports: [hote],
    providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
  }).createComponent(hote);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

export function monterAvecRouteur<T>(
  composant: Type<T>,
  entrees: Readonly<Record<string, unknown>> = {},
): ComponentFixture<T> {
  const fixture = TestBed.configureTestingModule({
    imports: [composant],
    providers: [provideRouter([])],
  }).createComponent(composant);
  for (const [nom, valeur] of Object.entries(entrees)) {
    fixture.componentRef.setInput(nom, valeur);
  }
  fixture.detectChanges();
  return fixture;
}
