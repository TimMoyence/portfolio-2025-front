import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { BudgetPresentationComponent } from "./budget-presentation.component";

describe("BudgetPresentationComponent", () => {
  let component: BudgetPresentationComponent;
  let fixture: ComponentFixture<BudgetPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetPresentationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });
});
