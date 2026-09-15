import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import type { ConfusionComptee, DerouleCours } from '../../../../cours/content/types';
import type { EtatSession } from '../../../../cours/runtime/core/sync';
import { buildAuthSession } from '../../../../testing/factories/auth.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import type { FluxDouble } from '../../../../testing/factories/sync.factory';
import { createFluxDouble } from '../../../../testing/factories/sync.factory';
import { cibleMarque } from '../../../../testing/marqueurs-dom';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { CREATEUR_FLUX } from '../cours-flux.token';
import { CoursEcranComponent } from '../ecran/cours-ecran.component';
import { CoursSceneComponent } from './cours-scene.component';

type Fixture = ComponentFixture<CoursSceneComponent>;

const SESSION = 'seance-1';
const JETON = 'jwt-formateur';

const CONFUSIONS_DE_LA_CLASSE: readonly ConfusionComptee[] = [
  { id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés', nombre: 1 },
];

function derouleDeSeance(): DerouleCours {
  return buildDerouleCours({
    ecrans: [
      buildEcranDeroule({
        id: 'ecran-vote',
        notes: 'Rappeler la formule de capitalisation avant de lancer le vote.',
        corriges: [
          {
            questionId: 'Q-CAP-03',
            bonneReponse: '1480.24',
            confusions: CONFUSIONS_DE_LA_CLASSE.map(({ id, libelle }) => ({ id, libelle })),
          },
        ],
      }),
      buildEcranDeroule({ id: 'ecran-rappel', notes: '', seuil: null, corriges: [] }),
    ],
  });
}

describe('CoursSceneComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let double: FluxDouble;
  let deroule: DerouleCours;
  const montees: Fixture[] = [];

  function cible(fixture: Fixture, marque: string): HTMLElement {
    return cibleMarque(fixture, marque, 'la scene');
  }

  function apercu(fixture: Fixture): CoursEcranComponent | null {
    const ecran = fixture.debugElement.queryAll(By.directive(CoursEcranComponent)).at(0);
    return ecran === undefined ? null : (ecran.componentInstance as CoursEcranComponent);
  }

  function monter(): Fixture {
    const fixture = TestBed.createComponent(CoursSceneComponent);
    montees.push(fixture);
    fixture.componentRef.setInput('sessionId', SESSION);
    fixture.detectChanges();
    return fixture;
  }

  async function monterEtStabiliser(): Promise<Fixture> {
    const fixture = monter();
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
    return fixture;
  }

  function diffuser(fixture: Fixture, etat: Partial<EtatSession>): void {
    double.diffuser(etat);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    deroule = derouleDeSeance();
    port = createFormationsPortStub();
    port.lireDeroule.and.returnValue(of(deroule));
    double = createFluxDouble();
    await setupTestBed({
      imports: [CoursSceneComponent],
      providers: [
        { provide: FORMATIONS_PORT, useValue: port },
        { provide: CREATEUR_FLUX, useValue: double.fabrique },
      ],
    }).compileComponents();
    TestBed.inject(AuthStateService).login(buildAuthSession({ accessToken: JETON }));
  });

  afterEach(() => {
    for (const fixture of montees) {
      fixture.destroy();
    }
    montees.length = 0;
    TestBed.inject(AuthStateService).clearSession();
  });

  it('lit le deroule de la session puis ouvre le flux formateur pour suivre l ecran courant', async () => {
    const fixture = await monterEtStabiliser();

    expect(port.lireDeroule).toHaveBeenCalledOnceWith(SESSION);
    expect(double.fabrique).toHaveBeenCalledTimes(1);
    const options = double.fabrique.calls.mostRecent().args[0];
    expect(options.chemin).toBe('presenter-stream');
    expect(options.sessionId).toBe(SESSION);
    expect(options.entetes?.()).toEqual({ authorization: `Bearer ${JETON}` });
    expect(double.flux.ouvrir).toHaveBeenCalledTimes(1);

    expect(apercu(fixture)?.ecran()).toBe(deroule.ecrans[0]);
    expect(apercu(fixture)?.rendu()).toBe('stage');
    expect(apercu(fixture)?.role()).toBe('presentateur');

    diffuser(fixture, { ecranCourant: 1 });

    expect(apercu(fixture)?.ecran()).toBe(deroule.ecrans[1]);
  });

  it('n envoie aucun en-tete authorization sans session ouverte', async () => {
    await monterEtStabiliser();
    const options = double.fabrique.calls.mostRecent().args[0];

    TestBed.inject(AuthStateService).clearSession();

    expect(options.entetes?.()).toEqual({});
  });

  it('n affiche ni les notes, ni la bonne reponse, ni les confusions, et ne recupere ni resultats ni code de seance', async () => {
    const fixture = await monterEtStabiliser();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texte).not.toContain(deroule.ecrans[0].notes);
    expect(texte).not.toContain(deroule.ecrans[0].corriges[0].bonneReponse);
    expect(texte).not.toContain(CONFUSIONS_DE_LA_CLASSE[0].libelle);
    expect(port.ouvrirSeance).not.toHaveBeenCalled();
    expect(double.flux.onResultats).not.toHaveBeenCalled();
  });

  it('affiche un message pendant le chargement du deroule', () => {
    port.lireDeroule.and.returnValue(new Subject<DerouleCours>());
    const fixture = monter();

    expect(cible(fixture, 'scene-chargement').getAttribute('role')).toBe('status');
    expect(apercu(fixture)).toBeNull();
  });

  it('alerte quand le deroule ne peut pas etre lu, sans ouvrir de flux', async () => {
    port.lireDeroule.and.returnValue(throwError(() => new Error('reseau coupe')));
    const fixture = await monterEtStabiliser();

    expect(cible(fixture, 'scene-echec').getAttribute('role')).toBe('alert');
    expect(double.fabrique).not.toHaveBeenCalled();
  });

  it('affiche un message de fin et ferme le flux quand la seance est close', async () => {
    const fixture = await monterEtStabiliser();

    diffuser(fixture, { etat: 'terminee', ecranCourant: 0 });

    expect(cible(fixture, 'scene-terminee').getAttribute('role')).toBe('status');
    expect(apercu(fixture)).toBeNull();
    expect(double.flux.close).toHaveBeenCalled();
  });

  it('occupe la hauteur de la fenetre sans deborder et fait defiler un contenu plus grand', async () => {
    const fixture = await monterEtStabiliser();
    const hote = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(hote);

    expect(style.overflowX).toBe('auto');
    expect(style.overflowY).toBe('auto');
    expect(style.boxSizing).toBe('border-box');
    expect(hote.getBoundingClientRect().height).toBe(window.innerHeight);
    expect(hote.getBoundingClientRect().width).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  });

  it('ferme le flux a la destruction de la scene', async () => {
    const fixture = await monterEtStabiliser();

    expect(double.flux.close).not.toHaveBeenCalled();
    fixture.destroy();
    expect(double.flux.close).toHaveBeenCalledTimes(1);
  });
});
