import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { COOKIE_CONSENT_PORT } from './core/ports/cookie-consent.port';
import { AppComponent } from './app.component';
import { createCookieConsentPortStub } from '../testing/factories/cookie-consent.factory';
import { setupTestBed } from '../testing/setup-test-bed';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p data-testid="page-routee">page</p>',
})
class PageRouteeComponent {
  static surMontage(): void {
    return;
  }

  constructor() {
    PageRouteeComponent.surMontage();
  }
}

describe('AppComponent sur une route sans coquille', () => {
  const ELEMENTS_DE_LA_COQUILLE = [
    'app-navbar',
    'app-footer',
    'app-asili-background',
    'app-skip-link',
    'main .pt-24',
  ];

  beforeEach(async () => {
    await setupTestBed({
      imports: [AppComponent],
      providers: [
        { provide: COOKIE_CONSENT_PORT, useValue: createCookieConsentPortStub() },
        provideRouter([
          { path: 'scene', component: PageRouteeComponent, data: { coquille: false } },
          { path: 'accueil', component: PageRouteeComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('retire la coquille du site sur la route qui la refuse et la rend aux autres', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const compiled = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/scene');
    fixture.detectChanges();

    for (const selecteur of ELEMENTS_DE_LA_COQUILLE) {
      expect(compiled.querySelector(selecteur)).withContext(selecteur).toBeNull();
    }
    expect(compiled.querySelector('app-cookie-banner')).toBeNull();
    expect(compiled.querySelector('main#main-content [data-testid="page-routee"]')).not.toBeNull();

    await router.navigateByUrl('/accueil');
    fixture.detectChanges();

    for (const selecteur of ELEMENTS_DE_LA_COQUILLE) {
      expect(compiled.querySelector(selecteur)).withContext(selecteur).not.toBeNull();
    }
  });

  it('ne remonte pas la page routee quand la coquille disparait', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    await router.navigateByUrl('/accueil');
    fixture.detectChanges();
    const montages = spyOn(PageRouteeComponent, 'surMontage');

    await router.navigateByUrl('/scene');
    fixture.detectChanges();
    fixture.detectChanges();

    expect(montages).toHaveBeenCalledTimes(1);
  });
});

describe('AppComponent', () => {
  beforeEach(async () => {
    await setupTestBed({
      router: true,
      imports: [AppComponent],
      providers: [
        {
          provide: COOKIE_CONSENT_PORT,
          useValue: createCookieConsentPortStub(),
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'portfolio-app' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('portfolio-app');
  });

  it('should render the navbar and router outlet shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it("devrait afficher le skip-link d'accessibilite", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('app-skip-link');
    expect(skipLink).not.toBeNull();
  });

  it('devrait contenir un landmark main avec le bon role', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const main = compiled.querySelector('main[role="main"]');
    expect(main).not.toBeNull();
    expect(main?.id).toBe('main-content');
  });

  it('place l ecran de nouvel essai de session juste avant la page routee', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main app-session-retry + router-outlet')).not.toBeNull();
  });

  it('devrait contenir le gestionnaire SEO', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-seo-manager')).not.toBeNull();
  });

  it("devrait rendre le footer immediatement (pas de defer pour que SSR/prerender l'inclue)", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const footerElement = compiled.querySelector('app-footer');
    expect(footerElement).not.toBeNull();
  });
});
