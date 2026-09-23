import { TestBed } from '@angular/core/testing';
import { buildSortCorrectionProps } from '../../../../../testing/factories/visual-slide.factory';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { SlideSortReviewComponent } from './slide-sort-review.component';

function monter(misplaced: readonly string[] = []): HTMLElement {
  const fixture = TestBed.createComponent(SlideSortReviewComponent);
  const { title, subtitle, categories, cards } = buildSortCorrectionProps();
  fixture.componentRef.setInput('title', title);
  fixture.componentRef.setInput('subtitle', subtitle);
  fixture.componentRef.setInput('categories', categories);
  fixture.componentRef.setInput('cards', cards);
  fixture.componentRef.setInput('misplaced', misplaced);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function carte(element: HTMLElement, id: string): HTMLElement | null {
  return element.querySelector<HTMLElement>(`[data-carte="${id}"]`);
}

describe('SlideSortReviewComponent', () => {
  beforeEach(() => setupTestBed({ http: false, imports: [SlideSortReviewComponent] }));

  it('L4 · reprend les zones du tri et range chaque carte dans sa bonne categorie', () => {
    const element = monter();

    const zones = [...element.querySelectorAll<HTMLElement>('[data-zone]')];
    expect(zones.map((zone) => zone.dataset['zone'])).toEqual(['valeur', 'ambigu']);
    expect(zones[0].querySelector('h3')?.textContent?.trim()).toBe('Valeur absolue');
    expect(carte(element, 'ca-2025')?.closest('[data-zone]')?.getAttribute('data-zone')).toBe(
      'valeur',
    );
    expect(carte(element, 'inflation')?.closest('[data-zone]')?.getAttribute('data-zone')).toBe(
      'ambigu',
    );
  });

  it('L4 · accompagne chaque carte de sa justification', () => {
    const element = monter();

    expect(carte(element, 'inflation')?.textContent).toContain('+12 %');
    expect(carte(element, 'inflation')?.textContent).toContain(
      'Sans base ni période, le pourcentage ne dit rien.',
    );
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Correction du tri');
  });

  it('L4 · borde de rouge et signale les seules cartes que l etudiant a mal placees', () => {
    const element = monter(['inflation']);

    expect(carte(element, 'inflation')?.classList).toContain('slide-sort-review__carte--erreur');
    expect(carte(element, 'inflation')?.textContent).toContain('Mal placée');
    expect(carte(element, 'ca-2025')?.classList).not.toContain('slide-sort-review__carte--erreur');
    expect(carte(element, 'ca-2025')?.textContent).not.toContain('Mal placée');
  });

  it('L4 · ne signale aucune erreur sans retour de l etudiant', () => {
    const element = monter();

    expect(element.querySelectorAll('.slide-sort-review__carte--erreur').length).toBe(0);
  });
});
