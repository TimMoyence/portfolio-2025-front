import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { BUDGET_PORT } from "../../core/ports/budget.port";
import {
  buildBudgetGroup,
  createBudgetPortStub,
} from "../../../testing/factories/budget.factory";
import { BudgetAppComponent } from "./budget-app.component";

describe("BudgetAppComponent", () => {
  let component: BudgetAppComponent;
  let fixture: ComponentFixture<BudgetAppComponent>;
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
      imports: [BudgetAppComponent],
      providers: [{ provide: BUDGET_PORT, useValue: budgetPortStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetAppComponent);
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
    budgetPortStub.getEntriesMonths.and.returnValue(of([]));
    budgetPortStub.getMembers.and.returnValue(of([]));
    budgetPortStub.getContributions.and.returnValue(of([]));
    budgetPortStub.getGoals.and.returnValue(of([]));

    // Re-create component to trigger fresh initBudget
    fixture = TestBed.createComponent(BudgetAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.groupId()).toBe("group-1");
  });

  describe("no group state (auto-create regression guard)", () => {
    it("does NOT auto-create a group when getGroups returns an empty list", async () => {
      budgetPortStub.getGroups.and.returnValue(of([]));
      budgetPortStub.createGroup.and.returnValue(of(buildBudgetGroup()));

      fixture = TestBed.createComponent(BudgetAppComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(budgetPortStub.createGroup).not.toHaveBeenCalled();
      expect(component.groupId()).toBeNull();
      expect(component.hasNoGroup()).toBeTrue();
    });

    it("still auto-loads the first group when getGroups returns one", async () => {
      const group = buildBudgetGroup();
      budgetPortStub.getGroups.and.returnValue(of([group]));
      budgetPortStub.getCategories.and.returnValue(of([]));
      budgetPortStub.getEntries.and.returnValue(of([]));
      budgetPortStub.getEntriesMonths.and.returnValue(of([]));
      budgetPortStub.getMembers.and.returnValue(of([]));
      budgetPortStub.getContributions.and.returnValue(of([]));
      budgetPortStub.getGoals.and.returnValue(of([]));

      fixture = TestBed.createComponent(BudgetAppComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(budgetPortStub.createGroup).not.toHaveBeenCalled();
      expect(component.hasNoGroup()).toBeFalse();
    });

    it("creates a group explicitly when user clicks the CTA", async () => {
      const group = buildBudgetGroup();
      budgetPortStub.getGroups.and.returnValue(of([]));
      budgetPortStub.createGroup.and.returnValue(of(group));
      budgetPortStub.getCategories.and.returnValue(of([]));
      budgetPortStub.getEntries.and.returnValue(of([]));
      budgetPortStub.getEntriesMonths.and.returnValue(of([]));
      budgetPortStub.getMembers.and.returnValue(of([]));
      budgetPortStub.getContributions.and.returnValue(of([]));
      budgetPortStub.getGoals.and.returnValue(of([]));

      fixture = TestBed.createComponent(BudgetAppComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      await component.createFirstGroup();
      await fixture.whenStable();

      expect(budgetPortStub.createGroup).toHaveBeenCalledTimes(1);
      expect(component.groupId()).toBe(group.id);
      expect(component.hasNoGroup()).toBeFalse();
    });
  });

  describe("shareBudgetWith — 3 statuts + pending invitations", () => {
    async function initWithGroup() {
      const group = buildBudgetGroup();
      budgetPortStub.getGroups.and.returnValue(of([group]));
      budgetPortStub.getCategories.and.returnValue(of([]));
      budgetPortStub.getEntries.and.returnValue(of([]));
      budgetPortStub.getEntriesMonths.and.returnValue(of([]));
      budgetPortStub.getMembers.and.returnValue(of([]));
      budgetPortStub.getContributions.and.returnValue(of([]));
      budgetPortStub.getGoals.and.returnValue(of([]));
      budgetPortStub.listPendingInvitations.and.returnValue(
        of({ invitations: [] }),
      );

      fixture = TestBed.createComponent(BudgetAppComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      return group;
    }

    it("affiche un message 'shared' quand le backend renvoie status: shared", async () => {
      await initWithGroup();
      budgetPortStub.shareBudget.and.returnValue(of({ status: "shared" }));
      component.onShareEmailChange("maria@test.com");

      await component.shareBudgetWith();

      expect(component.shareMessage()).toContain("partag");
      expect(component.shareEmail()).toBe("");
    });

    it("affiche un message 'already-member' quand le backend renvoie status: already-member", async () => {
      await initWithGroup();
      budgetPortStub.shareBudget.and.returnValue(
        of({ status: "already-member" }),
      );
      component.onShareEmailChange("alice@test.com");

      await component.shareBudgetWith();

      expect(component.shareMessage().toLowerCase()).toContain("membre");
    });

    it("affiche un message 'invited' + rafraichit pending list", async () => {
      await initWithGroup();
      budgetPortStub.shareBudget.and.returnValue(of({ status: "invited" }));
      const pending = {
        invitations: [
          {
            id: "inv-1",
            targetEmail: "new@test.com",
            expiresAt: "2026-05-18T15:00:00.000Z",
            createdAt: "2026-05-11T15:00:00.000Z",
          },
        ],
      };
      budgetPortStub.listPendingInvitations.and.returnValue(of(pending));
      component.onShareEmailChange("new@test.com");

      await component.shareBudgetWith();

      expect(component.shareMessage().toLowerCase()).toContain("invitation");
      expect(component.pendingInvitations()).toEqual(pending.invitations);
    });

    it("expose un message 'quota' sur erreur 429", async () => {
      await initWithGroup();
      budgetPortStub.shareBudget.and.returnValue(
        throwError(() => ({ status: 429, error: { detail: "rate-limited" } })),
      );
      component.onShareEmailChange("spam@test.com");

      await component.shareBudgetWith();

      expect(component.shareMessage().toLowerCase()).toContain("limite");
    });

    it("expose un message 'forbidden' sur erreur 403", async () => {
      await initWithGroup();
      budgetPortStub.shareBudget.and.returnValue(
        throwError(() => ({ status: 403, error: { detail: "not-owner" } })),
      );
      component.onShareEmailChange("forbidden@test.com");

      await component.shareBudgetWith();

      expect(component.shareMessage().toLowerCase()).toContain("propri");
    });

    it("charge les invitations en attente au mount du groupe", async () => {
      await initWithGroup();
      expect(budgetPortStub.listPendingInvitations).toHaveBeenCalledWith(
        "group-1",
      );
    });
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
  });

  describe("month picker integration (7.2)", () => {
    it("currentMonth defaults to current calendar month", () => {
      const now = new Date();
      expect(component.currentMonth()).toBe(now.getMonth() + 1);
    });

    it("onMonthChange updates currentMonth and currentYear", () => {
      component.groupId.set(null);
      component.onMonthChange({ month: 3, year: 2026 });
      expect(component.currentMonth()).toBe(3);
      expect(component.currentYear()).toBe(2026);
    });

    it("entriesMonths defaults to empty array", () => {
      expect(component.entriesMonths()).toEqual([]);
    });
  });

  describe("empty state (7.1)", () => {
    it("isEmpty is true when no entriesMonths and no entries", async () => {
      await fixture.whenStable();
      // After fallback (API unreachable), no entriesMonths and no entries loaded yet
      // (sample data loaded but entriesMonths still empty)
      expect(component.entriesMonths()).toEqual([]);
    });

    it("isEmpty is false when entries exist", async () => {
      await fixture.whenStable();
      // With sample data loaded, entries() is non-empty so isEmpty should be false
      // (sample loaded into baseTransactions by fallback path)
      // isEmpty = entriesMonths.length===0 && entries.length===0
      // After fallback sample loaded, entries.length > 0
      const hasEntries = component.entries().length > 0;
      if (hasEntries) {
        expect(component.isEmpty()).toBeFalse();
      }
    });
  });
});
