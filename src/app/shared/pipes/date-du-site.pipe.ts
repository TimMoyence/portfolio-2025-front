import { inject, LOCALE_ID, Pipe, type PipeTransform } from '@angular/core';

const FUSEAU_DU_SITE = 'Europe/Paris';

@Pipe({ name: 'dateDuSite', standalone: true })
export class DateDuSitePipe implements PipeTransform {
  private readonly format = new Intl.DateTimeFormat(inject(LOCALE_ID), {
    dateStyle: 'long',
    timeZone: FUSEAU_DU_SITE,
  });

  transform(instant: string): string {
    return this.format.format(new Date(instant));
  }
}
