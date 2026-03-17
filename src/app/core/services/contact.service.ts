import { Inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import type { ContactFormState } from "../models/contact.model";
import type { MessageResponse } from "../models/message.response";
import type { ContactPort } from "../ports/contact.port";
import { CONTACT_PORT } from "../ports/contact.port";

@Injectable({
  providedIn: "root",
})
export class ContactService {
  constructor(
    @Inject(CONTACT_PORT) private readonly contactPort: ContactPort,
  ) {}

  contact(credentials: ContactFormState): Observable<MessageResponse> {
    return this.contactPort.contact(credentials);
  }
}
