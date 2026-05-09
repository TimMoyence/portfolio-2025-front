import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  BudgetTransactionsTableComponent,
  BudgetTransactionView,
} from "./budget-transactions-table.component";

const view = (
  overrides: Partial<BudgetTransactionView> = {},
): BudgetTransactionView => ({
  id: "tx-1",
  dateLabel: "01/03",
  description: "Carrefour",
  type: "card_payment",
  state: "COMPLETED",
  amountLabel: "-12,50 €",
  isExpense: true,
  category: "Courses",
  ...overrides,
});

describe("BudgetTransactionsTableComponent", () => {
  let fixture: ComponentFixture<BudgetTransactionsTableComponent>;
  let component: BudgetTransactionsTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetTransactionsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetTransactionsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("transactions", [view()]);
    fixture.componentRef.setInput("categories", ["Courses", "Logement"]);
    fixture.detectChanges();
  });

  it("renders a delete button per transaction with a non-empty aria-label (B5)", () => {
    const deleteBtns = fixture.nativeElement.querySelectorAll(
      '[data-testid="delete-entry"]',
    );
    expect(deleteBtns.length).toBe(1);
    const ariaLabel = deleteBtns[0].getAttribute("aria-label") ?? "";
    expect(ariaLabel.length).toBeGreaterThan(0);
    expect(ariaLabel).toContain("Carrefour");
  });

  it("emits deleteRequested with the transaction id on click (B5)", () => {
    const emitted: string[] = [];
    component.deleteRequested.subscribe((id: string) => emitted.push(id));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="delete-entry"]',
    );
    btn.click();

    expect(emitted).toEqual(["tx-1"]);
  });
});
