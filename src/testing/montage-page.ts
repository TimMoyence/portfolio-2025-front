import { PLATFORM_ID, type Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { isolateAnimReady } from './anim-ready';
import { setupTestBed, type SetupTestBedOptions } from './setup-test-bed';

export interface OptionsDeMontage<T> extends SetupTestBedOptions {
  avantRendu?: (fixture: ComponentFixture<T>) => void;
}

export interface PageMontee<T> {
  readonly fixture: ComponentFixture<T>;
  readonly composant: T;
  readonly racine: HTMLElement;
}

export function montagePage<T>(
  composant: Type<T>,
  options: OptionsDeMontage<T> = {},
): () => ComponentFixture<T> {
  const { avantRendu, ...banc } = options;
  let fixture: ComponentFixture<T>;

  isolateAnimReady();

  beforeEach(async () => {
    await setupTestBed({ router: true, ...banc, imports: [composant] }).compileComponents();
    fixture = TestBed.createComponent(composant);
    avantRendu?.(fixture);
    fixture.detectChanges();
  });

  return () => fixture;
}

export function pageMontee<T>(
  composant: Type<T>,
  options: OptionsDeMontage<T> = {},
): PageMontee<T> {
  const fixture = montagePage(composant, options);
  return {
    get fixture() {
      return fixture();
    },
    get composant() {
      return fixture().componentInstance;
    },
    get racine() {
      return fixture().nativeElement as HTMLElement;
    },
  };
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
  return poserLesEntrees(fixture, entrees);
}

export function poserLesEntrees<T>(
  fixture: ComponentFixture<T>,
  entrees: Readonly<Record<string, unknown>>,
): ComponentFixture<T> {
  for (const [nom, valeur] of Object.entries(entrees)) {
    fixture.componentRef.setInput(nom, valeur);
  }
  fixture.detectChanges();
  return fixture;
}
