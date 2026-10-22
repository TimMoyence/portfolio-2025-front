import { inject, LOCALE_ID, Pipe, type PipeTransform } from '@angular/core';

const FUSEAU_DU_SITE = 'Europe/Paris';

export function dateDuSite(instant: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: FUSEAU_DU_SITE }).format(
    new Date(instant),
  );
}

@Pipe({ name: 'dateDuSite', standalone: true })
export class DateDuSitePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(instant: string): string {
    return dateDuSite(instant, this.locale);
  }
}
