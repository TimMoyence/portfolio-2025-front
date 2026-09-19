import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import type {
  ConfusionComptee,
  DerouleCours,
  ResultatsSeance,
} from '../../../../cours/content/types';
import type { EtatSession } from '../../../../cours/runtime/core/sync';
import { buildAuthSession } from '../../../../testing/factories/auth.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildResultatQuestion,
  buildResultatsSeance,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { buildVoteQuestion } from '../../../../testing/factories/cours.factory';
import type { FluxDouble } from '../../../../testing/factories/sync.factory';
import { createFluxDouble } from '../../../../testing/factories/sync.factory';
import { cibleMarque } from '../../../../testing/marqueurs-dom';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { CREATEUR_FLUX } from '../cours-flux.token';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
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
        type: 'fp-vote',
        donnees: { question: buildVoteQuestion() },
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

  function apercu(fixture: Fixture): SlideActivityComponent | null {
    const ecran = fixture.debugElement.queryAll(By.directive(SlideActivityComponent)).at(0);
    return ecran === undefined ? null : (ecran.componentInstance as SlideActivityComponent);
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

    expect(apercu(fixture)?.slide()).toEqual({
      id: deroule.ecrans[0].id,
      type: deroule.ecrans[0].type,
      titre: null,
      duree: deroule.ecrans[0].duree,
      interactif: deroule.ecrans[0].interactif,
      donnees: deroule.ecrans[0].donnees,
    });
    expect(Object.hasOwn(apercu(fixture)?.slide() ?? {}, 'corriges')).toBeFalse();
    expect(apercu(fixture)?.render()).toBe('stage');
    expect(apercu(fixture)?.role()).toBe('presentateur');

    diffuser(fixture, { ecranCourant: 1 });

    expect(apercu(fixture)?.slide()).toEqual({
      id: deroule.ecrans[1].id,
      type: deroule.ecrans[1].type,
      titre: null,
      duree: deroule.ecrans[1].duree,
      interactif: deroule.ecrans[1].interactif,
      donnees: deroule.ecrans[1].donnees,
    });
  });

  it('n envoie aucun en-tete authorization sans session ouverte', async () => {
    await monterEtStabiliser();
    const options = double.fabrique.calls.mostRecent().args[0];

    TestBed.inject(AuthStateService).clearSession();

    expect(options.entetes?.()).toEqual({});
  });

  it('recupere les resultats et les transmet a la slide sans afficher les notes ni la correction', async () => {
    const fixture = await monterEtStabiliser();
    const resultats: ResultatsSeance = buildResultatsSeance({
      participants: 12,
      questions: [buildResultatQuestion({ total: 10, correctes: 7 })],
    });
    double.diffuserResultats(resultats);
    fixture.detectChanges();

    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texte).not.toContain(deroule.ecrans[0].notes);
    expect(texte).not.toContain(deroule.ecrans[0].corriges[0].bonneReponse);
    expect(texte).not.toContain(CONFUSIONS_DE_LA_CLASSE[0].libelle);
    expect(port.ouvrirSeance).not.toHaveBeenCalled();
    expect(double.flux.onResultats).toHaveBeenCalled();
    expect(apercu(fixture)?.resultats()).toEqual(jasmine.objectContaining({ ...resultats }));
    expect(texte).not.toContain('Réponses des élèves');
    expect(texte).not.toContain('70 %');
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

  it('propose une projection plein écran dans le vocabulaire de présentation', async () => {
    const fixture = await monterEtStabiliser();

    const bouton = cible(fixture, 'scene-plein-ecran') as HTMLButtonElement;
    expect(bouton.textContent).toContain('Plein écran');
    expect(bouton.getAttribute('aria-pressed')).toBe('false');
  });

  it('signale discretement dans un coin la sante du flux qu elle suit', async () => {
    const fixture = await monterEtStabiliser();
    const pastille = cible(fixture, 'scene-flux');

    expect(pastille.getAttribute('role')).toBe('status');
    expect(pastille.getAttribute('data-etat')).toBe('connexion');
    expect(getComputedStyle(pastille).position).toBe('fixed');

    for (const [statut, etat] of [
      [{ etat: 'connecte' }, 'connecte'],
      [{ etat: 'reconnexion' }, 'reconnexion'],
      [{ etat: 'refuse', statut: 429 }, 'refuse'],
    ] as const) {
      double.diffuserStatut(statut);
      fixture.detectChanges();

      expect(pastille.getAttribute('data-etat')).toBe(etat);
    }
    expect(pastille.textContent).toContain('429');
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

  it('ne projette les comptes d un jalon qu a partir de cinq reponses', async () => {
    const annexe = { type: 'revelation' as const, titre: 'Méthode', lignes: ['Capitaliser'] };
    deroule = buildDerouleCours({
      ecrans: [
        buildEcranDeroule({
          id: 'ecran-jalon',
          type: 'fp-pulse',
          donnees: { sondage: { id: 'P-PULSE-01' } },
          corrigeEcran: annexe,
        }),
      ],
    });
    port.lireDeroule.and.returnValue(of(deroule));
    const fixture = await monterEtStabiliser();
    diffuser(fixture, { ecranCourant: 0, pilotage: { 'ecran-jalon': { revele: true } } });

    double.diffuserResultats({
      ...buildResultatsSeance(),
      jalons: { 'P-PULSE-01': { perdu: 1, 'ca-va': 2, clair: 1, total: 4 } },
    });
    fixture.detectChanges();

    expect(apercu(fixture)?.direct()?.comptesJalon).toBeNull();
    expect(apercu(fixture)?.direct()?.pilotage).toEqual({ revele: true });
    expect(apercu(fixture)?.donneesFormateur()).toBe(annexe);

    const comptes = { perdu: 1, 'ca-va': 2, clair: 2, total: 5 };
    double.diffuserResultats({ ...buildResultatsSeance(), jalons: { 'P-PULSE-01': comptes } });
    fixture.detectChanges();

    expect(apercu(fixture)?.direct()?.comptesJalon).toEqual(comptes);
  });
});
