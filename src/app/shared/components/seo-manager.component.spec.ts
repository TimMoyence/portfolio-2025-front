import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Subject, of } from "rxjs";
import { APP_CONFIG } from "../../core/config/app-config.token";
import type { AppConfig } from "../../core/config/app-config.model";
import {
  SeoRegistryService,
  SeoResolvedConfig,
} from "../../core/seo/seo-registry.service";
import type { SeoConfig } from "../../core/seo/seo.interface";
import { SeoService } from "../../core/seo/seo.service";
import { SeoManagerComponent } from "./seo-manager.component";

describe("SeoManagerComponent", () => {
  let component: SeoManagerComponent;
  let fixture: ComponentFixture<SeoManagerComponent>;
  let routerEvents$: Subject<NavigationEnd>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let seoRegistrySpy: jasmine.SpyObj<SeoRegistryService>;
  let activatedRouteStub: {
    firstChild: ActivatedRoute | null;
    outlet: string;
    data: Subject<Record<string, unknown>>;
  };
  let routeData$: Subject<Record<string, unknown>>;

  const mockAppConfig: AppConfig = {
    production: false,
    appName: "test",
    apiBaseUrl: "http://localhost:3000/api/v1/portfolio25/",
    baseUrl: "https://example.com",
    external: { sebastianUrl: "" },
  };

  const baseSeoConfig: SeoConfig = {
    title: "Page de test",
    description: "Description de test",
    keywords: ["test", "seo"],
    ogImage: "/assets/images/test.webp",
    twitterCard: "summary_large_image",
  };

  const resolvedConfig: SeoResolvedConfig = {
    seo: baseSeoConfig,
    index: true,
    page: {
      id: "test-page",
      path: "/test",
      index: true,
      locales: {
        fr: {
          title: "Page de test",
          description: "Description de test",
        },
      },
    },
  };

  beforeEach(async () => {
    routerEvents$ = new Subject<NavigationEnd>();
    routeData$ = new Subject<Record<string, unknown>>();

    seoServiceSpy = jasmine.createSpyObj<SeoService>("SeoService", [
      "updateSeoMetadata",
    ]);

    seoRegistrySpy = jasmine.createSpyObj<SeoRegistryService>(
      "SeoRegistryService",
      [
        "getSeoByKey",
        "getSeoByPath",
        "getLocales",
        "getDefaultLocale",
        "getLocaleId",
        "getBaseUrl",
      ],
    );
    seoRegistrySpy.getLocales.and.returnValue(["fr", "en"]);
    seoRegistrySpy.getDefaultLocale.and.returnValue("fr");
    seoRegistrySpy.getLocaleId.and.returnValue("fr");
    seoRegistrySpy.getBaseUrl.and.returnValue("https://example.com");
    seoRegistrySpy.getSeoByKey.and.returnValue(of(resolvedConfig));
    seoRegistrySpy.getSeoByPath.and.returnValue(of(null));

    activatedRouteStub = {
      firstChild: null,
      outlet: "primary",
      data: routeData$,
    };

    const routerStub = {
      events: routerEvents$.asObservable(),
      url: "/fr/test",
    };

    await TestBed.configureTestingModule({
      imports: [SeoManagerComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: SeoRegistryService, useValue: seoRegistrySpy },
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeoManagerComponent);
    component = fixture.componentInstance;
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait appliquer la config SEO depuis les route data", () => {
    const routeDataSeo: SeoConfig = {
      title: "Titre depuis route data",
      description: "Description depuis route data",
      ogImage: "/assets/images/route.webp",
      twitterCard: "summary_large_image",
    };

    fixture.detectChanges();

    routerEvents$.next(new NavigationEnd(1, "/fr/test", "/fr/test"));
    routeData$.next({ seo: routeDataSeo });

    expect(seoServiceSpy.updateSeoMetadata).toHaveBeenCalledTimes(1);
    const call = seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
    expect(call.title).toBe("Titre depuis route data");
    expect(call.description).toBe("Description depuis route data");
  });

  it("devrait appliquer la config SEO depuis le registre par cle", () => {
    seoRegistrySpy.getSeoByKey.and.returnValue(of(resolvedConfig));

    fixture.detectChanges();

    routerEvents$.next(new NavigationEnd(1, "/fr/test", "/fr/test"));
    routeData$.next({ seoKey: "test-page" });

    expect(seoRegistrySpy.getSeoByKey).toHaveBeenCalledWith("test-page");
    expect(seoServiceSpy.updateSeoMetadata).toHaveBeenCalledTimes(1);
    const call = seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
    expect(call.title).toBe("Page de test");
  });

  it("devrait appliquer la config SEO par defaut si aucune config fournie", () => {
    seoRegistrySpy.getSeoByPath.and.returnValue(of(null));

    fixture.detectChanges();

    routerEvents$.next(new NavigationEnd(1, "/fr/unknown", "/fr/unknown"));
    routeData$.next({});

    expect(seoServiceSpy.updateSeoMetadata).toHaveBeenCalledTimes(1);
    const call = seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
    expect(call.robots).toBe("index, follow");
    expect(call.canonicalUrl).toContain("https://example.com");
  });

  it("devrait construire les hreflangs pour toutes les locales", () => {
    seoRegistrySpy.getSeoByKey.and.returnValue(of(resolvedConfig));

    fixture.detectChanges();

    routerEvents$.next(new NavigationEnd(1, "/fr/test", "/fr/test"));
    routeData$.next({ seoKey: "test-page" });

    const call = seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
    expect(call.hreflangs).toBeDefined();
    expect(call.hreflangs!["fr"]).toBe("https://example.com/fr/test");
    expect(call.hreflangs!["en"]).toBe("https://example.com/en/test");
    expect(call.hreflangs!["x-default"]).toBe("https://example.com/fr/test");
  });

  it("devrait construire les URLs canoniques correctement", () => {
    seoRegistrySpy.getSeoByKey.and.returnValue(of(resolvedConfig));

    fixture.detectChanges();

    routerEvents$.next(new NavigationEnd(1, "/fr/test", "/fr/test"));
    routeData$.next({ seoKey: "test-page" });

    const call = seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
    expect(call.canonicalUrl).toBe("https://example.com/fr/test");
    expect(call.ogUrl).toBe("https://example.com/fr/test");
  });

  it("devrait resoudre les URLs absolues pour ogImage", () => {
    const configAvecImageRelative: SeoResolvedConfig = {
      ...resolvedConfig,
      seo: {
        ...baseSeoConfig,
        ogImage: "/assets/images/og.webp",
      },
    };
    seoRegistrySpy.getSeoByKey.and.returnValue(of(configAvecImageRelative));

    fixture.detectChanges();

    routerEvents$.next(new NavigationEnd(1, "/fr/test", "/fr/test"));
    routeData$.next({ seoKey: "test-page" });

    const call = seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
    expect(call.ogImage).toBe("https://example.com/assets/images/og.webp");
  });
});
