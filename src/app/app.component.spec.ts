import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { APP_CONFIG } from "./core/config/app-config.token";
import { COOKIE_CONSENT_PORT } from "./core/ports/cookie-consent.port";
import { environment } from "../environments/environnement";
import { AppComponent } from "./app.component";
import { createCookieConsentPortStub } from "../testing/factories/cookie-consent.factory";

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
        {
          provide: COOKIE_CONSENT_PORT,
          useValue: createCookieConsentPortStub(),
        },
      ],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'portfolio-app' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual("portfolio-app");
  });

  it("should render the navbar and router outlet shell", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-navbar")).not.toBeNull();
    expect(compiled.querySelector("router-outlet")).not.toBeNull();
  });

  it("devrait afficher le skip-link d'accessibilite", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector("app-skip-link");
    expect(skipLink).not.toBeNull();
  });

  it("devrait contenir un landmark main avec le bon role", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const main = compiled.querySelector('main[role="main"]');
    expect(main).not.toBeNull();
    expect(main?.id).toBe("main-content");
  });

  it("devrait contenir le gestionnaire SEO", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-seo-manager")).not.toBeNull();
  });

  it("devrait afficher un placeholder pour le footer en attendant le defer", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Le @defer (on viewport) n'est pas declenche en test unitaire,
    // donc on verifie que le placeholder est bien present
    const footerPlaceholder = compiled.querySelector(".h-48");
    expect(footerPlaceholder).not.toBeNull();
  });
});
