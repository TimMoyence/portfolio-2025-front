import { inject, LOCALE_ID, Pipe, type PipeTransform } from '@angular/core';

const FUSEAU_DU_SITE = 'Europe/Paris';

function auFuseauDuSite(
  options: Intl.DateTimeFormatOptions,
): (instant: string, locale: string) => string {
  return (instant, locale) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: FUSEAU_DU_SITE }).format(
      new Date(instant),
    );
}

export const dateDuSite = auFuseauDuSite({ dateStyle: 'long' });

export const heureDuSite = auFuseauDuSite({ timeStyle: 'medium' });

const FORMATS_DE_JOUR = {
  entier: auFuseauDuSite({ dateStyle: 'full' }),
  court: auFuseauDuSite({ day: 'numeric', month: 'short' }),
} as const;

@Pipe({ name: 'dateDuSite', standalone: true })
export class DateDuSitePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(instant: string): string {
    return dateDuSite(instant, this.locale);
  }
}

@Pipe({ name: 'jourDuSite', standalone: true })
export class JourDuSitePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(instant: string, format: keyof typeof FORMATS_DE_JOUR = 'entier'): string {
    return FORMATS_DE_JOUR[format](instant, this.locale);
  }
}
