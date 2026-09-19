import type { ComponentFixture } from '@angular/core/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import {
  buildEcranDeroule,
  buildGroupeFormation,
  buildGuideFormateur,
  buildParticipantDeSeance,
  buildRapportSeance,
  buildResultatQuestion,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { AnnotationFormateur, FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, GroupeRefuse } from '../../../core/ports/formations.port';
import { CoursPanneauPedagogiqueComponent } from './cours-panneau-pedagogique.component';

type Fixture = ComponentFixture<CoursPanneauPedagogiqueComponent>;

const SESSION = 'seance-1';

describe('CoursPanneauPedagogiqueComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;

  function monter(): Fixture {
    const fixture = TestBed.createComponent(CoursPanneauPedagogiqueComponent);
    fixture.componentRef.setInput(
      'ecran',
      buildEcranDeroule({ id: 'ecran-1', guide: buildGuideFormateur() }),
    );
    fixture.componentRef.setInput('resultats', []);
    fixture.componentRef.setInput('participants', 12);
    fixture.componentRef.setInput('sessionId', SESSION);
    fixture.componentRef.setInput('nextScreenTitle', 'Le taux global');
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    return fixture;
  }

  function element<T extends HTMLElement>(fixture: Fixture, marque: string): T {
    const trouve = (fixture.nativeElement as HTMLElement).querySelector<T>(
      `[data-testid="${marque}"]`,
    );
    if (trouve === null) {
      throw new Error(`Aucun élément ${marque} dans le panneau pédagogique`);
    }
    return trouve;
  }

  function saisirLaNote(fixture: Fixture, texte: string): void {
    const note = element<HTMLTextAreaElement>(fixture, 'annotation-note');
    note.value = texte;
    note.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function changer(fixture: Fixture, champ: HTMLSelectElement, valeur: string): void {
    champ.value = valeur;
    champ.dispatchEvent(new Event('change'));
    tick();
    fixture.detectChanges();
  }

  function etatDeLaNote(fixture: Fixture): string | null {
    return element(fixture, 'annotation-etat').getAttribute('data-etat');
  }

  beforeEach(() => {
    port = createFormationsPortStub();
    setupTestBed({
      imports: [CoursPanneauPedagogiqueComponent],
      providers: [{ provide: FORMATIONS_PORT, useValue: port }],
    });
  });

  it('lit annotations, groupes, participants et reponses libres de la seance', fakeAsync(() => {
    monter();

    for (const lecture of [
      port.lireAnnotations,
      port.lireGroupes,
      port.lireParticipants,
      port.lireReponsesLibres,
    ]) {
      expect(lecture).toHaveBeenCalledOnceWith(SESSION);
    }
  }));

  it('relit les donnees partagees a chaque resultat recu du flux, sans autre sondage', fakeAsync(() => {
    const fixture = monter();

    fixture.componentRef.setInput('resultats', [buildResultatQuestion()]);
    fixture.detectChanges();
    tick();

    expect(port.lireAnnotations).toHaveBeenCalledTimes(2);
    expect(port.lireParticipants).toHaveBeenCalledTimes(2);
    tick(60_000);
    expect(port.lireAnnotations).toHaveBeenCalledTimes(2);
  }));

  it('signale une relecture refusee au lieu d afficher des listes vides', fakeAsync(() => {
    port.lireAnnotations.and.returnValue(throwError(() => new Error('403')));

    const fixture = monter();

    expect(element(fixture, 'panneau-lecture-echec').getAttribute('role')).toBe('alert');
  }));

  it('montre le guide de l ecran sans reveler la reponse attendue', fakeAsync(() => {
    const fixture = monter();

    expect(element(fixture, 'presentateur-guide').textContent).toContain('À dire');
    expect(element(fixture, 'presentateur-guide').textContent).not.toContain(
      buildGuideFormateur().reponse ?? '',
    );
  }));

  describe('enregistrement de la note', () => {
    it('n envoie qu une requete, 600 ms apres la derniere frappe', fakeAsync(() => {
      const fixture = monter();

      saisirLaNote(fixture, 'R');
      saisirLaNote(fixture, 'Re');
      saisirLaNote(fixture, 'Relancer');
      tick(599);

      expect(port.enregistrerAnnotation).not.toHaveBeenCalled();
      expect(etatDeLaNote(fixture)).toBe('en_cours');

      tick(1);
      fixture.detectChanges();

      expect(port.enregistrerAnnotation).toHaveBeenCalledOnceWith(SESSION, {
        screenId: 'ecran-1',
        groupName: 'Classe entière',
        note: 'Relancer',
      });
      expect(etatDeLaNote(fixture)).toBe('enregistre');
    }));

    it('annule l enregistrement precedent encore en vol', fakeAsync(() => {
      let annule = false;
      port.enregistrerAnnotation.and.returnValues(
        new Observable<AnnotationFormateur>(() => () => {
          annule = true;
        }),
        NEVER,
      );
      const fixture = monter();

      saisirLaNote(fixture, 'Premiere version');
      tick(600);
      saisirLaNote(fixture, 'Seconde version');
      tick(600);

      expect(port.enregistrerAnnotation).toHaveBeenCalledTimes(2);
      expect(annule).toBeTrue();
    }));

    it('affiche l echec reel d un enregistrement', fakeAsync(() => {
      port.enregistrerAnnotation.and.returnValue(throwError(() => new Error('500')));
      const fixture = monter();

      saisirLaNote(fixture, 'Note');
      tick(600);
      fixture.detectChanges();

      expect(etatDeLaNote(fixture)).toBe('echec');
    }));

    it('n enregistre pas une note videe', fakeAsync(() => {
      const fixture = monter();

      saisirLaNote(fixture, '   ');
      tick(600);
      fixture.detectChanges();

      expect(port.enregistrerAnnotation).not.toHaveBeenCalled();
      expect(etatDeLaNote(fixture)).toBe('repos');
    }));

    it('vide la note au changement d ecran sans la reenregistrer sous le nouvel ecran', fakeAsync(() => {
      const fixture = monter();
      saisirLaNote(fixture, 'Note de l ecran 1');

      fixture.componentRef.setInput('ecran', buildEcranDeroule({ id: 'ecran-2' }));
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();

      expect(element<HTMLTextAreaElement>(fixture, 'annotation-note').value).toBe('');
      expect(port.enregistrerAnnotation.calls.allArgs()).toEqual([
        [SESSION, { screenId: 'ecran-1', groupName: 'Classe entière', note: 'Note de l ecran 1' }],
      ]);
    }));
  });

  describe('groupes', () => {
    it('cree un groupe et le propose au suivi de l annotation', fakeAsync(() => {
      const fixture = monter();
      const champ = element<HTMLInputElement>(fixture, 'groupe-nouveau');

      champ.value = 'Groupe du fond';
      champ.dispatchEvent(new Event('input'));
      element<HTMLButtonElement>(fixture, 'groupe-creer').click();
      tick();
      fixture.detectChanges();

      expect(port.creerGroupe).toHaveBeenCalledOnceWith(SESSION, 'Groupe du fond');
      expect(
        [...element<HTMLSelectElement>(fixture, 'annotation-groupe').options].map(
          (option) => option.value,
        ),
      ).toEqual(['Classe entière', 'Groupe du fond']);
    }));

    it('explique le refus d un nom deja pris', fakeAsync(() => {
      port.creerGroupe.and.returnValue(throwError(() => new GroupeRefuse('nom-deja-pris', 409)));
      const fixture = monter();
      const champ = element<HTMLInputElement>(fixture, 'groupe-nouveau');

      champ.value = 'Groupe A';
      champ.dispatchEvent(new Event('input'));
      element<HTMLButtonElement>(fixture, 'groupe-creer').click();
      tick();
      fixture.detectChanges();

      expect(element(fixture, 'groupes-refus').textContent).toContain('déjà pris');
    }));

    it('affecte un participant a un groupe puis l en retire', fakeAsync(() => {
      port.lireGroupes.and.returnValue(of({ groups: [buildGroupeFormation()] }));
      port.lireParticipants.and.returnValue(of({ participants: [buildParticipantDeSeance()] }));
      const fixture = monter();
      const choix = element<HTMLSelectElement>(fixture, 'participant-groupe');

      changer(fixture, choix, 'groupe-1');
      changer(fixture, choix, '');

      expect(port.affecterParticipant).toHaveBeenCalledOnceWith(
        SESSION,
        'participant-1',
        'groupe-1',
      );
      expect(port.retirerParticipantDuGroupe).toHaveBeenCalledOnceWith(SESSION, 'participant-1');
    }));
  });

  it('exporte le bilan de la seance en JSON', fakeAsync(() => {
    const creation = spyOn(URL, 'createObjectURL').and.returnValue('blob:bilan');
    spyOn(URL, 'revokeObjectURL');
    const clic = spyOn(HTMLAnchorElement.prototype, 'click');
    port.exporterBilan.and.returnValue(of(buildRapportSeance({ code: '4821' })));
    const fixture = monter();

    element<HTMLButtonElement>(fixture, 'panneau-exporter-bilan').click();
    tick();

    expect(port.exporterBilan).toHaveBeenCalledOnceWith(SESSION);
    expect((creation.calls.mostRecent().args[0] as Blob).type).toBe('application/json');
    expect((clic.calls.mostRecent().object as HTMLAnchorElement).download).toBe(
      `bilan-seance-${SESSION}.json`,
    );
  }));

  it('signale un export du bilan en echec', fakeAsync(() => {
    port.exporterBilan.and.returnValue(throwError(() => new Error('500')));
    const fixture = monter();

    element<HTMLButtonElement>(fixture, 'panneau-exporter-bilan').click();
    tick();
    fixture.detectChanges();

    expect(element(fixture, 'panneau-export-echec').getAttribute('role')).toBe('alert');
  }));
});
