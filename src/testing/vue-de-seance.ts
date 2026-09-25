import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { ResultatsSeance } from '../cours/content/types';
import type { EtatSession } from '../cours/runtime/core/sync';
import { SlideActivityComponent } from '../app/shared/slides/session/slide-activity.component';
import type { FluxDouble } from './factories/sync.factory';

interface VueDeSeance {
  quandStabilise(): Promise<void>;
}

export async function stabiliserLaVue(fixture: ComponentFixture<VueDeSeance>): Promise<void> {
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
}

export function diffuserSurLaVue<T>(
  double: FluxDouble,
  fixture: ComponentFixture<T>,
  etat: Partial<EtatSession>,
): void {
  double.diffuser(etat);
  fixture.detectChanges();
}

export function publierSurLaVue<T>(
  double: FluxDouble,
  fixture: ComponentFixture<T>,
  resultats: ResultatsSeance,
): void {
  double.diffuserResultats(resultats);
  fixture.detectChanges();
}

export function ecransMontes<T>(fixture: ComponentFixture<T>): readonly SlideActivityComponent[] {
  return fixture.debugElement
    .queryAll(By.directive(SlideActivityComponent))
    .map((ecran) => ecran.componentInstance as SlideActivityComponent);
}

export function idsDesEcransMontes<T>(fixture: ComponentFixture<T>): readonly string[] {
  return ecransMontes(fixture).map((ecran) => ecran.slide().id);
}

export function attendreLaFermetureDuFlux<T>(
  double: FluxDouble,
  fixture: ComponentFixture<T>,
): void {
  expect(double.flux.close).not.toHaveBeenCalled();
  fixture.destroy();
  expect(double.flux.close).toHaveBeenCalledTimes(1);
}
