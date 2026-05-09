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
    // Default: getGroups fails so we fall back to sample data
    budgetPortStub.getGroups.and.returnValue(
      throwError(() => new Error("API unreachable")),
    );
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
    budgetPortStub.getGroups.and.returnValue(of([group]));
    budgetPortStub.getCategories.and.returnValue(of([]));
    budgetPortStub.getEntries.and.returnValue(of([]));

    // Re-create component to trigger fresh initBudget
    fixture = TestBed.createComponent(CommonBudgetTmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.groupId()).toBe("group-1");
  });

  describe("delete entry (B5)", () => {
    it("calls port.deleteEntry with the entry id when user confirms", () => {
      spyOn(window, "confirm").and.returnValue(true);
      budgetPortStub.deleteEntry.and.returnValue(of(undefined));

      component.onDeleteEntry("tx-99");

      expect(budgetPortStub.deleteEntry).toHaveBeenCalledWith("tx-99");
    });

    it("does not call port.deleteEntry when user cancels", () => {
      spyOn(window, "confirm").and.returnValue(false);

      component.onDeleteEntry("tx-99");

      expect(budgetPortStub.deleteEntry).not.toHaveBeenCalled();
    });

    it("rollbacks (reloads entries) when deleteEntry API call fails", async () => {
      spyOn(window, "confirm").and.returnValue(true);
      spyOn(console, "error");
      const group = buildBudgetGroup();
      // Setup: groupId resolved, deleteEntry fails, getEntries spy validates reload.
      component.groupId.set(group.id);
      budgetPortStub.deleteEntry.and.returnValue(
        throwError(() => new Error("API down")),
      );
      budgetPortStub.getEntries.and.returnValue(of([]));
      const initialGetEntriesCalls = budgetPortStub.getEntries.calls.count();

      component.onDeleteEntry("tx-99");
      await Promise.resolve();

      expect(budgetPortStub.deleteEntry).toHaveBeenCalledWith("tx-99");
      expect(budgetPortStub.getEntries.calls.count()).toBeGreaterThan(
        initialGetEntriesCalls,
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("loading state (B4)", () => {
    it("renders the loading indicator when loading() is true", () => {
      component.loading.set(true);
      fixture.detectChanges();

      const loader = fixture.nativeElement.querySelector(
        '[data-testid="budget-loading"]',
      );
      expect(loader).toBeTruthy();
      expect(loader.getAttribute("role")).toBe("status");
    });

    it("hides the loading indicator when loading() is false", () => {
      component.loading.set(false);
      fixture.detectChanges();

      const loader = fixture.nativeElement.querySelector(
        '[data-testid="budget-loading"]',
      );
      expect(loader).toBeNull();
    });
  });

  describe("i18n labels (FR source)", () => {
    it("getCategoryLabel('ALL') returns the localized French label", () => {
      expect(component.getCategoryLabel("ALL")).toBe("Toutes les catégories");
    });

    it("getMonthLabel returns French month names", () => {
      expect(component.getMonthLabel("March")).toBe("Mars");
      expect(component.getMonthLabel("April")).toBe("Avril");
      expect(component.getMonthLabel("May")).toBe("Mai");
      expect(component.getMonthLabel("June")).toBe("Juin");
    });

    it("mariaContributionLines exposes two FR-labelled entries", () => {
      const lines = component.mariaContributionLines();
      expect(lines.length).toBe(2);
      expect(lines[0].label).toBe("Maria a ajouté");
      expect(lines[1].label).toBe("Maria reste à ajouter");
    });

    it("timContributionLines exposes two FR-labelled entries", () => {
      const lines = component.timContributionLines();
      expect(lines.length).toBe(2);
      expect(lines[0].label).toBe("Tim a ajouté");
      expect(lines[1].label).toBe("Tim reste à ajouter");
    });
  });
});
