import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  buildSebastianPeriodReport,
  createSebastianPortStub,
} from "../../../../testing/factories/sebastian.factory";
import { SEBASTIAN_PORT } from "../../../core/ports/sebastian.port";
import { SebastianReportsComponent } from "./sebastian-reports.component";

describe("SebastianReportsComponent", () => {
  let component: SebastianReportsComponent;
  let fixture: ComponentFixture<SebastianReportsComponent>;
  let portStub: ReturnType<typeof createSebastianPortStub>;

  beforeEach(async () => {
    portStub = createSebastianPortStub();
    portStub.getPeriodReport.and.returnValue(of(buildSebastianPeriodReport()));

    await TestBed.configureTestingModule({
      imports: [SebastianReportsComponent],
      providers: [{ provide: SEBASTIAN_PORT, useValue: portStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger le rapport au demarrage", () => {
    expect(portStub.getPeriodReport).toHaveBeenCalledWith(
      "week",
      jasmine.any(String),
    );
  });

  it("devrait afficher les boutons de periode", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='period-button']");
    expect(buttons.length).toBe(3);
  });

  it("devrait afficher le selecteur Semaine comme actif par defaut", () => {
    const activeButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        "[data-testid='period-button'].bg-scheme-accent",
      );
    expect(activeButton).toBeTruthy();
    expect(activeButton!.textContent!.trim()).toBe("Semaine");
  });

  it("devrait changer la periode quand on clique sur Mois", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='period-button']");
    const monthButton = Array.from(buttons).find((b) =>
      b.textContent!.includes("Mois"),
    )!;

    monthButton.click();
    fixture.detectChanges();

    expect(component.selectedPeriod()).toBe("month");
    expect(portStub.getPeriodReport).toHaveBeenCalledWith(
      "month",
      jasmine.any(String),
    );
  });

  it("devrait afficher le navigateur temporel", () => {
    const nav = fixture.nativeElement.querySelector(
      "[data-testid='period-nav']",
    );
    expect(nav).toBeTruthy();
  });

  it("devrait afficher le label de la periode", () => {
    const label: HTMLElement | null = fixture.nativeElement.querySelector(
      "[data-testid='period-label']",
    );
    expect(label).toBeTruthy();
    expect(label!.textContent!.trim()).toMatch(/Semaine du/);
  });

  it("devrait naviguer vers la periode precedente", () => {
    const prevButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector("[data-testid='prev-period']");
    expect(prevButton).toBeTruthy();

    const initialDate = component.currentStartDate();
    prevButton!.click();
    fixture.detectChanges();

    expect(component.currentStartDate()).not.toBe(initialDate);
    expect(portStub.getPeriodReport.calls.count()).toBeGreaterThan(1);
  });

  it("devrait naviguer vers la periode suivante", () => {
    const nextButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector("[data-testid='next-period']");
    expect(nextButton).toBeTruthy();

    const initialDate = component.currentStartDate();
    nextButton!.click();
    fixture.detectChanges();

    expect(component.currentStartDate()).not.toBe(initialDate);
  });

  it("devrait afficher les totaux du rapport", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("4"); // total alcohol
    expect(content).toContain("14"); // total coffee
  });

  it("devrait afficher la comparaison avec la periode precedente", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("-10%");
    expect(content).toContain("+5%");
  });

  it("devrait afficher le composant heatmap", () => {
    const heatmap = fixture.nativeElement.querySelector(
      "app-sebastian-heatmap",
    );
    expect(heatmap).toBeTruthy();
  });

  it("devrait afficher la distribution par jour", () => {
    const distSection = fixture.nativeElement.querySelector(
      "[data-testid='day-distribution']",
    );
    expect(distSection).toBeTruthy();
  });

  it("devrait afficher les labels des jours de la semaine", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Lun");
    expect(content).toContain("Dim");
  });

  it("devrait utiliser les tokens de design SSOT", () => {
    const cards: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll(".bg-scheme-surface");
    expect(cards.length).toBeGreaterThan(0);
  });
});
