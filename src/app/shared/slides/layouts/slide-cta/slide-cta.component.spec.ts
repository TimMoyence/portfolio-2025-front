import { APP_BASE_HREF } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SlideCtaComponent } from './slide-cta.component';

@Component({
  standalone: true,
  imports: [SlideCtaComponent],
  template: `
    <app-slide-cta
      title="Récupère le toolkit"
      description="PDF gratuit avec mes prompts IA"
      ctaLabel="Télécharger"
      ctaHref="/formations/ia-solopreneurs/toolkit"
    />
  `,
})
class HostComponent {}

describe('SlideCtaComponent', () => {
  it('rend titre, description et bouton CTA', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.slide-cta');
    expect(root.querySelector('h2').textContent).toContain('Récupère le toolkit');
    expect(root.querySelector('p').textContent).toContain('PDF gratuit');
    const btn = root.querySelector('a.slide-cta__btn');
    expect(btn.textContent).toContain('Télécharger');
    expect(btn.getAttribute('href')).toBe('/formations/ia-solopreneurs/toolkit');
  });

  for (const [cible, attendu] of [
    ['/contact', '/en/contact'],
    ['https://github.com/', 'https://github.com/'],
  ] as const) {
    it(`mène ${cible} dans la langue de la page quand le lien est interne, tel quel sinon`, () => {
      TestBed.configureTestingModule({
        providers: [provideRouter([]), { provide: APP_BASE_HREF, useValue: '/en/' }],
      });
      const fixture = TestBed.createComponent(SlideCtaComponent);
      fixture.componentRef.setInput('title', 'Une question ?');
      fixture.componentRef.setInput('ctaLabel', 'Me contacter');
      fixture.componentRef.setInput('ctaHref', cible);
      fixture.detectChanges();

      const bouton = (fixture.nativeElement as HTMLElement).querySelector('a.slide-cta__btn');
      expect(bouton?.getAttribute('href')).toBe(attendu);
    });
  }
});
