import type { ComponentFixture } from '@angular/core/testing';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import {
  poserLePressePapiers,
  rendreLePressePapiers,
} from '../../../../testing/dom/presse-papiers';
import {
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../../testing/factories/formations/formations.factory';
import { poserLesEntrees } from '../../../../testing/page/montage-page';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import {
  TRI_CORRIGE,
  buildVerdictDuTri,
  buildRecitVisuel,
  buildVisualIllustrationSlide,
  buildVisualImageHeroSlide,
  buildVisualImageSlide,
  buildVisualPromptSlide,
  buildVisualSlide,
  PROMPT_DE_L_ANALYSTE,
  buildVisualSortCorrectionSlide,
} from '../../../../testing/factories/formations/visual-slide.factory';
import type { RetourBrique } from '../../../core/ports/formations.port';
import { SlideVisualComponent } from './slide-visual.component';

describe('SlideVisualComponent', () => {
  beforeEach(() => setupTestBed({ imports: [SlideVisualComponent] }));

  it('rend un écran B2 avec le composant du design system et les textes du serveur', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualSlide());
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-slide-hero')).not.toBeNull();
    expect(element.textContent).toContain('Lire un chiffre');
    expect(element.textContent).toContain('Contrôler avant de décider');
  });

  it('affiche un message lorsque le layout reçu est inconnu', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput(
      'slide',
      buildVisualSlide({
        donnees: { recit: { presentation: { version: 2, renderer: 'introuvable', props: {} } } },
      }),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });

  it('transmet la priorite de chargement au hero de l ecran prioritaire', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualImageHeroSlide());
    fixture.componentRef.setInput('prioritaire', true);
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('.slide-hero__bg img');
    expect(img?.getAttribute('loading')).toBe('eager');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
  });

  it('laisse le chargement differe aux ecrans qui ne sont pas prioritaires', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualImageHeroSlide());
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('.slide-hero__bg img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  for (const renderer of ['image-left', 'image-right'] as const) {
    it(`${renderer} · charge sans différer toutes les images de l écran prioritaire`, () => {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildVisualImageSlide(renderer));
      fixture.componentRef.setInput('prioritaire', true);
      fixture.detectChanges();

      const images = [...(fixture.nativeElement as HTMLElement).querySelectorAll('img')];
      expect(images.map((img) => img.getAttribute('loading'))).toEqual(['eager']);
      expect(
        (fixture.nativeElement as HTMLElement)
          .querySelector('.slide-image__media img')
          ?.getAttribute('fetchpriority'),
      ).toBe('high');
    });

    it(`${renderer} · diffère les images d un écran qui n est pas prioritaire`, () => {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildVisualImageSlide(renderer));
      fixture.detectChanges();

      const images = [...(fixture.nativeElement as HTMLElement).querySelectorAll('img')];
      expect(images.map((img) => img.getAttribute('loading'))).toEqual(['lazy']);
      expect(images.some((img) => img.hasAttribute('fetchpriority'))).toBeFalse();
    });
  }

  describe('illustration', () => {
    const ecranMonte = (prioritaire: boolean): HTMLElement => {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildVisualIllustrationSlide());
      fixture.componentRef.setInput('prioritaire', prioritaire);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };
    const imageDe = (prioritaire: boolean): HTMLImageElement | null =>
      ecranMonte(prioritaire).querySelector('app-slide-illustration img');

    it('ne montre que l image du cours, avec son texte alternatif', () => {
      const ecran = ecranMonte(false);
      const image = ecran.querySelector('app-slide-illustration img');

      expect(image?.getAttribute('src')).toBe('/assets/cours/b2-02/v2/cinq-factures.webp');
      expect(image?.getAttribute('alt')).toContain('médiane 12 jours');
      expect(ecran.querySelector('h1, h2, h3, p')).toBeNull();
    });

    it('charge l image sans différer sur l écran prioritaire', () => {
      const image = imageDe(true);

      expect(image?.getAttribute('loading')).toBe('eager');
      expect(image?.getAttribute('fetchpriority')).toBe('high');
    });

    it('diffère l image d un écran qui n est pas prioritaire', () => {
      const image = imageDe(false);

      expect(image?.getAttribute('loading')).toBe('lazy');
      expect(image?.hasAttribute('fetchpriority')).toBeFalse();
    });
  });

  describe('prompt', () => {
    afterEach(() => rendreLePressePapiers());

    const ecranDuPrompt = (): ComponentFixture<SlideVisualComponent> => {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildVisualPromptSlide());
      fixture.detectChanges();
      return fixture;
    };
    const boutonDe = (fixture: ComponentFixture<SlideVisualComponent>): HTMLButtonElement | null =>
      (fixture.nativeElement as HTMLElement).querySelector('app-slide-prompt button');
    const copierPuisLire = (fixture: ComponentFixture<SlideVisualComponent>): string => {
      boutonDe(fixture)?.click();
      flushMicrotasks();
      fixture.detectChanges();
      return boutonDe(fixture)?.textContent?.trim() ?? '';
    };

    it('F2 · affiche le titre, le sous-titre et le texte entier du prompt, avec son bouton de copie', () => {
      const element = ecranDuPrompt().nativeElement as HTMLElement;

      expect(element.querySelector('app-slide-prompt h2')?.textContent).toBe(
        'L’IA analyste, tous ensemble',
      );
      expect(element.querySelector('app-slide-prompt header p')?.textContent).toBe(
        'Le formateur lance le prompt sur son compte.',
      );
      expect(element.querySelector('app-slide-prompt pre')?.textContent).toBe(PROMPT_DE_L_ANALYSTE);
      expect(element.querySelector('app-slide-prompt button')?.textContent?.trim()).toBe(
        'Copier le prompt',
      );
    });

    it('F2 · place le texte exact dans le presse-papiers puis annonce « Prompt copié »', fakeAsync(() => {
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      poserLePressePapiers(writeText);
      const fixture = ecranDuPrompt();

      expect(copierPuisLire(fixture)).toBe('Prompt copié');
      expect(writeText).toHaveBeenCalledOnceWith(PROMPT_DE_L_ANALYSTE);
      tick(2000);
    }));

    for (const [cas, presse] of [
      ['sans presse-papiers', () => null],
      [
        'quand le presse-papiers refuse',
        () => jasmine.createSpy('writeText').and.rejectWith(new Error('refus')),
      ],
    ] as const) {
      it(`F2 · annonce l échec ${cas} et laisse le texte sélectionnable`, fakeAsync(() => {
        spyOn(console, 'error');
        poserLePressePapiers(presse());
        const fixture = ecranDuPrompt();

        expect(copierPuisLire(fixture)).toBe('Échec — copiez à la main');
        const texte = (fixture.nativeElement as HTMLElement).querySelector('app-slide-prompt pre');
        expect(texte === null ? null : getComputedStyle(texte).userSelect).not.toBe('none');
        tick(2500);
      }));
    }
  });

  describe('lien vers la source', () => {
    function lienDe(sourceLink: unknown): HTMLAnchorElement | null {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput(
        'slide',
        buildVisualImageSlide('image-left', 'B2-01-A5-01-NIGHTINGALE', { sourceLink }),
      );
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('.slide-visual__source a');
    }

    it('cite la source declaree par l ecran', () => {
      const lien = lienDe({ href: 'https://www.insee.fr/', label: 'Insee' });

      expect(lien?.getAttribute('href')).toBe('https://www.insee.fr/');
      expect(lien?.textContent?.trim()).toBe('Insee');
    });

    it('ne cite aucune source dont l adresse ou le libelle n est pas un texte', () => {
      expect(lienDe({ href: null, label: 'Insee' })).toBeNull();
      expect(lienDe({ href: 'https://www.insee.fr/', label: 12 })).toBeNull();
    });
  });

  describe('correction du tri', () => {
    function monter(retours: ReadonlyMap<string, RetourBrique[]> = new Map()): HTMLElement {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildVisualSortCorrectionSlide());
      fixture.componentRef.setInput('retours', retours);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    function enErreur(element: HTMLElement): string[] {
      return [...element.querySelectorAll<HTMLElement>('.slide-sort-review__carte--erreur')].map(
        (carte) => carte.dataset['carte'] ?? '',
      );
    }

    it('L4 · rend l ecran sort-review avec le layout de correction', () => {
      const element = monter();

      expect(element.querySelector('app-slide-sort-review')).not.toBeNull();
      expect(element.querySelector('[role="alert"]')).toBeNull();
      expect(enErreur(element)).toEqual([]);
    });

    it('L4 · borde les cartes que l etudiant a mal placees au tri source', () => {
      const element = monter(
        new Map([
          [TRI_CORRIGE.screenId, [buildVerdictDuTri({ 'ca-2025': true, inflation: false })]],
        ]),
      );

      expect(enErreur(element)).toEqual(['inflation']);
    });

    it('L4 · ignore le verdict d un autre tri ou d un autre ecran', () => {
      const element = monter(
        new Map([
          [TRI_CORRIGE.screenId, [buildVerdictDuTri({ inflation: false }, 'autre-tri')]],
          ['B2-01-AUTRE', [buildVerdictDuTri({ 'ca-2025': false })]],
        ]),
      );

      expect(enErreur(element)).toEqual([]);
    });

    function monterLaCorrectionAvecLesComptes(
      entrees: Readonly<Record<string, unknown>>,
      question: Parameters<typeof buildResultatQuestion>[0],
    ): ComponentFixture<SlideVisualComponent> {
      return poserLesEntrees(TestBed.createComponent(SlideVisualComponent), {
        slide: buildVisualSortCorrectionSlide(),
        resultats: buildResultatsSeance({
          questions: [
            buildResultatQuestion({
              questionId: TRI_CORRIGE.sortId,
              ecranId: TRI_CORRIGE.screenId,
              ...question,
            }),
          ],
        }),
        ...entrees,
      });
    }

    it('F07 · projette au presentateur, carte par carte, combien l ont bien placee', () => {
      const fixture = monterLaCorrectionAvecLesComptes(
        { role: 'presentateur' },
        {
          total: 12,
          parCle: { inflation: { total: 12, justes: 5 }, 'ca-2025': { total: 12, justes: 11 } },
        },
      );
      const element = fixture.nativeElement as HTMLElement;
      const compte = (id: string): string =>
        element
          .querySelector(`[data-carte="${id}"] [data-testid="sort-review-compte"]`)
          ?.textContent?.replace(/\s+/g, ' ')
          .trim() ?? '';

      expect(compte('inflation')).toBe('5 / 12 bien placée');
      expect(compte('ca-2025')).toBe('11 / 12 bien placée');
    });

    it('F07 · ne montre aucun compte de classe a l etudiant', () => {
      const fixture = monterLaCorrectionAvecLesComptes(
        {},
        { parCle: { inflation: { total: 12, justes: 5 } } },
      );

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[data-testid="sort-review-compte"]'),
      ).toBeNull();
    });
  });

  it('rend la trace ecrite et le nuage de points avec leur composant', () => {
    const rendus = [
      {
        renderer: 'lesson',
        selecteur: 'app-slide-lesson',
        props: {
          title: 'Ajuster un nuage',
          blocks: [{ kind: 'definition', title: 'Point moyen', text: 'G(x̄ ; ȳ)' }],
        },
      },
      {
        renderer: 'scatter',
        selecteur: 'app-slide-scatter',
        props: {
          title: 'Ventes',
          xLabel: 'Mois',
          yLabel: 'k€',
          xRange: [0, 7],
          yRange: [550, 900],
          points: [
            { x: 1, y: 610 },
            { x: 2, y: 652 },
          ],
          description: 'Deux points.',
        },
      },
    ];
    for (const { renderer, selecteur, props } of rendus) {
      const fixture = TestBed.createComponent(SlideVisualComponent);
      fixture.componentRef.setInput('slide', buildRecitVisuel(renderer, renderer, props));
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector(selecteur))
        .withContext(renderer)
        .not.toBeNull();
    }
  });

  it('ne transmet la priorite qu a un hero, sans casser les autres layouts', () => {
    const fixture = TestBed.createComponent(SlideVisualComponent);
    fixture.componentRef.setInput('slide', buildVisualSortCorrectionSlide());
    fixture.componentRef.setInput('prioritaire', true);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-slide-sort-review'),
    ).not.toBeNull();
  });
});
