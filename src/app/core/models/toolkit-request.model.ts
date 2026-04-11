import type { InteractionProfile } from "./interaction-profile.model";

/** Requete d'envoi du lead magnet toolkit. */
export interface ToolkitRequest {
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: string;
  /** Profil d'interaction collecte pendant la navigation (optionnel). */
  profile?: InteractionProfile;
}

/** Reponse du backend apres demande de toolkit. */
export interface ToolkitResponse {
  /** Message de confirmation affiche a l'utilisateur */
  message: string;
  /** Token d'acces a la page privee du toolkit */
  accessToken: string;
}
