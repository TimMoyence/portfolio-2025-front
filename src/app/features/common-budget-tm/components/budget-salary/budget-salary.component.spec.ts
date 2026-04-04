import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetSalaryComponent } from "./budget-salary.component";

describe("BudgetSalaryComponent", () => {
  let component: BudgetSalaryComponent;
  let fixture: ComponentFixture<BudgetSalaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetSalaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetSalaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("timSalary", "3000");
    fixture.componentRef.setInput("mariaSalary", "2000");
    fixture.componentRef.setInput("timSalaryShare", "60.0%");
    fixture.componentRef.setInput("mariaSalaryShare", "40.0%");
    fixture.componentRef.setInput("totalSalary", 5000);
    fixture.componentRef.setInput("budgetValidationMessage", "");
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher le total combine", () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("5,000");
  });

  it("devrait emettre timSalaryChange lors de la saisie", () => {
    spyOn(component.timSalaryChange, "emit");

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="number"]'),
    );
    const timInput = inputs[0];
    timInput.value = "3500";
    timInput.dispatchEvent(new Event("input"));

    expect(component.timSalaryChange.emit).toHaveBeenCalledWith("3500");
  });

  it("devrait emettre validate lors du clic", () => {
    spyOn(component.validate, "emit");

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector("button");
    button.click();

    expect(component.validate.emit).toHaveBeenCalled();
  });

  it("devrait afficher le message de validation quand present", () => {
    fixture.componentRef.setInput(
      "budgetValidationMessage",
      "Saved for March!",
    );
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("Saved for March!");
  });
});
