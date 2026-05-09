import { ComponentRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  buildBudgetCategory,
  buildBudgetGoalWithProgress,
} from "../../../../../testing/factories/budget.factory";
import type { CreateBudgetGoalPayload } from "../../../../core/models/budget.model";
import { BudgetSavingsGoalsComponent } from "./budget-savings-goals.component";

describe("BudgetSavingsGoalsComponent", () => {
  const goal1 = buildBudgetGoalWithProgress({
    id: "goal-1",
    name: "Epargne vacances",
    targetAmount: 1000,
    currentAmount: 400,
    progressPercent: 40,
    kind: "SAVINGS",
  });
  const goal2 = buildBudgetGoalWithProgress({
    id: "goal-2",
    name: "Plafond loisirs",
    targetAmount: 300,
    currentAmount: 280,
    progressPercent: 93,
    kind: "SPENDING_LIMIT",
  });

  const catLoisirs = buildBudgetCategory({
    id: "cat-loisirs",
    name: "Loisirs",
  });

  async function createFixture(
    goals = [goal1, goal2],
    categories = [catLoisirs],
  ) {
    await TestBed.configureTestingModule({
      imports: [BudgetSavingsGoalsComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(BudgetSavingsGoalsComponent);
    const cmpRef: ComponentRef<BudgetSavingsGoalsComponent> =
      fixture.componentRef;
    cmpRef.setInput("goals", goals);
    cmpRef.setInput("categories", categories);
    fixture.detectChanges();
    return fixture;
  }

  it("doit afficher chaque goal avec sa barre de progression et son pourcentage", async () => {
    const fixture = await createFixture();
    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent).toContain("Epargne vacances");
    expect(nativeEl.textContent).toContain("Plafond loisirs");
    expect(nativeEl.textContent).toContain("40");
    expect(nativeEl.textContent).toContain("93");
    const bars = nativeEl.querySelectorAll(".rounded-full.h-full");
    expect(bars.length).toBe(2);
  });

  it("doit soumettre un goal SAVINGS sans categoryId", async () => {
    const fixture = await createFixture();
    const emitted: Omit<CreateBudgetGoalPayload, "groupId">[] = [];
    fixture.componentInstance.createGoal.subscribe(
      (p: Omit<CreateBudgetGoalPayload, "groupId">) => emitted.push(p),
    );

    // Rempli le formulaire via les signals
    fixture.componentInstance.formName.set("Mon epargne");
    fixture.componentInstance.formKind.set("SAVINGS");
    fixture.componentInstance.formTargetAmount.set(2000);
    fixture.detectChanges();

    fixture.componentInstance.onSubmit();
    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe("Mon epargne");
    expect(emitted[0].kind).toBe("SAVINGS");
    expect(emitted[0].targetAmount).toBe(2000);
    expect(emitted[0].categoryId).toBeNull();
  });

  it("doit inclure categoryId pour un goal CATEGORY_LIMIT", async () => {
    const fixture = await createFixture();
    const emitted: Omit<CreateBudgetGoalPayload, "groupId">[] = [];
    fixture.componentInstance.createGoal.subscribe(
      (p: Omit<CreateBudgetGoalPayload, "groupId">) => emitted.push(p),
    );

    fixture.componentInstance.formName.set("Plafond loisirs");
    fixture.componentInstance.formKind.set("CATEGORY_LIMIT");
    fixture.componentInstance.formTargetAmount.set(300);
    fixture.componentInstance.formCategoryId.set("cat-loisirs");
    fixture.detectChanges();

    fixture.componentInstance.onSubmit();
    expect(emitted.length).toBe(1);
    expect(emitted[0].kind).toBe("CATEGORY_LIMIT");
    expect(emitted[0].categoryId).toBe("cat-loisirs");
  });

  it("doit emettre deleteGoal avec l'id du goal quand confirm retourne true", async () => {
    const fixture = await createFixture();
    spyOn(window, "confirm").and.returnValue(true);
    const emitted: string[] = [];
    fixture.componentInstance.deleteGoal.subscribe((id: string) =>
      emitted.push(id),
    );

    fixture.componentInstance.onDeleteClick("goal-1");
    expect(window.confirm).toHaveBeenCalled();
    expect(emitted).toContain("goal-1");
  });
});
