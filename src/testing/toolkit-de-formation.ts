import type { Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LEAD_MAGNET_PORT } from '../app/core/ports/lead-magnet.port';
import { ToolkitFormComponent } from '../app/shared/components/toolkit-form/toolkit-form.component';
import { createLeadMagnetPortStub } from './factories/lead-magnet.factory';
import { montagePage } from './montage-page';

export interface ToolkitAttendu {
  readonly titre: readonly string[];
  readonly slug: string;
}

export function decrireToolkitDeFormation<T>(
  composant: Type<T>,
  attendu: ToolkitAttendu,
): () => HTMLElement {
  const page = montagePage(composant, {
    providers: [{ provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() }],
  });
  const rendu = (): HTMLElement => page().nativeElement as HTMLElement;

  it('devrait etre cree', () => {
    expect(page().componentInstance).toBeTruthy();
  });

  it('devrait rendre le titre principal (H1)', () => {
    const titre = rendu().querySelector('h1')?.textContent?.toLowerCase() ?? '';
    for (const fragment of attendu.titre) {
      expect(titre).toContain(fragment.toLowerCase());
    }
  });

  it('devrait rendre le toolkit-form (capture lead-magnet) avec le slug de la formation', () => {
    const fixture: ComponentFixture<T> = page();
    const formulaire = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(formulaire).not.toBeNull();
    expect((formulaire.componentInstance as ToolkitFormComponent).formationSlug).toBe(attendu.slug);
  });

  it("devrait afficher la section 'Ce que contient le toolkit'", () => {
    expect(rendu().textContent?.toLowerCase()).toContain('ce que contient');
  });

  it('devrait afficher le nom de la marque', () => {
    expect(rendu().textContent).toContain('Asili Design');
  });

  return rendu;
}
