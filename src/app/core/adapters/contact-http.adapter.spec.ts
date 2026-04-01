import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environnement";
import { APP_CONFIG } from "../config/app-config.token";
import type { ContactFormState } from "../models/contact.model";
import type { MessageResponse } from "../models/message.response";
import { ContactHttpAdapter } from "./contact-http.adapter";

describe("ContactHttpAdapter", () => {
  let adapter: ContactHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ContactHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    });

    adapter = TestBed.inject(ContactHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should POST contact form data to the contacts endpoint", () => {
    const payload: ContactFormState = {
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+33123456789",
      subject: "Collaboration",
      message: "Bonjour, je souhaite collaborer.",
      role: "developer",
      terms: true,
      termsVersion: "2026-02-11",
      termsLocale: "fr",
      termsAcceptedAt: "2026-03-01T10:00:00Z",
      termsMethod: "checkbox",
    };
    const response: MessageResponse = {
      message: "Message envoyé avec succès.",
      httpCode: 201,
    };

    adapter.contact(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/contacts`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it("should propagate HTTP errors", () => {
    const payload: ContactFormState = {
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      subject: "Test",
      message: "Test message",
      role: "other",
      terms: true,
    };

    adapter.contact(payload).subscribe({
      next: () => fail("should have failed"),
      error: (error) => {
        expect(error.status).toBe(422);
      },
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/contacts`);
    req.flush("Validation error", {
      status: 422,
      statusText: "Unprocessable Entity",
    });
  });
});
