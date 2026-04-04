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
import { AuthStateService } from "../../core/services/auth-state.service";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { createBudgetPortStub } from "../../../testing/factories/budget.factory";
import { BudgetComponent } from "./budget.component";

describe("BudgetComponent", () => {
  let component: BudgetComponent;
  let fixture: ComponentFixture<BudgetComponent>;
  let authState: AuthStateService;

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

    authState = TestBed.inject(AuthStateService);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(BudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("devrait se creer", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("devrait afficher le composant applicatif quand l utilisateur a le role budget", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["budget"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-common-budget-tm");
    const presEl = fixture.nativeElement.querySelector(
      "app-budget-presentation",
    );
    expect(appEl).toBeTruthy();
    expect(presEl).toBeNull();
  });

  it("devrait afficher la presentation quand l utilisateur n est pas connecte", () => {
    // Arrange — aucun login

    // Act
    createComponent();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-common-budget-tm");
    const presEl = fixture.nativeElement.querySelector(
      "app-budget-presentation",
    );
    expect(appEl).toBeNull();
    expect(presEl).toBeTruthy();
  });

  it("devrait afficher la presentation quand l utilisateur n a pas le role budget", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["weather"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-common-budget-tm");
    const presEl = fixture.nativeElement.querySelector(
      "app-budget-presentation",
    );
    expect(appEl).toBeNull();
    expect(presEl).toBeTruthy();
  });

  it("hasAccess devrait retourner true si connecte avec le bon role", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["budget"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.hasAccess()).toBeTrue();
  });

  it("hasAccess devrait retourner false si non connecte", () => {
    // Arrange — aucun login

    // Act
    createComponent();

    // Assert
    expect(component.hasAccess()).toBeFalse();
  });
});
