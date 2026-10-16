import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PRESENTATION_PORT } from '../../core/ports/presentation.port';
import { SlideDeckService } from '../../shared/slides';
import type { PresentationInteractionsResponse } from '../../core/ports/presentation.port';
import { createPresentationPortStub } from '../../../testing/factories/presentation.factory';
import { reponsesServiesPar } from '../../../testing/fixtures/reponses-servies';
import { SlidesLibraryComponent } from './slides-library.component';

const [INTERACTIONS_SERVIES] = reponsesServiesPar(
  'GET /api/presentations/:slug/interactions',
) as readonly PresentationInteractionsResponse[];

describe('SlidesLibraryComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SlidesLibraryComponent],
      providers: [
        SlideDeckService,
        provideRouter([]),
        {
          provide: PRESENTATION_PORT,
          useValue: createPresentationPortStub(INTERACTIONS_SERVIES),
        },
      ],
    });
  });

  it("affiche la question de chaque démonstration d'interaction, servie ou en ligne", () => {
    const fixture = TestBed.createComponent(SlidesLibraryComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const texte = (selecteur: string): string =>
      root.querySelector(selecteur)?.textContent?.replace(/\s+/g, ' ') ?? '';
    const servies = Object.values(INTERACTIONS_SERVIES.interactions);
    const questionsServies = (seau: 'present' | 'scroll'): string[] =>
      servies.flatMap((interactions) => (interactions[seau] ?? []).map(({ question }) => question));

    expect(texte('app-slide-quiz .slide-quiz__question').trim())
      .withContext('question du quiz en ligne')
      .not.toBe('');
    expect(root.querySelectorAll('app-slide-quiz .slide-quiz__option').length)
      .withContext('options du quiz en ligne')
      .toBeGreaterThan(1);
    expect(questionsServies('present').filter((q) => texte('app-slide-poll').includes(q)))
      .withContext('question servie du sondage')
      .toHaveSize(1);
    expect(questionsServies('scroll').filter((q) => texte('app-slide-reflection').includes(q)))
      .withContext('question servie de la réflexion')
      .toHaveSize(1);
  });

  it('rend au moins un echantillon de chaque layout', () => {
    const fixture = TestBed.createComponent(SlidesLibraryComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-slide-hero')).toBeTruthy();
    expect(root.querySelector('app-slide-image-left')).toBeTruthy();
    expect(root.querySelector('app-slide-image-right')).toBeTruthy();
    expect(root.querySelector('app-slide-video')).toBeTruthy();
    expect(root.querySelector('app-slide-stats')).toBeTruthy();
    expect(root.querySelector('app-slide-quote')).toBeTruthy();
    expect(root.querySelector('app-slide-comparison')).toBeTruthy();
    expect(root.querySelector('app-slide-grid')).toBeTruthy();
    expect(root.querySelector('app-slide-cta')).toBeTruthy();
  });
});
