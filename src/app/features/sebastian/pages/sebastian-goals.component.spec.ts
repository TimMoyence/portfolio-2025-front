import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  buildSebastianGoal,
  createSebastianPortStub,
} from "../../../../testing/factories/sebastian.factory";
import { SEBASTIAN_PORT } from "../../../core/ports/sebastian.port";
import { SebastianGoalsComponent } from "./sebastian-goals.component";

describe("SebastianGoalsComponent", () => {
  let component: SebastianGoalsComponent;
  let fixture: ComponentFixture<SebastianGoalsComponent>;
  let portStub: ReturnType<typeof createSebastianPortStub>;

  beforeEach(async () => {
    portStub = createSebastianPortStub();
    portStub.getGoals.and.returnValue(
      of([
        buildSebastianGoal({
          id: "g1",
          category: "coffee",
          targetQuantity: 3,
          period: "daily",
        }),
        buildSebastianGoal({
          id: "g2",
          category: "alcohol",
          targetQuantity: 7,
          period: "weekly",
        }),
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [SebastianGoalsComponent],
      providers: [{ provide: SEBASTIAN_PORT, useValue: portStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger les objectifs au demarrage", () => {
    expect(portStub.getGoals).toHaveBeenCalled();
    expect(component.goals().length).toBe(2);
  });

  it("devrait afficher tous les objectifs", () => {
    const items = fixture.nativeElement.querySelectorAll(
      "[data-testid='goal-item']",
    );
    expect(items.length).toBe(2);
  });

  it("devrait afficher les details de chaque objectif", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("3");
    expect(content).toContain("jour");
    expect(content).toContain("7");
    expect(content).toContain("sem.");
  });

  it("devrait afficher le formulaire d ajout", () => {
    const categorySelect = fixture.nativeElement.querySelector(
      "[data-testid='goal-category']",
    );
    const quantityInput = fixture.nativeElement.querySelector(
      "[data-testid='goal-quantity']",
    );
    const periodSelect = fixture.nativeElement.querySelector(
      "[data-testid='goal-period']",
    );
    const submitButton = fixture.nativeElement.querySelector(
      "[data-testid='goal-submit']",
    );

    expect(categorySelect).toBeTruthy();
    expect(quantityInput).toBeTruthy();
    expect(periodSelect).toBeTruthy();
    expect(submitButton).toBeTruthy();
  });

  it("devrait soumettre un nouvel objectif", () => {
    const newGoal = buildSebastianGoal({ id: "g-new", category: "coffee" });
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
  });

  it("devrait ajouter l objectif a la liste apres soumission", () => {
    const newGoal = buildSebastianGoal({ id: "g-new" });
    portStub.setGoal.and.returnValue(of(newGoal));

    component.goalCategory = "coffee";
    component.goalQuantity = 5;
    component.goalPeriod = "daily";
    component.addGoal();
    fixture.detectChanges();

    expect(component.goals().length).toBe(3);
  });

  it("devrait supprimer un objectif quand on clique sur supprimer", () => {
    portStub.deleteGoal.and.returnValue(of(void 0));

    const deleteButtons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='delete-goal']");
    expect(deleteButtons.length).toBe(2);

    deleteButtons[0].click();
    fixture.detectChanges();

    expect(portStub.deleteGoal).toHaveBeenCalledWith("g1");
  });

  it("devrait mettre a jour la liste apres suppression", () => {
    portStub.deleteGoal.and.returnValue(of(void 0));

    component.removeGoal("g1");
    fixture.detectChanges();

    expect(component.goals().length).toBe(1);
    expect(component.goals().find((g) => g.id === "g1")).toBeUndefined();
  });

  it("devrait afficher un message vide quand il n y a pas d objectifs", () => {
    portStub.getGoals.and.returnValue(of([]));
    component.loadGoals();
    fixture.detectChanges();

    const emptyMessage = fixture.nativeElement.querySelector(
      "[data-testid='empty-state']",
    );
    expect(emptyMessage).toBeTruthy();
  });

  it("devrait afficher les icones de categorie", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("\u2615"); // ☕
    expect(content).toContain("\uD83C\uDF7A"); // 🍺
  });

  it("devrait utiliser les tokens de design SSOT", () => {
    const surface =
      fixture.nativeElement.querySelectorAll(".bg-scheme-surface");
    expect(surface.length).toBeGreaterThan(0);
  });
});
