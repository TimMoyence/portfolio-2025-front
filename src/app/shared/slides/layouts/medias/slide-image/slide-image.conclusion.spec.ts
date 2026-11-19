import { TestBed } from '@angular/core/testing';
import { buildVisualImageSlide } from '../../../../../../testing/factories/formations/visual-slide.factory';
import { setupTestBed } from '../../../../../../testing/setup-test-bed';
import { SlideVisualComponent } from '../../../visual/slide-visual.component';

const REGLE = [
  'En maths, on écrit : f(x) = a e^(kx).',
  'a est la valeur de départ : f(0) = a.',
  'k règle le sens : k > 0, f croît.',
].join('\n');

function monterLaPageImage(): HTMLElement {
  setupTestBed({ imports: [SlideVisualComponent] });
  const fixture = TestBed.createComponent(SlideVisualComponent);
  fixture.componentRef.setInput(
    'slide',
    buildVisualImageSlide('image-left', 'B2-07-A1-03-ENFANT-A-ET-K', {
      title: 'Le départ et la vitesse',
      paragraphs: ['Deux ballons partent de la même taille.'],
      items: ['La taille commune, marquée a → a = f(0)'],
      conclusion: REGLE,
    }),
  );
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('page image : la règle du cours après le parallèle (RET-05)', () => {
  it('RET-05 · affiche « En maths, on écrit » après les correspondances, une idée par ligne', () => {
    const contenu = monterLaPageImage().querySelector<HTMLElement>('.slide-image__content');
    const conclusion = contenu?.querySelector<HTMLElement>('.slide-image__conclusion');

    const ordre = [...(contenu?.children ?? [])].map((enfant) => enfant.className.split(' ')[0]);

    expect(conclusion?.innerText.split('\n')).toEqual(REGLE.split('\n'));
    expect(ordre.slice(-3)).toEqual([
      'slide-image__paragraph',
      'slide-image__items',
      'slide-image__conclusion',
    ]);
  });
});
