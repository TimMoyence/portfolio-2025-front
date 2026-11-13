import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEWSLETTER_PORT } from '../../../../core/ports/newsletter.port';
import { createNewsletterPortStub } from '../../../../../testing/factories/newsletter.factory';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { NewsletterFormComponent } from './newsletter-form.component';

@Component({
  standalone: true,
  imports: [NewsletterFormComponent],
  template: `<app-newsletter-form /><app-newsletter-form />`,
})
class PageAvecDeuxBlocsComponent {}

describe('Deux blocs Newsletter sur la meme page', () => {
  it('NL-01 · chaque bloc nomme son propre titre et mene a la politique depuis toute page', async () => {
    await setupTestBed({
      http: false,
      router: true,
      imports: [PageAvecDeuxBlocsComponent],
      providers: [{ provide: NEWSLETTER_PORT, useValue: createNewsletterPortStub() }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PageAvecDeuxBlocsComponent);
    fixture.detectChanges();
    const hote: HTMLElement = fixture.nativeElement;

    const blocs = Array.from(hote.querySelectorAll('section'));
    const titres = blocs.map((bloc) => bloc.getAttribute('aria-labelledby'));
    expect(new Set(titres).size).toBe(2);
    for (const bloc of blocs) {
      const id = bloc.getAttribute('aria-labelledby') ?? '';
      expect(hote.querySelectorAll(`[id="${id}"]`).length).toBe(1);
      expect(bloc.querySelector(`[id="${id}"]`)?.tagName).toBe('H2');
      expect(bloc.querySelector('a')?.getAttribute('href')).toBe('/privacy');
    }
  });
});
