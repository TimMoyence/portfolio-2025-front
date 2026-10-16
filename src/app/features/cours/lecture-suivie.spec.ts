import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { type Chargement, type LectureSuivie, lectureSuivie } from './lecture-suivie';

function lecteur(): LectureSuivie {
  return TestBed.runInInjectionContext(() => lectureSuivie());
}

function reseauCoupe(): Observable<never> {
  return throwError(() => new Error('reseau coupe'));
}

describe('lectureSuivie', () => {
  beforeEach(() => {
    setupTestBed({ http: false });
  });

  it('passe par le chargement puis le succes et rend la ressource lue', async () => {
    const etat = signal<Chargement>('repos');
    const source = new Subject<string>();
    const lecture = lecteur()(source, etat);

    expect(etat()).toBe('chargement');

    source.next('deroule');
    source.complete();

    expect(await lecture).toBe('deroule');
    expect(etat()).toBe('succes');
  });

  it('passe a l echec et ne rend rien quand la lecture echoue', async () => {
    const etat = signal<Chargement>('repos');

    expect(await lecteur()(reseauCoupe(), etat)).toBeNull();
    expect(etat()).toBe('echec');
  });

  it('dit l attente commune d une lecture limitee et l oublie a la lecture suivante', async () => {
    const etat = signal<Chargement>('repos');
    const limite = signal<string | null>(null);
    const lire = lecteur();
    const limitee = throwError(() =>
      refusDuBack(429, 'Too Many Requests', { 'Retry-After': '120' }),
    );

    expect(await lire(limitee, etat, limite)).toBeNull();
    expect([etat(), limite()]).toEqual([
      'echec',
      'Trop de tentatives en peu de temps : réessayez dans 2 min.',
    ]);

    expect(await lire(reseauCoupe(), etat, limite)).toBeNull();
    expect([etat(), limite()]).toEqual(['echec', null]);
  });

  it('lit une ressource sans etat a suivre', async () => {
    expect(await lecteur()(of('enonces'))).toBe('enonces');
    expect(await lecteur()(reseauCoupe())).toBeNull();
  });

  it('ne rend rien et ne touche plus l etat quand le composant est detruit pendant la lecture', async () => {
    const injecteur = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const lire = runInInjectionContext(injecteur, () => lectureSuivie());
    const reussie = signal<Chargement>('repos');
    const echouee = signal<Chargement>('repos');
    const sourceReussie = new Subject<string>();
    const sourceEchouee = new Subject<string>();
    const lectures = Promise.all([lire(sourceReussie, reussie), lire(sourceEchouee, echouee)]);

    injecteur.destroy();
    sourceReussie.next('deroule');
    sourceReussie.complete();
    sourceEchouee.error(new Error('reseau coupe'));

    expect(await lectures).toEqual([null, null]);
    expect([reussie(), echouee()]).toEqual(['chargement', 'chargement']);
  });
});
