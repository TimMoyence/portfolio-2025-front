import type { ChampsAntiRobot } from './champs-anti-robot.model';

export interface ContactFormState extends ChampsAntiRobot {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  subject: string;
  message: string;
  role: string;
  terms: boolean;
  termsVersion?: string;
  termsLocale?: string;
  termsAcceptedAt?: string;
  termsMethod?: string;
}
