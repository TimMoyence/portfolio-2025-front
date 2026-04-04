import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { BUDGET_PORT } from "../../../../core/ports/budget.port";
import {
  buildBudgetCategory,
  buildRecurringEntry,
  createBudgetPortStub,
} from "../../../../../testing/factories/budget.factory";
import { BudgetRecurringComponent } from "./budget-recurring.component";

describe("BudgetRecurringComponent", () => {
  let component: BudgetRecurringComponent;
  let fixture: ComponentFixture<BudgetRecurringComponent>;
  let budgetPortStub: ReturnType<typeof createBudgetPortStub>;

  beforeEach(async () => {
    budgetPortStub = createBudgetPortStub();
    budgetPortStub.getRecurringEntries.and.returnValue(
      of([buildRecurringEntry()]),
    );

    await TestBed.configureTestingModule({
      imports: [BudgetRecurringComponent],
      providers: [{ provide: BUDGET_PORT, useValue: budgetPortStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetRecurringComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("groupId", "group-1");
    fixture.componentRef.setInput("categories", [buildBudgetCategory()]);
    fixture.detectChanges();
  });

  it("devrait se creer sans erreur", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger les entrees recurrentes au demarrage", async () => {
    await fixture.whenStable();
    expect(budgetPortStub.getRecurringEntries).toHaveBeenCalledWith("group-1");
    expect(component.recurringEntries().length).toBe(1);
  });

  it("devrait avoir le formulaire masque par defaut", () => {
    expect(component.showForm()).toBeFalse();
  });

  it("devrait afficher le formulaire au clic sur ajouter", () => {
    component.toggleForm();
    expect(component.showForm()).toBeTrue();
  });
});
