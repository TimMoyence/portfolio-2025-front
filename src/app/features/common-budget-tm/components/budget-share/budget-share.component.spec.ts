import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetShareComponent } from "./budget-share.component";

describe("BudgetShareComponent", () => {
  let component: BudgetShareComponent;
  let fixture: ComponentFixture<BudgetShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetShareComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetShareComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("shareEmail", "");
    fixture.componentRef.setInput("shareMessage", "");
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait emettre shareEmailChange lors de la saisie", () => {
    spyOn(component.shareEmailChange, "emit");

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="email"]',
    );
    input.value = "test@example.com";
    input.dispatchEvent(new Event("input"));

    expect(component.shareEmailChange.emit).toHaveBeenCalledWith(
      "test@example.com",
    );
  });

  it("devrait emettre shareBudget lors du clic sur Inviter", () => {
    spyOn(component.shareBudget, "emit");

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector("button");
    button.click();

    expect(component.shareBudget.emit).toHaveBeenCalled();
  });

  it("devrait afficher le message de partage quand present", () => {
    fixture.componentRef.setInput("shareMessage", "Budget partage !");
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("Budget partage !");
  });

  it("devrait emettre shareBudget lors de la touche Enter", () => {
    spyOn(component.shareBudget, "emit");

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="email"]',
    );
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    input.dispatchEvent(event);

    expect(component.shareBudget.emit).toHaveBeenCalled();
  });
});
