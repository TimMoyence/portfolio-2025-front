import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { balisesInjectees, CHARGE_XSS, xssDeclenche } from '../../../../../testing/charge-xss';
import {
  buildParticipantDeSeance,
  createFormationsPortStub,
} from '../../../../../testing/factories/formations.factory';
import { cibleMarque, lireMarque as lire } from '../../../../../testing/marqueurs-dom';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../../core/ports/formations.port';
import { PanneauParticipantsComponent } from './panneau-participants.component';

type Fixture = ComponentFixture<PanneauParticipantsComponent>;

const SESSION = 'seance-1';

describe('PanneauParticipantsComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;

  function monter(sessionId: string | null = SESSION): Fixture {
    const fixture = TestBed.createComponent(PanneauParticipantsComponent);
    fixture.componentRef.setInput('sessionId', sessionId);
    fixture.detectChanges();
    return fixture;
  }

  async function cliquerLePremier(fixture: Fixture, marque: string): Promise<void> {
    const boutons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      `[data-testid="${marque}"]`,
    );
    expect(boutons.length).withContext(marque).toBeGreaterThan(0);
    boutons[0].click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function afficherDeuxParticipants(): Promise<Fixture> {
    port.lireParticipants.and.returnValue(
      of({
        participants: [
          buildParticipantDeSeance(),
          buildParticipantDeSeance({ id: 'participant-2', prenom: 'Sami' }),
        ],
      }),
    );
    const fixture = monter();
    await cliquerLePremier(fixture, 'activite-participants-afficher');
    return fixture;
  }

  function evinces(fixture: Fixture): readonly (string | null)[] {
    return [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="activite-participant"]',
      ),
    ].map((ligne) => ligne.getAttribute('data-evince'));
  }

  beforeEach(async () => {
    port = createFormationsPortStub();
    await setupTestBed({
      imports: [PanneauParticipantsComponent],
      providers: [{ provide: FORMATIONS_PORT, useValue: port }],
    }).compileComponents();
  });

  it('alerte quand la liste ne peut pas etre lue, puis permet de reessayer ou de masquer', async () => {
    port.lireParticipants.and.returnValue(throwError(() => new Error('reseau coupe')));
    const fixture = monter();

    await cliquerLePremier(fixture, 'activite-participants-afficher');

    expect(lire(fixture, 'activite-participants-echec')?.getAttribute('role')).toBe('alert');
    port.lireParticipants.and.returnValue(of({ participants: [buildParticipantDeSeance()] }));
    await cliquerLePremier(fixture, 'activite-participants-reessayer');
    expect(lire(fixture, 'activite-participant')).not.toBeNull();

    await masquerLaListe(fixture);
  });

  async function masquerLaListe(fixture: Fixture): Promise<void> {
    await cliquerLePremier(fixture, 'activite-participants-masquer');

    expect(lire(fixture, 'activite-participant')).toBeNull();
    expect(lire(fixture, 'activite-participants-afficher')).not.toBeNull();
  }

  it('lit les participants puis marque evince celui que le formateur retire', async () => {
    const fixture = await afficherDeuxParticipants();

    await cliquerLePremier(fixture, 'activite-evincer');

    expect(port.evincerParticipant).toHaveBeenCalledOnceWith(SESSION, 'participant-1');
    expect(evinces(fixture)).toEqual(['true', 'false']);
  });

  it('referme la liste a la demande du formateur', async () => {
    await masquerLaListe(await afficherDeuxParticipants());
  });

  it('readmet l evince que le formateur avait retire par erreur', async () => {
    const fixture = await afficherDeuxParticipants();
    await cliquerLePremier(fixture, 'activite-evincer');

    await cliquerLePremier(fixture, 'activite-readmettre');

    expect(port.readmettreParticipant).toHaveBeenCalledOnceWith(SESSION, 'participant-1');
    expect(evinces(fixture)).toEqual(['false', 'false']);
  });

  it('alerte quand la readmission est refusee, la place ayant ete reprise', async () => {
    const fixture = await afficherDeuxParticipants();
    await cliquerLePremier(fixture, 'activite-evincer');
    port.readmettreParticipant.and.returnValue(throwError(() => new Error('seance complete')));

    await cliquerLePremier(fixture, 'activite-readmettre');

    expect(lire(fixture, 'activite-participants-echec')?.getAttribute('role')).toBe('alert');
    expect(lire(fixture, 'activite-participants-masquer')).not.toBeNull();
  });

  it('S1 · libere le poste d un participant pour qu il reprenne sa place depuis un autre appareil', async () => {
    const fixture = await afficherDeuxParticipants();

    await cliquerLePremier(fixture, 'activite-liberer');

    expect(port.libererPoste).toHaveBeenCalledOnceWith(SESSION, 'participant-1');
    expect(lire(fixture, 'activite-poste-libere')?.getAttribute('role')).toBe('status');
    expect(lire(fixture, 'activite-poste-libere')?.textContent).toContain('Lea Dubois');
    expect(evinces(fixture)).toEqual(['false', 'false']);
  });

  it('S1 · ne propose pas de liberer le poste d un participant evince', async () => {
    const fixture = await afficherDeuxParticipants();
    await cliquerLePremier(fixture, 'activite-evincer');

    const ligne = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-participant="participant-1"]',
    );
    expect(ligne?.querySelector('[data-testid="activite-liberer"]')).toBeNull();
  });

  it('S1 · alerte quand la liberation du poste est refusee', async () => {
    const fixture = await afficherDeuxParticipants();
    port.libererPoste.and.returnValue(throwError(() => new Error('participant introuvable')));

    await cliquerLePremier(fixture, 'activite-liberer');

    expect(lire(fixture, 'activite-participants-echec')?.getAttribute('role')).toBe('alert');
    expect(lire(fixture, 'activite-poste-libere')).toBeNull();
  });

  it('T6 · affiche un nom piege en texte brut dans la liste comme dans l avis de liberation', async () => {
    port.lireParticipants.and.returnValue(
      of({ participants: [buildParticipantDeSeance({ prenom: CHARGE_XSS, nom: CHARGE_XSS })] }),
    );
    const fixture = monter();
    await cliquerLePremier(fixture, 'activite-participants-afficher');

    await cliquerLePremier(fixture, 'activite-liberer');

    expect(lire(fixture, 'activite-participant')?.textContent).toContain(CHARGE_XSS);
    expect(lire(fixture, 'activite-poste-libere')?.textContent).toContain(CHARGE_XSS);
    expect(balisesInjectees(fixture.nativeElement as HTMLElement)).toBe(0);
    expect(xssDeclenche()).toBeFalse();
  });

  it('ne lit rien sans seance ouverte', () => {
    const fixture = monter(null);

    expect(
      (cibleMarque(fixture, 'activite-participants-afficher', 'le panneau') as HTMLButtonElement)
        .disabled,
    ).toBeTrue();
  });
});
