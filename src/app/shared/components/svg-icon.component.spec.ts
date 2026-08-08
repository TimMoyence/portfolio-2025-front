import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import type { SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvgIconComponent } from './svg-icon.component';

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M0 0h24v24H0z"/></svg>`;

const REJECTED_NAMES: readonly { readonly label: string; readonly name: string }[] = [
  { label: 'un path traversal (../)', name: '../etc/passwd' },
  { label: 'du HTML (<script>)', name: '<script>alert(1)</script>' },
  { label: 'un path traversal a travers un slash', name: 'network/../../etc/passwd' },
  { label: 'un segment vide (a//b)', name: 'network//google' },
];

function nameChange(currentValue: string, previousValue?: string): SimpleChanges {
  const firstChange = previousValue === undefined;
  return {
    name: {
      currentValue,
      previousValue,
      firstChange,
      isFirstChange: () => firstChange,
    },
  };
}

async function configureTestBed(platformId: 'browser' | 'server'): Promise<void> {
  SvgIconComponent.clearCache();

  await TestBed.configureTestingModule({
    imports: [SvgIconComponent],
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
    ],
  }).compileComponents();
}

describe('SvgIconComponent', () => {
  let component: SvgIconComponent;
  let fixture: ComponentFixture<SvgIconComponent>;
  let httpMock: HttpTestingController;

  function loadIcon(name: string, previousValue?: string): void {
    component.name = name;
    component.ngOnChanges(nameChange(name, previousValue));
  }

  afterEach(() => {
    httpMock.verify();
  });

  describe('en contexte navigateur', () => {
    beforeEach(async () => {
      await configureTestBed('browser');

      httpMock = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(SvgIconComponent);
      component = fixture.componentInstance;
    });

    it('devrait se creer', () => {
      expect(component).toBeTruthy();
    });

    it('devrait charger une icone SVG via HTTP', () => {
      loadIcon('test-icon');

      const req = httpMock.expectOne('assets/icons/test-icon.svg');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_SVG);

      expect(component.svgContent).not.toBeNull();
    });

    it('devrait utiliser le cache pour les icones deja chargees', () => {
      loadIcon('cached-icon');
      httpMock.expectOne('assets/icons/cached-icon.svg').flush(MOCK_SVG);

      component.ngOnChanges(nameChange('cached-icon', 'cached-icon'));

      httpMock.expectNone('assets/icons/cached-icon.svg');
      expect(component.svgContent).not.toBeNull();
    });

    it('devrait vider le cache statique via clearCache()', () => {
      loadIcon('clearable-icon');
      httpMock.expectOne('assets/icons/clearable-icon.svg').flush(MOCK_SVG);

      SvgIconComponent.clearCache();

      component.ngOnChanges(nameChange('clearable-icon', 'clearable-icon'));
      httpMock.expectOne('assets/icons/clearable-icon.svg').flush(MOCK_SVG);

      expect(component.svgContent).not.toBeNull();
    });

    it('devrait appliquer le fill currentColor par defaut', () => {
      loadIcon('fill-icon');

      httpMock.expectOne('assets/icons/fill-icon.svg').flush(MOCK_SVG);

      const content = component.svgContent?.toString() ?? '';
      expect(content).toContain('currentColor');
    });

    it('devrait appliquer les dimensions en rem', () => {
      component.name = 'size-icon';
      component.size = 2;
      component.ngOnChanges({
        ...nameChange('size-icon'),
        size: {
          currentValue: 2,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      httpMock.expectOne('assets/icons/size-icon.svg').flush(MOCK_SVG);

      expect(component.hostWidth).toBe('2rem');
      expect(component.hostHeight).toBe('2rem');
    });

    it('devrait gerer les erreurs HTTP gracieusement', () => {
      loadIcon('missing-icon');

      httpMock
        .expectOne('assets/icons/missing-icon.svg')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(component.svgContent).toBeNull();
    });

    it('devrait avoir le role img', () => {
      expect(component.role).toBe('img');
    });

    it('devrait charger une icone en sous-dossier (network/google)', () => {
      spyOn(console, 'warn');

      loadIcon('network/google');

      const req = httpMock.expectOne('assets/icons/network/google.svg');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_SVG);

      expect(component.svgContent).not.toBeNull();
      expect(console.warn).not.toHaveBeenCalled();
    });

    for (const { label, name } of REJECTED_NAMES) {
      it(`ne devrait pas charger un SVG si le name contient ${label}`, () => {
        spyOn(console, 'warn');

        loadIcon(name);

        httpMock.expectNone(`assets/icons/${name}.svg`);
        expect(component.svgContent).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(jasmine.stringContaining("Nom d'icone invalide"));
      });
    }
  });

  describe('en contexte serveur (SSR)', () => {
    beforeEach(async () => {
      await configureTestBed('server');

      httpMock = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(SvgIconComponent);
      component = fixture.componentInstance;
    });

    it("devrait ne pas charger d'icone en SSR", () => {
      loadIcon('ssr-icon');

      httpMock.expectNone('assets/icons/ssr-icon.svg');
      expect(component.svgContent).toBeNull();
    });
  });
});
