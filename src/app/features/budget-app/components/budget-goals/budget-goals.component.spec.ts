import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { BUDGET_PORT } from "../../../../core/ports/budget.port";
import {
  buildBudgetCategory,
  createBudgetPortStub,
} from "../../../../../testing/factories/budget.factory";
import { BudgetGoalsComponent } from "./budget-goals.component";

describe("BudgetGoalsComponent", () => {
  let component: BudgetGoalsComponent;
  let fixture: ComponentFixture<BudgetGoalsComponent>;
  let budgetPortStub: ReturnType<typeof createBudgetPortStub>;

  beforeEach(async () => {
    budgetPortStub = createBudgetPortStub();
    budgetPortStub.updateCategory.and.returnValue(
      of(buildBudgetCategory({ budgetLimit: 800 })),
    );

    await TestBed.configureTestingModule({
      imports: [BudgetGoalsComponent],
      providers: [{ provide: BUDGET_PORT, useValue: budgetPortStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetGoalsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("categories", [
      buildBudgetCategory({ id: "cat-1", name: "Courses", budgetLimit: 600 }),
    ]);
    fixture.componentRef.setInput("categoryTotals", [
      {
        name: "Courses",
        plan: "600,00 €",
        fact: "450,00 €",
        left: "150,00 €",
        isLeftNegative: false,
        budgetType: "VARIABLE" as const,
      },
    ]);
    fixture.componentRef.setInput("groupId", "group-1");
    fixture.detectChanges();
  });

  it("devrait se creer sans erreur", () => {
    expect(component).toBeTruthy();
  });

  it("devrait calculer les categories avec objectifs", () => {
    const goals = component.categoriesWithGoals();
    expect(goals.length).toBe(1);
    expect(goals[0].name).toBe("Courses");
  });

  it("devrait calculer la progression correctement", () => {
    const goals = component.categoriesWithGoals();
    // 450 / 600 = 75%
    expect(goals[0].progress).toBe(75);
  });
});
