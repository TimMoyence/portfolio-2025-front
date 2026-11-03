import { PLATFORM_ID, type Provider, type Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

export type PlateformeDeRendu = 'browser' | 'server';

export function monterSurPlateforme<T>(
  composant: Type<T>,
  plateforme: PlateformeDeRendu,
  providers: readonly Provider[] = [],
): ComponentFixture<T> {
  return TestBed.configureTestingModule({
    imports: [composant],
    providers: [{ provide: PLATFORM_ID, useValue: plateforme }, provideRouter([]), ...providers],
  }).createComponent(composant);
}

export function injecterSurPlateforme<T>(service: Type<T>, plateforme: PlateformeDeRendu): T {
  return TestBed.configureTestingModule({
    providers: [service, { provide: PLATFORM_ID, useValue: plateforme }],
  }).inject(service);
}
