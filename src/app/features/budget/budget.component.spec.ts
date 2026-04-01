import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { throwError } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { BUDGET_PORT } from "../../core/ports/budget.port";
import { createAuthPortStub } from "../../../testing/factories/auth.factory";
import { createBudgetPortStub } from "../../../testing/factories/budget.factory";
import { BudgetComponent } from "./budget.component";

describe("BudgetComponent", () => {
  let component: BudgetComponent;
  let fixture: ComponentFixture<BudgetComponent>;

  beforeEach(async () => {
    const budgetPortStub = createBudgetPortStub();
    budgetPortStub.createGroup.and.returnValue(
      throwError(() => new Error("API unreachable")),
    );

    await TestBed.configureTestingModule({
      imports: [BudgetComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: createAuthPortStub() },
        { provide: BUDGET_PORT, useValue: budgetPortStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });
});
