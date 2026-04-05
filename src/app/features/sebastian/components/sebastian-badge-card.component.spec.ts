import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import type { SebastianBadgeStatus } from "../../../core/models/sebastian.model";
import { buildSebastianBadgeStatus } from "../../../../testing/factories/sebastian.factory";
import { SebastianBadgeCardComponent } from "./sebastian-badge-card.component";

/**
 * Hote de test pour fournir l'input requis via un signal.
 */
@Component({
  standalone: true,
  imports: [SebastianBadgeCardComponent],
  template: `<app-sebastian-badge-card [badge]="badge()" />`,
})
class TestHostComponent {
  readonly badge = signal<SebastianBadgeStatus>(buildSebastianBadgeStatus());
}

describe("SebastianBadgeCardComponent", () => {
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
      "app-sebastian-badge-card",
    );
    expect(card).toBeTruthy();
  });

  it("devrait afficher le nom du badge", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Premiere entree");
  });

  it("devrait afficher la description du badge", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Enregistrer sa premiere consommation");
  });

  it("devrait afficher un badge debloque avec bordure accent", () => {
    const card: HTMLElement = fixture.nativeElement.querySelector(
      "[data-testid='badge-card']",
    );
    expect(card).toBeTruthy();
    expect(card.classList).toContain("border-scheme-accent");
  });

  it("devrait afficher la date de deblocage pour un badge debloque", () => {
    const content = fixture.nativeElement.textContent as string;
    // La date formatee doit etre presente
    expect(content).toContain("01/04/2026");
  });

  it("devrait afficher un badge verrouille avec opacite reduite", () => {
    host.badge.set(
      buildSebastianBadgeStatus({
        key: "streak-7",
        name: "Semaine parfaite",
        description: "7 jours consecutifs sous objectif",
        category: "streaks",
        unlocked: false,
        unlockedAt: undefined,
      }),
    );
    fixture.detectChanges();

    const card: HTMLElement = fixture.nativeElement.querySelector(
      "[data-testid='badge-card']",
    );
    expect(card).toBeTruthy();
    expect(card.classList).toContain("opacity-50");
  });

  it("devrait afficher la categorie pour un badge verrouille", () => {
    host.badge.set(
      buildSebastianBadgeStatus({
        unlocked: false,
        category: "streaks",
        unlockedAt: undefined,
      }),
    );
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("streaks");
  });

  it("devrait afficher les initiales du badge dans le placeholder", () => {
    const icon: HTMLElement | null = fixture.nativeElement.querySelector(
      "[data-testid='badge-icon']",
    );
    expect(icon).toBeTruthy();
    expect(icon!.textContent!.trim()).toBe("PE");
  });

  it("devrait ne pas afficher la date pour un badge verrouille", () => {
    host.badge.set(
      buildSebastianBadgeStatus({
        unlocked: false,
        unlockedAt: undefined,
      }),
    );
    fixture.detectChanges();

    const dateEl = fixture.nativeElement.querySelector(
      "[data-testid='badge-date']",
    );
    expect(dateEl).toBeNull();
  });
});
