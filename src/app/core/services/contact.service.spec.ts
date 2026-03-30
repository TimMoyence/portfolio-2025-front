import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import type { ContactFormState } from "../models/contact.model";
import type { MessageResponse } from "../models/message.response";
import type { ContactPort } from "../ports/contact.port";
import { CONTACT_PORT } from "../ports/contact.port";
import { ContactService } from "./contact.service";

describe("ContactService", () => {
  let service: ContactService;
  let contactPortSpy: jasmine.SpyObj<ContactPort>;

  beforeEach(() => {
    contactPortSpy = jasmine.createSpyObj<ContactPort>("ContactPort", [
      "contact",
    ]);

    TestBed.configureTestingModule({
      providers: [
        ContactService,
        {
          provide: CONTACT_PORT,
          useValue: contactPortSpy,
        },
      ],
    });

    service = TestBed.inject(ContactService);
  });

  it("should delegate contact to the contact port", () => {
    const payload: ContactFormState = {
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      subject: "Collaboration",
      message: "Bonjour, je souhaite collaborer.",
      role: "developer",
      terms: true,
    };
    const response: MessageResponse = {
      message: "Message envoyé avec succès.",
      httpCode: 201,
    };

    contactPortSpy.contact.and.returnValue(of(response));

    service.contact(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(contactPortSpy.contact).toHaveBeenCalledWith(payload);
  });
});
