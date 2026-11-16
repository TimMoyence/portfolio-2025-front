import { Component, input } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
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

const VERSO_LONG =
  'Un taux se lit avec son numérateur, son dénominateur, sa période et la source qui le produit : sans ces quatre repères, 27,6 % ne dit rien à personne et ne permet aucune décision.';

@Component({
  standalone: true,
  imports: [SlideGridComponent],
  template: `
    <div style="width: 260px">
      <app-slide-grid
        [items]="[{ title: 'Mesure', description: 'Quel indicateur ?', back: verso }]"
      />
    </div>
  `,
})
class HoteRetournableComponent {
  verso = VERSO_LONG;
}

const VERSO_EN_ETAPES =
  '1. Calculer f′(x).\n2. Résoudre f′(x) = 0.\n3. Dresser le tableau de variations.\n4. Lire le maximum et conclure.';

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

  it('R7 · equilibre les rangees : au plus six colonnes, sans rangee orpheline', () => {
    const colonnesPour = (nombre: number): string => {
      const fixture = TestBed.createComponent(SlideGridComponent);
      fixture.componentRef.setInput(
        'items',
        Array.from({ length: nombre }, (_, rang) => ({ title: `C${rang}`, description: '' })),
      );
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>('.slide-grid__grid')!
        .style.getPropertyValue('--slide-grid-colonnes');
    };

    expect([3, 5, 7, 11, 12, 15].map(colonnesPour)).toEqual(['3', '5', '4', '6', '6', '5']);
  });

  function carteRetournable(verso = VERSO_LONG): {
    fixture: ComponentFixture<HoteRetournableComponent>;
    carte: HTMLElement | null;
  } {
    const fixture = TestBed.createComponent(HoteRetournableComponent);
    fixture.componentInstance.verso = verso;
    fixture.detectChanges();
    const carte = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.slide-grid__card--flip',
    );
    return { fixture, carte };
  }

  for (const [nature, texte] of [
    ['long sur une ligne', VERSO_LONG],
    ['en quatre étapes', VERSO_EN_ETAPES],
  ] as const) {
    it(`R8 · garde le verso ${nature} d une carte retournee dans sa carte`, () => {
      const { fixture, carte } = carteRetournable(texte);
      carte?.click();
      fixture.detectChanges();
      const verso = carte?.querySelector<HTMLElement>('.slide-grid__face--back');

      expect(carte?.getAttribute('aria-pressed')).toBe('true');
      expect(verso?.scrollHeight ?? Infinity).toBeLessThanOrEqual(verso?.clientHeight ?? 0);
      expect(carte?.scrollHeight ?? Infinity).toBeLessThanOrEqual(carte?.clientHeight ?? 0);
    });
  }

  it('pose chaque étape du verso sur sa propre ligne', () => {
    const fixture = TestBed.createComponent(SlideGridComponent);
    fixture.componentRef.setInput('items', [
      { title: 'Rédiger', description: 'Quelles étapes ?', back: '1. Calculer.\n2. Résoudre.' },
    ]);
    fixture.detectChanges();
    const carte = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.slide-grid__card--flip',
    );
    carte?.click();
    fixture.detectChanges();

    expect(
      carte?.querySelector<HTMLElement>('.slide-grid__face--back span')?.innerText.split('\n'),
    ).toEqual(['1. Calculer.', '2. Résoudre.']);
  });

  it('R8 · ne reserve pas la hauteur du verso a une carte non retournee', () => {
    const { carte } = carteRetournable();
    const recto = carte?.querySelector<HTMLElement>('.slide-grid__face--front');
    const style = carte === null ? null : getComputedStyle(carte);
    const hauteurDuRecto =
      (recto?.offsetHeight ?? 0) +
      parseFloat(style?.paddingTop ?? '0') +
      parseFloat(style?.paddingBottom ?? '0');

    expect(carte?.getAttribute('aria-pressed')).toBe('false');
    expect(carte?.clientHeight ?? Infinity).toBeLessThanOrEqual(
      Math.max(parseFloat(style?.minHeight ?? '0'), hauteurDuRecto) + 1,
    );
  });

  it('QF-20 · dans une fiche de cartes retournables, centre la carte de lien comme ses voisines', () => {
    const fixture = TestBed.createComponent(SlideGridComponent);
    fixture.componentRef.setInput('items', [
      { title: 'Mesure', description: 'Quel indicateur ?', back: VERSO_LONG },
      { title: 'Référentiel', description: 'Le programme.', href: 'https://example.org' },
    ]);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    document.body.appendChild(racine);
    const lien = racine.querySelector<HTMLElement>('a.slide-grid__card');
    const style = lien === null ? null : getComputedStyle(lien);

    expect(style?.textAlign).toBe('center');
    expect(style?.alignItems).toBe('center');
    expect(style?.justifyContent).toBe('center');
    racine.remove();
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
