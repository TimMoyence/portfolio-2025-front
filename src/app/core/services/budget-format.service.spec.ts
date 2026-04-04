import { LOCALE_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { BudgetFormatService } from "./budget-format.service";

describe("BudgetFormatService", () => {
  let service: BudgetFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: "fr-FR" }],
    });
    service = TestBed.inject(BudgetFormatService);
  });

  it("devrait formater un montant en EUR", () => {
    const result = service.formatCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("€");
  });

  it("devrait ajouter + pour un montant positif", () => {
    expect(service.formatSignedCurrency(50)).toContain("+");
  });

  it("devrait ne pas ajouter + pour un montant negatif", () => {
    expect(service.formatSignedCurrency(-50)).not.toContain("+");
  });

  it("devrait formater une date ISO en francais", () => {
    const result = service.formatDate("2026-03-15");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("devrait retourner - pour une date vide", () => {
    expect(service.formatDate("")).toBe("-");
  });

  it("devrait parser un montant avec virgule", () => {
    expect(service.parseAmount("1234,56")).toBeCloseTo(1234.56);
  });

  it("devrait retourner 0 pour un montant invalide", () => {
    expect(service.parseAmount("abc")).toBe(0);
  });

  it("devrait calculer un pourcentage", () => {
    const result = service.formatPercentage(30, 100);
    expect(result).toContain("30");
    expect(result).toContain("%");
  });

  it("devrait retourner 0% si le total est zero", () => {
    expect(service.formatPercentage(50, 0)).toBe("0%");
  });
});
