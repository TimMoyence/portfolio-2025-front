import { PLATFORM_ID, type Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

export type PlateformeDeRendu = 'browser' | 'server';

export function monterSurPlateforme<T>(
  composant: Type<T>,
  plateforme: PlateformeDeRendu,
): ComponentFixture<T> {
  return TestBed.configureTestingModule({
    imports: [composant],
    providers: [{ provide: PLATFORM_ID, useValue: plateforme }],
  }).createComponent(composant);
}

export function injecterSurPlateforme<T>(service: Type<T>, plateforme: PlateformeDeRendu): T {
  return TestBed.configureTestingModule({
    providers: [service, { provide: PLATFORM_ID, useValue: plateforme }],
  }).inject(service);
}
