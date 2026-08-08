import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { SebastianHealthScore } from '../../../core/models/sebastian.model';
import { buildSebastianHealthScore } from '../../../../testing/factories/sebastian.factory';
import { SebastianScoreCardComponent } from './sebastian-score-card.component';

@Component({
  standalone: true,
  imports: [SebastianScoreCardComponent],
  template: `<app-sebastian-score-card [score]="score()" />`,
})
class TestHostComponent {
  readonly score = signal<SebastianHealthScore>(buildSebastianHealthScore());
}

describe('SebastianScoreCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait se creer', () => {
    const card = fixture.nativeElement.querySelector('app-sebastian-score-card');
    expect(card).toBeTruthy();
  });

  const SCORE_CARD_TEXTS: readonly (readonly [string, string])[] = [
    ['le score numerique', '72'],
    ["l'indicateur de phase", 'Phase 2'],
    ['le message', 'Bonne progression, continuez !'],
    ["la barre d'adherence aux objectifs", '60'],
    ['le bonus de tendance quand present', '8'],
    ['le bonus de streak quand present', '4'],
  ];

  for (const [libelle, attendu] of SCORE_CARD_TEXTS) {
    it(`devrait afficher ${libelle}`, () => {
      const content = fixture.nativeElement.textContent as string;
      expect(content).toContain(attendu);
    });
  }

  it('devrait ne pas afficher le bonus de tendance quand absent', () => {
    host.score.set(
      buildSebastianHealthScore({
        breakdown: { goalAdherence: 70 },
      }),
    );
    fixture.detectChanges();

    const bonusElements = fixture.nativeElement.querySelectorAll("[data-testid='trend-bonus']");
    expect(bonusElements.length).toBe(0);
  });

  it('devrait ne pas afficher le bonus de streak quand absent', () => {
    host.score.set(
      buildSebastianHealthScore({
        breakdown: { goalAdherence: 70 },
      }),
    );
    fixture.detectChanges();

    const bonusElements = fixture.nativeElement.querySelectorAll("[data-testid='streak-bonus']");
    expect(bonusElements.length).toBe(0);
  });

  it('devrait mettre a jour quand le score change', () => {
    host.score.set(buildSebastianHealthScore({ score: 95, phase: 3 }));
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('95');
    expect(content).toContain('Phase 3');
  });

  it('devrait utiliser le glass Asili dark lounge ambré', () => {
    const card: HTMLElement = fixture.nativeElement.querySelector("[data-testid='score-card']");
    expect(card).toBeTruthy();
    expect(card.classList).toContain('bg-white/[0.04]');
    expect(card.classList).toContain('border-[rgba(230,170,70,0.14)]');
    expect(card.classList).toContain('rounded-[20px]');
  });
});
