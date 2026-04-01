import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import type { AuthPort } from "../ports/auth.port";
import { AUTH_PORT } from "../ports/auth.port";
import {
  buildAuthSession,
  buildAuthUser,
  buildForgotPasswordPayload,
  buildLoginCredentials,
  buildResetPasswordPayload,
  buildSetPasswordPayload,
} from "../../../testing/factories/auth.factory";
import { AuthService } from "./auth.service";

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

  it("should delegate login to the auth port", () => {
    const credentials = buildLoginCredentials({ email: "john@example.com" });
    const session = buildAuthSession({
      user: buildAuthUser({ email: credentials.email }),
    });

    authPortSpy.login.and.returnValue(of(session));

    service.login(credentials).subscribe((result) => {
      expect(result).toEqual(session);
    });

    expect(authPortSpy.login).toHaveBeenCalledWith(credentials);
  });

  it("should delegate register to the auth port", () => {
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

    service.register(payload).subscribe((result) => {
      expect(result).toEqual(createdUser);
    });

    expect(authPortSpy.register).toHaveBeenCalledWith(payload);
  });

  it("should delegate googleAuth to the auth port", () => {
    const session = buildAuthSession({
      accessToken: "google-token",
      user: buildAuthUser({ email: "google@example.com" }),
    });

    authPortSpy.googleAuth.and.returnValue(of(session));

    service.googleAuth("id-token-from-google").subscribe((result) => {
      expect(result).toEqual(session);
    });

    expect(authPortSpy.googleAuth).toHaveBeenCalledWith("id-token-from-google");
  });

  it("should delegate requestPasswordReset to the auth port", () => {
    const payload = buildForgotPasswordPayload({ email: "john@example.com" });
    const response = {
      message:
        "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.",
    };

    authPortSpy.requestPasswordReset.and.returnValue(of(response));

    service.requestPasswordReset(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(authPortSpy.requestPasswordReset).toHaveBeenCalledWith(payload);
  });

  it("should delegate resetPassword to the auth port", () => {
    const payload = buildResetPasswordPayload();
    const response = { message: "Mot de passe reinitialise avec succes." };

    authPortSpy.resetPassword.and.returnValue(of(response));

    service.resetPassword(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(authPortSpy.resetPassword).toHaveBeenCalledWith(payload);
  });

  it("should delegate setPassword to the auth port", () => {
    const payload = buildSetPasswordPayload();
    const updatedUser = buildAuthUser({ id: "user-1" });

    authPortSpy.setPassword.and.returnValue(of(updatedUser));

    service.setPassword(payload).subscribe((result) => {
      expect(result).toEqual(updatedUser);
    });

    expect(authPortSpy.setPassword).toHaveBeenCalledWith(payload);
  });
});
