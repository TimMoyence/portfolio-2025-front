import type { ComponentFixture } from '@angular/core/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import type { SlideMethodStep } from './slide-method-path.component';
import { SlideMethodPathComponent } from './slide-method-path.component';

const ETAPES: readonly SlideMethodStep[] = [
  {
    id: 'lire',
    title: 'Lire',
    question: 'Que mesure le chiffre ?',
    proof: 'La base',
    result: 'Un taux',
  },
  {
    id: 'controler',
    title: 'Contrôler',
    question: 'La base est-elle la bonne ?',
    proof: 'Le périmètre',
    result: 'Une comparaison juste',
  },
  {
    id: 'decider',
    title: 'Décider',
    question: 'Que faut-il faire ?',
    proof: 'L’écart',
    result: 'Une décision argumentée',
  },
];

const DELAI_AUTOPLAY_MS = 2600;

function monter(autoplay = true): ComponentFixture<SlideMethodPathComponent> {
  const fixture = TestBed.createComponent(SlideMethodPathComponent);
  fixture.componentRef.setInput('title', 'Méthode de lecture');
  fixture.componentRef.setInput('steps', ETAPES);
  fixture.componentRef.setInput('autoplay', autoplay);
  fixture.detectChanges();
  return fixture;
}

function etapeAffichee(fixture: ComponentFixture<SlideMethodPathComponent>): string {
  const titre = (fixture.nativeElement as HTMLElement).querySelector(
    '.slide-method-path__detail h3',
  );
  return titre?.textContent?.trim() ?? '';
}

function simulerPreferenceDeMouvement(reduit: boolean): void {
  spyOn(window, 'matchMedia').and.returnValue({ matches: reduit } as MediaQueryList);
}

describe('SlideMethodPathComponent', () => {
  it('affiche la première étape, sa preuve et son résultat', () => {
    const fixture = monter(false);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h2')?.textContent).toContain('Méthode de lecture');
    expect(etapeAffichee(fixture)).toBe('Lire');
    expect(element.querySelector('.slide-method-path__detail dl')?.textContent).toContain(
      'La base',
    );
    expect(element.querySelector('[aria-current="step"]')?.textContent).toContain('Lire');
  });

  it('montre l étape choisie au clic', () => {
    const fixture = monter(false);

    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.slide-method-path__step')[2]
      .click();
    fixture.detectChanges();

    expect(etapeAffichee(fixture)).toBe('Décider');
  });

  it('fait défiler les étapes quand le mouvement est permis', fakeAsync(() => {
    simulerPreferenceDeMouvement(false);
    const fixture = monter();

    tick(DELAI_AUTOPLAY_MS);
    fixture.detectChanges();

    expect(etapeAffichee(fixture)).toBe('Contrôler');
    discardPeriodicTasks();
  }));

  it('suspend le défilement tant que le pointeur survole la méthode', fakeAsync(() => {
    simulerPreferenceDeMouvement(false);
    const fixture = monter();

    (fixture.nativeElement as HTMLElement)
      .querySelector('.slide-method-path')
      ?.dispatchEvent(new MouseEvent('mouseenter'));
    tick(DELAI_AUTOPLAY_MS * 2);
    fixture.detectChanges();

    expect(etapeAffichee(fixture)).toBe('Lire');
    discardPeriodicTasks();
  }));

  it('ne fait pas défiler les étapes quand l utilisateur demande moins de mouvement', fakeAsync(() => {
    simulerPreferenceDeMouvement(true);
    const fixture = monter();

    tick(DELAI_AUTOPLAY_MS * 2);
    fixture.detectChanges();

    expect(etapeAffichee(fixture)).toBe('Lire');
    discardPeriodicTasks();
  }));
});
