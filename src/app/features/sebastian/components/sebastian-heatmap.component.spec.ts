import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import type { SebastianHeatmapPoint } from "../../../core/models/sebastian.model";
import { SebastianHeatmapComponent } from "./sebastian-heatmap.component";

/**
 * Hote de test pour fournir l'input requis via un signal.
 */
@Component({
  standalone: true,
  imports: [SebastianHeatmapComponent],
  template: `<app-sebastian-heatmap [data]="data()" />`,
})
class TestHostComponent {
  readonly data = signal<SebastianHeatmapPoint[]>([
    { date: "2026-03-30", alcohol: 1, coffee: 2, combined: 3 },
    { date: "2026-03-31", alcohol: 0, coffee: 3, combined: 3 },
    { date: "2026-04-01", alcohol: 2, coffee: 1, combined: 3 },
    { date: "2026-04-02", alcohol: 0, coffee: 0, combined: 0 },
    { date: "2026-04-03", alcohol: 3, coffee: 4, combined: 7 },
    { date: "2026-04-04", alcohol: 1, coffee: 2, combined: 3 },
    { date: "2026-04-05", alcohol: 0, coffee: 1, combined: 1 },
  ]);
}

describe("SebastianHeatmapComponent", () => {
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
    const heatmap = fixture.nativeElement.querySelector(
      "app-sebastian-heatmap",
    );
    expect(heatmap).toBeTruthy();
  });

  it("devrait rendre des cellules de jour", () => {
    const cells = fixture.nativeElement.querySelectorAll(
      "[data-testid='heatmap-cell']",
    );
    expect(cells.length).toBe(7);
  });

  it("devrait afficher les boutons de mode", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='mode-button']");
    expect(buttons.length).toBe(3);
  });

  it("devrait avoir le mode combined actif par defaut", () => {
    const activeButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        "[data-testid='mode-button'].bg-scheme-accent",
      );
    expect(activeButton).toBeTruthy();
    expect(activeButton!.textContent!.trim()).toContain("Combine");
  });

  it("devrait changer de mode quand on clique sur Alcool", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='mode-button']");
    const alcoholButton = Array.from(buttons).find((b) =>
      b.textContent!.includes("Alcool"),
    )!;

    alcoholButton.click();
    fixture.detectChanges();

    expect(alcoholButton.classList).toContain("bg-scheme-accent");
  });

  it("devrait changer de mode quand on clique sur Cafe", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='mode-button']");
    const coffeeButton = Array.from(buttons).find((b) =>
      b.textContent!.includes("Caf"),
    )!;

    coffeeButton.click();
    fixture.detectChanges();

    expect(coffeeButton.classList).toContain("bg-scheme-accent");
  });

  it("devrait appliquer une intensite nulle pour une cellule a 0", () => {
    const cells: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='heatmap-cell']");
    // La cellule du 2026-04-02 a combined=0
    const zeroCell = Array.from(cells).find((c) =>
      c.textContent!.includes("2"),
    );
    expect(zeroCell).toBeTruthy();
    // Une cellule a zero ne devrait pas avoir d'opacite accent
    const zeroCellApril2 = cells[3]; // 4eme jour dans l'ordre
    expect(zeroCellApril2.classList).toContain("bg-scheme-surface");
  });

  it("devrait appliquer une intensite elevee pour une cellule a valeur haute", () => {
    const cells: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='heatmap-cell']");
    // La cellule du 2026-04-03 a combined=7 (la plus haute)
    const highCell = cells[4]; // 5eme jour
    expect(
      highCell.classList.contains("bg-scheme-accent") ||
        highCell.className.includes("bg-scheme-accent"),
    ).toBeTrue();
  });

  it("devrait utiliser les tokens de design SSOT", () => {
    const container: HTMLElement | null = fixture.nativeElement.querySelector(
      "[data-testid='heatmap-container']",
    );
    expect(container).toBeTruthy();
    expect(container!.classList).toContain("bg-scheme-surface");
    expect(container!.classList).toContain("rounded-card");
  });

  it("devrait afficher le numero du jour dans chaque cellule", () => {
    const cells: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='heatmap-cell']");
    const firstCellText = cells[0].textContent!.trim();
    expect(firstCellText).toContain("30");
  });

  it("devrait mettre a jour quand les donnees changent", () => {
    host.data.set([
      { date: "2026-04-10", alcohol: 5, coffee: 5, combined: 10 },
    ]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll(
      "[data-testid='heatmap-cell']",
    );
    expect(cells.length).toBe(1);
  });
});
