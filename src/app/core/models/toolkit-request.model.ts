import type { ChampsAntiRobot } from './champs-anti-robot.model';

export interface ToolkitRequest extends ChampsAntiRobot {
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: string;
}

export interface ToolkitResponse {
  message: string;
  accessToken?: string;
}
