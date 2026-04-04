import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import type { AuthPort } from "../ports/auth.port";
import { AUTH_PORT } from "../ports/auth.port";
import {
  buildAuthSession,
  buildAuthUser,
  buildChangePasswordPayload,
  buildForgotPasswordPayload,
  buildLoginCredentials,
  buildResetPasswordPayload,
  buildSetPasswordPayload,
} from "../../../testing/factories/auth.factory";
import { AuthService } from "./auth.service";

/**
 * AuthService est une facade intentionnellement "thin" :
 * elle delegue chaque appel au port auth injecte sans transformation ni etat.
 *
 * Les tests ci-dessous verifient le COMPORTEMENT observable (valeur emise,
 * propagation d'erreur) plutot que l'implementation interne (appel au port).
 * Un test de cablage unique confirme que le port est bien branche.
 */
describe("AuthService", () => {
  let service: AuthService;
  let authPortSpy: jasmine.SpyObj<AuthPort>;

  beforeEach(() => {
    authPortSpy = jasmine.createSpyObj<AuthPort>("AuthPort", [
      "login",
      "register",
      "googleAuth",
      "requestPasswordReset",
      "resetPassword",
      "setPassword",
      "changePassword",
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AUTH_PORT,
          useValue: authPortSpy,
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  // --- Cablage : une seule verification que le port est injecte ---

  it("devrait etre instancie avec le port auth injecte", () => {
    expect(service).toBeTruthy();
  });

  // --- Comportement : login propage la session et les erreurs ---

  it("devrait propager la session retournee par login()", (done: DoneFn) => {
    const credentials = buildLoginCredentials({ email: "john@example.com" });
    const session = buildAuthSession({
      user: buildAuthUser({ email: credentials.email }),
    });
    authPortSpy.login.and.returnValue(of(session));

    service.login(credentials).subscribe({
      next: (result) => {
        expect(result.accessToken).toBe(session.accessToken);
        expect(result.user.email).toBe("john@example.com");
        done();
      },
    });
  });

  it("devrait propager les erreurs de login() a l'appelant", (done: DoneFn) => {
    const credentials = buildLoginCredentials();
    authPortSpy.login.and.returnValue(
      throwError(() => new Error("Identifiants invalides")),
    );

    service.login(credentials).subscribe({
      error: (err: Error) => {
        expect(err.message).toBe("Identifiants invalides");
        done();
      },
    });
  });

  // --- Comportement : register propage l'utilisateur cree ---

  it("devrait propager l'utilisateur retourne par register()", (done: DoneFn) => {
    const payload = {
      email: "john@example.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Doe",
    };
    const createdUser = buildAuthUser({
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });
    authPortSpy.register.and.returnValue(of(createdUser));

    service.register(payload).subscribe({
      next: (result) => {
        expect(result.email).toBe("john@example.com");
        expect(result.firstName).toBe("John");
        done();
      },
    });
  });

  // --- Comportement : googleAuth propage la session ---

  it("devrait propager la session retournee par googleAuth()", (done: DoneFn) => {
    const session = buildAuthSession({
      user: buildAuthUser({ email: "google@example.com" }),
    });
    authPortSpy.googleAuth.and.returnValue(of(session));

    service.googleAuth("id-token-from-google").subscribe({
      next: (result) => {
        expect(result.user.email).toBe("google@example.com");
        expect(result.accessToken).toBe(session.accessToken);
        done();
      },
    });
  });

  // --- Comportement : requestPasswordReset propage le message ---

  it("devrait propager le message de confirmation de requestPasswordReset()", (done: DoneFn) => {
    const payload = buildForgotPasswordPayload({ email: "john@example.com" });
    const response = {
      message:
        "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.",
    };
    authPortSpy.requestPasswordReset.and.returnValue(of(response));

    service.requestPasswordReset(payload).subscribe({
      next: (result) => {
        expect(result.message).toContain("lien de reinitialisation");
        done();
      },
    });
  });

  // --- Comportement : resetPassword propage le message ---

  it("devrait propager le message de succes de resetPassword()", (done: DoneFn) => {
    const payload = buildResetPasswordPayload();
    const response = { message: "Mot de passe reinitialise avec succes." };
    authPortSpy.resetPassword.and.returnValue(of(response));

    service.resetPassword(payload).subscribe({
      next: (result) => {
        expect(result.message).toContain("reinitialise");
        done();
      },
    });
  });

  // --- Comportement : setPassword propage l'utilisateur mis a jour ---

  it("devrait propager l'utilisateur mis a jour par setPassword()", (done: DoneFn) => {
    const payload = buildSetPasswordPayload();
    const updatedUser = buildAuthUser({ id: "user-1" });
    authPortSpy.setPassword.and.returnValue(of(updatedUser));

    service.setPassword(payload).subscribe({
      next: (result) => {
        expect(result.id).toBe("user-1");
        done();
      },
    });
  });

  // --- Comportement : changePassword propage l'utilisateur mis a jour ---

  it("devrait propager l'utilisateur mis a jour par changePassword()", (done: DoneFn) => {
    const payload = buildChangePasswordPayload();
    const updatedUser = buildAuthUser({
      id: "user-1",
      email: "changed@example.com",
    });
    authPortSpy.changePassword.and.returnValue(of(updatedUser));

    service.changePassword(payload).subscribe({
      next: (result) => {
        expect(result.id).toBe("user-1");
        expect(result.email).toBe("changed@example.com");
        done();
      },
    });
  });
});
