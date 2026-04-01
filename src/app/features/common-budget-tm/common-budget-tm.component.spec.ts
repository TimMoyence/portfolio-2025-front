import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { BUDGET_PORT } from "../../core/ports/budget.port";
import {
  buildBudgetGroup,
  createBudgetPortStub,
} from "../../../testing/factories/budget.factory";
import { CommonBudgetTmComponent } from "./common-budget-tm.component";

describe("CommonBudgetTmComponent", () => {
  let component: CommonBudgetTmComponent;
  let fixture: ComponentFixture<CommonBudgetTmComponent>;
  let budgetPortStub: ReturnType<typeof createBudgetPortStub>;

  beforeEach(async () => {
    budgetPortStub = createBudgetPortStub();
    // Default: createGroup fails so we fall back to sample data
    budgetPortStub.createGroup.and.returnValue(
      throwError(() => new Error("API unreachable")),
    );

    await TestBed.configureTestingModule({
      imports: [CommonBudgetTmComponent],
      providers: [{ provide: BUDGET_PORT, useValue: budgetPortStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonBudgetTmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fallback to sample data when API is unreachable", async () => {
    // Wait for initBudget to complete
    await fixture.whenStable();
    expect(component.sourceLabel()).toBe("Fallback - Embedded sample");
  });

  it("should load from API when available", async () => {
    const group = buildBudgetGroup();
    budgetPortStub.createGroup.and.returnValue(of(group));
    budgetPortStub.getCategories.and.returnValue(of([]));
    budgetPortStub.getEntries.and.returnValue(of([]));

    // Re-create component to trigger fresh initBudget
    fixture = TestBed.createComponent(CommonBudgetTmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.groupId()).toBe("group-1");
  });
});
