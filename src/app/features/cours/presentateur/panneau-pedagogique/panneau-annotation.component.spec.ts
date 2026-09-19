import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { AnnotationFormateur } from '../../../../core/ports/formations.port';
import {
  buildAnnotationFormateur,
  buildGroupeFormation,
} from '../../../../../testing/factories/formations.factory';
import type { EtatSauvegarde, SaisieAnnotation } from './panneau-annotation.component';
import { PanneauAnnotationComponent } from './panneau-annotation.component';

type Fixture = ComponentFixture<PanneauAnnotationComponent>;

const NOTE_ECRAN_1 = buildAnnotationFormateur({ screenId: 'ecran-1', note: 'Reprendre la base.' });
const NOTE_GROUPE_A = buildAnnotationFormateur({
  id: 'annotation-2',
  screenId: 'ecran-1',
  groupName: 'Groupe A',
  note: 'Le groupe A confond les taux.',
});

function monter(annotations: readonly AnnotationFormateur[] = [NOTE_ECRAN_1]): Fixture {
  const fixture = TestBed.createComponent(PanneauAnnotationComponent);
  fixture.componentRef.setInput('ecranId', 'ecran-1');
  fixture.componentRef.setInput('groupes', [buildGroupeFormation({ name: 'Groupe A' })]);
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

function groupe(fixture: Fixture): HTMLSelectElement {
  return (fixture.nativeElement as HTMLElement).querySelector(
    '[data-testid="annotation-groupe"]',
  ) as HTMLSelectElement;
}

function saisir(fixture: Fixture, texte: string): void {
  note(fixture).value = texte;
  note(fixture).dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function choisirLeGroupe(fixture: Fixture, nom: string): void {
  groupe(fixture).value = nom;
  groupe(fixture).dispatchEvent(new Event('change'));
  fixture.detectChanges();
}

describe('PanneauAnnotationComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauAnnotationComponent] }));

  it('reprend la note deja enregistree pour l ecran', () => {
    const fixture = monter();

    expect(note(fixture).value).toBe(NOTE_ECRAN_1.note);
    expect(groupe(fixture).value).toBe('Classe entière');
  });

  it('emet chaque saisie avec l ecran et le groupe suivis au moment de la frappe', () => {
    const fixture = monter();
    const saisies: SaisieAnnotation[] = [];
    fixture.componentInstance.saisie.subscribe((saisie) => saisies.push(saisie));

    choisirLeGroupe(fixture, 'Groupe A');
    saisir(fixture, 'Relancer Nora.');

    expect(saisies).toEqual([
      { screenId: 'ecran-1', groupName: 'Groupe A', note: 'Relancer Nora.' },
    ]);
  });

  it('affiche la note du groupe choisi pour l ecran', () => {
    const fixture = monter([NOTE_ECRAN_1, NOTE_GROUPE_A]);

    choisirLeGroupe(fixture, 'Groupe A');

    expect(note(fixture).value).toBe(NOTE_GROUPE_A.note);
  });

  it('vide la note et revient a la classe entiere sur un ecran sans annotation', () => {
    const fixture = monter([NOTE_ECRAN_1, NOTE_GROUPE_A]);
    choisirLeGroupe(fixture, 'Groupe A');
    saisir(fixture, 'Brouillon de l ecran 1');

    fixture.componentRef.setInput('ecranId', 'ecran-2');
    fixture.detectChanges();

    expect(note(fixture).value).toBe('');
    expect(groupe(fixture).value).toBe('Classe entière');
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
