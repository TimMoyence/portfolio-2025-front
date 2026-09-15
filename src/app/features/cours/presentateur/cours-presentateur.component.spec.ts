import { APP_BASE_HREF } from '@angular/common';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
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
import type { FluxDouble } from '../../../../testing/factories/sync.factory';
import { createFluxDouble } from '../../../../testing/factories/sync.factory';
import { cibleMarque, lireMarque as lire } from '../../../../testing/marqueurs-dom';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort, SeanceOuverte } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { CREATEUR_FLUX } from '../cours-flux.token';
import { CoursEcranComponent } from '../ecran/cours-ecran.component';
import { CoursPresentateurComponent } from './cours-presentateur.component';

type Fixture = ComponentFixture<CoursPresentateurComponent>;

const SLUG = 'b1-09-interets-composes';
const SESSION = 'seance-1';
const CODE = '4821';
const JETON = 'jwt-formateur';
const BASE_DE_L_APPLICATION = '/fr/';

const CONFUSIONS_DE_LA_CLASSE: readonly ConfusionComptee[] = [
  { id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés', nombre: 1 },
  { id: 'taux-annuel', libelle: 'Taux annuel appliqué à chaque mois', nombre: 3 },
];

function derouleDeSeance(): DerouleCours {
  const sansQuestion = { seuil: null, corriges: [] };
  return buildDerouleCours({
    ecrans: [
      buildEcranDeroule({
        id: 'ecran-vote',
        corriges: [
          {
            questionId: 'Q-CAP-03',
            bonneReponse: '1480.24',
            confusions: CONFUSIONS_DE_LA_CLASSE.map(({ id, libelle }) => ({ id, libelle })),
          },
        ],
      }),
      buildEcranDeroule({ id: 'ecran-rappel', ...sansQuestion }),
      buildEcranDeroule({ id: 'ecran-exercice', ...sansQuestion }),
      buildEcranDeroule({ id: 'ecran-taux', ...sansQuestion }),
    ],
    remediations: { 'interet-simple': 'ecran-rappel', 'taux-annuel': 'ecran-taux' },
  });
}

function resultatsDeLaQuestion(total: number, correctes: number): ResultatsSeance {
  return buildResultatsSeance({
    participants: 20,
    questions: [
      buildResultatQuestion({
        questionId: 'Q-CAP-03',
        total,
        correctes,
        neSaitPas: 1,
        confusions: CONFUSIONS_DE_LA_CLASSE,
      }),
    ],
  });
}

describe('CoursPresentateurComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let double: FluxDouble;
  let deroule: DerouleCours;
  const montees: Fixture[] = [];

  function cible(fixture: Fixture, marque: string): HTMLElement {
    return cibleMarque(fixture, marque, 'le pupitre');
  }

  function texte(fixture: Fixture, marque: string): string {
    return cible(fixture, marque).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function bouton(fixture: Fixture, marque: string): HTMLButtonElement {
    return cible(fixture, marque) as HTMLButtonElement;
  }

  function apercu(fixture: Fixture): CoursEcranComponent {
    const ecran = fixture.debugElement.queryAll(By.directive(CoursEcranComponent)).at(0);
    if (ecran === undefined) {
      throw new Error('Aucun apercu d ecran dans le pupitre');
    }
    return ecran.componentInstance as CoursEcranComponent;
  }

  function monter(): Fixture {
    const fixture = TestBed.createComponent(CoursPresentateurComponent);
    montees.push(fixture);
    fixture.componentRef.setInput('slug', SLUG);
    fixture.detectChanges();
    return fixture;
  }

  async function stabiliser(fixture: Fixture): Promise<void> {
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
  }

  async function cliquer(fixture: Fixture, marque: string): Promise<void> {
    bouton(fixture, marque).click();
    fixture.detectChanges();
    await stabiliser(fixture);
  }

  async function ouvrirLaSeance(): Promise<Fixture> {
    const fixture = monter();
    await cliquer(fixture, 'presentateur-ouvrir');
    return fixture;
  }

  function diffuser(fixture: Fixture, etat: Partial<EtatSession>): void {
    double.diffuser(etat);
    fixture.detectChanges();
  }

  function publier(fixture: Fixture, resultats: ResultatsSeance): void {
    double.diffuserResultats(resultats);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    deroule = derouleDeSeance();
    port = createFormationsPortStub();
    port.ouvrirSeance.and.returnValue(of({ sessionId: SESSION, code: CODE }));
    port.lireDeroule.and.returnValue(of(deroule));
    double = createFluxDouble();
    await setupTestBed({
      router: true,
      imports: [CoursPresentateurComponent],
      providers: [
        { provide: FORMATIONS_PORT, useValue: port },
        { provide: CREATEUR_FLUX, useValue: double.fabrique },
        { provide: APP_BASE_HREF, useValue: BASE_DE_L_APPLICATION },
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

  it('ouvre la seance par son slug et ne lit le deroule qu une fois la seance ouverte', async () => {
    const ouverture = new Subject<SeanceOuverte>();
    const lecture = new Subject<DerouleCours>();
    let annoncerLaLecture: () => void = () => undefined;
    const lectureDemandee = new Promise<void>((resoudre) => {
      annoncerLaLecture = resoudre;
    });
    port.ouvrirSeance.and.returnValue(ouverture);
    port.lireDeroule.and.callFake(() => {
      annoncerLaLecture();
      return lecture;
    });
    const fixture = monter();

    bouton(fixture, 'presentateur-ouvrir').click();
    fixture.detectChanges();

    expect(port.ouvrirSeance).toHaveBeenCalledOnceWith(SLUG);
    expect(cible(fixture, 'presentateur-ouverture-chargement').getAttribute('role')).toBe('status');
    expect(port.lireDeroule).not.toHaveBeenCalled();

    ouverture.next({ sessionId: SESSION, code: CODE });
    ouverture.complete();
    await lectureDemandee;
    fixture.detectChanges();

    expect(port.lireDeroule).toHaveBeenCalledOnceWith(SESSION);
    expect(texte(fixture, 'presentateur-code')).toBe(CODE);
    expect(cible(fixture, 'presentateur-deroule-chargement').getAttribute('role')).toBe('status');
    expect(double.fabrique).not.toHaveBeenCalled();

    lecture.next(deroule);
    lecture.complete();
    await stabiliser(fixture);

    expect(lire(fixture, 'presentateur-deroule-chargement')).toBeNull();
    expect(texte(fixture, 'presentateur-titre')).toBe(deroule.titre);
    expect(double.fabrique).toHaveBeenCalledTimes(1);
  });

  it('affiche le code de seance en tres grand des l ouverture', async () => {
    const fixture = await ouvrirLaSeance();

    expect(parseFloat(getComputedStyle(cible(fixture, 'presentateur-code')).fontSize))
      .withContext('le code doit se lire depuis le fond de la salle')
      .toBeGreaterThanOrEqual(64);
  });

  it('alerte quand la seance ne s ouvre pas, sans lire de deroule ni ouvrir de flux', async () => {
    port.ouvrirSeance.and.returnValue(throwError(() => new Error('refus')));
    const fixture = await ouvrirLaSeance();

    expect(cible(fixture, 'presentateur-ouverture-echec').getAttribute('role')).toBe('alert');
    expect(port.lireDeroule).not.toHaveBeenCalled();
    expect(double.fabrique).not.toHaveBeenCalled();
    expect(bouton(fixture, 'presentateur-ouvrir').disabled).toBeFalse();
  });

  it('relit a la demande un deroule en echec sans rouvrir la seance', async () => {
    port.lireDeroule.and.returnValues(
      throwError(() => new Error('reseau coupe')),
      of(deroule),
    );
    const fixture = await ouvrirLaSeance();

    expect(cible(fixture, 'presentateur-deroule-echec').getAttribute('role')).toBe('alert');
    expect(double.fabrique).not.toHaveBeenCalled();

    await cliquer(fixture, 'presentateur-deroule-reessayer');

    expect(port.ouvrirSeance).toHaveBeenCalledTimes(1);
    expect(port.lireDeroule.calls.allArgs()).toEqual([[SESSION], [SESSION]]);
    expect(lire(fixture, 'presentateur-deroule-echec')).toBeNull();
    expect(double.fabrique).toHaveBeenCalledTimes(1);
  });

  it('laisse relire le deroule et clore la seance quand le deroule reste en echec', async () => {
    const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    port.lireDeroule.and.returnValue(throwError(() => new Error('reseau coupe')));
    const fixture = await ouvrirLaSeance();

    expect(lire(fixture, 'presentateur-deroule-reessayer')).toBeTruthy();

    await cliquer(fixture, 'presentateur-cloturer');
    await cliquer(fixture, 'presentateur-cloture-confirmer');

    expect(port.cloturer).toHaveBeenCalledOnceWith(SESSION);
    expect(navigation).toHaveBeenCalledOnceWith(['/cours/seance', SESSION, 'synthese']);
  });

  it('n envoie aucun en-tete authorization au flux sans session', async () => {
    await ouvrirLaSeance();
    const options = double.fabrique.calls.mostRecent().args[0];

    TestBed.inject(AuthStateService).clearSession();

    expect(options.entetes?.()).toEqual({});
  });

  it('ouvre le flux formateur avec le jeton du compte, sans rejoindre comme un etudiant', async () => {
    await ouvrirLaSeance();
    const options = double.fabrique.calls.mostRecent().args[0];

    expect(double.fabrique).toHaveBeenCalledTimes(1);
    expect(options.sessionId).toBe(SESSION);
    expect(options.chemin).toBe('presenter-stream');
    expect(options.jeton).toBeUndefined();
    expect(options.entetes?.()).toEqual({ authorization: `Bearer ${JETON}` });
    expect(double.flux.ouvrir).toHaveBeenCalledTimes(1);
    expect(double.flux.join).not.toHaveBeenCalled();

    TestBed.inject(AuthStateService).login(buildAuthSession({ accessToken: 'jwt-renouvele' }));

    expect(options.entetes?.())
      .withContext('une reconnexion du flux porte le jeton du moment')
      .toEqual({ authorization: 'Bearer jwt-renouvele' });
  });

  it('compte les participants dans les resultats et non dans l etat du flux', async () => {
    const fixture = await ouvrirLaSeance();

    diffuser(fixture, { participants: 99 });

    expect(texte(fixture, 'presentateur-participants-nombre')).toBe('0');

    publier(fixture, buildResultatsSeance({ participants: 12 }));

    expect(texte(fixture, 'presentateur-participants-nombre')).toBe('12');
  });

  it('demarre la seance puis retire le bouton de demarrage', async () => {
    const fixture = await ouvrirLaSeance();

    await cliquer(fixture, 'presentateur-demarrer');

    expect(port.demarrer).toHaveBeenCalledOnceWith(SESSION);
    expect(lire(fixture, 'presentateur-demarrer')).toBeNull();
  });

  it('suit l ecran, le rythme et la fin annonces par le flux', async () => {
    const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = await ouvrirLaSeance();

    diffuser(fixture, {
      ecranCourant: 2,
      modeRythme: 'libre',
      intervalleLibre: { premier: 2, dernier: 3 },
    });

    expect(texte(fixture, 'presentateur-ecran')).toBe('3 / 4');
    expect(cible(fixture, 'presentateur-rythme-mode').getAttribute('data-mode')).toBe('libre');
    expect(apercu(fixture).ecran()).toBe(deroule.ecrans[2]);

    diffuser(fixture, { etat: 'terminee', ecranCourant: 2 });

    expect(cible(fixture, 'presentateur-terminee').getAttribute('role')).toBe('status');
    expect(lire(fixture, 'presentateur-suivant')).toBeNull();
    expect(double.flux.close).toHaveBeenCalled();

    bouton(fixture, 'presentateur-synthese').click();

    expect(navigation).toHaveBeenCalledOnceWith(['/cours/seance', SESSION, 'synthese']);
  });

  it('montre en scene l ecran courant du deroule avec ses notes, sans le remonter a chaque etat', async () => {
    const fixture = await ouvrirLaSeance();
    const ecran = apercu(fixture);
    const hote = fixture.debugElement.query(By.directive(CoursEcranComponent))
      .nativeElement as HTMLElement;

    expect(ecran.ecran()).toBe(deroule.ecrans[0]);
    expect(ecran.rendu()).toBe('stage');
    expect(ecran.role()).toBe('presentateur');
    expect(hote.hasAttribute('role'))
      .withContext('presentateur est un role du runtime, pas un role ARIA')
      .toBeFalse();
    expect(texte(fixture, 'presentateur-notes')).toContain(deroule.ecrans[0].notes);

    diffuser(fixture, { ecranCourant: 0, participants: 5 });

    expect(apercu(fixture)).toBe(ecran);
  });

  it('avance l ecran affiche sans attendre l echo du flux', async () => {
    port.piloter.and.returnValue(new Subject<void>());
    const fixture = await ouvrirLaSeance();

    bouton(fixture, 'presentateur-suivant').click();
    diffuser(fixture, { ecranCourant: 0 });

    expect(texte(fixture, 'presentateur-ecran')).toBe('2 / 4');
    expect(port.piloter).toHaveBeenCalledOnceWith(SESSION, { ecran: 1 });
  });

  it('un double clic sur suivant n avance que d un ecran', async () => {
    const commande = new Subject<void>();
    port.piloter.and.returnValue(commande);
    const fixture = await ouvrirLaSeance();
    const suivant = bouton(fixture, 'presentateur-suivant');

    suivant.click();
    suivant.click();
    fixture.detectChanges();

    expect(port.piloter).toHaveBeenCalledTimes(1);
    expect(texte(fixture, 'presentateur-ecran')).toBe('2 / 4');

    commande.complete();
    await stabiliser(fixture);
    suivant.click();
    fixture.detectChanges();

    expect(port.piloter).toHaveBeenCalledTimes(2);
    expect(texte(fixture, 'presentateur-ecran')).toBe('3 / 4');
  });

  it('borne la navigation au premier et au dernier ecran du deroule', async () => {
    const fixture = await ouvrirLaSeance();

    expect(bouton(fixture, 'presentateur-precedent').disabled).toBeTrue();
    fixture.componentInstance.allerA(-1);

    diffuser(fixture, { ecranCourant: 3 });

    expect(bouton(fixture, 'presentateur-suivant').disabled).toBeTrue();
    fixture.componentInstance.allerA(4);
    fixture.detectChanges();

    expect(port.piloter).not.toHaveBeenCalled();
    expect(texte(fixture, 'presentateur-ecran')).toBe('4 / 4');
  });

  it('ouvre le rythme libre de l ecran courant au dernier ecran, puis reprend la main', async () => {
    const fixture = await ouvrirLaSeance();
    diffuser(fixture, { ecranCourant: 1 });

    await cliquer(fixture, 'presentateur-rythme');

    expect(port.piloter).toHaveBeenCalledWith(SESSION, {
      mode: 'libre',
      intervalle: { premier: 1, dernier: 3 },
    });
    expect(cible(fixture, 'presentateur-rythme-mode').getAttribute('data-mode')).toBe('libre');

    await cliquer(fixture, 'presentateur-rythme');

    expect(port.piloter).toHaveBeenCalledWith(SESSION, { mode: 'pilote' });
    expect(cible(fixture, 'presentateur-rythme-mode').getAttribute('data-mode')).toBe('pilote');
  });

  it('revient a l ecran d avant quand la commande est refusee', async () => {
    port.piloter.and.returnValue(throwError(() => new Error('refus')));
    const fixture = await ouvrirLaSeance();

    await cliquer(fixture, 'presentateur-suivant');

    expect(texte(fixture, 'presentateur-ecran')).toBe('1 / 4');
    expect(cible(fixture, 'presentateur-echec').getAttribute('role')).toBe('alert');
  });

  it('sous le seuil, detaille la question et vise l ecran de la confusion dominante', async () => {
    const fixture = await ouvrirLaSeance();

    publier(fixture, resultatsDeLaQuestion(10, 5));

    expect(cible(fixture, 'presentateur-question').getAttribute('data-etat')).toBe('sous-le-seuil');
    expect(texte(fixture, 'presentateur-question-total')).toBe('10 / 20');
    expect(texte(fixture, 'presentateur-question-part')).toMatch(/^50\s?%$/);
    expect(texte(fixture, 'presentateur-question-ne-sait-pas')).toBe('1');
    expect(texte(fixture, 'presentateur-question-seuil')).toMatch(/^70\s?%$/);
    expect(texte(fixture, 'presentateur-question-bonne-reponse')).toBe('1480.24');
    const confusions = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        "[data-testid='presentateur-confusion']",
      ),
    ].map((confusion) => [
      confusion.getAttribute('data-confusion'),
      confusion.querySelector("[data-testid='presentateur-confusion-nombre']")?.textContent?.trim(),
    ]);
    expect(confusions).toEqual([
      ['interet-simple', '1'],
      ['taux-annuel', '3'],
    ]);

    await cliquer(fixture, 'presentateur-remediation');

    expect(port.piloter).toHaveBeenCalledOnceWith(SESSION, { ecran: 3 });
    expect(apercu(fixture).ecran()).toBe(deroule.ecrans[3]);
  });

  for (const [cas, total, correctes] of [
    ['le seuil est atteint', 10, 7],
    ['personne n a encore repondu', 0, 0],
  ] as const) {
    it(`ne propose aucune remediation quand ${cas}`, async () => {
      const fixture = await ouvrirLaSeance();

      publier(fixture, resultatsDeLaQuestion(total, correctes));

      expect(cible(fixture, 'presentateur-question').hasAttribute('data-etat')).toBeFalse();
      expect(lire(fixture, 'presentateur-remediation')).toBeNull();
    });
  }

  const remediationsIncompletes: readonly (readonly [string, DerouleCours['remediations']])[] = [
    ['n a pas d ecran de remediation', { 'interet-simple': 'ecran-rappel' }],
    ['vise un ecran absent du deroule', { 'taux-annuel': 'ecran-disparu' }],
  ];

  for (const [cas, remediations] of remediationsIncompletes) {
    it(`cache la remediation quand la confusion dominante ${cas}`, async () => {
      port.lireDeroule.and.returnValue(of({ ...deroule, remediations }));
      const fixture = await ouvrirLaSeance();

      publier(fixture, resultatsDeLaQuestion(10, 5));

      expect(cible(fixture, 'presentateur-question').getAttribute('data-etat')).toBe(
        'sous-le-seuil',
      );
      expect(lire(fixture, 'presentateur-remediation')).toBeNull();
    });
  }

  it('la cloture demande confirmation, ne part qu une fois puis mene a la synthese', async () => {
    const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fermeture = new Subject<void>();
    port.cloturer.and.returnValue(fermeture);
    const fixture = await ouvrirLaSeance();

    await cliquer(fixture, 'presentateur-cloturer');

    expect(lire(fixture, 'presentateur-cloture-confirmation')).toBeTruthy();
    expect(port.cloturer).not.toHaveBeenCalled();

    const confirmer = bouton(fixture, 'presentateur-cloture-confirmer');
    confirmer.click();
    confirmer.click();
    fixture.detectChanges();

    expect(port.cloturer).toHaveBeenCalledOnceWith(SESSION);
    expect(navigation).not.toHaveBeenCalled();

    fermeture.complete();
    await stabiliser(fixture);

    expect(navigation).toHaveBeenCalledOnceWith(['/cours/seance', SESSION, 'synthese']);
    expect(double.flux.close).toHaveBeenCalled();
  });

  it('ne ramene pas a la synthese un formateur parti avant la fin de la cloture', async () => {
    const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fermeture = new Subject<void>();
    port.cloturer.and.returnValue(fermeture);
    const fixture = await ouvrirLaSeance();
    await cliquer(fixture, 'presentateur-cloturer');
    bouton(fixture, 'presentateur-cloture-confirmer').click();

    fixture.destroy();
    fermeture.complete();
    await fixture.componentInstance.quandStabilise();

    expect(port.cloturer).toHaveBeenCalledTimes(1);
    expect(navigation).not.toHaveBeenCalled();
  });

  it('ouvre la scene du videoprojecteur dans une fenetre nommee sous la base de l application', async () => {
    const fenetre = spyOn(window, 'open').and.returnValue(null);
    const fixture = await ouvrirLaSeance();

    bouton(fixture, 'presentateur-scene').click();

    expect(fenetre).toHaveBeenCalledOnceWith(
      `${BASE_DE_L_APPLICATION}cours/presenter/${SLUG}/scene/${SESSION}`,
      'cours-scene',
    );
  });

  it('ferme le flux a la destruction du pupitre', async () => {
    const fixture = await ouvrirLaSeance();

    expect(double.flux.close).not.toHaveBeenCalled();
    fixture.destroy();
    expect(double.flux.close).toHaveBeenCalledTimes(1);
  });
});
