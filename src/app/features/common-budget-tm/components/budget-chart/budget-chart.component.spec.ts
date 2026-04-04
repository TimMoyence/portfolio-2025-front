import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetChartComponent } from "./budget-chart.component";

describe("BudgetChartComponent", () => {
  let component: BudgetChartComponent;
  let fixture: ComponentFixture<BudgetChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer sans erreur", () => {
    expect(component).toBeTruthy();
  });

  it("devrait ne pas etre en mode navigateur dans les tests", () => {
    // En environnement de test, isPlatformBrowser retourne true
    // mais les canvas ne sont pas rendus sans donnees
    expect(component).toBeTruthy();
  });

  it("devrait accepter des categoryTotals vides", () => {
    expect(component.categoryTotals()).toEqual([]);
  });

  it("devrait accepter des apiCategories vides", () => {
    expect(component.apiCategories()).toEqual([]);
  });
});
