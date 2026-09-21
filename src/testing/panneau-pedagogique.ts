import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, tick } from '@angular/core/testing';
import { CoursPanneauPedagogiqueComponent } from '../app/features/cours/presentateur/cours-panneau-pedagogique.component';
import { buildEcranDeroule, buildGuideFormateur } from './factories/formations.factory';

export type FixtureDuPanneau = ComponentFixture<CoursPanneauPedagogiqueComponent>;

export const SEANCE_DU_PANNEAU = 'seance-1';

export const ECRAN_DU_PANNEAU = 'ecran-1';

export function monterLePanneau(sessionId: string | null = SEANCE_DU_PANNEAU): FixtureDuPanneau {
  const fixture = TestBed.createComponent(CoursPanneauPedagogiqueComponent);
  fixture.componentRef.setInput(
    'ecran',
    buildEcranDeroule({ id: ECRAN_DU_PANNEAU, guide: buildGuideFormateur() }),
  );
  fixture.componentRef.setInput('resultats', []);
  fixture.componentRef.setInput('participants', 12);
  fixture.componentRef.setInput('sessionId', sessionId);
  fixture.componentRef.setInput('nextScreenTitle', 'Le taux global');
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
  return fixture;
}

export function repereDuPanneau<T extends HTMLElement>(
  fixture: FixtureDuPanneau,
  marque: string,
): T {
  const trouve = (fixture.nativeElement as HTMLElement).querySelector<T>(
    `[data-testid="${marque}"]`,
  );
  if (trouve === null) {
    throw new Error(`Aucun élément ${marque} dans le panneau pédagogique`);
  }
  return trouve;
}

export function saisirLaNoteDuPanneau(fixture: FixtureDuPanneau, texte: string): void {
  const note = repereDuPanneau<HTMLTextAreaElement>(fixture, 'annotation-note');
  note.value = texte;
  note.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

export function noteAffichee(fixture: FixtureDuPanneau): string {
  return repereDuPanneau<HTMLTextAreaElement>(fixture, 'annotation-note').value;
}
