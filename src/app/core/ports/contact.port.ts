import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { ContactFormState } from "../models/contact.model";
import { MessageResponse } from "../models/message.response";

export interface ContactPort {
  contact(credentials: ContactFormState): Observable<MessageResponse>;
}

export const CONTACT_PORT = new InjectionToken<ContactPort>("CONTACT_PORT");
