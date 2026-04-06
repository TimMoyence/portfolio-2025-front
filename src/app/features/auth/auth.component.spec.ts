import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import type { AuthSession } from "../../core/models/auth.model";
import { APP_CONFIG } from "../../core/config/app-config.token";
import type { AuthPort } from "../../core/ports/auth.port";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { environment } from "../../../environments/environment";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { AuthComponent } from "./auth.component";

describe("AuthComponent", () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthPort>;

  /** Configure le TestBed avec le seoKey donne et cree le composant. */
  async function setupWithSeoKey(seoKey: string): Promise<void> {
    localStorage.removeItem("portfolio_jwt");

    authService = createAuthPortStub();

    await TestBed.configureTestingModule({
      imports: [FormsModule, AuthComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AUTH_PORT,
          useValue: authService,
        },
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { seoKey },
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setupWithSeoKey("login");
  });

  it("devrait afficher l onglet connexion par defaut sur /login", () => {
    expect(component.activeTab).toBe("log-in");
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

  it("devrait basculer vers l onglet login apres inscription reussie", () => {
    const form = buildForm(false);
    component.activeTab = "sign-up";
    component.signupForm = {
      email: "john@example.com",
      password: "Password123!",
      verifPassword: "Password123!",
      firstName: "John",
      lastName: "Doe",
      phone: "",
    };
    authService.register.and.returnValue(
      of(
        buildAuthUser({
          id: "1",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
      ),
    );

    component.handleSignupSubmit(form);

    expect(component.activeTab).toBe("log-in");
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

  it("devrait rediriger vers returnUrl apres login si present", () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, "navigateByUrl");
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.queryParamMap, "get").and.callFake((key: string) =>
      key === "returnUrl" ? "/profil" : null,
    );

    const form = buildForm(false);
    component.loginForm = {
      email: "john@example.com",
      password: "Password123!",
    };
    authService.login.and.returnValue(
      of(buildAuthSession({ user: buildAuthUser({ firstName: "John" }) })),
    );

    component.handleLoginSubmit(form);

    expect(navigateSpy).toHaveBeenCalledWith("/profil");
  });

  it("devrait rediriger vers / si pas de returnUrl", () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, "navigateByUrl");

    const form = buildForm(false);
    component.loginForm = {
      email: "john@example.com",
      password: "Password123!",
    };
    authService.login.and.returnValue(
      of(buildAuthSession({ user: buildAuthUser({ firstName: "John" }) })),
    );

    component.handleLoginSubmit(form);

    expect(navigateSpy).toHaveBeenCalledWith("/");
  });

  describe("route /register", () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await setupWithSeoKey("register");
    });

    it("devrait afficher l onglet inscription par defaut sur /register", () => {
      expect(component.activeTab).toBe("sign-up");
    });
  });
});
