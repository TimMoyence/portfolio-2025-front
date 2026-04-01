import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environnement";
import { APP_CONFIG } from "../config/app-config.token";
import {
  buildAuthSession,
  buildAuthUser,
  buildForgotPasswordPayload,
  buildLoginCredentials,
  buildResetPasswordPayload,
  buildSetPasswordPayload,
} from "../../../testing/factories/auth.factory";
import { AuthHttpAdapter } from "./auth-http.adapter";

describe("AuthHttpAdapter", () => {
  let adapter: AuthHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    });

    adapter = TestBed.inject(AuthHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should POST credentials to the login endpoint", () => {
    const credentials = buildLoginCredentials();
    const response = buildAuthSession({
      user: buildAuthUser({ email: credentials.email }),
    });

    adapter.login(credentials).subscribe((session) => {
      expect(session).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(credentials);
    req.flush(response);
  });

  it("should POST payload to the register endpoint", () => {
    const payload = {
      email: "john@example.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Doe",
      phone: "+33123456789",
    };

    const user = buildAuthUser({
      id: "generated-id",
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
    });

    adapter.register(payload).subscribe((createdUser) => {
      expect(createdUser).toEqual(user);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(user);
  });

  it("should POST idToken to /auth/google", () => {
    const session = buildAuthSession();

    adapter.googleAuth("google-id-token").subscribe((result) => {
      expect(result).toEqual(session);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/google`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ idToken: "google-id-token" });
    req.flush(session);
  });

  it("should POST email to /auth/forgot-password", () => {
    const payload = buildForgotPasswordPayload({ email: "john@example.com" });
    const response = {
      message:
        "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.",
    };

    adapter.requestPasswordReset(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/auth/forgot-password`,
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it("should POST token and password to /auth/reset-password", () => {
    const payload = buildResetPasswordPayload();
    const response = { message: "Mot de passe reinitialise avec succes." };

    adapter.resetPassword(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/auth/reset-password`,
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it("should POST password to /auth/set-password", () => {
    const payload = buildSetPasswordPayload();
    const user = buildAuthUser({ id: "user-1", email: "john@example.com" });

    adapter.setPassword(payload).subscribe((result) => {
      expect(result).toEqual(user);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/auth/set-password`,
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(user);
  });
});
