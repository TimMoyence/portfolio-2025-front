import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type { MessageResponse } from "../models/message.response";
import type { ToolkitRequest } from "../models/toolkit-request.model";

/** Port pour l'envoi de demandes de lead magnet. */
export interface LeadMagnetPort {
  requestToolkit(request: ToolkitRequest): Observable<MessageResponse>;
}

export const LEAD_MAGNET_PORT = new InjectionToken<LeadMagnetPort>(
  "LEAD_MAGNET_PORT",
);
