import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type { ToolkitPageData } from "../models/toolkit-page.model";
import type {
  ToolkitRequest,
  ToolkitResponse,
} from "../models/toolkit-request.model";

/** Port pour l'envoi de demandes de lead magnet et consultation du toolkit. */
export interface LeadMagnetPort {
  /** Envoie une demande de toolkit et retourne le token d'acces. */
  requestToolkit(request: ToolkitRequest): Observable<ToolkitResponse>;
  /** Recupere les donnees du toolkit prive via son token. */
  getToolkitByToken(token: string): Observable<ToolkitPageData>;
}

export const LEAD_MAGNET_PORT = new InjectionToken<LeadMagnetPort>(
  "LEAD_MAGNET_PORT",
);
