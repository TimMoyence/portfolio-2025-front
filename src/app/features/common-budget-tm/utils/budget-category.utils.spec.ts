import type { BudgetCategoryModel } from "../../../core/models/budget.model";
import type { BudgetTransaction } from "./budget-csv-parser.utils";
import {
  getBudgetType,
  getCategoryFact,
  getCategoryFacts,
  getPlanValue,
} from "./budget-category.utils";

function buildCategory(
  overrides: Partial<BudgetCategoryModel> = {},
): BudgetCategoryModel {
  return {
    id: "cat-1",
    groupId: null,
    name: "Loyer",
    color: "#000",
    icon: "home",
    budgetType: "FIXED",
    budgetLimit: 900,
    displayOrder: 1,
    ...overrides,
  };
}

function buildTransaction(
  overrides: Partial<BudgetTransaction> = {},
): BudgetTransaction {
  return {
    id: "tx-1",
    startedDate: "2025-03-01",
    completedDate: "2025-03-02",
    description: "Test",
    type: "CARD_PAYMENT",
    state: "COMPLETED",
    amount: -50,
    category: "Courses",
    ...overrides,
  };
}

describe("getBudgetType", () => {
  const categories = [
    buildCategory({ name: "Loyer", budgetType: "FIXED" }),
    buildCategory({ name: "Courses", budgetType: "VARIABLE", id: "cat-2" }),
  ];

  it("devrait retourner le type de budget correct", () => {
    expect(getBudgetType("Loyer", categories)).toBe("FIXED");
    expect(getBudgetType("Courses", categories)).toBe("VARIABLE");
  });

  it("devrait retourner VARIABLE par defaut pour une categorie inconnue", () => {
    expect(getBudgetType("Inconnue", categories)).toBe("VARIABLE");
  });
});

describe("getPlanValue", () => {
  const categories = [
    buildCategory({ name: "Loyer", budgetLimit: 900 }),
    buildCategory({
      name: "Courses",
      budgetLimit: 400,
      id: "cat-2",
    }),
  ];

  it("devrait retourner la limite budgetaire", () => {
    expect(getPlanValue("Loyer", categories)).toBe(900);
    expect(getPlanValue("Courses", categories)).toBe(400);
  });

  it("devrait retourner 0 pour une categorie inconnue", () => {
    expect(getPlanValue("Inconnue", categories)).toBe(0);
  });
});

describe("getCategoryFacts", () => {
  it("devrait agreger les categories avec des depenses negatives", () => {
    const transactions: BudgetTransaction[] = [
      buildTransaction({ category: "Courses", amount: -50 }),
      buildTransaction({ category: "Transport", amount: -30, id: "tx-2" }),
      buildTransaction({ category: "Courses", amount: -20, id: "tx-3" }),
    ];

    const result = getCategoryFacts(transactions, []);

    expect(result).toContain("Courses");
    expect(result).toContain("Transport");
    expect(result).toContain("Pockets");
  });

  it("devrait exclure les contributions", () => {
    const transactions: BudgetTransaction[] = [
      buildTransaction({ category: "Contribution", amount: 1000 }),
      buildTransaction({ category: "Courses", amount: -50 }),
    ];

    const result = getCategoryFacts(transactions, []);

    expect(result).not.toContain("Contribution");
    expect(result).toContain("Courses");
  });

  it("devrait exclure les transferts entrants (montant positif)", () => {
    const transactions: BudgetTransaction[] = [
      buildTransaction({
        category: "Transfer / Savings",
        amount: 500,
        id: "tx-s",
      }),
      buildTransaction({ category: "Courses", amount: -50 }),
    ];

    const result = getCategoryFacts(transactions, []);

    expect(result).not.toContain("Transfer / Savings");
  });

  it("devrait ajouter les categories avec une limite budgetaire", () => {
    const categories = [buildCategory({ name: "Loisirs", budgetLimit: 200 })];

    const result = getCategoryFacts([], categories);

    expect(result).toContain("Loisirs");
    expect(result).toContain("Pockets");
  });
});

describe("getCategoryFact", () => {
  it("devrait sommer les montants negatifs pour la categorie", () => {
    const transactions: BudgetTransaction[] = [
      buildTransaction({ category: "Courses", amount: -50 }),
      buildTransaction({ category: "Courses", amount: -30, id: "tx-2" }),
      buildTransaction({ category: "Courses", amount: 100, id: "tx-3" }),
      buildTransaction({ category: "Transport", amount: -20, id: "tx-4" }),
    ];

    expect(getCategoryFact("Courses", transactions)).toBe(80);
  });

  it("devrait retourner 0 si aucune depense pour la categorie", () => {
    const transactions: BudgetTransaction[] = [
      buildTransaction({ category: "Courses", amount: 100 }),
    ];

    expect(getCategoryFact("Courses", transactions)).toBe(0);
    expect(getCategoryFact("Inconnue", transactions)).toBe(0);
  });
});
