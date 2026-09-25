import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { poserLesEntrees } from '../../../../../testing/montage-page';
import type { SlideGuideItem } from './slide-guide.component';
import { SlideGuideComponent } from './slide-guide.component';

const ETAPES: readonly SlideGuideItem[] = [
  { title: 'Repérer la base', description: 'Sur quel total le taux est-il calculé ?' },
  {
    title: 'Comparer',
    description: 'Deux taux ne se comparent que sur la même base.',
    detail: 'Sinon, revenir aux effectifs.',
  },
];

function monter(
  entrees: Readonly<Record<string, unknown>> = {},
): ComponentFixture<SlideGuideComponent> {
  return poserLesEntrees(TestBed.createComponent(SlideGuideComponent), {
    title: 'Contrôler un pourcentage',
    items: ETAPES,
    ...entrees,
  });
}

describe('SlideGuideComponent', () => {
  it('rend le titre, le sous-titre, le contexte et les étapes numérotées', () => {
    const fixture = monter({ subtitle: 'En trois gestes', context: 'Avant de conclure' });

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h2')?.textContent).toContain('Contrôler un pourcentage');
    expect(element.querySelector('.slide-guide__subtitle')?.textContent).toContain(
      'En trois gestes',
    );
    expect(element.querySelector('.slide-guide__context')?.textContent).toContain(
      'Avant de conclure',
    );
    const etapes = element.querySelectorAll('.slide-guide__steps li');
    expect(etapes).toHaveSize(2);
    expect(etapes[1].querySelector('.slide-guide__number')?.textContent).toContain('2');
    expect(etapes[1].querySelector('h3')?.textContent).toContain('Comparer');
  });

  it('n affiche le détail que pour les étapes qui en portent un', () => {
    const fixture = monter();

    const details = (fixture.nativeElement as HTMLElement).querySelectorAll('.slide-guide__detail');
    expect(details).toHaveSize(1);
    expect(details[0].textContent).toContain('revenir aux effectifs');
  });

  it('termine sur ce qu il faut retenir et le geste professionnel quand ils sont fournis', () => {
    const fixture = monter({ takeaway: 'La base d abord', nextAction: 'Citer la source' });

    const pied = (fixture.nativeElement as HTMLElement).querySelector('.slide-guide__footer');
    expect(pied?.textContent).toContain('À retenir');
    expect(pied?.textContent).toContain('La base d abord');
    expect(pied?.textContent).toContain('Geste professionnel');
    expect(pied?.textContent).toContain('Citer la source');
  });

  it('n affiche pas de pied sans rien à retenir ni geste à faire', () => {
    const fixture = monter();

    expect((fixture.nativeElement as HTMLElement).querySelector('.slide-guide__footer')).toBeNull();
  });
});
