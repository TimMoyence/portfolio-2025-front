import type {
  BudgetCategoryModel,
  BudgetEntryModel,
  BudgetGroup,
  BudgetSummary,
} from "../../app/core/models/budget.model";
import type { BudgetPort } from "../../app/core/ports/budget.port";

/** Construit un objet BudgetGroup avec des valeurs par defaut. */
export function buildBudgetGroup(
  overrides?: Partial<BudgetGroup>,
): BudgetGroup {
  return {
    id: "group-1",
    name: "Budget couple T&M",
    ownerId: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Construit un objet BudgetCategoryModel avec des valeurs par defaut. */
export function buildBudgetCategory(
  overrides?: Partial<BudgetCategoryModel>,
): BudgetCategoryModel {
  return {
    id: "cat-1",
    groupId: null,
    name: "Courses",
    color: "#22C55E",
    icon: "shopping-cart",
    budgetType: "VARIABLE",
    budgetLimit: 600,
    displayOrder: 8,
    ...overrides,
  };
}

/** Construit un objet BudgetEntryModel avec des valeurs par defaut. */
export function buildBudgetEntry(
  overrides?: Partial<BudgetEntryModel>,
): BudgetEntryModel {
  return {
    id: "entry-1",
    groupId: "group-1",
    createdByUserId: "user-1",
    categoryId: "cat-1",
    date: "2026-03-15",
    description: "Carrefour courses",
    amount: -85.5,
    type: "VARIABLE",
    state: "COMPLETED",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Construit un objet BudgetSummary avec des valeurs par defaut. */
export function buildBudgetSummary(
  overrides?: Partial<BudgetSummary>,
): BudgetSummary {
  return {
    totalExpenses: 1500,
    totalIncoming: 3000,
    byCategory: [
      {
        categoryId: "cat-1",
        categoryName: "Courses",
        total: 600,
        budgetLimit: 600,
        remaining: 0,
      },
    ],
    ...overrides,
  };
}

/** Cree un stub complet du port budget avec des spies Jasmine. */
export function createBudgetPortStub(): Record<keyof BudgetPort, jasmine.Spy> {
  return {
    getGroups: jasmine.createSpy("getGroups"),
    createGroup: jasmine.createSpy("createGroup"),
    createEntry: jasmine.createSpy("createEntry"),
    getEntries: jasmine.createSpy("getEntries"),
    getSummary: jasmine.createSpy("getSummary"),
    importEntries: jasmine.createSpy("importEntries"),
    createCategory: jasmine.createSpy("createCategory"),
    getCategories: jasmine.createSpy("getCategories"),
    shareBudget: jasmine.createSpy("shareBudget"),
  };
}
