import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import type { AuthSession } from "../../core/models/auth.model";
import { APP_CONFIG } from "../../core/config/app-config.token";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { AuthService } from "../../core/services/auth.service";
import { environment } from "../../../environments/environnement";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { AuthComponent } from "./auth.component";

describe("AuthComponent", () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    localStorage.removeItem("portfolio_jwt");

    authService = jasmine.createSpyObj<AuthService>("AuthService", [
      "register",
      "login",
      "googleAuth",
    ]);

    await TestBed.configureTestingModule({
      imports: [FormsModule, AuthComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: AUTH_PORT,
          useValue: createAuthPortStub(),
        },
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Cree un mock type de NgForm via jasmine.createSpyObj (PE-012). */
  const buildForm = (invalid: boolean): NgForm =>
    jasmine.createSpyObj<NgForm>("NgForm", ["resetForm"], {
      invalid,
      valid: !invalid,
    });

  it("should call the auth service when sign up form is valid and passwords match", () => {
    const form = buildForm(false);
    component.signupForm = {
      email: "john@example.com",
      password: "Password123!",
      verifPassword: "Password123!",
      firstName: "John",
      lastName: "Doe",
      phone: "  +33 6 12 34 56 78  ",
    };
    authService.register.and.returnValue(
      of(
        buildAuthUser({
          id: "1",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+33 6 12 34 56 78",
          roles: [],
        }),
      ),
    );

    component.handleSignupSubmit(form);

    expect(authService.register).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Doe",
      phone: "+33 6 12 34 56 78",
    });
    expect(component.signupSuccessMessage).toContain("Compte créé");
  });

  it("should not call auth service when passwords do not match", () => {
    const form = buildForm(false);
    component.signupForm = {
      email: "john@example.com",
      password: "Password123!",
      verifPassword: "Password456!",
      firstName: "John",
      lastName: "Doe",
      phone: "",
    };

    component.handleSignupSubmit(form);

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.signupErrorMessage).toBeDefined();
  });

  it("should call auth service login when form is valid", () => {
    const form = buildForm(false);
    component.loginForm = {
      email: "john@example.com",
      password: "Password123!",
    };
    const session: AuthSession = buildAuthSession({
      accessToken: "token",
      expiresIn: 3600,
      user: buildAuthUser({
        id: "1",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: null,
        roles: [],
      }),
    });
    authService.login.and.returnValue(of(session));

    component.handleLoginSubmit(form);

    expect(authService.login).toHaveBeenCalledWith(component.loginForm);
    expect(component.loginSuccessMessage).toContain("Bienvenue");
  });
});
