import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type { ContactFormState } from "../models/contact.model";
import type { MessageResponse } from "../models/message.response";

export interface ContactPort {
  contact(credentials: ContactFormState): Observable<MessageResponse>;
}

export const CONTACT_PORT = new InjectionToken<ContactPort>("CONTACT_PORT");
