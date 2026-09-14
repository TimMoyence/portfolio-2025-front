import type { DebugElement } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Observable } from 'rxjs';
import { NEVER, of, Subject, throwError } from 'rxjs';
import type { CoursContent } from '../../../../cours/content/types';
import { clearIdentity } from '../../../../cours/runtime/core/identity';
import { pending } from '../../../../cours/runtime/core/queue';
import type { EtatSession, Sync, SyncListener } from '../../../../cours/runtime/core/sync';
import { buildEcranQuestionnaire } from '../../../../testing/factories/cours.factory';
import {
  buildCoursContent,
  buildRattachement,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort, VerdictReponse } from '../../../core/ports/formations.port';
import {
  FORMATIONS_PORT,
  RattachementRefuse,
  SujetRefuse,
} from '../../../core/ports/formations.port';
import type { ReponseBrique } from '../ecran/cours-ecran.component';
import { CoursEcranComponent } from '../ecran/cours-ecran.component';
import type { CreateurFlux } from './cours-etudiant.component';
import { CoursEtudiantComponent, CREATEUR_FLUX } from './cours-etudiant.component';

type Fixture = ComponentFixture<CoursEtudiantComponent>;

const JETON = 'jeton-participant-7f3a91';
const SESSION = 'sess-42';
const CODE_SAISI = '12 34';
const CODE_NORMALISE = '1234';
const ETIQUETTE_BRUTE = 'interets-simples';
const VALEUR_ATTENDUE = '1480.24';
const ETIQUETTE_LIBELLE = 'Les intérêts ont été additionnés au lieu d’être composés.';

const REPONSE_NUMERIQUE: ReponseBrique = { questionId: 'Q-VA-07', valeur: 1400, dureeMs: 900 };
const REPONSE_VOTE: ReponseBrique = { questionId: 'Q-CAP-03', valeur: 'b', dureeMs: 400 };

const REUSSITE: VerdictReponse = { reussite: true, libelleConfusion: null };
const CONFUSION: VerdictReponse = { reussite: false, libelleConfusion: ETIQUETTE_LIBELLE };

const IDENTITE: readonly (readonly [string, string])[] = [
  ['prenom', 'Lea'],
  ['nom', 'Dubois'],
  ['email', 'lea.dubois@example.com'],
];

function sujetDeSeance(): CoursContent {
  const cours = buildCoursContent();
  return {
    ...cours,
    ecrans: [buildEcranQuestionnaire({ id: 'ecran-1' }), ...cours.ecrans.slice(1)],
  };
}

function livrer(arrivee: Subject<CoursContent>, sujet: CoursContent): void {
  arrivee.next(sujet);
  arrivee.complete();
}

function verdictAvecFuite(): VerdictReponse {
  const recu: Record<string, unknown> = {
    reponseAttendue: VALEUR_ATTENDUE,
    correcte: false,
    misconception: ETIQUETTE_BRUTE,
    reussite: false,
    libelleConfusion: ETIQUETTE_LIBELLE,
  };
  return recu as unknown as VerdictReponse;
}

interface FluxDouble {
  readonly fabrique: jasmine.Spy<CreateurFlux>;
  readonly flux: jasmine.SpyObj<Sync>;
  diffuser(etat: Partial<EtatSession>): void;
}

function creerFluxDouble(): FluxDouble {
  const ecoutes: SyncListener[] = [];
  const flux = jasmine.createSpyObj<Sync>('Sync', [
    'join',
    'ouvrir',
    'submit',
    'onState',
    'onResultats',
    'close',
  ]);
  flux.onState.and.callFake((ecoute) => {
    ecoutes.push(ecoute);
    return () => undefined;
  });
  const diffuser = (etat: Partial<EtatSession>): void => {
    const complet: EtatSession = {
      etat: 'en_cours',
      modeRythme: 'pilote',
      ecranCourant: 0,
      intervalleLibre: null,
      participants: 3,
      ...etat,
    };
    for (const ecoute of ecoutes) {
      ecoute(complet);
    }
  };
  return {
    fabrique: jasmine.createSpy<CreateurFlux>('creerFlux').and.returnValue(flux),
    flux,
    diffuser,
  };
}

