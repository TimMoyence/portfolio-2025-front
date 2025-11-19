export interface SignupFormState {
  email: string;
  password: string;
  verifPassword?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}
