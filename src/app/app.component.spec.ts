import { APP_BASE_HREF } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AUTH_PORT } from './core/ports/auth.port';
import { AppComponent } from './app.component';
import { createAuthPortStub } from '../testing/factories/auth.factory';
import { cliquerSansQuitterLaPage } from '../testing/montage-page';
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

const portsDeLaCoquille = (): Provider[] => [
  { provide: AUTH_PORT, useValue: createAuthPortStub() },
];

const preparerLApplication = (...providers: (Provider | EnvironmentProviders)[]): Promise<void> =>
  setupTestBed({
    imports: [AppComponent],
    providers: [...portsDeLaCoquille(), ...providers],
  }).compileComponents();

const ouvrirLaRoute = async (
  url: string,
): Promise<{ fixture: ComponentFixture<AppComponent>; compiled: HTMLElement; router: Router }> => {
  const fixture = TestBed.createComponent(AppComponent);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, router };
};

describe('AppComponent sur une route sans coquille', () => {
  const ELEMENTS_DE_LA_COQUILLE = [
    'app-navbar',
    'app-footer',
    'app-asili-background',
    'app-skip-link',
    'main .pt-24',
    'main app-adresse-a-verifier',
  ];

  beforeEach(() =>
    preparerLApplication(
      provideRouter([
        { path: 'scene', component: PageRouteeComponent, data: { coquille: false } },
        { path: 'accueil', component: PageRouteeComponent },
      ]),
    ),
  );

  it('retire la coquille du site sur la route qui la refuse et la rend aux autres', async () => {
    const { fixture, compiled, router } = await ouvrirLaRoute('/scene');

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
      providers: portsDeLaCoquille(),
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

describe("AppComponent : le lien d'evitement", () => {
  beforeEach(() =>
    preparerLApplication(
      { provide: APP_BASE_HREF, useValue: '/en/' },
      provideRouter([{ path: 'formations', component: PageRouteeComponent }]),
    ),
  );

  it('mene au contenu principal de la page courante, dans sa langue, et le contenu peut prendre le focus', async () => {
    const { compiled, router } = await ouvrirLaRoute('/formations?ref=menu');
    const lien = compiled.querySelector<HTMLAnchorElement>('a.skip-link');

    expect(lien?.getAttribute('href')).toBe('/en/formations?ref=menu#main-content');

    const navigation = spyOn(router, 'navigateByUrl').and.callThrough();
    expect(cliquerSansQuitterLaPage(lien as HTMLElement).priseParLeRouteur).toBeTrue();
    await navigation.calls.mostRecent()?.returnValue;

    expect(router.url).toBe('/formations?ref=menu#main-content');
    const contenu = compiled.querySelector<HTMLElement>('main#main-content');
    document.body.appendChild(compiled);
    contenu?.focus();
    expect(document.activeElement).toBe(contenu);
    compiled.remove();
  });
});
