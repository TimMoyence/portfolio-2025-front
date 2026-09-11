import type { InteractionProfile } from './interaction-profile.model';

export interface ToolkitRequest {
  website?: string;
  formStartedAt?: number;
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: string;
  profile?: InteractionProfile;
}

export interface ToolkitResponse {
  message: string;
  accessToken: string;
}
