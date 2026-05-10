import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetMonthPickerComponent } from "./budget-month-picker.component";

describe("BudgetMonthPickerComponent", () => {
  let component: BudgetMonthPickerComponent;
  let fixture: ComponentFixture<BudgetMonthPickerComponent>;

  const availableMonths = [
    { month: 3, year: 2026 },
    { month: 4, year: 2026 },
    { month: 5, year: 2026 },
  ];

  function createComponent(
    currentMonth = 5,
    currentYear = 2026,
    months = availableMonths,
  ) {
    fixture = TestBed.createComponent(BudgetMonthPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("currentMonth", currentMonth);
    fixture.componentRef.setInput("currentYear", currentYear);
    fixture.componentRef.setInput("availableMonths", months);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetMonthPickerComponent],
    }).compileComponents();
  });

  it("should render the select element", () => {
    createComponent();
    const select: HTMLSelectElement | null =
      fixture.nativeElement.querySelector("select");
    expect(select).toBeTruthy();
  });

  it("should render all availableMonths as options", () => {
    createComponent();
    const options: NodeListOf<HTMLOptionElement> =
      fixture.nativeElement.querySelectorAll("option");
    // currentMonth (5/2026) is in availableMonths, so no extra option added
    expect(options.length).toBe(3);
  });

  it("should use French locale for month labels (mai 2026)", () => {
    createComponent(5, 2026, [{ month: 5, year: 2026 }]);
    const options: NodeListOf<HTMLOptionElement> =
      fixture.nativeElement.querySelectorAll("option");
    const labels = Array.from(options).map((o) => o.textContent?.trim());
    expect(labels).toContain("mai 2026");
  });

  it("should include currentMonth in options even if not in availableMonths", () => {
    createComponent(6, 2026, availableMonths);
    const options: NodeListOf<HTMLOptionElement> =
      fixture.nativeElement.querySelectorAll("option");
    // currentMonth 6/2026 not in availableMonths, should be prepended
    expect(options.length).toBe(4);
    expect(options[0].value).toBe("6-2026");
  });

  it("should emit monthChange event with correct month and year payload", () => {
    createComponent();
    let payload: { month: number; year: number } | undefined;
    component.monthChange.subscribe((v) => (payload = v));

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector("select");
    select.value = "3-2026";
    select.dispatchEvent(new Event("change"));

    expect(payload).toEqual({ month: 3, year: 2026 });
  });

  it("should select the currentMonth/currentYear option by default", () => {
    createComponent(4, 2026);
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector("select");
    expect(select.value).toBe("4-2026");
  });
});
