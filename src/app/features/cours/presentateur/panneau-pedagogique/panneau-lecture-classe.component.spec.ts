import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { ResultatQuestion } from '../../../../../cours/content/types';
import { buildResultatQuestion } from '../../../../../testing/factories/formations.factory';
import { PanneauLectureClasseComponent } from './panneau-lecture-classe.component';

type Fixture = ComponentFixture<PanneauLectureClasseComponent>;

function monter(resultats: readonly ResultatQuestion[], participants: number): Fixture {
  const fixture = TestBed.createComponent(PanneauLectureClasseComponent);
  fixture.componentRef.setInput('questionIds', ['Q-1', 'Q-2']);
  fixture.componentRef.setInput('resultats', resultats);
  fixture.componentRef.setInput('participants', participants);
  fixture.detectChanges();
  return fixture;
}

function valeur(fixture: Fixture, marque: string): string {
  return (
    (fixture.nativeElement as HTMLElement)
      .querySelector(`[data-testid="${marque}"]`)
      ?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

describe('PanneauLectureClasseComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauLectureClasseComponent] }));

  it('annonce l absence de donnees tant que personne n a repondu sur l ecran', () => {
    const fixture = monter([], 12);

    expect(valeur(fixture, 'lecture-classe-taux')).toBe('—');
    expect(valeur(fixture, 'lecture-classe-reponses')).toBe('0 / 12');
    expect(valeur(fixture, 'lecture-classe-confiance')).toBe('Aucune donnée');
  });

  it('agrege les seules questions de l ecran et juge le diagnostic a confirmer sous 90 % de couverture', () => {
    const fixture = monter(
      [
        buildResultatQuestion({ questionId: 'Q-1', total: 4, correctes: 3 }),
        buildResultatQuestion({ questionId: 'Q-2', total: 4, correctes: 1 }),
        buildResultatQuestion({ questionId: 'Q-AUTRE', total: 20, correctes: 20 }),
      ],
      10,
    );

    expect(valeur(fixture, 'lecture-classe-taux')).toMatch(/^50\s?%$/);
    expect(valeur(fixture, 'lecture-classe-reponses')).toBe('8 / 10');
    expect(valeur(fixture, 'lecture-classe-confiance')).toBe('À confirmer');
  });

  it('juge le diagnostic solide des 90 % de couverture', () => {
    const fixture = monter(
      [buildResultatQuestion({ questionId: 'Q-1', total: 9, correctes: 9 })],
      10,
    );

    expect(valeur(fixture, 'lecture-classe-confiance')).toBe('Solide');
  });
});
