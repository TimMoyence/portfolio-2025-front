import { fakeAsync, tick } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import {
  buildAnnotationFormateur,
  buildEcranDeroule,
  buildRapportSeance,
  buildReponseLibreFormateur,
  buildResultatQuestion,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import type { FixtureDuPanneau } from '../../../../testing/panneau-pedagogique';
import {
  SEANCE_DU_PANNEAU,
  monterLePanneau,
  noteAffichee,
  preparerLePanneau,
  relireLePanneau,
  repereDuPanneau,
  saisirLaNoteDuPanneau,
} from '../../../../testing/panneau-pedagogique';
import type { AnnotationFormateur, FormationsPort } from '../../../core/ports/formations.port';

const SESSION = SEANCE_DU_PANNEAU;

describe('CoursPanneauPedagogiqueComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;

  function etatDeLaNote(fixture: FixtureDuPanneau): string | null {
    return repereDuPanneau(fixture, 'annotation-etat').getAttribute('data-etat');
  }

  beforeEach(() => {
    port = createFormationsPortStub();
    preparerLePanneau(port);
  });

  it('lit annotations et reponses libres de la seance', fakeAsync(() => {
    monterLePanneau();

    for (const lecture of [port.lireAnnotations, port.lireReponsesLibres]) {
      expect(lecture).toHaveBeenCalledOnceWith(SESSION);
    }
  }));

  it('relit les donnees partagees a chaque resultat recu du flux, sans autre sondage', fakeAsync(() => {
    const fixture = monterLePanneau();

    fixture.componentRef.setInput('resultats', [buildResultatQuestion()]);
    fixture.detectChanges();
    tick();

    expect(port.lireAnnotations).toHaveBeenCalledTimes(2);
    expect(port.lireReponsesLibres).toHaveBeenCalledTimes(2);
    tick(60_000);
    expect(port.lireAnnotations).toHaveBeenCalledTimes(2);
  }));

  it('signale une relecture refusee au lieu d afficher des listes vides', fakeAsync(() => {
    port.lireAnnotations.and.returnValue(throwError(() => new Error('403')));

    const fixture = monterLePanneau();

    expect(repereDuPanneau(fixture, 'panneau-lecture-echec').getAttribute('role')).toBe('alert');
  }));

  describe('enregistrement de la note', () => {
    it('n envoie qu une requete, 600 ms apres la derniere frappe', fakeAsync(() => {
      const fixture = monterLePanneau();

      saisirLaNoteDuPanneau(fixture, 'R');
      saisirLaNoteDuPanneau(fixture, 'Re');
      saisirLaNoteDuPanneau(fixture, 'Relancer');
      tick(599);

      expect(port.enregistrerAnnotation).not.toHaveBeenCalled();
      expect(etatDeLaNote(fixture)).toBe('en_cours');

      tick(1);
      fixture.detectChanges();

      expect(port.enregistrerAnnotation).toHaveBeenCalledOnceWith(SESSION, {
        screenId: 'ecran-1',
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
      const fixture = monterLePanneau();

      saisirLaNoteDuPanneau(fixture, 'Premiere version');
      tick(600);
      saisirLaNoteDuPanneau(fixture, 'Seconde version');
      tick(600);

      expect(port.enregistrerAnnotation).toHaveBeenCalledTimes(2);
      expect(annule).toBeTrue();
    }));

    it('affiche l echec reel d un enregistrement', fakeAsync(() => {
      port.enregistrerAnnotation.and.returnValue(throwError(() => new Error('500')));
      const fixture = monterLePanneau();

      saisirLaNoteDuPanneau(fixture, 'Note');
      tick(600);
      fixture.detectChanges();

      expect(etatDeLaNote(fixture)).toBe('echec');
    }));

    it('n enregistre pas une note videe', fakeAsync(() => {
      const fixture = monterLePanneau();

      saisirLaNoteDuPanneau(fixture, '   ');
      tick(600);
      fixture.detectChanges();

      expect(port.enregistrerAnnotation).not.toHaveBeenCalled();
      expect(etatDeLaNote(fixture)).toBe('repos');
    }));

    it('ne laisse pas une relecture plus ancienne ecraser la note qui vient d etre enregistree', fakeAsync(() => {
      port.lireAnnotations.and.returnValue(
        of({
          annotations: [
            buildAnnotationFormateur({ note: 'Ancienne', updatedAt: '2026-09-19T08:00:00.000Z' }),
          ],
        }),
      );
      port.enregistrerAnnotation.and.returnValue(
        of(buildAnnotationFormateur({ note: 'Nouvelle', updatedAt: '2026-09-19T09:00:00.000Z' })),
      );
      const fixture = monterLePanneau();
      saisirLaNoteDuPanneau(fixture, 'Nouvelle');
      tick(600);

      relireLePanneau(fixture);

      expect(port.lireAnnotations).toHaveBeenCalledTimes(2);
      expect(noteAffichee(fixture)).toBe('Nouvelle');
    }));

    it('vide la note au changement d ecran sans la reenregistrer sous le nouvel ecran', fakeAsync(() => {
      const fixture = monterLePanneau();
      saisirLaNoteDuPanneau(fixture, 'Note de l ecran 1');

      fixture.componentRef.setInput('ecran', buildEcranDeroule({ id: 'ecran-2' }));
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();

      expect(noteAffichee(fixture)).toBe('');
      expect(port.enregistrerAnnotation.calls.allArgs()).toEqual([
        [SESSION, { screenId: 'ecran-1', note: 'Note de l ecran 1' }],
      ]);
    }));
  });

  it('ne propose plus aucun suivi par groupe', fakeAsync(() => {
    const fixture = monterLePanneau();
    const hote = fixture.nativeElement as HTMLElement;

    expect(hote.querySelector('[data-testid="groupe-nouveau"]')).toBeNull();
    expect(hote.querySelector('select')).toBeNull();
  }));

  it('groupe les reponses libres sous la question de l ecran', fakeAsync(() => {
    port.lireReponsesLibres.and.returnValue(
      of({
        responses: [
          buildReponseLibreFormateur({ activityId: 'mission:mesure', response: 'Un montant.' }),
        ],
      }),
    );
    const fixture = monterLePanneau();
    fixture.componentRef.setInput(
      'ecran',
      buildEcranDeroule({
        type: 'fp-pro',
        donnees: {
          cas: { questionsLibres: [{ id: 'mission:mesure', question: 'Que mesure-t-il ?' }] },
        },
      }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(repereDuPanneau(fixture, 'reponses-libres-question').textContent?.trim()).toBe(
      'Que mesure-t-il ?',
    );
    expect(repereDuPanneau(fixture, 'reponse-libre').textContent?.trim()).toBe('Un montant.');
  }));

  it('exporte le bilan de la seance en JSON', fakeAsync(() => {
    const creation = spyOn(URL, 'createObjectURL').and.returnValue('blob:bilan');
    spyOn(URL, 'revokeObjectURL');
    const clic = spyOn(HTMLAnchorElement.prototype, 'click');
    port.exporterBilan.and.returnValue(of(buildRapportSeance({ code: '4821' })));
    const fixture = monterLePanneau();

    repereDuPanneau<HTMLButtonElement>(fixture, 'panneau-exporter-bilan').click();
    tick();

    expect(port.exporterBilan).toHaveBeenCalledOnceWith(SESSION);
    expect((creation.calls.mostRecent().args[0] as Blob).type).toBe('application/json');
    expect((clic.calls.mostRecent().object as HTMLAnchorElement).download).toBe(
      `bilan-seance-${SESSION}.json`,
    );
  }));

  it('signale un export du bilan en echec', fakeAsync(() => {
    port.exporterBilan.and.returnValue(throwError(() => new Error('500')));
    const fixture = monterLePanneau();

    repereDuPanneau<HTMLButtonElement>(fixture, 'panneau-exporter-bilan').click();
    tick();
    fixture.detectChanges();

    expect(repereDuPanneau(fixture, 'panneau-export-echec').getAttribute('role')).toBe('alert');
  }));
});
