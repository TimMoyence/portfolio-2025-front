import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SvgIconComponent } from "./svg-icon.component";

/** SVG brut utilise comme fixture de test. */
const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M0 0h24v24H0z"/></svg>`;

describe("SvgIconComponent", () => {
  describe("en contexte navigateur", () => {
    let component: SvgIconComponent;
    let fixture: ComponentFixture<SvgIconComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
      SvgIconComponent.clearCache();

      await TestBed.configureTestingModule({
        imports: [SvgIconComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "browser" },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      }).compileComponents();

      httpMock = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(SvgIconComponent);
      component = fixture.componentInstance;
    });

    afterEach(() => {
      httpMock.verify();
    });

    it("devrait se creer", () => {
      expect(component).toBeTruthy();
    });

    it("devrait charger une icone SVG via HTTP", () => {
      component.name = "test-icon";
      component.ngOnChanges({
        name: {
          currentValue: "test-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      const req = httpMock.expectOne("assets/icons/test-icon.svg");
      expect(req.request.method).toBe("GET");
      req.flush(MOCK_SVG);

      expect(component.svgContent).not.toBeNull();
    });

    it("devrait utiliser le cache pour les icones deja chargees", () => {
      // Premier chargement — peuple le cache
      component.name = "cached-icon";
      component.ngOnChanges({
        name: {
          currentValue: "cached-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      const req = httpMock.expectOne("assets/icons/cached-icon.svg");
      req.flush(MOCK_SVG);

      // Deuxieme chargement — doit utiliser le cache, aucune requete HTTP
      component.ngOnChanges({
        name: {
          currentValue: "cached-icon",
          previousValue: "cached-icon",
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      httpMock.expectNone("assets/icons/cached-icon.svg");
      expect(component.svgContent).not.toBeNull();
    });

    it("devrait vider le cache statique via clearCache()", () => {
      // Peuple le cache avec une icone
      component.name = "clearable-icon";
      component.ngOnChanges({
        name: {
          currentValue: "clearable-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      httpMock.expectOne("assets/icons/clearable-icon.svg").flush(MOCK_SVG);

      // Vide le cache
      SvgIconComponent.clearCache();

      // Recharge la meme icone — doit emettre une nouvelle requete HTTP
      component.ngOnChanges({
        name: {
          currentValue: "clearable-icon",
          previousValue: "clearable-icon",
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      const req = httpMock.expectOne("assets/icons/clearable-icon.svg");
      req.flush(MOCK_SVG);

      expect(component.svgContent).not.toBeNull();
    });

    it("devrait appliquer le fill currentColor par defaut", () => {
      component.name = "fill-icon";
      component.ngOnChanges({
        name: {
          currentValue: "fill-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      const req = httpMock.expectOne("assets/icons/fill-icon.svg");
      req.flush(MOCK_SVG);

      const content = component.svgContent?.toString() ?? "";
      expect(content).toContain("currentColor");
    });

    it("devrait appliquer les dimensions en rem", () => {
      component.name = "size-icon";
      component.size = 2;
      component.ngOnChanges({
        name: {
          currentValue: "size-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
        size: {
          currentValue: 2,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      const req = httpMock.expectOne("assets/icons/size-icon.svg");
      req.flush(MOCK_SVG);

      expect(component.hostWidth).toBe("2rem");
      expect(component.hostHeight).toBe("2rem");
    });

    it("devrait gerer les erreurs HTTP gracieusement", () => {
      component.name = "missing-icon";
      component.ngOnChanges({
        name: {
          currentValue: "missing-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      const req = httpMock.expectOne("assets/icons/missing-icon.svg");
      req.flush("Not Found", { status: 404, statusText: "Not Found" });

      expect(component.svgContent).toBeNull();
    });

    it("devrait avoir le role img", () => {
      expect(component.role).toBe("img");
    });

    it("ne devrait pas charger un SVG si le name contient un path traversal (../)", () => {
      spyOn(console, "warn");

      component.name = "../etc/passwd";
      component.ngOnChanges({
        name: {
          currentValue: "../etc/passwd",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      httpMock.expectNone("assets/icons/../etc/passwd.svg");
      expect(component.svgContent).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining("Nom d'icone invalide"),
      );
    });

    it("ne devrait pas charger un SVG si le name contient du HTML (<script>)", () => {
      spyOn(console, "warn");

      component.name = "<script>alert(1)</script>";
      component.ngOnChanges({
        name: {
          currentValue: "<script>alert(1)</script>",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      httpMock.expectNone("assets/icons/<script>alert(1)</script>.svg");
      expect(component.svgContent).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining("Nom d'icone invalide"),
      );
    });

    it("ne devrait pas charger un SVG si le name contient des slashes", () => {
      spyOn(console, "warn");

      component.name = "icons/malicious";
      component.ngOnChanges({
        name: {
          currentValue: "icons/malicious",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      httpMock.expectNone("assets/icons/icons/malicious.svg");
      expect(component.svgContent).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining("Nom d'icone invalide"),
      );
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let component: SvgIconComponent;
    let fixture: ComponentFixture<SvgIconComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
      SvgIconComponent.clearCache();

      await TestBed.configureTestingModule({
        imports: [SvgIconComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "server" },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      }).compileComponents();

      httpMock = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(SvgIconComponent);
      component = fixture.componentInstance;
    });

    afterEach(() => {
      httpMock.verify();
    });

    it("devrait ne pas charger d'icone en SSR", () => {
      component.name = "ssr-icon";
      component.ngOnChanges({
        name: {
          currentValue: "ssr-icon",
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      httpMock.expectNone("assets/icons/ssr-icon.svg");
      expect(component.svgContent).toBeNull();
    });
  });
});
