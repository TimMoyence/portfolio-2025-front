import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { MotifRefusGroupe } from '../../../../core/ports/formations.port';
import {
  buildGroupeFormation,
  buildParticipantDeSeance,
} from '../../../../../testing/factories/formations.factory';
import { PanneauGroupesComponent } from './panneau-groupes.component';

type Fixture = ComponentFixture<PanneauGroupesComponent>;

const GROUPE_A = buildGroupeFormation({ id: 'groupe-a', name: 'Groupe A' });
const GROUPE_B = buildGroupeFormation({ id: 'groupe-b', name: 'Groupe B' });
const LEA = buildParticipantDeSeance({ id: 'p-lea', prenom: 'Lea', groupId: 'groupe-a' });
const NORA = buildParticipantDeSeance({ id: 'p-nora', prenom: 'Nora', nom: 'Karim' });

function monter(refus: MotifRefusGroupe | null = null): Fixture {
  const fixture = TestBed.createComponent(PanneauGroupesComponent);
  fixture.componentRef.setInput('groupes', [GROUPE_A, GROUPE_B]);
  fixture.componentRef.setInput('participants', [LEA, NORA]);
  fixture.componentRef.setInput('refus', refus);
  fixture.detectChanges();
  return fixture;
}

function element<T extends HTMLElement>(fixture: Fixture, selecteur: string): T {
  const trouve = (fixture.nativeElement as HTMLElement).querySelector<T>(selecteur);
  if (trouve === null) {
    throw new Error(`Élément introuvable : ${selecteur}`);
  }
  return trouve;
}

function selecteurDe(fixture: Fixture, participantId: string): HTMLSelectElement {
  return element<HTMLSelectElement>(
    fixture,
    `[data-participant="${participantId}"] [data-testid="participant-groupe"]`,
  );
}

describe('PanneauGroupesComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauGroupesComponent] }));

  it('demande la creation d un groupe au nom saisi puis vide le champ', () => {
    const fixture = monter();
    const creations = jasmine.createSpy('creation');
    fixture.componentInstance.creation.subscribe(creations);
    const champ = element<HTMLInputElement>(fixture, '[data-testid="groupe-nouveau"]');

    champ.value = '  Groupe C  ';
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element<HTMLButtonElement>(fixture, '[data-testid="groupe-creer"]').click();
    fixture.detectChanges();

    expect(creations).toHaveBeenCalledOnceWith('Groupe C');
    expect(champ.value).toBe('');
  });

  it('ne demande pas la creation d un groupe sans nom', () => {
    const fixture = monter();
    const creations = jasmine.createSpy('creation');
    fixture.componentInstance.creation.subscribe(creations);

    element<HTMLButtonElement>(fixture, '[data-testid="groupe-creer"]').click();

    expect(creations).not.toHaveBeenCalled();
  });

  it('demande le renommage d un groupe seulement quand son nom change', () => {
    const fixture = monter();
    const renommages = jasmine.createSpy('renommage');
    fixture.componentInstance.renommage.subscribe(renommages);
    const champ = element<HTMLInputElement>(fixture, '[data-testid="groupe-nom"]');

    champ.dispatchEvent(new Event('change'));
    champ.value = 'Groupe du fond';
    champ.dispatchEvent(new Event('change'));

    expect(renommages).toHaveBeenCalledOnceWith({ groupe: GROUPE_A, nom: 'Groupe du fond' });
  });

  it('montre chaque participant dans son groupe et demande son affectation ou son retrait', () => {
    const fixture = monter();
    const affectations = jasmine.createSpy('affectation');
    fixture.componentInstance.affectation.subscribe(affectations);

    expect(selecteurDe(fixture, 'p-lea').value).toBe('groupe-a');
    expect(selecteurDe(fixture, 'p-nora').value).toBe('');
    expect(element(fixture, '[data-participant="p-nora"] label').textContent).toContain(
      'Nora Karim',
    );

    selecteurDe(fixture, 'p-nora').value = 'groupe-b';
    selecteurDe(fixture, 'p-nora').dispatchEvent(new Event('change'));
    selecteurDe(fixture, 'p-lea').value = '';
    selecteurDe(fixture, 'p-lea').dispatchEvent(new Event('change'));

    expect(affectations.calls.allArgs()).toEqual([
      [{ participantId: 'p-nora', groupId: 'groupe-b' }],
      [{ participantId: 'p-lea', groupId: null }],
    ]);
  });

  it('explique un nom de groupe deja pris', () => {
    const fixture = monter('nom-deja-pris');

    expect(element(fixture, '[data-testid="groupes-refus"]').textContent).toContain('déjà pris');
  });
});
