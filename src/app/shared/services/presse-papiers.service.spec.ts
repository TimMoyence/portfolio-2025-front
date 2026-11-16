import { PLATFORM_ID } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { poserLePressePapiers, rendreLePressePapiers } from '../../../testing/dom/presse-papiers';
import { PressePapiersService } from './presse-papiers.service';

const LIBELLES = { repos: 'Copier', copie: 'Copié !' };
const ECHEC = 'Échec — copiez à la main';

function service(plateforme: 'browser' | 'server' = 'browser'): PressePapiersService {
  TestBed.configureTestingModule({
    providers: [PressePapiersService, { provide: PLATFORM_ID, useValue: plateforme }],
  });
  return TestBed.inject(PressePapiersService);
}

describe('PressePapiersService', () => {
  afterEach(() => rendreLePressePapiers());

  it('annonce le libellé de repos tant que rien n est copié', () => {
    expect(service().libelle('texte', LIBELLES)).toBe('Copier');
  });

  it('copie le texte exact, annonce la copie pour ce texte seul, puis revient au repos', fakeAsync(() => {
    const pressePapiers = service();
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    poserLePressePapiers(writeText);

    pressePapiers.copier('mon-prompt');
    flushMicrotasks();

    expect(writeText).toHaveBeenCalledOnceWith('mon-prompt');
    expect(pressePapiers.libelle('mon-prompt', LIBELLES)).toBe('Copié !');
    expect(pressePapiers.libelle('autre-prompt', LIBELLES)).toBe('Copier');
    tick(2000);
    expect(pressePapiers.libelle('mon-prompt', LIBELLES)).toBe('Copier');
  }));

  for (const [cas, presse] of [
    [
      'quand le presse-papiers refuse',
      () => jasmine.createSpy('writeText').and.rejectWith(new Error('refus')),
    ],
    ['sans presse-papiers', () => null],
  ] as const) {
    it(`annonce l échec ${cas}, puis revient au repos`, fakeAsync(() => {
      const consoleError = spyOn(console, 'error');
      const pressePapiers = service();
      poserLePressePapiers(presse());

      pressePapiers.copier('texte-ko');
      flushMicrotasks();

      expect(pressePapiers.libelle('texte-ko', LIBELLES)).toBe(ECHEC);
      expect(pressePapiers.texteCopie()).toBeNull();
      expect(consoleError).toHaveBeenCalled();
      tick(2500);
      expect(pressePapiers.libelle('texte-ko', LIBELLES)).toBe('Copier');
    }));
  }

  it('efface l échec d un texte qu une copie suivante réussit', fakeAsync(() => {
    spyOn(console, 'error');
    const pressePapiers = service();
    poserLePressePapiers(jasmine.createSpy('writeText').and.rejectWith(new Error('refus')));
    pressePapiers.copier('texte');
    flushMicrotasks();
    poserLePressePapiers(jasmine.createSpy('writeText').and.resolveTo());

    pressePapiers.copier('texte');
    flushMicrotasks();

    expect(pressePapiers.libelle('texte', LIBELLES)).toBe('Copié !');
    tick(2500);
  }));

  for (const [annonce, ecrire, attendu, duree] of [
    ['une copie suivante', () => jasmine.createSpy('writeText').and.resolveTo(), 'Copié !', 2000],
    [
      'un échec suivant',
      () => jasmine.createSpy('writeText').and.rejectWith(new Error('refus')),
      ECHEC,
      2500,
    ],
  ] as const) {
    it(`garde à ${annonce} son annonce entière, sans que la minuterie de la précédente l efface`, fakeAsync(() => {
      spyOn(console, 'error');
      const pressePapiers = service();
      poserLePressePapiers(ecrire());
      pressePapiers.copier('texte');
      flushMicrotasks();
      tick(duree - 500);

      pressePapiers.copier('texte');
      flushMicrotasks();
      tick(1000);

      expect(pressePapiers.libelle('texte', LIBELLES)).toBe(attendu);
      tick(duree - 1000);
      expect(pressePapiers.libelle('texte', LIBELLES)).toBe('Copier');
    }));
  }

  it('ne touche pas au presse-papiers côté serveur', () => {
    const pressePapiers = service('server');
    const writeText = jasmine.createSpy('writeText');
    poserLePressePapiers(writeText);

    pressePapiers.copier('rien-cote-serveur');

    expect(writeText).not.toHaveBeenCalled();
    expect(pressePapiers.libelle('rien-cote-serveur', LIBELLES)).toBe('Copier');
  });
});
