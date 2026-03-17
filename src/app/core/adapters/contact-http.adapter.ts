import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
import type { ContactFormState } from "../models/contact.model";
import type { MessageResponse } from "../models/message.response";
import type { ContactPort } from "../ports/contact.port";

@Injectable()
export class ContactHttpAdapter implements ContactPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  contact(credentials: ContactFormState): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.baseUrl}contacts`,
      credentials,
    );
  }
}