describe('CoursEtudiantComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let double: FluxDouble;
  let sujet: CoursContent;
  const montees: Fixture[] = [];

  function lire(fixture: Fixture, marque: string): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      `[data-testid='${marque}']`,
    );
  }

  function verdictsAffiches(fixture: Fixture): HTMLElement[] {
    return [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        "[data-testid='etudiant-verdict']",
      ),
    ];
  }

  function libellesDesVerdicts(fixture: Fixture): (string | null)[][] {
    return verdictsAffiches(fixture).map((verdict) => [
      verdict.getAttribute('data-question'),
      verdict
        .querySelector("[data-testid='etudiant-verdict-libelle']")
        ?.textContent?.replace(/\s+/g, ' ')
        .trim() ?? null,
    ]);
  }

  function sujetEnAttente(): { arrivee: Subject<CoursContent>; lectureDemandee: Promise<void> } {
    const arrivee = new Subject<CoursContent>();
    const lectureDemandee = new Promise<void>((resoudre) => {
      port.lireSujet.and.callFake((): Observable<CoursContent> => {
        resoudre();
        return arrivee;
      });
    });
    return { arrivee, lectureDemandee };
  }

  function ecranDe(fixture: Fixture): DebugElement {
    const ecran = fixture.debugElement.queryAll(By.directive(CoursEcranComponent)).at(0);
    if (ecran === undefined) {
      throw new Error('Aucun ecran de cours monte dans la vue etudiant');
    }
    return ecran;
  }

  function ecranAffiche(fixture: Fixture): unknown {
    return (ecranDe(fixture).componentInstance as CoursEcranComponent).ecran();
  }

  function soumettre(fixture: Fixture, code: string): void {
    const formulaire = lire(fixture, 'etudiant-entree');
    const valeurs: readonly (readonly [string, string])[] = [['code', code], ...IDENTITE];
    for (const [nom, valeur] of valeurs) {
      const champ = formulaire?.querySelector<HTMLInputElement>(`[name="${nom}"]`);
      if (champ) {
        champ.value = valeur;
      }
    }
    formulaire?.dispatchEvent(new Event('submit'));
  }

  function monter(): Fixture {
    const fixture = TestBed.createComponent(CoursEtudiantComponent);
    montees.push(fixture);
    fixture.detectChanges();
    return fixture;
  }

  async function stabiliser(fixture: Fixture): Promise<void> {
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
  }

  async function rattacher(code = CODE_SAISI): Promise<Fixture> {
    const fixture = monter();
    soumettre(fixture, code);
    await stabiliser(fixture);
    return fixture;
  }

  async function repondre(fixture: Fixture, reponse: ReponseBrique): Promise<void> {
    ecranDe(fixture).triggerEventHandler('reponse', reponse);
    await stabiliser(fixture);
  }

  function diffuser(fixture: Fixture, etat: Partial<EtatSession>): void {
    double.diffuser(etat);
    fixture.detectChanges();
  }

  async function laisserPasserLeReseau(fixture: Fixture): Promise<void> {
    window.dispatchEvent(new Event('online'));
    await stabiliser(fixture);
  }

  beforeEach(async () => {
    localStorage.clear();
    clearIdentity();
    sujet = sujetDeSeance();
    port = createFormationsPortStub();
    port.rejoindre.and.returnValue(of(buildRattachement({ sessionId: SESSION, jeton: JETON })));
    port.lireSujet.and.returnValue(of(sujet));
    double = creerFluxDouble();
    await setupTestBed({
      imports: [CoursEtudiantComponent],
      providers: [
        { provide: FORMATIONS_PORT, useValue: port },
        { provide: CREATEUR_FLUX, useValue: double.fabrique },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    for (const fixture of montees) {
      fixture.destroy();
    }
    montees.length = 0;
    clearIdentity();
    localStorage.clear();
  });

  it('refuse un code qui n a pas quatre chiffres avant tout appel reseau', async () => {
    const fixture = await rattacher('12a4');

    expect(port.rejoindre).not.toHaveBeenCalled();
    expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif')).toBe('code-invalide');
    expect(fixture.componentInstance.etat()).toBe('code');
  });

  it('retire les espaces du code avant de le transmettre au serveur', async () => {
    const fixture = await rattacher();

    expect(port.rejoindre).toHaveBeenCalledOnceWith(CODE_NORMALISE, jasmine.any(Object));
    expect(fixture.componentInstance.etat()).toBe('seance');
  });

  it('lit le sujet avec le jeton du rattachement et n ouvre la seance qu a son arrivee', async () => {
    const { arrivee, lectureDemandee } = sujetEnAttente();
    const fixture = monter();
    soumettre(fixture, CODE_SAISI);
    await lectureDemandee;
    fixture.detectChanges();

    expect(port.lireSujet).toHaveBeenCalledOnceWith(SESSION, JETON);
    expect(lire(fixture, 'etudiant-chargement')?.getAttribute('role')).toBe('status');
    expect(lire(fixture, 'etudiant-seance')).toBeNull();
    expect(double.fabrique).not.toHaveBeenCalled();

    livrer(arrivee, sujet);
    await stabiliser(fixture);

    expect(lire(fixture, 'etudiant-chargement')).toBeNull();
    expect(lire(fixture, 'etudiant-seance')).toBeTruthy();
    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
  });

  it('n ouvre ni flux ni verrou quand la vue est detruite pendant la lecture du sujet', async () => {
    const { arrivee, lectureDemandee } = sujetEnAttente();
    const fixture = monter();
    soumettre(fixture, CODE_SAISI);
    await lectureDemandee;
    fixture.destroy();
    const ecoutes = spyOn(window, 'addEventListener').and.callThrough();

    livrer(arrivee, sujet);
    await fixture.componentInstance.quandStabilise();

    expect(double.fabrique).not.toHaveBeenCalled();
    expect(ecoutes.calls.allArgs().map(([type]) => type)).not.toContain('blur');
  });

  const lecturesRefusees: readonly {
    readonly cas: string;
    readonly erreur: Error;
    readonly motif: string;
    readonly message: string;
    readonly reessayable: boolean;
  }[] = [
    {
      cas: 'le cours a change depuis l ouverture',
      erreur: new SujetRefuse('cours-modifie', 409),
      motif: 'cours-modifie',
      message: 'Le cours a changé',
      reessayable: false,
    },
    {
      cas: 'la lecture echoue sans motif connu',
      erreur: new Error('reseau coupe'),
      motif: 'sujet-indisponible',
      message: 'n’a pas pu être chargé',
      reessayable: true,
    },
  ];

  for (const { cas, erreur, motif, message, reessayable } of lecturesRefusees) {
    it(`alerte sans ouvrir de seance quand ${cas}`, async () => {
      port.lireSujet.and.returnValue(throwError(() => erreur));
      const fixture = await rattacher();
      const alerte = lire(fixture, 'etudiant-sujet-refuse');

      expect(alerte?.getAttribute('role')).toBe('alert');
      expect(alerte?.getAttribute('data-motif')).toBe(motif);
      expect(alerte?.textContent).toContain(message);
      expect(lire(fixture, 'etudiant-sujet-reessayer') !== null)
        .withContext('seul un sujet indisponible se relit, un cours modifie reste un refus')
        .toBe(reessayable);
      expect(lire(fixture, 'etudiant-seance')).toBeNull();
      expect(lire(fixture, 'etudiant-entree')).toBeNull();
      expect(double.fabrique).not.toHaveBeenCalled();
    });
  }

  it('relit un sujet indisponible a la demande en repassant par le chargement', async () => {
    const arrivee = new Subject<CoursContent>();
    port.lireSujet.and.returnValues(
      throwError(() => new SujetRefuse('sujet-indisponible', 503)),
      arrivee,
    );
    const fixture = await rattacher();

    lire(fixture, 'etudiant-sujet-reessayer')?.click();
    fixture.detectChanges();

    expect(lire(fixture, 'etudiant-chargement')).toBeTruthy();
    expect(lire(fixture, 'etudiant-sujet-refuse')).toBeNull();

    livrer(arrivee, sujet);
    await stabiliser(fixture);

    expect(port.rejoindre).toHaveBeenCalledTimes(1);
    expect(port.lireSujet.calls.allArgs()).toEqual([
      [SESSION, JETON],
      [SESSION, JETON],
    ]);
    expect(lire(fixture, 'etudiant-seance')).toBeTruthy();
    expect(double.fabrique).toHaveBeenCalledTimes(1);
  });

  it('porte le jeton au flux sans jamais l ecrire dans le stockage local', async () => {
    await rattacher();
    const ecrit = Object.keys(localStorage)
      .map((cle) => localStorage.getItem(cle) ?? '')
      .join('|');

    expect(double.fabrique.calls.mostRecent().args[0].jeton).toBe(JETON);
    expect(double.flux.join).toHaveBeenCalledTimes(1);
    expect(ecrit.length).toBeGreaterThan(0);
    expect(ecrit).not.toContain(JETON);
  });

  it('monte en rendu main l ecran que designe le flux sans remonter l ecran repete', async () => {
    port.rejoindre.and.returnValue(
      of(buildRattachement({ sessionId: SESSION, jeton: JETON, ecranCourant: 1 })),
    );
    const fixture = await rattacher();
    const avant = ecranDe(fixture).componentInstance as CoursEcranComponent;

    expect(avant.ecran()).toBe(sujet.ecrans[1]);
    expect(avant.rendu()).toBe('hand');
    expect(avant.role()).toBe('etudiant');
    expect((ecranDe(fixture).nativeElement as HTMLElement).hasAttribute('role'))
      .withContext('etudiant est un role du runtime, pas un role ARIA')
      .toBeFalse();

    diffuser(fixture, { ecranCourant: 1, participants: 12 });

    expect(ecranDe(fixture).componentInstance).toBe(avant);
    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    diffuser(fixture, { ecranCourant: 2 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);
    expect(lire(fixture, 'etudiant-progression')?.textContent?.trim()).toBe('3 / 4');
  });

  it('envoie au serveur la reponse d une brique avec son identifiant de question', async () => {
    const fixture = await rattacher();

    await repondre(fixture, REPONSE_VOTE);

    expect(port.repondre).toHaveBeenCalledOnceWith(SESSION, JETON, {
      questionId: 'Q-CAP-03',
      valeur: 'b',
      dureeMs: 400,
    });
  });

  it('n affiche que le resultat et l etiquette de confusion', async () => {
    port.repondre.and.returnValue(of(verdictAvecFuite()));
    const fixture = await rattacher();
    await repondre(fixture, REPONSE_NUMERIQUE);
    const rendu = (fixture.nativeElement as HTMLElement).innerHTML;
    const [verdict] = verdictsAffiches(fixture);

    expect(verdict.getAttribute('data-reussite')).toBe('false');
    expect(verdict.getAttribute('data-question')).toBe('Q-VA-07');
    expect(lire(fixture, 'etudiant-confusion')?.textContent).toContain('composés');
    expect(rendu).not.toContain(VALEUR_ATTENDUE);
    expect(rendu).not.toContain(ETIQUETTE_BRUTE);
  });

  it('garde un verdict par question de l ecran et les efface au changement d ecran', async () => {
    port.repondre.and.returnValues(of(REUSSITE), of(CONFUSION), of(CONFUSION));
    const fixture = await rattacher();

    await repondre(fixture, REPONSE_NUMERIQUE);
    await repondre(fixture, REPONSE_VOTE);
    await repondre(fixture, REPONSE_NUMERIQUE);

    expect(
      verdictsAffiches(fixture).map((verdict) => [
        verdict.getAttribute('data-question'),
        verdict.getAttribute('data-reussite'),
      ]),
    ).toEqual([
      ['Q-VA-07', 'false'],
      ['Q-CAP-03', 'false'],
    ]);

    diffuser(fixture, { ecranCourant: 1 });

    expect(verdictsAffiches(fixture)).toEqual([]);
  });

  it('range les verdicts dans l ordre des questions de l ecran et les numerote', async () => {
    port.repondre.and.returnValues(of(CONFUSION), of(REUSSITE));
    const fixture = await rattacher();

    await repondre(fixture, REPONSE_VOTE);
    await repondre(fixture, REPONSE_NUMERIQUE);

    expect(libellesDesVerdicts(fixture)).toEqual([
      ['Q-VA-07', 'Question 1 : Réussi'],
      ['Q-CAP-03', 'Question 2 : Manqué'],
    ]);
  });

  it('envoie au retour du reseau la reponse mise en file hors ligne, une seule fois', async () => {
    const fixture = await rattacher();
    window.dispatchEvent(new Event('offline'));
    await repondre(fixture, REPONSE_NUMERIQUE);

    expect(port.repondre).not.toHaveBeenCalled();
    expect(pending().length).toBe(1);
    expect(lire(fixture, 'etudiant-hors-ligne')).toBeTruthy();

    await laisserPasserLeReseau(fixture);

    expect(port.repondre).toHaveBeenCalledOnceWith(SESSION, JETON, REPONSE_NUMERIQUE);
    expect(pending().length).toBe(0);
    expect(lire(fixture, 'etudiant-hors-ligne')).toBeNull();
    expect(verdictsAffiches(fixture).length).toBe(1);

    await laisserPasserLeReseau(fixture);

    expect(port.repondre).toHaveBeenCalledTimes(1);
  });

  it('n affiche pas sur un nouvel ecran le verdict d une reponse renvoyee depuis le precedent', async () => {
    const fixture = await rattacher();
    window.dispatchEvent(new Event('offline'));
    await repondre(fixture, REPONSE_NUMERIQUE);
    diffuser(fixture, { ecranCourant: 1 });

    await laisserPasserLeReseau(fixture);

    expect(port.repondre).toHaveBeenCalledTimes(1);
    expect(verdictsAffiches(fixture)).toEqual([]);
  });

  it('remonte les incidents de verrou groupes sans bloquer la reponse en cours', async () => {
    port.signalerIncidents.and.returnValue(NEVER);
    const fixture = await rattacher();
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('blur'));
    await repondre(fixture, REPONSE_NUMERIQUE);
    const [sessionId, jeton, lot] = port.signalerIncidents.calls.mostRecent().args;

    expect(port.signalerIncidents).toHaveBeenCalledTimes(1);
    expect(sessionId).toBe(SESSION);
    expect(jeton).toBe(JETON);
    expect(lot.length).toBe(2);
    expect(port.repondre).toHaveBeenCalledTimes(1);
    expect(verdictsAffiches(fixture).length).toBe(1);
  });

  it('ne propose l ecran suivant que si le rythme du flux le permet', async () => {
    const fixture = await rattacher();

    expect(lire(fixture, 'etudiant-suivant')).toBeNull();

    diffuser(fixture, { modeRythme: 'libre', intervalleLibre: { premier: 0, dernier: 1 } });
    lire(fixture, 'etudiant-suivant')?.click();
    fixture.detectChanges();

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);
    expect(lire(fixture, 'etudiant-suivant')).toBeNull();
  });

  it('rejoint l ecran du formateur a la bascule en libre sans intervalle puis reste sur l ecran choisi', async () => {
    const fixture = await rattacher();
    const libre: Partial<EtatSession> = {
      modeRythme: 'libre',
      intervalleLibre: null,
      ecranCourant: 1,
    };
    diffuser(fixture, libre);

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    lire(fixture, 'etudiant-suivant')?.click();
    fixture.detectChanges();
    diffuser(fixture, { ...libre, participants: 13 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);

    diffuser(fixture, { ...libre, ecranCourant: 3 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);
  });

  it('reste dans l intervalle libre quand le formateur change d ecran et y ramene qui en sort', async () => {
    const fixture = await rattacher();
    const intervalle = { premier: 0, dernier: 3 };
    diffuser(fixture, { modeRythme: 'libre', intervalleLibre: intervalle });
    lire(fixture, 'etudiant-suivant')?.click();
    fixture.detectChanges();

    diffuser(fixture, { modeRythme: 'libre', intervalleLibre: intervalle, ecranCourant: 2 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    diffuser(fixture, {
      modeRythme: 'libre',
      intervalleLibre: { premier: 2, dernier: 3 },
      ecranCourant: 2,
    });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);
  });

  it('ramene l etudiant sur l ecran du formateur quand il repasse en rythme pilote', async () => {
    const fixture = await rattacher();
    diffuser(fixture, { modeRythme: 'libre', intervalleLibre: null });
    lire(fixture, 'etudiant-suivant')?.click();
    fixture.detectChanges();

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    diffuser(fixture, { modeRythme: 'pilote', ecranCourant: 0 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
    expect(lire(fixture, 'etudiant-suivant')).toBeNull();
  });

  it('ferme le flux a la destruction du composant', async () => {
    const fixture = await rattacher();

    expect(double.flux.close).not.toHaveBeenCalled();
    fixture.destroy();
    expect(double.flux.close).toHaveBeenCalledTimes(1);
  });

  it('dit a l etudiant que le code de seance est inconnu', async () => {
    port.rejoindre.and.returnValue(throwError(() => new RattachementRefuse('code-inconnu', 404)));
    const fixture = await rattacher();
    const alerte = lire(fixture, 'etudiant-echec');

    expect(alerte?.getAttribute('data-motif')).toBe('code-inconnu');
    expect(alerte?.textContent).toContain("n'existe pas");
    expect(fixture.componentInstance.etat()).toBe('code');
    expect(port.lireSujet).not.toHaveBeenCalled();
  });

  it('distingue une inscription deja enregistree d un code inconnu', async () => {
    port.rejoindre.and.returnValue(throwError(() => new RattachementRefuse('deja-inscrit', 409)));
    const fixture = await rattacher();

    expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif')).toBe('deja-inscrit');
    expect(lire(fixture, 'etudiant-echec')?.textContent).toContain('déjà enregistrée');
  });

  it('clot la seance quand le flux annonce sa fin', async () => {
    port.rejoindre.and.returnValue(
      of(buildRattachement({ sessionId: SESSION, jeton: JETON, modeRythme: 'libre' })),
    );
    const fixture = await rattacher();

    diffuser(fixture, { etat: 'terminee', modeRythme: 'libre' });

    expect(lire(fixture, 'etudiant-fin')).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(CoursEcranComponent))).toBeNull();
    expect(lire(fixture, 'etudiant-suivant')).toBeNull();
  });
});
