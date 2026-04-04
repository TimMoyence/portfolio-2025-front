import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { BUDGET_PORT } from "../../../../core/ports/budget.port";
import { createBudgetPortStub } from "../../../../../testing/factories/budget.factory";
import { BudgetExportComponent } from "./budget-export.component";

describe("BudgetExportComponent", () => {
  let component: BudgetExportComponent;
  let fixture: ComponentFixture<BudgetExportComponent>;
  let budgetPortStub: ReturnType<typeof createBudgetPortStub>;

  beforeEach(async () => {
    budgetPortStub = createBudgetPortStub();
    budgetPortStub.exportPdf.and.returnValue(
      of(new Blob(["pdf-content"], { type: "application/pdf" })),
    );

    await TestBed.configureTestingModule({
      imports: [BudgetExportComponent],
      providers: [{ provide: BUDGET_PORT, useValue: budgetPortStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetExportComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("groupId", "group-1");
    fixture.componentRef.setInput("month", 3);
    fixture.componentRef.setInput("year", 2026);
    fixture.detectChanges();
  });

  it("devrait se creer sans erreur", () => {
    expect(component).toBeTruthy();
  });

  it("devrait ne pas etre en cours d'export par defaut", () => {
    expect(component.exporting()).toBeFalse();
  });

  it("devrait appeler le port pour exporter le PDF", async () => {
    await component.exportPdf();
    expect(budgetPortStub.exportPdf).toHaveBeenCalledWith("group-1", 3, 2026);
  });
});
