import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import type { MessageResponse } from "../models/message.response";
import { CONTACT_PORT } from "../ports/contact.port";
import { ContactService } from "./contact.service";
import {
  buildContactPayload,
  createContactPortStub,
} from "../../../testing/factories/contact.factory";

describe("ContactService", () => {
  let service: ContactService;
  let contactPortSpy: ReturnType<typeof createContactPortStub>;

  beforeEach(() => {
    contactPortSpy = createContactPortStub();

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
    const payload = buildContactPayload();
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
