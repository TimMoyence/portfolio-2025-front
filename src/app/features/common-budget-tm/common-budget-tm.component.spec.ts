import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CommonBudgetTmComponent } from "./common-budget-tm.component";

describe("CommonBudgetTmComponent", () => {
  let component: CommonBudgetTmComponent;
  let fixture: ComponentFixture<CommonBudgetTmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonBudgetTmComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonBudgetTmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
