import type { CookieConsentRequestDto } from '../../../../contrat/types.gen';

export type CookieConsentState = Pick<
  CookieConsentRequestDto,
  'policyVersion' | 'locale' | 'region' | 'preferences'
> & { updatedAt: string };
