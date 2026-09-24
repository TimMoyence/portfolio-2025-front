import { TestBed } from '@angular/core/testing';
import {
  ATELIER_CORRIGE,
  buildAnswerReviewProps,
} from '../../../../../testing/factories/visual-slide.factory';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import {
  SlideAnswerReviewComponent,
  type ReussiteDeLaClasse,
} from './slide-answer-review.component';

const [EVOLUTION, PART] = ATELIER_CORRIGE.questions;

interface Retours {
  readonly verdicts?: Readonly<Record<string, boolean>>;
  readonly cibles?: Readonly<Record<string, string>>;
  readonly reussites?: Readonly<Record<string, ReussiteDeLaClasse>>;
}

function monter(retours: Retours = {}): HTMLElement {
  const fixture = TestBed.createComponent(SlideAnswerReviewComponent);
  const { title, subtitle, explications } = buildAnswerReviewProps();
  fixture.componentRef.setInput('title', title);
  fixture.componentRef.setInput('subtitle', subtitle);
  fixture.componentRef.setInput('explications', explications);
  fixture.componentRef.setInput('verdicts', retours.verdicts ?? {});
  fixture.componentRef.setInput('cibles', retours.cibles ?? {});
  fixture.componentRef.setInput('reussites', retours.reussites ?? {});
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function explication(element: HTMLElement, reference: string): HTMLElement | null {
  return element.querySelector<HTMLElement>(`[data-reference="${reference}"]`);
}

describe('SlideAnswerReviewComponent', () => {
  beforeEach(() => setupTestBed({ http: false, imports: [SlideAnswerReviewComponent] }));

  it('T6 · pose le titre et chaque explication de la correction, dans l ordre des questions', () => {
    const element = monter();

    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Correction de l’atelier 1');
    expect(
      [...element.querySelectorAll<HTMLElement>('[data-reference]')].map(
        (ligne) => ligne.dataset['reference'],
      ),
    ).toEqual([EVOLUTION, PART]);
    expect(explication(element, PART)?.textContent).toContain('45,5 % du CA');
  });

  it('T6 · montre a l etudiant la reponse attendue de son tirage', () => {
    const element = monter({ cibles: { [PART]: '45,5 %' } });

    expect(explication(element, PART)?.textContent).toContain('Réponse attendue');
    expect(explication(element, PART)?.textContent).toContain('45,5 %');
    expect(explication(element, EVOLUTION)?.textContent).not.toContain('Réponse attendue');
  });

  it('T6 · borde de vert la reponse juste et de rouge la reponse a revoir', () => {
    const element = monter({ verdicts: { [EVOLUTION]: true, [PART]: false } });

    expect(explication(element, EVOLUTION)?.classList).toContain(
      'slide-answer-review__explication--juste',
    );
    expect(explication(element, EVOLUTION)?.textContent).toContain('Votre réponse est juste');
    expect(explication(element, PART)?.classList).toContain(
      'slide-answer-review__explication--erreur',
    );
    expect(explication(element, PART)?.textContent).toContain('Votre réponse est à revoir');
  });

  it('T6 · ne signale rien sans reponse de l etudiant', () => {
    const element = monter();

    expect(element.querySelectorAll('.slide-answer-review__signal').length).toBe(0);
  });

  it('T10 · projette le nombre de reponses justes de la classe par question', () => {
    const element = monter({ reussites: { [EVOLUTION]: { justes: 14, total: 20 } } });

    expect(explication(element, EVOLUTION)?.textContent).toContain('14 / 20');
    expect(explication(element, PART)?.querySelector('.slide-answer-review__reussite')).toBeNull();
  });
});
