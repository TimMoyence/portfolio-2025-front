import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
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

  function setup(platformId: 'browser' | 'server' = 'browser'): void {
    TestBed.configureTestingModule({
      imports: [AsiliMethodComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliMethodComponent);
    fixture.componentRef.setInput('steps', STEPS);
  }

  // Isolation : la classe `anim-ready` vit sur <html> (singleton partagé entre
  // tous les specs Karma). On la retire avant ET après chaque test pour
  // immuniser l'assertion SSR « pas d'anim-ready » contre une fuite d'état
  // laissée par un spec précédent (ex. home/presentation/offer) qui aurait
  // rendu un `appReveal` en plateforme browser sans nettoyer, quel que soit
  // l'ordre d'exécution randomisé.
  beforeEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  it('se cree', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

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

  it("affiche le kicker, le titre <h2> et l'intro quand fournis en inputs", () => {
    setup();
    fixture.componentRef.setInput('kicker', 'La methode');
    fixture.componentRef.setInput('heading', 'Un fil conducteur');
    fixture.componentRef.setInput('intro', 'Le digital est un levier.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kicker')?.textContent).toContain('La methode');
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2?.textContent).toContain('Un fil conducteur');
    expect(fixture.nativeElement.querySelector('.method-head__intro')?.textContent).toContain(
      'Le digital est un levier.',
    );
  });

  it("n'affiche ni kicker ni titre ni intro quand non fournis", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kicker')).toBeNull();
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(fixture.nativeElement.querySelector('.method-head__intro')).toBeNull();
  });

  it("rend la ligne pointillee masquee aux lecteurs d'ecran", () => {
    setup();
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.method-line');
    expect(line).not.toBeNull();
    expect(line.getAttribute('aria-hidden')).toBe('true');
  });

  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    setup('server');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.step').length).toBe(STEPS.length);
    expect(document.documentElement.classList).not.toContain('anim-ready');
  });

  it("calcule un delai d'echelonnement cyclique 1..3", () => {
    setup();
    const c = fixture.componentInstance as unknown as {
      revealDelay(i: number): number | null;
    };
    expect(c.revealDelay(0)).toBeNull();
    expect(c.revealDelay(1)).toBe(1);
    expect(c.revealDelay(2)).toBe(2);
    expect(c.revealDelay(3)).toBe(3);
    expect(c.revealDelay(4)).toBeNull();
  });
});
