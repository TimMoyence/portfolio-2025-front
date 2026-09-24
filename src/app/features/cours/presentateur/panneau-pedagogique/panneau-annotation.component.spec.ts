import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { AnnotationFormateur } from '../../../../core/ports/formations.port';
import { buildAnnotationFormateur } from '../../../../../testing/factories/formations.factory';
import type { EtatSauvegarde, SaisieAnnotation } from './panneau-annotation.component';
import { PanneauAnnotationComponent } from './panneau-annotation.component';

type Fixture = ComponentFixture<PanneauAnnotationComponent>;

const NOTE_ECRAN_1 = buildAnnotationFormateur({ screenId: 'ecran-1', note: 'Reprendre la base.' });
const NOTE_ECRAN_2 = buildAnnotationFormateur({
  id: 'annotation-2',
  screenId: 'ecran-2',
  note: 'La classe confond les taux.',
});

function monter(annotations: readonly AnnotationFormateur[] = [NOTE_ECRAN_1]): Fixture {
  const fixture = TestBed.createComponent(PanneauAnnotationComponent);
  fixture.componentRef.setInput('ecranId', 'ecran-1');
  fixture.componentRef.setInput('annotations', annotations);
  fixture.componentRef.setInput('etat', 'repos');
  fixture.detectChanges();
  return fixture;
}

function note(fixture: Fixture): HTMLTextAreaElement {
  return (fixture.nativeElement as HTMLElement).querySelector(
    '[data-testid="annotation-note"]',
  ) as HTMLTextAreaElement;
}

function saisir(fixture: Fixture, texte: string): void {
  note(fixture).value = texte;
  note(fixture).dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('PanneauAnnotationComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauAnnotationComponent] }));

  it('reprend la note deja enregistree pour l ecran, sans selecteur de groupe', () => {
    const fixture = monter();

    expect(note(fixture).value).toBe(NOTE_ECRAN_1.note);
    expect((fixture.nativeElement as HTMLElement).querySelector('select')).toBeNull();
  });

  it('emet chaque saisie avec l ecran suivi au moment de la frappe', () => {
    const fixture = monter();
    const saisies: SaisieAnnotation[] = [];
    fixture.componentInstance.saisie.subscribe((saisie) => saisies.push(saisie));

    saisir(fixture, 'Relancer Nora.');

    expect(saisies).toEqual([{ screenId: 'ecran-1', note: 'Relancer Nora.' }]);
  });

  it('affiche la note de l ecran suivant quand le formateur change d ecran', () => {
    const fixture = monter([NOTE_ECRAN_1, NOTE_ECRAN_2]);
    saisir(fixture, 'Brouillon de l ecran 1');

    fixture.componentRef.setInput('ecranId', 'ecran-2');
    fixture.detectChanges();

    expect(note(fixture).value).toBe(NOTE_ECRAN_2.note);
  });

  it('vide la note sur un ecran sans annotation', () => {
    const fixture = monter([NOTE_ECRAN_1]);
    saisir(fixture, 'Brouillon de l ecran 1');

    fixture.componentRef.setInput('ecranId', 'ecran-3');
    fixture.detectChanges();

    expect(note(fixture).value).toBe('');
  });

  it('prend la note relue du serveur tant que le formateur ne la modifie pas', () => {
    const fixture = monter([]);

    fixture.componentRef.setInput('annotations', [NOTE_ECRAN_1]);
    fixture.detectChanges();

    expect(note(fixture).value).toBe(NOTE_ECRAN_1.note);
  });

  it('garde la saisie en cours quand une relecture du serveur arrive avant son enregistrement', () => {
    const fixture = monter();
    saisir(fixture, 'Saisie locale non encore enregistrée');

    fixture.componentRef.setInput('annotations', [{ ...NOTE_ECRAN_1, note: 'Autre poste' }]);
    fixture.detectChanges();

    expect(note(fixture).value).toBe('Saisie locale non encore enregistrée');
  });

  const ETATS: readonly (readonly [EtatSauvegarde, string])[] = [
    ['en_cours', 'Enregistrement'],
    ['enregistre', 'Note enregistrée'],
    ['echec', 'n’a pas pu être enregistrée'],
  ];

  for (const [etat, message] of ETATS) {
    it(`affiche l etat reel de l enregistrement : ${etat}`, () => {
      const fixture = monter();

      fixture.componentRef.setInput('etat', etat);
      fixture.detectChanges();

      const statut = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="annotation-etat"]',
      );
      expect(statut?.getAttribute('data-etat')).toBe(etat);
      expect(statut?.textContent).toContain(message);
    });
  }

  it('n annonce aucune synchronisation avant la premiere saisie', () => {
    const fixture = monter();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('synchronisées');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="annotation-etat"]')
        ?.textContent?.trim(),
    ).toBe('');
  });
});
