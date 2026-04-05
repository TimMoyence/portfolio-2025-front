import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import type { SebastianHealthScore } from "../../../core/models/sebastian.model";
import { buildSebastianHealthScore } from "../../../../testing/factories/sebastian.factory";
import { SebastianScoreCardComponent } from "./sebastian-score-card.component";

/**
 * Hote de test pour fournir l'input requis via un signal.
 */
@Component({
  standalone: true,
  imports: [SebastianScoreCardComponent],
  template: `<app-sebastian-score-card [score]="score()" />`,
})
class TestHostComponent {
  readonly score = signal<SebastianHealthScore>(buildSebastianHealthScore());
}

describe("SebastianScoreCardComponent", () => {
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

  it("devrait se creer", () => {
    const card = fixture.nativeElement.querySelector(
      "app-sebastian-score-card",
    );
    expect(card).toBeTruthy();
  });

  it("devrait afficher le score numerique", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("72");
  });

  it("devrait afficher l'indicateur de phase", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Phase 2");
  });

  it("devrait afficher le message", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Bonne progression, continuez !");
  });

  it("devrait afficher la barre d'adherence aux objectifs", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("60");
  });

  it("devrait afficher le bonus de tendance quand present", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("8");
  });

  it("devrait afficher le bonus de streak quand present", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("4");
  });

  it("devrait ne pas afficher le bonus de tendance quand absent", () => {
    host.score.set(
      buildSebastianHealthScore({
        breakdown: { goalAdherence: 70 },
      }),
    );
    fixture.detectChanges();

    const bonusElements = fixture.nativeElement.querySelectorAll(
      "[data-testid='trend-bonus']",
    );
    expect(bonusElements.length).toBe(0);
  });

  it("devrait ne pas afficher le bonus de streak quand absent", () => {
    host.score.set(
      buildSebastianHealthScore({
        breakdown: { goalAdherence: 70 },
      }),
    );
    fixture.detectChanges();

    const bonusElements = fixture.nativeElement.querySelectorAll(
      "[data-testid='streak-bonus']",
    );
    expect(bonusElements.length).toBe(0);
  });

  it("devrait mettre a jour quand le score change", () => {
    host.score.set(buildSebastianHealthScore({ score: 95, phase: 3 }));
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("95");
    expect(content).toContain("Phase 3");
  });

  it("devrait utiliser les tokens de design SSOT", () => {
    const card: HTMLElement = fixture.nativeElement.querySelector(
      "[data-testid='score-card']",
    );
    expect(card).toBeTruthy();
    expect(card.classList).toContain("bg-scheme-surface");
    expect(card.classList).toContain("rounded-card");
  });
});
