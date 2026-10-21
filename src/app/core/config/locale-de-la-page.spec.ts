import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { injecterLocaleDeLaPage, localeDeLaPage } from './locale-de-la-page';

describe('localeDeLaPage', () => {
  it('sert l anglais a la locale anglaise, quelle que soit sa casse', () => {
    expect(localeDeLaPage('EN-US', '/articles')).toBe('en');
  });

  it('sert l anglais sous le prefixe /en meme quand la locale de build est francaise', () => {
    expect(localeDeLaPage('fr', '/en/articles')).toBe('en');
  });

  it('sert le francais par defaut', () => {
    expect(localeDeLaPage('fr', '/articles')).toBe('fr');
  });

  it('ne prend pas pour le prefixe /en un segment qui commence par en', () => {
    expect(localeDeLaPage('fr', '/enquete')).toBe('fr');
    expect(localeDeLaPage('fr', '/en')).toBe('en');
  });
});

describe('injecterLocaleDeLaPage', () => {
  it('lit la locale de build injectee', () => {
    setupTestBed({ http: false, providers: [{ provide: LOCALE_ID, useValue: 'en-US' }] });

    expect(TestBed.runInInjectionContext(() => injecterLocaleDeLaPage())).toBe('en');
  });
});
