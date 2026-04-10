import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type { SlideInteractions } from "../../shared/models/slide.model";

/** Réponse de l'API interactions de présentation. */
export interface PresentationInteractionsResponse {
  slug: string;
  interactions: Record<string, SlideInteractions>;
}

/** Port pour récupérer les interactions d'une présentation. */
export interface PresentationPort {
  getInteractions(slug: string): Observable<PresentationInteractionsResponse>;
}

export const PRESENTATION_PORT = new InjectionToken<PresentationPort>(
  "PRESENTATION_PORT",
);
