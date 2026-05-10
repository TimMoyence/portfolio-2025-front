import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetEmptyStateComponent } from "./budget-empty-state.component";

describe("BudgetEmptyStateComponent", () => {
  let component: BudgetEmptyStateComponent;
  let fixture: ComponentFixture<BudgetEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetEmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the import CSV button", () => {
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector(
      "[data-testid='empty-import-btn']",
    );
    expect(btn).toBeTruthy();
    expect(btn?.type).toBe("button");
  });

  it("should render the create entry button", () => {
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector(
      "[data-testid='empty-create-btn']",
    );
    expect(btn).toBeTruthy();
    expect(btn?.type).toBe("button");
  });

  it("should emit importClick when import button is clicked", () => {
    let emitted = false;
    component.importClick.subscribe(() => (emitted = true));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      "[data-testid='empty-import-btn']",
    );
    btn.click();

    expect(emitted).toBeTrue();
  });

  it("should emit createClick when create button is clicked", () => {
    let emitted = false;
    component.createClick.subscribe(() => (emitted = true));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      "[data-testid='empty-create-btn']",
    );
    btn.click();

    expect(emitted).toBeTrue();
  });

  it("should contain i18n keys for title and description", () => {
    const nativeEl: HTMLElement = fixture.nativeElement;
    const title = nativeEl.querySelector("[data-testid='empty-title']");
    const desc = nativeEl.querySelector("[data-testid='empty-description']");
    expect(title).toBeTruthy();
    expect(desc).toBeTruthy();
  });
});
