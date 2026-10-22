import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateDuSitePipe } from './date-du-site.pipe';

function pipeEn(locale: string): DateDuSitePipe {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  return TestBed.runInInjectionContext(() => new DateDuSitePipe());
}

describe('DateDuSitePipe', () => {
  it('date une publication du soir au jour de Paris, quel que soit le fuseau qui rend la page', () => {
    expect(pipeEn('fr').transform('2026-10-21T22:30:00Z')).toBe('22 octobre 2026');
  });

  it('suit l heure d hiver de Paris', () => {
    const pipe = pipeEn('fr');

    expect(pipe.transform('2026-12-31T23:30:00Z')).toBe('1 janvier 2027');
    expect(pipe.transform('2026-12-31T22:30:00Z')).toBe('31 décembre 2026');
  });

  it('ecrit la date dans la langue de la page', () => {
    expect(pipeEn('en').transform('2026-10-21T22:30:00Z')).toBe('October 22, 2026');
  });
});
