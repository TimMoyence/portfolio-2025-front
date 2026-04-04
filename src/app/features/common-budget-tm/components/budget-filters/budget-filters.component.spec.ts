import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetFiltersComponent } from "./budget-filters.component";

describe("BudgetFiltersComponent", () => {
  let component: BudgetFiltersComponent;
  let fixture: ComponentFixture<BudgetFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("searchTerm", "");
    fixture.componentRef.setInput("categoryFilter", "ALL");
    fixture.componentRef.setInput("stateFilter", "ALL");
    fixture.componentRef.setInput("budgetTypeFilter", "ALL");
    fixture.componentRef.setInput("categories", ["Courses", "Loyer"]);
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher les categories dans le select", () => {
    const options: HTMLOptionElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("select option"),
    );
    const categorySelectOptions = options.filter(
      (o) => o.value === "Courses" || o.value === "Loyer",
    );
    expect(categorySelectOptions.length).toBe(2);
  });

  it("devrait emettre searchChange lors de la saisie", () => {
    spyOn(component.searchChange, "emit");

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="search"]',
    );
    input.value = "test";
    input.dispatchEvent(new Event("input"));

    expect(component.searchChange.emit).toHaveBeenCalledWith("test");
  });

  it("devrait emettre categoryFilterChange lors du changement de select", () => {
    spyOn(component.categoryFilterChange, "emit");

    const selects: HTMLSelectElement[] = Array.from(
      fixture.nativeElement.querySelectorAll("select"),
    );
    // Le premier select est celui des categories
    const categorySelect = selects[0];
    categorySelect.value = "Courses";
    categorySelect.dispatchEvent(new Event("change"));

    expect(component.categoryFilterChange.emit).toHaveBeenCalledWith("Courses");
  });
});
