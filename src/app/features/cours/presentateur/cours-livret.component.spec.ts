import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import type { LivretDuCours } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildGuideFormateur,
  buildLivretDuCours,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { CoursLivretComponent } from './cours-livret.component';

type Fixture = ComponentFixture<CoursLivretComponent>;

const SLUG = 'b2-02-series-statistiques';

const LIVRET_B2_02: LivretDuCours = {
  version: 1,
  sujet: INSTANTANE_B2_02.sujet,
  corrige: INSTANTANE_B2_02.deroule,
};

async function monter(livret: Observable<LivretDuCours>): Promise<{
  fixture: Fixture;
  port: ReturnType<typeof createFormationsPortStub>;
}> {
  const port = createFormationsPortStub();
  port.lireLivret.and.returnValue(livret);
  setupTestBed({
    imports: [CoursLivretComponent],
    providers: [{ provide: FORMATIONS_PORT, useValue: port }],
  });
  const fixture = TestBed.createComponent(CoursLivretComponent);
  fixture.componentRef.setInput('slug', SLUG);
  fixture.detectChanges();
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
  return { fixture, port };
}

function tous(fixture: Fixture, testId: string): HTMLElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      `[data-testid="${testId}"]`,
    ),
  );
}

function un(fixture: Fixture, testId: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    `[data-testid="${testId}"]`,
  );
}

function basculerSurLeCorrige(fixture: Fixture): void {
  un(fixture, 'livret-vue-corrige')?.click();
  fixture.detectChanges();
}

describe('CoursLivretComponent', () => {
  it('lit le livret du cours demandé et en affiche le titre et la version', async () => {
    const { fixture, port } = await monter(of(LIVRET_B2_02));

    expect(port.lireLivret).toHaveBeenCalledOnceWith(SLUG);
    expect(un(fixture, 'livret-titre')?.textContent).toContain(INSTANTANE_B2_02.sujet.titre);
    expect(un(fixture, 'livret-version')?.textContent).toContain('1');
  });

  it('met en page pour l’étudiant les 25 écrans du B2-02 à traiter sur papier, sans correction ni jalon de séance', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    const ids = tous(fixture, 'livret-ecran').map((page) => page.dataset['ecran']);

    expect(ids.length).toBe(25);
    expect(ids).not.toContain('B2-02-A1-07-CORRECTION');
    expect(ids).not.toContain('B2-02-A1-09-JALON');
    expect(ids).toContain('B2-02-A2-01-NUAGE-RIVAGE');
    expect(tous(fixture, 'livret-corrige')).toEqual([]);
  });

  it('bascule sur le corrigé des 35 écrans du B2-02, corrections comprises', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    basculerSurLeCorrige(fixture);

    const ids = tous(fixture, 'livret-corrige').map((page) => page.dataset['ecran']);
    expect(ids.length).toBe(35);
    expect(ids).toContain('B2-02-A1-07-CORRECTION');
    expect(tous(fixture, 'livret-ecran')).toEqual([]);
  });

  it('accompagne chaque écran du corrigé de ses notes, de ses bonnes réponses et du guide formateur', async () => {
    const livret = buildLivretDuCours({
      corrige: buildDerouleCours({
        ecrans: [buildEcranDeroule({ id: 'ecran-guide', guide: buildGuideFormateur() })],
      }),
    });
    const { fixture } = await monter(of(livret));

    basculerSurLeCorrige(fixture);

    expect(un(fixture, 'livret-notes')?.textContent).toContain(
      'Rappeler la formule de capitalisation',
    );
    expect(un(fixture, 'livret-reponses')?.textContent).toContain('1480.24');
    expect(un(fixture, 'livret-guide')?.textContent).toContain('Des milliers d’euros');
  });

  it('imprime la vue affichée', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));
    const imprimer = spyOn(window, 'print');

    un(fixture, 'livret-imprimer')?.click();

    expect(imprimer).toHaveBeenCalledTimes(1);
  });

  it('signale un livret illisible au lieu d’une page vide', async () => {
    const { fixture } = await monter(throwError(() => new Error('403')));

    expect(un(fixture, 'livret-echec')?.getAttribute('role')).toBe('alert');
    expect(tous(fixture, 'livret-ecran')).toEqual([]);
  });
});
