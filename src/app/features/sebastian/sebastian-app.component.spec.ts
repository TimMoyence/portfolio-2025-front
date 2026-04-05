import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import {
  buildSebastianEntry,
  buildSebastianGoal,
  buildSebastianStats,
  createSebastianPortStub,
} from "../../../testing/factories/sebastian.factory";
import { SEBASTIAN_PORT } from "../../core/ports/sebastian.port";
import { SebastianAppComponent } from "./sebastian-app.component";

describe("SebastianAppComponent", () => {
  let component: SebastianAppComponent;
  let fixture: ComponentFixture<SebastianAppComponent>;
  let portStub: ReturnType<typeof createSebastianPortStub>;

  beforeEach(async () => {
    portStub = createSebastianPortStub();
    portStub.getEntries.and.returnValue(
      of([
        buildSebastianEntry({ id: "e1", category: "coffee" }),
        buildSebastianEntry({
          id: "e2",
          category: "alcohol",
          unit: "standard_drink",
        }),
      ]),
    );
    portStub.getGoals.and.returnValue(
      of([
        buildSebastianGoal({
          id: "g1",
          category: "coffee",
          period: "daily",
          targetQuantity: 3,
        }),
      ]),
    );
    portStub.getStats.and.returnValue(of(buildSebastianStats()));

    await TestBed.configureTestingModule({
      imports: [SebastianAppComponent],
      providers: [
        provideRouter([]),
        { provide: SEBASTIAN_PORT, useValue: portStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger les entrees au demarrage", () => {
    expect(portStub.getEntries).toHaveBeenCalled();
    expect(component.entries().length).toBe(2);
  });

  it("devrait charger les objectifs au demarrage", () => {
    expect(portStub.getGoals).toHaveBeenCalled();
    expect(component.goals().length).toBe(1);
  });

  it("devrait charger les statistiques au demarrage", () => {
    expect(portStub.getStats).toHaveBeenCalledWith("week");
    expect(component.stats()).toBeTruthy();
  });

  it("devrait afficher le titre Sebastian", () => {
    const h1: HTMLHeadingElement | null =
      fixture.nativeElement.querySelector("h1");
    expect(h1).toBeTruthy();
    expect(h1!.textContent!.trim()).toContain("Sebastian");
  });

  it("devrait afficher les boutons d'ajout rapide", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("section button");
    expect(buttons.length).toBe(2);
  });

  it("devrait afficher les 5 onglets de navigation", () => {
    const tabs: NodeListOf<HTMLAnchorElement> =
      fixture.nativeElement.querySelectorAll("nav a");
    expect(tabs.length).toBe(5);
    const labels = Array.from(tabs).map((t) => t.textContent!.trim());
    expect(labels).toEqual([
      "Dashboard",
      "Rapports",
      "Badges",
      "Historique",
      "Objectifs",
    ]);
  });

  it("devrait avoir un point de projection ng-content pour le router-outlet", () => {
    const main = fixture.nativeElement.querySelector("main");
    expect(main).toBeTruthy();
  });

  it("devrait appeler addEntry lors d'un ajout rapide cafe", () => {
    const newEntry = buildSebastianEntry({ id: "e-new", category: "coffee" });
    portStub.addEntry.and.returnValue(of(newEntry));

    component.quickAdd("coffee");

    expect(portStub.addEntry).toHaveBeenCalledWith(
      jasmine.objectContaining({ category: "coffee", quantity: 1 }),
    );
  });

  it("devrait appeler addEntry lors d'un ajout rapide alcool", () => {
    const newEntry = buildSebastianEntry({
      id: "e-new",
      category: "alcohol",
      unit: "standard_drink",
    });
    portStub.addEntry.and.returnValue(of(newEntry));

    component.quickAdd("alcohol");

    expect(portStub.addEntry).toHaveBeenCalledWith(
      jasmine.objectContaining({ category: "alcohol", quantity: 1 }),
    );
  });

  it("devrait mettre a jour la liste apres ajout rapide", () => {
    const newEntry = buildSebastianEntry({ id: "e-new", category: "coffee" });
    portStub.addEntry.and.returnValue(of(newEntry));

    component.quickAdd("coffee");

    expect(component.entries().length).toBe(3);
    expect(component.entries()[0].id).toBe("e-new");
  });

  it("devrait calculer le total alcool du jour", () => {
    const today = new Date().toISOString().slice(0, 10);
    portStub.getEntries.and.returnValue(
      of([
        buildSebastianEntry({
          id: "a1",
          category: "alcohol",
          quantity: 2,
          date: today,
        }),
        buildSebastianEntry({
          id: "a2",
          category: "alcohol",
          quantity: 1,
          date: today,
        }),
        buildSebastianEntry({ id: "c1", category: "coffee", date: today }),
      ]),
    );

    // Recharger les donnees
    const freshFixture = TestBed.createComponent(SebastianAppComponent);
    freshFixture.detectChanges();
    expect(freshFixture.componentInstance.todayAlcohol()).toBe(3);
  });

  it("devrait calculer la progression cafe par rapport a l objectif", () => {
    const today = new Date().toISOString().slice(0, 10);
    portStub.getEntries.and.returnValue(
      of([
        buildSebastianEntry({
          id: "c1",
          category: "coffee",
          quantity: 2,
          date: today,
        }),
      ]),
    );
    portStub.getGoals.and.returnValue(
      of([
        buildSebastianGoal({
          category: "coffee",
          period: "daily",
          targetQuantity: 4,
          isActive: true,
        }),
      ]),
    );

    const freshFixture = TestBed.createComponent(SebastianAppComponent);
    freshFixture.detectChanges();
    expect(freshFixture.componentInstance.coffeeProgress()).toBe(50);
  });
});
