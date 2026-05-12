import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import type { AuthSession } from "../../core/models/auth.model";
import { APP_CONFIG } from "../../core/config/app-config.token";
import type { AuthPort } from "../../core/ports/auth.port";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { BUDGET_PORT } from "../../core/ports/budget.port";
import { environment } from "../../../environments/environment";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { createBudgetPortStub } from "../../../testing/factories/budget.factory";
import { AuthComponent } from "./auth.component";

describe("AuthComponent", () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthPort>;
  let budgetPortStub: ReturnType<typeof createBudgetPortStub>;

  /** Configure le TestBed avec le seoKey donne et un map de queryParams. */
  async function setupWithSeoKey(
    seoKey: string,
    queryParams: Record<string, string | null> = {},
    configureBudgetPort?: (
      stub: ReturnType<typeof createBudgetPortStub>,
    ) => void,
  ): Promise<void> {
    localStorage.removeItem("portfolio_jwt");

    authService = createAuthPortStub();
    budgetPortStub = createBudgetPortStub();
    configureBudgetPort?.(budgetPortStub);

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
          provide: BUDGET_PORT,
          useValue: budgetPortStub,
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
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
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
      of({
        message:
          "Inscription reussie. Un email de verification a ete envoye a votre adresse.",
      }),
    );

    component.handleSignupSubmit(form);

    expect(authService.register).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Doe",
      phone: "+33 6 12 34 56 78",
    });
    expect(component.signupSuccessMessage).toContain("Inscription reussie");
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
      of({
        message:
          "Inscription reussie. Un email de verification a ete envoye a votre adresse.",
      }),
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

  describe("query param ?invite= (magic-link)", () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it("ignore l'invitation quand aucun param invite n'est present", async () => {
      await setupWithSeoKey("register");
      expect(budgetPortStub.previewInvitation).not.toHaveBeenCalled();
      expect(component.inviteToken()).toBeNull();
      expect(component.invitePreview()).toBeNull();
    });

    it("appelle previewInvitation et stocke la preview quand ?invite= est present", async () => {
      const preview = {
        inviterFirstName: "Tim",
        groupName: "Budget couple T&M",
        targetEmail: "mary@test.com",
        expiresAt: "2026-05-18T15:00:00.000Z",
      };

      await setupWithSeoKey("register", { invite: "TOK123" }, (stub) => {
        stub.previewInvitation.and.returnValue(of(preview));
      });

      expect(budgetPortStub.previewInvitation).toHaveBeenCalledWith("TOK123");
      expect(component.inviteToken()).toBe("TOK123");
      expect(component.invitePreview()).toEqual(preview);
      // Email pre-rempli depuis la preview
      expect(component.signupForm.email).toBe("mary@test.com");
    });

    it("expose inviteError quand la preview retourne une erreur 404", async () => {
      await setupWithSeoKey("register", { invite: "EXPIRED" }, (stub) => {
        stub.previewInvitation.and.returnValue(
          throwError(() => ({ status: 404 })),
        );
      });

      expect(budgetPortStub.previewInvitation).toHaveBeenCalledWith("EXPIRED");
      expect(component.inviteError()).toBeTrue();
      // L'utilisateur peut quand meme s'inscrire normalement, donc token mis a null.
      expect(component.inviteToken()).toBeNull();
    });

    it("transmet inviteToken dans le payload register a la soumission", async () => {
      const preview = {
        inviterFirstName: "Tim",
        groupName: "Budget",
        targetEmail: "mary@test.com",
        expiresAt: "2026-05-18T15:00:00.000Z",
      };

      await setupWithSeoKey("register", { invite: "TOK999" }, (stub) => {
        stub.previewInvitation.and.returnValue(of(preview));
      });

      const form = jasmine.createSpyObj<NgForm>("NgForm", ["resetForm"], {
        invalid: false,
        valid: true,
      });
      component.signupForm = {
        email: "mary@test.com",
        password: "Password123!",
        verifPassword: "Password123!",
        firstName: "Mary",
        lastName: "Naumenk",
        phone: "",
      };
      authService.register.and.returnValue(
        of({ message: "Inscription reussie." }),
      );

      component.handleSignupSubmit(form);

      expect(authService.register).toHaveBeenCalledWith({
        email: "mary@test.com",
        password: "Password123!",
        firstName: "Mary",
        lastName: "Naumenk",
        phone: null,
        inviteToken: "TOK999",
      });
    });

    it("redirige vers /atelier/budget/app apres register avec inviteToken accepte", async () => {
      const preview = {
        inviterFirstName: "Tim",
        groupName: "Budget",
        targetEmail: "mary@test.com",
        expiresAt: "2026-05-18T15:00:00.000Z",
      };
      await setupWithSeoKey("register", { invite: "TOK1" }, (stub) => {
        stub.previewInvitation.and.returnValue(of(preview));
      });

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, "navigateByUrl");

      const form = jasmine.createSpyObj<NgForm>("NgForm", ["resetForm"], {
        invalid: false,
        valid: true,
      });
      component.signupForm = {
        email: "mary@test.com",
        password: "Password123!",
        verifPassword: "Password123!",
        firstName: "Mary",
        lastName: "Naumenk",
        phone: "",
      };
      authService.register.and.returnValue(
        of({ message: "Inscription reussie." }),
      );

      component.handleSignupSubmit(form);

      expect(navigateSpy).toHaveBeenCalledWith("/atelier/budget/app");
    });

    it("Google OAuth — transmet inviteToken au googleAuth et redirige /atelier/budget/app", async () => {
      const preview = {
        inviterFirstName: "Tim",
        groupName: "Budget",
        targetEmail: "mary@test.com",
        expiresAt: "2026-05-18T15:00:00.000Z",
      };
      await setupWithSeoKey("register", { invite: "GOOG-TOK" }, (stub) => {
        stub.previewInvitation.and.returnValue(of(preview));
      });

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, "navigateByUrl");
      authService.googleAuth.and.returnValue(of(buildAuthSession()));

      // Acces direct au callback prive via cast — simule la callback GIS.
      (
        component as unknown as {
          onGoogleCredential: (
            response: { credential: string },
            context: "sign-up" | "log-in",
          ) => void;
        }
      ).onGoogleCredential({ credential: "google-id-token" }, "sign-up");

      expect(authService.googleAuth).toHaveBeenCalledWith(
        "google-id-token",
        "GOOG-TOK",
      );
      expect(navigateSpy).toHaveBeenCalledWith("/atelier/budget/app");
    });

    it("Google OAuth — appelle googleAuth sans inviteToken et redirige returnUrl par defaut", async () => {
      await setupWithSeoKey("login");

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, "navigateByUrl");
      authService.googleAuth.and.returnValue(of(buildAuthSession()));

      (
        component as unknown as {
          onGoogleCredential: (
            response: { credential: string },
            context: "sign-up" | "log-in",
          ) => void;
        }
      ).onGoogleCredential({ credential: "google-id-token" }, "log-in");

      expect(authService.googleAuth).toHaveBeenCalledWith(
        "google-id-token",
        undefined,
      );
      expect(navigateSpy).toHaveBeenCalledWith("/");
    });

    it("affiche inviteWarning sans rediriger vers /atelier/budget/app quand backend signale un echec", async () => {
      const preview = {
        inviterFirstName: "Tim",
        groupName: "Budget",
        targetEmail: "mary@test.com",
        expiresAt: "2026-05-18T15:00:00.000Z",
      };
      await setupWithSeoKey("register", { invite: "TOK2" }, (stub) => {
        stub.previewInvitation.and.returnValue(of(preview));
      });

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, "navigateByUrl");

      const form = jasmine.createSpyObj<NgForm>("NgForm", ["resetForm"], {
        invalid: false,
        valid: true,
      });
      component.signupForm = {
        email: "mary@test.com",
        password: "Password123!",
        verifPassword: "Password123!",
        firstName: "Mary",
        lastName: "Naumenk",
        phone: "",
      };
      authService.register.and.returnValue(
        of({
          message: "Inscription reussie.",
          inviteWarning: {
            code: "INVITATION_EXPIRED",
            message: "Cette invitation a expire.",
          },
        }),
      );

      component.handleSignupSubmit(form);

      expect(component.inviteWarning()).toEqual({
        code: "INVITATION_EXPIRED",
        message: "Cette invitation a expire.",
      });
      expect(navigateSpy).not.toHaveBeenCalledWith("/atelier/budget/app");
    });
  });
});
