import { TestBed } from '@angular/core/testing';
import type { EcranContent, RenderMode, Role } from '../../../../cours/content/types';
import { attendreQue } from '../../../../testing/briques-montees';
import { buildInstantaneDeSubstitution } from '../../../../testing/factories/instantane-b2-01.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { aUnePresentation } from '../visual/presentation-v2';
import { ECRAN_VERROUILLE, planDeMontage } from './lecture-ecran';
import { SlideActivityComponent } from './slide-activity.component';

const INSTANTANE = buildInstantaneDeSubstitution();
const RENDUS: readonly { render: RenderMode; role: Role }[] = [
  { render: 'hand', role: 'etudiant' },
  { render: 'board', role: 'presentateur' },
  { render: 'stage', role: 'presentateur' },
];

function nombreDeBriques(ecran: EcranContent): number {
  return aUnePresentation(ecran) || ecran.type === ECRAN_VERROUILLE
    ? 0
    : (planDeMontage(ecran)?.length ?? 0);
}

describe('AC-24 : chaque écran de l instantané se monte en main, au tableau et en projection', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('couvre chaque type d écran servi par le contrat § 9.4', () => {
    expect(new Set(INSTANTANE.map((ecran) => ecran.type)).size).toBe(18);
  });

  for (const ecran of INSTANTANE) {
    for (const { render, role } of RENDUS) {
      it(`${ecran.id} (${ecran.type}) en ${render}`, async () => {
        const erreurs: Event[] = [];
        const fixture = TestBed.createComponent(SlideActivityComponent);
        const element = fixture.nativeElement as HTMLElement;
        element.addEventListener('fp-block-error', (evenement) => erreurs.push(evenement));
        fixture.componentRef.setInput('slide', ecran);
        fixture.componentRef.setInput('render', render);
        fixture.componentRef.setInput('role', role);
        const attendues = nombreDeBriques(ecran);
        const montees = (): Element[] =>
          [...element.querySelectorAll('[data-testid="slide-activity-host"] > *')].filter(
            (brique) => (brique.shadowRoot?.childElementCount ?? 0) > 0,
          );

        await attendreQue(
          fixture,
          () => montees().length === attendues,
          `${ecran.id} en ${render}`,
        );

        expect(erreurs).toEqual([]);
        expect(element.querySelector('[data-testid="slide-activity-error"]')).toBeNull();
        expect(element.querySelector('[data-testid="slide-activity-unknown"]')).toBeNull();
        expect(montees().every((brique) => brique.getAttribute('render') === render)).toBeTrue();
        fixture.destroy();
      });
    }
  }
});
