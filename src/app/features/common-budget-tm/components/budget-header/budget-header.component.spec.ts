import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetHeaderComponent } from "./budget-header.component";

describe("BudgetHeaderComponent", () => {
  let component: BudgetHeaderComponent;
  let fixture: ComponentFixture<BudgetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("months", ["March", "April", "May", "June"]);
    fixture.componentRef.setInput("selectedMonth", "March");
    fixture.componentRef.setInput("sourceLabel", "Test source");
    fixture.componentRef.setInput("groupId", null);
    fixture.componentRef.setInput("shareEmail", "");
    fixture.componentRef.setInput("shareMessage", "");
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher les boutons de mois", () => {
    const buttons: HTMLButtonElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    // 4 month buttons + 1 reset button
    const monthButtons = buttons.filter((b) =>
      ["March", "April", "May", "June"].includes(b.textContent?.trim() ?? ""),
    );
    expect(monthButtons.length).toBe(4);
  });

  it("devrait afficher le sourceLabel", () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("Test source");
  });

  it("devrait emettre monthSelected lors du clic sur un mois", () => {
    spyOn(component.monthSelected, "emit");

    const buttons: HTMLButtonElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    const aprilButton = buttons.find((b) => b.textContent?.trim() === "April");
    aprilButton?.click();

    expect(component.monthSelected.emit).toHaveBeenCalledWith("April");
  });

  it("devrait emettre resetSample lors du clic sur Reset sample", () => {
    spyOn(component.resetSample, "emit");

    const buttons: HTMLButtonElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    const resetButton = buttons.find(
      (b) => b.textContent?.trim() === "Reset sample",
    );
    resetButton?.click();

    expect(component.resetSample.emit).toHaveBeenCalled();
  });

  it("ne devrait pas afficher la section partage sans groupId", () => {
    const shareSection =
      fixture.nativeElement.querySelector("app-budget-share");
    expect(shareSection).toBeNull();
  });

  it("devrait afficher la section partage avec un groupId", () => {
    fixture.componentRef.setInput("groupId", "group-1");
    fixture.detectChanges();

    const shareSection =
      fixture.nativeElement.querySelector("app-budget-share");
    expect(shareSection).toBeTruthy();
  });
});
