import type { LocaleDuSite } from '../config/locale-de-la-page';

export interface SignupFormState {
  email: string;
  password: string;
  verifPassword?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  locale: LocaleDuSite;
}
