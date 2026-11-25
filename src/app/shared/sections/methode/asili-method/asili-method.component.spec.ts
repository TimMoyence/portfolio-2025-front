import type { ComponentFixture } from '@angular/core/testing';
import {
  decrireRenduServeur,
  decrireSectionAsili,
} from '../../../../../testing/page/section-asili';
import { AsiliMethodComponent, type AsiliMethodStep } from './asili-method.component';

const STEPS: readonly AsiliMethodStep[] = [
  {
    num: '01',
    index: '— Clarifier',
    title: 'Comprendre',
    desc: 'Cartographier le besoin.',
  },
  {
    num: '02',
    index: '— Construire',
    title: 'Deployer',
    desc: 'Des outils robustes.',
  },
  {
    num: '03',
    index: '— Tester',
    title: 'Eprouver',
    desc: "On confronte a l'usage.",
  },
  {
    num: '04',
    index: '— Evoluer',
    title: 'Faire durer',
    desc: "L'outil grandit avec vous.",
  },
];

describe('AsiliMethodComponent', () => {
  let fixture: ComponentFixture<AsiliMethodComponent>;
  const monter = decrireSectionAsili(AsiliMethodComponent, { steps: STEPS });

  function setup(): void {
    fixture = monter();
  }

  it('rend une etape par element de `steps`', () => {
    setup();
    fixture.detectChanges();
    const steps = fixture.nativeElement.querySelectorAll('.step');
    expect(steps.length).toBe(STEPS.length);
  });

  it("rend chaque titre d'etape dans un <h3>", () => {
    setup();
    fixture.detectChanges();
    const titles = Array.from(fixture.nativeElement.querySelectorAll('.step h3')).map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );
    expect(titles).toEqual(STEPS.map((s) => s.title));
  });

  it("rend le numero et l'intitule (.ix) de chaque etape", () => {
    setup();
    fixture.detectChanges();
    const nums = Array.from(fixture.nativeElement.querySelectorAll('.step .num')).map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );
    const ixs = Array.from(fixture.nativeElement.querySelectorAll('.step .ix')).map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );
    expect(nums).toEqual(STEPS.map((s) => s.num));
    expect(ixs).toEqual(STEPS.map((s) => s.index));
  });

  it("n'affiche pas .ix quand `index` est absent", () => {
    setup();
    fixture.componentRef.setInput('steps', [
      { num: '01', title: 'Comprendre', desc: 'Cartographier le besoin.' },
    ] satisfies AsiliMethodStep[]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.step .ix').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.step h3')?.textContent).toContain('Comprendre');
  });

  it('affiche le kicker fourni en input, et aucun sans lui', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kicker')).toBeNull();
    fixture.componentRef.setInput('kicker', 'La methode');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kicker')?.textContent).toContain('La methode');
  });

  it('CON-05 · ne rend plus de ligne pointillée : la constellation relie les étapes', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.method-line')).toBeNull();
  });

  decrireRenduServeur(monter, (hote) => {
    expect(hote.querySelectorAll('.step').length).toBe(STEPS.length);
  });
});
