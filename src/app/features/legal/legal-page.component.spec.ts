import { APP_BASE_HREF } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { isolateAnimReady } from '../../../testing/anim-ready';
import { cliquerSansQuitterLaPage } from '../../../testing/montage-page';
import { LegalPageComponent, type LegalTocItem } from './legal-page.component';

const SOMMAIRE: readonly LegalTocItem[] = [
  { anchor: 'principe', label: 'Notre principe' },
  { anchor: 'droits', label: 'Vos droits' },
];

@Component({
  standalone: true,
  imports: [LegalPageComponent],
  template: `
    <app-legal-page kicker="Vos données" texte="conditions" [toc]="toc">
      <ng-container title>Politique de <em>confidentialité</em>.</ng-container>
      <section id="principe">
        <h2>1. Notre principe</h2>
        <p>Clarté et sobriété.</p>
        <div class="lg-note">Aucune publicité.</div>
      </section>
    </app-legal-page>
  `,
})
class PageHoteComponent {
  readonly toc = SOMMAIRE;
}

describe('LegalPageComponent', () => {
  let harnais: RouterTestingHarness;
  let page: HTMLElement;

  isolateAnimReady();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: APP_BASE_HREF, useValue: '/en/' },
        provideRouter([{ path: 'privacy', component: PageHoteComponent }]),
      ],
    });
    harnais = await RouterTestingHarness.create('/privacy');
    page = harnais.fixture.nativeElement as HTMLElement;
    document.body.appendChild(page);
    harnais.detectChanges();
  });

  afterEach(() => {
    harnais.fixture.destroy();
    page.remove();
  });

  it('rend le hero : kicker, titre projete en <h1> et date de mise a jour', () => {
    expect(page.querySelector('.lg-hero .kicker')?.textContent).toBe('Vos données');
    const titre = page.querySelector('.lg-hero h1') as HTMLElement;
    expect(titre.textContent?.trim()).toBe('Politique de confidentialité.');
    expect(getComputedStyle(titre.querySelector('em') as HTMLElement).fontStyle).toBe('italic');
    expect(page.querySelector('.lg-hero .updated')?.textContent).toBe(
      'Dernière mise à jour : 4 juin 2026',
    );
  });

  it('rend le sommaire comme une liste de liens vers les ancres du corps, sur la page courante', async () => {
    const sommaire = page.querySelector('nav.lg-toc') as HTMLElement;
    expect(sommaire.getAttribute('aria-label')).toBe('Sommaire');
    const liens = Array.from(sommaire.querySelectorAll<HTMLAnchorElement>('ol li a'));
    expect(liens.map((lien) => [lien.getAttribute('href'), lien.textContent])).toEqual([
      ['/en/privacy#principe', 'Notre principe'],
      ['/en/privacy#droits', 'Vos droits'],
    ]);

    expect(cliquerSansQuitterLaPage(liens[1]).priseParLeRouteur).toBeTrue();
    await harnais.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/privacy#droits');
  });

  it('projette le corps de la page dans .lg-body et lui applique la typographie legale', () => {
    const section = page.querySelector('.lg-layout .lg-body section#principe') as HTMLElement;
    expect(section).not.toBeNull();
    expect(getComputedStyle(section).scrollMarginTop).toBe('100px');
    expect(getComputedStyle(section.querySelector('h2') as HTMLElement).marginBottom).toBe('20px');
    expect(getComputedStyle(section.querySelector('p') as HTMLElement).lineHeight).not.toBe(
      'normal',
    );
    expect(getComputedStyle(section.querySelector('.lg-note') as HTMLElement).paddingLeft).toBe(
      '22px',
    );
  });
});
