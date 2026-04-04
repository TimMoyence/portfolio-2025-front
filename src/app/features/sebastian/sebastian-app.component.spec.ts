import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
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
      providers: [{ provide: SEBASTIAN_PORT, useValue: portStub }],
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

  it("devrait supprimer une entree", () => {
    portStub.deleteEntry.and.returnValue(of(void 0));

    component.removeEntry("e1");

    expect(portStub.deleteEntry).toHaveBeenCalledWith("e1");
    expect(component.entries().find((e) => e.id === "e1")).toBeUndefined();
  });

  it("devrait ajouter un objectif", () => {
    const newGoal = buildSebastianGoal({ id: "g-new" });
    portStub.setGoal.and.returnValue(of(newGoal));

    component.goalCategory = "coffee";
    component.goalQuantity = 5;
    component.goalPeriod = "daily";
    component.addGoal();

    expect(portStub.setGoal).toHaveBeenCalledWith({
      category: "coffee",
      targetQuantity: 5,
      period: "daily",
    });
    expect(component.goals().length).toBe(2);
  });

  it("devrait supprimer un objectif", () => {
    portStub.deleteGoal.and.returnValue(of(void 0));

    component.removeGoal("g1");

    expect(portStub.deleteGoal).toHaveBeenCalledWith("g1");
    expect(component.goals().find((g) => g.id === "g1")).toBeUndefined();
  });

  it("devrait afficher les boutons d'ajout rapide", () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("section button");
    expect(buttons.length).toBe(2);
  });

  it("devrait afficher les entrees dans l'historique", () => {
    fixture.detectChanges();
    const historyItems = fixture.nativeElement.querySelectorAll(
      "[class*='bg-white/5']",
    );
    expect(historyItems.length).toBeGreaterThanOrEqual(2);
  });

  it("devrait afficher les objectifs actifs", () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("3/jour");
  });
});
