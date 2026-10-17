export const LOCALES_DU_SITE = ['fr', 'en'] as const;

export const langueDuSite = (localeId: string): string => localeId.toLowerCase().split('-')[0];
