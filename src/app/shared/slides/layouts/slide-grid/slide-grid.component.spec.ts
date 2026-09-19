import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlideGridComponent } from './slide-grid.component';

@Component({
  standalone: true,
  imports: [SlideGridComponent],
  template: `
    <app-slide-grid
      title="Top 6 outils"
      [imprimable]="imprimable()"
      [items]="[
        { title: 'ChatGPT', description: 'Conversation' },
        { title: 'Claude', description: 'Analyse' },
        { title: 'Midjourney', description: 'Visuels' },
      ]"
    />
  `,
})
class HostComponent {
  readonly imprimable = input(false);
}

function monter(imprimable = false): HTMLElement {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentRef.setInput('imprimable', imprimable);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('SlideGridComponent', () => {
  afterEach(() => {
    document.querySelectorAll('.impression-fiche').forEach((copie) => copie.remove());
    document.body.removeAttribute('data-impression-fiche');
  });

  it('rend une carte par item', () => {
    const cards = monter().querySelectorAll('.slide-grid__card');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('ChatGPT');
    expect(cards[1].textContent).toContain('Analyse');
  });

  it('ne propose l impression que pour une fiche imprimable', () => {
    expect(monter().querySelector('[data-testid="slide-grid-imprimer"]')).toBeNull();
    expect(
      monter(true).querySelector('[data-testid="slide-grid-imprimer"]')?.textContent?.trim(),
    ).toBe('Imprimer ou enregistrer en PDF');
  });

  it('imprime une copie de la seule fiche puis la retire apres impression', () => {
    const impression = spyOn(window, 'print');
    const element = monter(true);

    element.querySelector<HTMLButtonElement>('[data-testid="slide-grid-imprimer"]')?.click();

    expect(impression).toHaveBeenCalledTimes(1);
    expect(document.body.hasAttribute('data-impression-fiche')).toBeTrue();
    expect(document.querySelector('.impression-fiche .slide-grid__card')?.textContent).toContain(
      'ChatGPT',
    );

    window.dispatchEvent(new Event('afterprint'));

    expect(document.querySelector('.impression-fiche')).toBeNull();
    expect(document.body.hasAttribute('data-impression-fiche')).toBeFalse();
  });
});
