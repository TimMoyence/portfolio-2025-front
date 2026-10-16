import type { ChampsAntiRobot } from './champs-anti-robot.model';
import type { InteractionProfile } from './interaction-profile.model';

export interface ToolkitRequest extends ChampsAntiRobot {
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
  accessToken?: string;
}
