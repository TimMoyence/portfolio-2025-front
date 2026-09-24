import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { EcranContent, Role } from '../cours/content/types';
import { SlideActivityComponent } from '../app/shared/slides/session/slide-activity.component';
import { aUnePresentation } from '../app/shared/slides/visual/presentation-v2';
import { ECRAN_VERROUILLE, planDeMontage } from '../app/shared/slides/session/lecture-ecran';

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

export const ROLES_DE_MONTAGE: readonly Role[] = ['etudiant', 'presentateur'];

function nombreDeBriques(ecran: EcranContent): number {
  return aUnePresentation(ecran) || ecran.type === ECRAN_VERROUILLE
    ? 0
    : (planDeMontage(ecran)?.length ?? 0);
}

export interface EcranMonte {
  readonly erreurs: readonly Event[];
  readonly element: HTMLElement;
  readonly montees: () => Element[];
  readonly detruire: () => void;
}

export async function monterEcran(ecran: EcranContent, role: Role): Promise<EcranMonte> {
  const erreurs: Event[] = [];
  const fixture = TestBed.createComponent(SlideActivityComponent);
  const element = fixture.nativeElement as HTMLElement;
  element.addEventListener('fp-block-error', (evenement) => erreurs.push(evenement));
  fixture.componentRef.setInput('slide', ecran);
  fixture.componentRef.setInput('role', role);
  const montees = (): Element[] =>
    [...element.querySelectorAll('[data-testid="slide-activity-host"] > *')].filter(
      (brique) => (brique.shadowRoot?.childElementCount ?? 0) > 0,
    );
  await attendreQue(
    fixture,
    () => montees().length === nombreDeBriques(ecran),
    `${ecran.id} pour ${role}`,
  );
  return { erreurs, element, montees, detruire: () => fixture.destroy() };
}
