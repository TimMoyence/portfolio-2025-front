import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { BUDGET_PORT } from "../ports/budget.port";
import {
  buildBudgetCategory,
  buildBudgetEntry,
  buildBudgetGroup,
  createBudgetPortStub,
} from "../../../testing/factories/budget.factory";
import { BudgetStateService } from "./budget-state.service";

describe("BudgetStateService", () => {
  let service: BudgetStateService;
  let budgetPortStub: ReturnType<typeof createBudgetPortStub>;

  beforeEach(() => {
    budgetPortStub = createBudgetPortStub();

    TestBed.configureTestingModule({
      providers: [
        BudgetStateService,
        { provide: BUDGET_PORT, useValue: budgetPortStub },
      ],
    });

    service = TestBed.inject(BudgetStateService);
  });

  it("devrait etre cree avec l'etat idle", () => {
    expect(service).toBeTruthy();
    expect(service.viewState()).toEqual({ status: "idle" });
  });

  describe("initBudget", () => {
    it("devrait charger le groupe, les categories et les entrees depuis l'API", async () => {
      const group = buildBudgetGroup();
      const category = buildBudgetCategory();
      const entry = buildBudgetEntry();

      budgetPortStub.getGroups.and.returnValue(of([group]));
      budgetPortStub.getCategories.and.returnValue(of([category]));
      budgetPortStub.getEntries.and.returnValue(of([entry]));

      await service.initBudget();

      expect(service.groupId()).toBe("group-1");
      expect(service.apiCategories()).toEqual([category]);
      expect(service.viewState().status).toBe("loaded");
      expect(
        (service.viewState() as { status: "loaded"; entriesCount: number })
          .entriesCount,
      ).toBe(1);
    });

    it("devrait creer un groupe si aucun n'existe", async () => {
      const group = buildBudgetGroup();
      budgetPortStub.getGroups.and.returnValue(of([]));
      budgetPortStub.createGroup.and.returnValue(of(group));
      budgetPortStub.getCategories.and.returnValue(of([]));
      budgetPortStub.getEntries.and.returnValue(of([]));

      await service.initBudget();

      expect(budgetPortStub.createGroup).toHaveBeenCalledWith(
        "Budget couple T&M",
      );
      expect(service.groupId()).toBe("group-1");
    });

    it("devrait fallback sur les donnees d'exemple si l'API est injoignable", async () => {
      budgetPortStub.getGroups.and.returnValue(
        throwError(() => new Error("API unreachable")),
      );
      budgetPortStub.createGroup.and.returnValue(
        throwError(() => new Error("API unreachable")),
      );

      await service.initBudget();

      expect(service.sourceLabel()).toBe("Fallback - Embedded sample");
      expect(service.viewState().status).toBe("loaded");
      expect(service.baseTransactions().length).toBeGreaterThan(0);
    });

    it("devrait passer en etat loading pendant le chargement", async () => {
      budgetPortStub.getGroups.and.returnValue(
        throwError(() => new Error("fail")),
      );
      budgetPortStub.createGroup.and.returnValue(
        throwError(() => new Error("fail")),
      );

      const statesCollected: string[] = [];

      // Capture l'etat loading au debut
      const promise = service.initBudget();
      statesCollected.push(service.viewState().status);

      await promise;

      // L'etat loading doit avoir ete capture
      expect(statesCollected).toContain("loading");
    });
  });

  describe("loadEntries", () => {
    beforeEach(async () => {
      const group = buildBudgetGroup();
      budgetPortStub.getGroups.and.returnValue(of([group]));
      budgetPortStub.getCategories.and.returnValue(of([]));
      budgetPortStub.getEntries.and.returnValue(of([]));
      await service.initBudget();
    });

    it("devrait charger les entrees pour le mois selectionne", async () => {
      const entry = buildBudgetEntry();
      budgetPortStub.getEntries.and.returnValue(of([entry]));

      await service.loadEntries();

      expect(service.baseTransactions().length).toBe(1);
      expect(service.viewState().status).toBe("loaded");
    });

    it("devrait afficher le sample pour mars si aucune entree", async () => {
      service.selectedMonth.set("March");
      budgetPortStub.getEntries.and.returnValue(of([]));

      await service.loadEntries();

      expect(service.sourceLabel()).toContain("Embedded sample");
      expect(service.baseTransactions().length).toBeGreaterThan(0);
    });

    it("devrait afficher 'No data yet' pour les autres mois sans entrees", async () => {
      service.selectedMonth.set("April");
      budgetPortStub.getEntries.and.returnValue(of([]));

      await service.loadEntries();

      expect(service.sourceLabel()).toContain("No data yet");
      expect(service.baseTransactions().length).toBe(0);
    });

    it("devrait passer en etat error en cas d'echec de chargement", async () => {
      budgetPortStub.getEntries.and.returnValue(
        throwError(() => new Error("Network error")),
      );

      await service.loadEntries();

      expect(service.viewState().status).toBe("error");
    });

    it("ne devrait rien faire sans groupId", async () => {
      service.groupId.set(null);
      budgetPortStub.getEntries.calls.reset();

      await service.loadEntries();

      expect(budgetPortStub.getEntries).not.toHaveBeenCalled();
    });
  });

  describe("transactions computed", () => {
    it("devrait appliquer les overrides de categories", () => {
      service.baseTransactions.set([
        {
          id: "t1",
          startedDate: "2026-03-01",
          completedDate: "2026-03-01",
          description: "Test",
          type: "CARD_PAYMENT",
          state: "COMPLETED",
          amount: -10,
          category: "Autres",
        },
      ]);
      service.overrides.set({ t1: "Courses" });

      expect(service.transactions()[0].category).toBe("Courses");
    });

    it("devrait garder la categorie d'origine sans override", () => {
      service.baseTransactions.set([
        {
          id: "t1",
          startedDate: "2026-03-01",
          completedDate: "2026-03-01",
          description: "Test",
          type: "CARD_PAYMENT",
          state: "COMPLETED",
          amount: -10,
          category: "Autres",
        },
      ]);

      expect(service.transactions()[0].category).toBe("Autres");
    });
  });

  describe("apiEntriesToTransactions", () => {
    it("devrait convertir les entrees API en transactions", () => {
      const category = buildBudgetCategory({ id: "cat-1", name: "Courses" });
      service.apiCategories.set([category]);

      const entry = buildBudgetEntry({
        id: "e1",
        categoryId: "cat-1",
        description: "Carrefour",
        amount: -50,
      });

      const result = service.apiEntriesToTransactions([entry]);

      expect(result[0].category).toBe("Courses");
      expect(result[0].description).toBe("Carrefour");
      expect(result[0].amount).toBe(-50);
    });

    it("devrait utiliser 'Autres' si la categorie est introuvable", () => {
      service.apiCategories.set([]);

      const entry = buildBudgetEntry({ categoryId: "unknown" });
      const result = service.apiEntriesToTransactions([entry]);

      expect(result[0].category).toBe("Autres");
    });
  });
});
