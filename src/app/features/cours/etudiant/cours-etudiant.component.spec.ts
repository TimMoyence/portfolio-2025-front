import type { DebugElement } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { NEVER, of, Subject, throwError } from 'rxjs';
import type {
  CoursContent,
  EcranContent,
  EtatParticipant,
  PilotageEcran,
} from '../../../../cours/content/types';
import { noeudsOmbre } from '../../../../testing/banc-de-brique';
import { briqueMontee, DELAI_DE_MONTAGE_MS } from '../../../../testing/briques-montees';
import type { EscapeParcoursPublic } from '../../../../cours/runtime/blocks/FpEscape';
import type { EtatDesEnigmes, EtatEnigme } from '../../../../cours/runtime/blocks/retours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import {
  champsAntiRobotDe,
  figerLesHorloges,
  horlogesDeSaisie,
  retarderLaMesure,
  sousHorlogeArreteeA,
  UNE_HEURE_MS,
} from '../../../../testing/horloge-simulee';
import { identifiantsDuMontage, planDeMontage } from '../../../shared/slides/session/lecture-ecran';
import { presentationDe } from '../../../shared/slides/visual/presentation-v2';
import {
  etatDeLaReflexion,
  garderLaReflexion,
  jusqua,
} from '../../../../testing/hote-d-interaction';
import {
  clearIdentity,
  LONGUEURS_MAX_DE_L_IDENTITE,
  lireSecretDeReprise,
  readIdentity,
  saveIdentity,
} from '../../../../cours/runtime/core/identity';
import { enqueue, pending } from '../../../../cours/runtime/core/queue';
import { EnvoisDeSeanceService } from '../../../shared/slides/session/envois-de-seance.service';
import { buildReponseLibreEnFile } from '../../../../testing/factories/queue.factory';
import type { EtatSession } from '../../../../cours/runtime/core/sync';
import {
  buildEcran,
  buildEcranQuestionnaire,
  buildFeuilleEvaluee,
  buildRevelationServie,
  buildSortiesMachine,
  buildSortiesMachineATrenteAns,
  buildSpacedRappel,
  buildTableauEvalue,
  buildWorkedExemple,
} from '../../../../testing/factories/cours.factory';
import {
  buildCoursContent,
  buildEtatDesEnigmes,
  buildEtatParticipant,
  buildRattachement,
  buildSpacedQuestionPublique,
  buildStrategiePublique,
  buildVerdictTentative,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { buildEnvoiReponse } from '../../../../testing/factories/queue.factory';
import { buildVisualQuizSlide } from '../../../../testing/factories/visual-slide.factory';
import type { FluxDouble } from '../../../../testing/factories/sync.factory';
import { createFluxDouble } from '../../../../testing/factories/sync.factory';
import { lireLesLibelles, lireLesLibellesDeChaqueEcran } from '../../../../testing/libelles-colles';
import { lireMarque as lire } from '../../../../testing/marqueurs-dom';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import {
  attendreLaFermetureDuFlux,
  diffuserSurLaVue,
  stabiliserLaMiseEnPage,
  stabiliserLaVue,
} from '../../../../testing/vue-de-seance';
import type { LimiteDeDebit } from '../../../core/models/limite-de-debit';
import type {
  FormationsPort,
  MotifRefusRattachement,
  RetourBrique,
  VerdictReponse,
} from '../../../core/ports/formations.port';
import {
  FORMATIONS_PORT,
  RattachementRefuse,
  ReponseLibreRefusee,
  ReponseRefusee,
  SujetRefuse,
} from '../../../core/ports/formations.port';
import { CREATEUR_FLUX } from '../cours-flux.token';
import type { EvenementBrique } from '../../../shared/slides/session/contrat-hote';
import { demanderLaPieceJointe } from '../../../../testing/piece-jointe-demandee';
import { CoursPresentationComponent } from '../../../shared/slides/session/cours-presentation.component';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { CoursEtudiantComponent } from './cours-etudiant.component';

type Fixture = ComponentFixture<CoursEtudiantComponent>;

interface ReponseSlide {
  readonly questionId: string;
  readonly valeur: number | string;
  readonly dureeMs: number;
}

const JETON = 'jeton-participant-7f3a91';
const SESSION = 'sess-42';
const ATTENTE_COMMUNE = 'Trop de tentatives en peu de temps : réessayez dans 2 min.';
const ATTENTE_DU_RESEAU =
  'Votre réponse est enregistrée sur ce poste et partira au retour du réseau.';
const REPONSE_LIMITEE =
  'Votre réponse est gardée sur ce poste : le serveur limite les envois, elle repartira d’elle-même.';
const ECRAN_LIMITE =
  'L’écran n’a pas encore pu être chargé : le serveur limite les demandes, il s’affichera de lui-même.';

const LIMITE_DE_DEUX_MINUTES: LimiteDeDebit = { minutes: 2 };

function refusLimite(limite: LimiteDeDebit = LIMITE_DE_DEUX_MINUTES): ReponseRefusee {
  return new ReponseRefusee('reseau', 429, limite);
}

const JALON_PERDU: EvenementBrique = {
  kind: 'jalon',
  screenId: 'ecran-1',
  sondageId: 'P-PULSE-01',
  etat: 'perdu',
};
const REFLEXION_DU_RAPPEL: EvenementBrique = {
  kind: 'libre',
  screenId: 'ecran-1',
  activityId: 'Q-RAPPEL-04:rappel',
  response: 'On capitalise',
  dureeMs: 2000,
};
const TENTATIVE_DU_SEUIL: EvenementBrique = {
  kind: 'tentative',
  screenId: 'ecran-1',
  parcoursId: 'K-EVASION-01',
  enigmeId: 'seuil',
  reponse: '30000',
  dureeMs: 40000,
};
const EVALUATION_A_VINGT_ANS: EvenementBrique = {
  kind: 'evaluation-machine',
  screenId: 'ecran-1',
  reglages: { C: 1000, i: 4, n: 20 },
};
const EVALUATION_DE_LA_FEUILLE: EvenementBrique = {
  kind: 'evaluation-feuille',
  screenId: 'ecran-1',
  planId: 'K-TABLEUR-01',
  rang: 4,
  demande: { cellules: { C3: '=A3*B3' }, recopie: { de: 'C3' } },
};
const EVALUATION_DU_TABLEAU: EvenementBrique = {
  kind: 'evaluation-tableau',
  screenId: 'ecran-1',
  planId: 'b2-01-a4-indice-toile',
  rang: 4,
  saisies: [{ rang: 0, cle: 'prix', saisie: '21,6' }],
};
const DEFI_DE_LA_DIZAINE: EvenementBrique = {
  kind: 'defi',
  screenId: 'ecran-1',
  defiId: 'D-DEFI-07',
  texte: 'Une dizaine d annees',
  dureeMs: 90000,
};
const ECRANS_DE_REFLEXION = [...INSTANTANES_DES_COURS_SERVIS].flatMap(
  ([prefixe, { sujet: servi }]) =>
    servi.ecrans.flatMap((ecran, rang) =>
      presentationDe(ecran)?.renderer === 'reflection' ? [{ prefixe, servi, rang }] : [],
    ),
);
const COFFRES_SERVIS = [...INSTANTANES_DES_COURS_SERVIS].flatMap(([prefixe, { sujet: servi }]) =>
  servi.ecrans.flatMap((ecran, rang) =>
    ecran.type === 'fp-escape'
      ? [{ prefixe, servi, rang, parcours: ecran.donnees?.['parcours'] as EscapeParcoursPublic }]
      : [],
  ),
);

function etatDeLEnigme(rang: number, ouverte: number): EtatEnigme {
  if (rang < ouverte) {
    return 'resolue';
  }
  return rang === ouverte ? 'ouverte' : 'verrouillee';
}

function etatDuCoffre(
  parcours: EscapeParcoursPublic,
  ouverte: number,
  restantesDeLaPremiere: number,
): EtatDesEnigmes {
  return {
    etats: Object.fromEntries(
      parcours.enigmes.map(({ id }, rang) => [
        id,
        {
          etat: etatDeLEnigme(rang, ouverte),
          tentativesRestantes: rang === 0 ? restantesDeLaPremiere : parcours.tentativesMax,
        },
      ]),
    ),
    enigmeOuverte: parcours.enigmes[ouverte]?.id ?? null,
    acheve: false,
  };
}
const CODE_SAISI = '12 34';
const CODE_NORMALISE = '1234';
const ETIQUETTE_BRUTE = 'interets-simples';
const VALEUR_ATTENDUE = '1480.24';
const ETIQUETTE_LIBELLE = 'Les intérêts ont été additionnés au lieu d’être composés.';

const REPONSE_NUMERIQUE: ReponseSlide = { questionId: 'Q-VA-07', valeur: 1400, dureeMs: 900 };
const REPONSE_VOTE: ReponseSlide = { questionId: 'Q-CAP-03', valeur: 'b', dureeMs: 400 };

const REUSSITE: VerdictReponse = { reussite: true, libelleConfusion: null };
const CONFUSION: VerdictReponse = { reussite: false, libelleConfusion: ETIQUETTE_LIBELLE };

const CONFUSION_POSEE_SUR_LA_BRIQUE: RetourBrique = {
  kind: 'verdict-reponse',
  questionId: 'Q-VA-07',
  correcte: false,
  libelleConfusion: ETIQUETTE_LIBELLE,
};

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

describe('CoursEtudiantComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let double: FluxDouble;
  let sujet: CoursContent;
  const montees: Fixture[] = [];

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

  function ecranMonte(fixture: Fixture): DebugElement | undefined {
    return fixture.debugElement.queryAll(By.directive(SlideActivityComponent)).at(0);
  }

  function ecranDe(fixture: Fixture): DebugElement {
    const ecran = ecranMonte(fixture);
    if (ecran === undefined) {
      throw new Error('Aucun ecran de cours monte dans la vue etudiant');
    }
    return ecran;
  }

  function ecranAffiche(fixture: Fixture): unknown {
    return (ecranDe(fixture).componentInstance as SlideActivityComponent).slide();
  }

  function soumettre(fixture: Fixture, code: string, identite = IDENTITE): void {
    const formulaire = lire(fixture, 'etudiant-entree');
    const valeurs: readonly (readonly [string, string])[] = [['code', code], ...identite];
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

  let horlogeTenueParLeTest = false;

  async function rattacher(code = CODE_SAISI, identite = IDENTITE): Promise<Fixture> {
    if (!horlogeTenueParLeTest) {
      figerLesHorloges(Date.now());
    }
    try {
      const fixture = monter();
      soumettre(fixture, code, identite);
      jasmine.clock().tick(1_200);
      await stabiliserLaVue(fixture);
      return fixture;
    } finally {
      if (!horlogeTenueParLeTest) {
        jasmine.clock().uninstall();
      }
    }
  }

  async function sousLHorlogeDuTest(scenario: () => Promise<void>): Promise<void> {
    figerLesHorloges(Date.now());
    horlogeTenueParLeTest = true;
    try {
      await scenario();
    } finally {
      horlogeTenueParLeTest = false;
      jasmine.clock().uninstall();
    }
  }

  async function emettre(fixture: Fixture, evenement: EvenementBrique): Promise<void> {
    ecranDe(fixture).triggerEventHandler('evenement', evenement);
    await stabiliserLaVue(fixture);
  }

  async function repondre(fixture: Fixture, reponse: ReponseSlide): Promise<void> {
    const ecran = ecranAffiche(fixture) as EcranContent;
    await emettre(fixture, { kind: 'reponse', screenId: ecran.id, ...reponse });
  }

  function retoursDe(fixture: Fixture, screenId = 'ecran-1'): readonly RetourBrique[] {
    return fixture.componentInstance.retours().get(screenId) ?? [];
  }

  function genresDe(fixture: Fixture, screenId = 'ecran-1'): string[] {
    return retoursDe(fixture, screenId).map((retour) => retour.kind);
  }

  async function rattacherALaSeanceEnCours(): Promise<Fixture> {
    const fixture = await rattacher();
    await diffuserPuisStabiliser(fixture, { etat: 'en_cours' });
    return fixture;
  }

  async function piloterSurLEcran(
    fixture: Fixture,
    ecranCourant: number,
    screenId: string,
    pilotage: PilotageEcran,
  ): Promise<void> {
    await diffuserPuisStabiliser(fixture, { ecranCourant, pilotage: { [screenId]: pilotage } });
  }

  async function suivreLaSeanceJusquA(ecranCourant: number): Promise<Fixture> {
    const fixture = await rattacherALaSeanceEnCours();
    await diffuserPuisStabiliser(fixture, { ecranCourant });
    return fixture;
  }

  async function diffuserPuisStabiliser(
    fixture: Fixture,
    etat: Partial<EtatSession>,
  ): Promise<void> {
    diffuserSurLaVue(double, fixture, etat);
    await stabiliserLaVue(fixture);
  }

  async function repondreHorsLigne(): Promise<Fixture> {
    const fixture = await rattacherALaSeanceEnCours();
    window.dispatchEvent(new Event('offline'));
    await repondre(fixture, REPONSE_NUMERIQUE);
    return fixture;
  }

  async function rattacherPuisRefuserLeFlux(statut: number): Promise<Fixture> {
    const fixture = await rattacher();
    double.diffuserStatut({ etat: 'refuse', statut });
    fixture.detectChanges();
    return fixture;
  }

  async function soumettreEnAttenteDuSujet(): Promise<{
    fixture: Fixture;
    arrivee: Subject<CoursContent>;
  }> {
    const { arrivee, lectureDemandee } = sujetEnAttente();
    const fixture = monter();
    soumettre(fixture, CODE_SAISI);
    await lectureDemandee;
    return { fixture, arrivee };
  }

  function passerEnLibrePuisAvancer(
    fixture: Fixture,
    intervalleLibre: EtatSession['intervalleLibre'],
  ): void {
    diffuserSurLaVue(double, fixture, { modeRythme: 'libre', intervalleLibre });
    lire(fixture, 'etudiant-suivant')?.click();
    fixture.detectChanges();
  }

  function servirUnSecretDeReprise(): void {
    port.rejoindre.and.returnValue(
      of(buildRattachement({ sessionId: SESSION, jeton: JETON, secretDeReprise: 'secret-servi' })),
    );
  }

  function attendreLaFileVideeEnLigne(fixture: Fixture): void {
    expect(pending().length).toBe(0);
    expect(lire(fixture, 'etudiant-hors-ligne')).toBeNull();
  }

  function texteDeLaFile(fixture: Fixture): string | undefined {
    return lire(fixture, 'etudiant-hors-ligne')?.textContent?.replace(/\s+/g, ' ').trim();
  }

  async function laisserPasserLeReseau(fixture: Fixture): Promise<void> {
    window.dispatchEvent(new Event('online'));
    await stabiliserLaVue(fixture);
  }

  beforeEach(async () => {
    localStorage.clear();
    clearIdentity();
    sujet = sujetDeSeance();
    port = createFormationsPortStub();
    port.rejoindre.and.returnValue(of(buildRattachement({ sessionId: SESSION, jeton: JETON })));
    port.lireSujet.and.returnValue(of(sujet));
    double = createFluxDouble();
    await setupTestBed({
      router: true,
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

  it('présente une entrée de séance compréhensible sans galerie technique ni compte à créer', () => {
    const fixture = monter();
    const entree = lire(fixture, 'etudiant-entree');

    expect(entree?.querySelector('h1')?.textContent).toContain('Rejoindre une séance');
    expect(entree?.querySelector('.student-entry__steps')?.textContent).toContain(
      'Je saisis le code de séance',
    );
    expect(entree?.querySelector('.student-entry__hint')?.textContent).toContain('4 chiffres');
    expect(entree?.querySelector('button[type="submit"]')?.textContent).toContain(
      'Entrer dans la séance',
    );
    expect(entree?.textContent).toContain('Pas de compte à créer');
    expect(entree?.querySelector('[data-testid="cours-galerie"]')).toBeNull();
  });

  it('F03 · propose au formateur de se connecter puis de revenir au pupitre du cours vise', async () => {
    await TestBed.inject(Router).navigateByUrl('/?cours=b2-01-traitement-information-chiffree');
    const fixture = monter();

    const lien = lire(fixture, 'etudiant-connexion-formateur') as HTMLAnchorElement | null;

    expect(lien).not.toBeNull();
    expect(lien?.getAttribute('href')).toBe(
      '/login?returnUrl=%2Fcours%2Fpresenter%2Fb2-01-traitement-information-chiffree',
    );
  });

  it('F03 · ne construit aucun retour vers un cours qui n est pas en seance', async () => {
    await TestBed.inject(Router).navigateByUrl('/?cours=cours-inconnu');
    const fixture = monter();

    expect(lire(fixture, 'etudiant-connexion-formateur')).toBeNull();
  });

  it('F03 · ne construit aucun retour depuis un cours vise mal forme', async () => {
    await TestBed.inject(Router).navigateByUrl('/?cours=..%2F..%2Fadmin');
    const fixture = monter();

    expect(lire(fixture, 'etudiant-connexion-formateur')).toBeNull();
  });

  it('refuse un code qui n a pas quatre chiffres avant tout appel reseau', async () => {
    const fixture = await rattacher('12a4');

    expect(port.rejoindre).not.toHaveBeenCalled();
    expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif')).toBe('code-invalide');
    expect(fixture.componentInstance.etat()).toBe('code');
  });

  it('laisse saisir et accepte une identite au plafond du serveur, comptee en caracteres', async () => {
    const sourire = String.fromCodePoint(0x1f600);
    const entree = lire(monter(), 'etudiant-entree');

    expect(entree?.querySelectorAll('input[name]').length).toBeGreaterThan(0);
    expect(entree?.querySelectorAll('input[maxlength]').length).toBe(0);

    await rattacher(CODE_SAISI, [
      ['prenom', sourire.repeat(LONGUEURS_MAX_DE_L_IDENTITE.prenom)],
      ['nom', sourire.repeat(LONGUEURS_MAX_DE_L_IDENTITE.nom)],
      ['email', 'lea.dubois@example.com'],
    ]);

    expect(port.rejoindre).toHaveBeenCalledTimes(1);
  });

  it('refuse avant tout appel reseau une identite que le serveur refuserait', async () => {
    const refusees: readonly (readonly [string, string, string])[] = [
      ['Lea', 'Dubois', 'lea@gmail'],
      ['Lea', 'Dubois', 'lea@exemple.c'],
      ['L'.repeat(81), 'Dubois', 'lea.dubois@example.com'],
      ['Lea', 'D'.repeat(81), 'lea.dubois@example.com'],
    ];
    for (const [prenom, nom, email] of refusees) {
      const fixture = await rattacher(CODE_SAISI, [
        ['prenom', prenom],
        ['nom', nom],
        ['email', email],
      ]);

      expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif'))
        .withContext(`${prenom.slice(0, 5)} ${nom.slice(0, 5)} ${email}`)
        .toBe('identite-refusee');
    }
    expect(port.rejoindre).not.toHaveBeenCalled();
  });

  it('retire les espaces du code avant de le transmettre au serveur', async () => {
    const fixture = await rattacher();

    expect(port.rejoindre).toHaveBeenCalledOnceWith(CODE_NORMALISE, jasmine.any(Object));
    expect(fixture.componentInstance.etat()).toBe('seance');
  });

  it('envoie au rattachement la durée de saisie mesurée sur l horloge monotone, sans heure de début', async () => {
    const horloges = horlogesDeSaisie();
    const fixture = monter();

    horloges.saisirPendant(20_000);
    soumettre(fixture, CODE_SAISI);
    await stabiliserLaVue(fixture);

    expect(champsAntiRobotDe(port.rejoindre.calls.argsFor(0)[1] ?? {})).toEqual({
      formFillDurationMs: 20_000,
      heureDeDebutEnvoyee: false,
    });
  });

  describe('délai anti-robot du rattachement', () => {
    const horloge = sousHorlogeArreteeA(new Date('2026-10-16T08:00:00Z'));

    async function laisserPasser(dureeMs: number): Promise<void> {
      jasmine.clock().tick(dureeMs);
      await Promise.resolve();
      await Promise.resolve();
    }

    for (const [cas, reculDeLHorloge] of [
      ['', 0],
      [', sans plus quand l horloge recule d une minute avant l envoi', 60_000],
      [', sans plus quand l horloge recule d une heure avant l envoi', UNE_HEURE_MS],
    ] as const) {
      it(`attend le délai anti-robot avant de demander le rattachement${cas}`, async () => {
        const fixture = monter();
        horloge.reculerDe(reculDeLHorloge);
        soumettre(fixture, CODE_SAISI);
        await Promise.resolve();
        fixture.detectChanges();

        expect(port.rejoindre).not.toHaveBeenCalled();
        expect(fixture.componentInstance.etat()).toBe('rattachement');
        expect(lire(fixture, 'etudiant-rattachement')).not.toBeNull();

        await laisserPasser(1_200);

        expect(port.rejoindre).toHaveBeenCalledOnceWith(CODE_NORMALISE, jasmine.any(Object));
      });
    }

    it('n envoie jamais une durée de saisie sous le délai anti-robot, même quand la mesure du poste retarde', async () => {
      const fixture = monter();
      soumettre(fixture, CODE_SAISI);
      await Promise.resolve();
      retarderLaMesure(50);

      await laisserPasser(1_200);

      expect(port.rejoindre).not.toHaveBeenCalled();

      await laisserPasser(50);

      expect(champsAntiRobotDe(port.rejoindre.calls.argsFor(0)[1] ?? {})).toEqual({
        formFillDurationMs: 1_200,
        heureDeDebutEnvoyee: false,
      });
    });
  });

  it('V5 · télécharge la pièce réservée d un écran avec le jeton du poste', async () => {
    demanderLaPieceJointe(await rattacherALaSeanceEnCours(), 'B3-01-A2-01-VOTE-FAMILLE');

    expect(port.telechargerPieceJointe).toHaveBeenCalledOnceWith(
      SESSION,
      JETON,
      'B3-01-A2-01-VOTE-FAMILLE',
    );
  });

  it('lit le sujet avec le jeton du rattachement et n ouvre la seance qu a son arrivee', async () => {
    const { fixture, arrivee } = await soumettreEnAttenteDuSujet();
    fixture.detectChanges();

    expect(port.lireSujet).toHaveBeenCalledOnceWith(SESSION, JETON);
    expect(lire(fixture, 'etudiant-chargement')?.getAttribute('role')).toBe('status');
    expect(lire(fixture, 'etudiant-seance')).toBeNull();
    expect(double.fabrique).not.toHaveBeenCalled();

    livrer(arrivee, sujet);
    await stabiliserLaVue(fixture);

    expect(lire(fixture, 'etudiant-chargement')).toBeNull();
    expect(lire(fixture, 'etudiant-seance')).toBeTruthy();

    diffuserSurLaVue(double, fixture, { etat: 'en_cours' });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
  });

  it('n ouvre ni flux ni verrou quand la vue est detruite pendant la lecture du sujet', async () => {
    const { fixture, arrivee } = await soumettreEnAttenteDuSujet();
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
    {
      cas: 'le serveur limite la cadence des lectures',
      erreur: new SujetRefuse('sujet-indisponible', 429, { minutes: 2 }),
      motif: 'sujet-indisponible',
      message: ATTENTE_COMMUNE,
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
        .withContext('un sujet indisponible ou limite se relit, un cours modifie reste un refus')
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
    await stabiliserLaVue(fixture);

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
    expect(double.flux.ouvrir).toHaveBeenCalledTimes(1);
    expect(ecrit.length).toBeGreaterThan(0);
    expect(ecrit).not.toContain(JETON);
  });

  it('monte dans le role etudiant l ecran que designe le flux sans remonter l ecran repete', async () => {
    port.rejoindre.and.returnValue(
      of(buildRattachement({ sessionId: SESSION, jeton: JETON, ecranCourant: 1 })),
    );
    const fixture = await rattacher();
    diffuserSurLaVue(double, fixture, { ecranCourant: 1, revision: 11 });
    const avant = ecranDe(fixture).componentInstance as SlideActivityComponent;

    expect(avant.slide()).toBe(sujet.ecrans[1]);
    expect(avant.apercu()).toBeFalse();
    expect(avant.role()).toBe('etudiant');
    expect((ecranDe(fixture).nativeElement as HTMLElement).hasAttribute('role'))
      .withContext('etudiant est un role du runtime, pas un role ARIA')
      .toBeFalse();

    diffuserSurLaVue(double, fixture, { ecranCourant: 1, revision: 12 });

    expect(ecranDe(fixture).componentInstance).toBe(avant);
    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    diffuserSurLaVue(double, fixture, { ecranCourant: 2 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);
    expect(lire(fixture, 'etudiant-progression')?.textContent?.trim()).toBe('3 / 4');
  });

  it('distingue un flux refuse de l attente avant le demarrage', async () => {
    const fixture = await rattacherPuisRefuserLeFlux(429);

    expect(lire(fixture, 'etudiant-flux-refuse')?.getAttribute('role')).toBe('alert');
    expect(lire(fixture, 'etudiant-flux-refuse')?.getAttribute('data-statut')).toBe('429');
    expect(lire(fixture, 'etudiant-attente')).toBeNull();
    expect(fixture.debugElement.query(By.directive(SlideActivityComponent))).toBeNull();
  });

  for (const statut of [401, 403]) {
    it(`sur un refus ${statut}, dit qu il faut rejoindre au lieu de promettre un retour du reseau`, async () => {
      const fixture = await rattacherPuisRefuserLeFlux(statut);

      const perdu = lire(fixture, 'etudiant-acces-perdu');
      expect(perdu?.getAttribute('role')).toBe('alert');
      expect(perdu?.getAttribute('data-statut')).toBe(String(statut));
      expect(perdu?.textContent).toContain('rejoindre');
      expect(lire(fixture, 'etudiant-flux-refuse')).toBeNull();
    });
  }

  it('sur un refus de debit, garde la promesse d un retour du suivi', async () => {
    const fixture = await rattacherPuisRefuserLeFlux(429);

    expect(lire(fixture, 'etudiant-flux-refuse')?.getAttribute('data-statut')).toBe('429');
    expect(lire(fixture, 'etudiant-acces-perdu')).toBeNull();
  });

  it('dit la saturation du suivi sans parler de connexion', async () => {
    const fixture = await rattacherPuisRefuserLeFlux(429);
    const refus = lire(fixture, 'etudiant-flux-refuse');

    expect(refus?.getAttribute('data-motif')).toBe('saturation');
    expect(refus?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Le suivi en direct est momentanément saturé (statut 429) : il reprendra de lui-même, sans rien à faire de votre côté.',
    );
  });

  it('garde la promesse du retour de la connexion pour un autre refus du suivi', async () => {
    const fixture = await rattacherPuisRefuserLeFlux(503);
    const refus = lire(fixture, 'etudiant-flux-refuse');

    expect(refus?.getAttribute('data-motif')).toBe('autre');
    expect(refus?.textContent).toContain('dès que la connexion sera rétablie');
  });

  const ecranAuRegime = (id: string, regime: 'focus' | 'examen') =>
    buildEcranQuestionnaire({ id, donnees: { ...buildEcranQuestionnaire().donnees, regime } });

  const copieBloquee = (): boolean => {
    const copie = new Event('copy', { cancelable: true });
    document.dispatchEvent(copie);
    return copie.defaultPrevented;
  };

  it('applique le regime de verrou propre a chaque ecran', async () => {
    sujet = {
      ...sujet,
      ecrans: [
        ecranAuRegime('ecran-focus', 'focus'),
        ecranAuRegime('ecran-examen', 'examen'),
        ...sujet.ecrans.slice(2),
      ],
    };
    port.lireSujet.and.returnValue(of(sujet));
    const fixture = await rattacherALaSeanceEnCours();

    window.dispatchEvent(new Event('blur'));
    await repondre(fixture, REPONSE_NUMERIQUE);
    expect(port.signalerIncidents.calls.mostRecent().args[2][0].type).toBe('window_blur');

    diffuserSurLaVue(double, fixture, { ecranCourant: 1 });

    expect(copieBloquee()).toBeTrue();
  });

  const rattacherSurUnEcranDExamen = () => {
    sujet = {
      ...sujet,
      ecrans: [ecranAuRegime('ecran-examen', 'examen'), ...sujet.ecrans.slice(1)],
    };
    port.lireSujet.and.returnValue(of(sujet));
    return rattacherALaSeanceEnCours();
  };

  it('remonte le contexte de l incident au contrat, pas seulement son type', async () => {
    const fixture = await rattacherSurUnEcranDExamen();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true }),
    );
    await repondre(fixture, REPONSE_NUMERIQUE);

    expect(port.signalerIncidents.calls.mostRecent().args[2]).toEqual([
      { type: 'blocked_shortcut', contexte: { touche: 's' }, horodatage: jasmine.any(String) },
      {
        type: 'fast_answer',
        contexte: { dureeMs: jasmine.any(Number) },
        horodatage: jasmine.any(String),
      },
    ]);
  });

  it('rend le copier a la page quand le poste quitte un ecran d examen', async () => {
    const fixture = await rattacherSurUnEcranDExamen();
    const pendantLaSeance = copieBloquee();

    fixture.destroy();

    expect([pendantLaSeance, copieBloquee()]).toEqual([true, false]);
  });

  const verrouiller = <E extends object>(ecran: E) => ({
    ...ecran,
    type: 'ecran-verrouille',
    interactif: false,
    donnees: {},
  });

  function servirUnQcmVisuelEnPremier(): void {
    sujet = {
      ...sujet,
      ecrans: [buildVisualQuizSlide({ id: 'ecran-1' }), ...sujet.ecrans.slice(1)],
    };
    port.lireSujet.and.returnValue(of(sujet));
  }

  const sujetAuSecondEcranVerrouille = () => ({
    ...sujet,
    ecrans: [sujet.ecrans[0], verrouiller(sujet.ecrans[1]), ...sujet.ecrans.slice(2)],
  });

  it('relit un ecran verrouille quand le formateur le revele', async () => {
    port.lireSujet.and.returnValues(of(sujetAuSecondEcranVerrouille()), of(sujet));

    const fixture = await suivreLaSeanceJusquA(1);

    expect(port.lireSujet).toHaveBeenCalledTimes(2);
    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);
    expect(lire(fixture, 'etudiant-ecran-chargement')).toBeNull();
  });

  const correctionVerrouillee = () => {
    const source = { ...sujet.ecrans[0], revelation: buildRevelationServie() };
    const correction = { ...sujet.ecrans[1], ecranSource: source.id };
    const sujetInitial = {
      ...sujet,
      ecrans: [source, verrouiller(correction), ...sujet.ecrans.slice(2)],
    };
    const sujetRelu = { ...sujet, ecrans: [source, correction, ...sujet.ecrans.slice(2)] };
    return { source, correction, sujetInitial, sujetRelu };
  };

  it('T9 · relit l écran de correction verrouillé dès que sa source est révélée, même si l étudiant est ailleurs', async () => {
    const { source, correction, sujetInitial, sujetRelu } = correctionVerrouillee();
    port.lireSujet.and.returnValues(of(sujetInitial), of(sujetRelu));
    const fixture = await suivreLaSeanceJusquA(0);

    expect(port.lireSujet).toHaveBeenCalledTimes(1);

    await piloterSurLEcran(fixture, 0, source.id, { revele: true });

    expect(port.lireSujet).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.sujet()?.ecrans[1]).toBe(correction);
    expect(ecranAffiche(fixture)).toBe(source);
  });

  it('relit le sujet quand le formateur corrige un écran par étayage seul, sans marque de révélation', async () => {
    const source = { ...sujet.ecrans[0], revelation: undefined };
    const revelee = { ...source, revelation: buildRevelationServie() };
    port.lireSujet.and.returnValues(
      of({ ...sujet, ecrans: [source, ...sujet.ecrans.slice(1)] }),
      of({ ...sujet, ecrans: [revelee, ...sujet.ecrans.slice(1)] }),
    );
    const fixture = await suivreLaSeanceJusquA(0);

    await piloterSurLEcran(fixture, 0, source.id, { etayage: 2 });

    expect(port.lireSujet).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.sujet()?.ecrans[0]).toBe(revelee);
  });

  it('S-02 · relit le sujet à chaque question que le formateur corrige sur place', async () => {
    const explication = (reference: string) => ({ reference, texte: `Corrigé de ${reference}.` });
    const exercice: EcranContent = { ...sujet.ecrans[0], revelation: undefined };
    const premiere = {
      ...exercice,
      revelation: buildRevelationServie({ explications: [explication('q1')] }),
    };
    const seconde = {
      ...exercice,
      revelation: buildRevelationServie({ explications: [explication('q1'), explication('q2')] }),
    };
    const avec = (ecran: EcranContent) =>
      of({ ...sujet, ecrans: [ecran, ...sujet.ecrans.slice(1)] });
    port.lireSujet.and.returnValues(avec(exercice), avec(premiere), avec(seconde));
    const fixture = await suivreLaSeanceJusquA(0);

    await piloterSurLEcran(fixture, 0, exercice.id, { explicationsDevoilees: 1 });
    expect(fixture.componentInstance.sujet()?.ecrans[0]).toBe(premiere);
    await piloterSurLEcran(fixture, 0, exercice.id, { explicationsDevoilees: 2 });

    expect(port.lireSujet).toHaveBeenCalledTimes(3);
    expect(fixture.componentInstance.sujet()?.ecrans[0]).toBe(seconde);
  });

  it('ne relit le sujet qu une fois quand le formateur sert et revele dans le meme etat', async () => {
    const { source, correction, sujetInitial, sujetRelu } = correctionVerrouillee();
    port.lireSujet.and.returnValues(of(sujetInitial), of(sujetRelu), of(sujetRelu));
    const fixture = await rattacherALaSeanceEnCours();

    await piloterSurLEcran(fixture, 1, source.id, { revele: true });

    expect(port.lireSujet).toHaveBeenCalledTimes(2);
    expect(ecranAffiche(fixture)).toBe(correction);
  });

  it('signale l echec d une relecture d ecran sans afficher un ecran vide', async () => {
    port.lireSujet.and.returnValues(
      of(sujetAuSecondEcranVerrouille()),
      throwError(() => new SujetRefuse('sujet-indisponible', 503)),
    );

    const fixture = await suivreLaSeanceJusquA(1);

    expect(lire(fixture, 'etudiant-ecran-echec')?.getAttribute('role')).toBe('alert');
    expect(fixture.debugElement.query(By.directive(SlideActivityComponent))).toBeNull();
  });

  const RELECTURES_REFUSEES: readonly {
    readonly cause: string;
    readonly refus: SujetRefuse;
    readonly message: string;
  }[] = [
    {
      cause: 'un sujet indisponible',
      refus: new SujetRefuse('sujet-indisponible', 503),
      message: 'L’écran n’a pas pu être chargé.',
    },
    {
      cause: 'la cadence du serveur',
      refus: new SujetRefuse('sujet-indisponible', 429, { minutes: 2 }),
      message: ECRAN_LIMITE,
    },
    {
      cause: 'un cours modifie',
      refus: new SujetRefuse('cours-modifie', 409),
      message: 'Le cours a changé depuis l’ouverture de la séance : prévenez votre formateur.',
    },
  ];

  const MOMENTS_DE_RELECTURE: readonly {
    readonly moment: string;
    readonly relire: (refus: SujetRefuse) => Promise<Fixture>;
  }[] = [
    {
      moment: 'a l arrivee sur un ecran verrouille',
      relire: (refus) => {
        port.lireSujet.and.returnValues(
          of(sujetAuSecondEcranVerrouille()),
          throwError(() => refus),
        );
        return suivreLaSeanceJusquA(1);
      },
    },
    {
      moment: 'a la revelation de sa source',
      relire: async (refus) => {
        const { source, sujetInitial } = correctionVerrouillee();
        port.lireSujet.and.returnValues(
          of(sujetInitial),
          throwError(() => refus),
        );
        const fixture = await suivreLaSeanceJusquA(0);
        await piloterSurLEcran(fixture, 0, source.id, { revele: true });
        return fixture;
      },
    },
  ];

  for (const { moment, relire } of MOMENTS_DE_RELECTURE) {
    for (const { cause, refus, message } of RELECTURES_REFUSEES) {
      it(`dit d une relecture d ecran refusee ${moment} par ${cause} sa vraie cause`, async () => {
        const fixture = await relire(refus);

        expect(port.lireSujet).toHaveBeenCalledTimes(2);
        expect(lire(fixture, 'etudiant-ecran-echec')?.textContent?.trim()).toBe(message);
      });
    }
  }

  describe('D-16 · ce que la cadence du serveur retient repart a chaque declencheur promis', () => {
    const ecranLimite = (limite: LimiteDeDebit) =>
      throwError(() => new SujetRefuse('sujet-indisponible', 429, limite));

    const ecranRelu = (fixture: Fixture) => ({
      lectures: port.lireSujet.calls.count(),
      second: fixture.componentInstance.sujet()?.ecrans[1].type,
      echec: lire(fixture, 'etudiant-ecran-echec'),
      chargement: lire(fixture, 'etudiant-ecran-chargement'),
    });
    const ECRAN_RELU = () => ({
      lectures: 3,
      second: sujet.ecrans[1].type,
      echec: null,
      chargement: null,
    });
    const ecranRetenu = (fixture: Fixture): Fixture => {
      expect(lire(fixture, 'etudiant-ecran-echec')?.textContent?.trim()).toBe(ECRAN_LIMITE);
      return fixture;
    };

    const ATTENTES_RETENUES: readonly {
      readonly attente: string;
      readonly briqueAffichee: boolean;
      readonly retenir: (limite?: LimiteDeDebit) => Promise<Fixture>;
      readonly etatSuivant: () => Partial<EtatSession>;
      readonly observerLeDepart: (fixture: Fixture) => unknown;
      readonly depart: () => unknown;
    }[] = [
      {
        attente: 'la relecture d un ecran verrouille a l arrivee',
        briqueAffichee: false,
        retenir: async (limite = LIMITE_DE_DEUX_MINUTES) => {
          port.lireSujet.and.returnValues(
            of(sujetAuSecondEcranVerrouille()),
            ecranLimite(limite),
            of(sujet),
          );
          return ecranRetenu(await suivreLaSeanceJusquA(1));
        },
        etatSuivant: () => ({ ecranCourant: 1 }),
        observerLeDepart: (fixture) => ({
          ...ecranRelu(fixture),
          affiche:
            (
              ecranMonte(fixture)?.componentInstance as SlideActivityComponent | undefined
            )?.slide() ?? null,
        }),
        depart: () => ({ ...ECRAN_RELU(), affiche: sujet.ecrans[1] }),
      },
      {
        attente: 'la relecture d un ecran verrouille a la revelation de sa source',
        briqueAffichee: false,
        retenir: async (limite = LIMITE_DE_DEUX_MINUTES) => {
          const { source, sujetInitial, sujetRelu } = correctionVerrouillee();
          port.lireSujet.and.returnValues(of(sujetInitial), ecranLimite(limite), of(sujetRelu));
          const fixture = await suivreLaSeanceJusquA(0);
          await piloterSurLEcran(fixture, 0, source.id, { revele: true });
          return ecranRetenu(fixture);
        },
        etatSuivant: () => ({
          ecranCourant: 0,
          pilotage: { [sujet.ecrans[0].id]: { revele: true } },
        }),
        observerLeDepart: ecranRelu,
        depart: ECRAN_RELU,
      },
      {
        attente: 'une reflexion',
        briqueAffichee: true,
        retenir: async (limite = LIMITE_DE_DEUX_MINUTES) => {
          port.enregistrerReponseLibre.and.returnValues(
            throwError(() => new ReponseLibreRefusee('reseau', 429, limite)),
            of({ status: 'enregistre' }),
            of({ status: 'enregistre' }),
          );
          const fixture = await rattacherALaSeanceEnCours();
          await emettre(fixture, REFLEXION_DU_RAPPEL);
          expect(lire(fixture, 'etudiant-reflexion-en-attente')?.getAttribute('data-etat')).toBe(
            'attente_limite',
          );
          return fixture;
        },
        etatSuivant: () => ({}),
        observerLeDepart: (fixture) => ({
          renvois: port.enregistrerReponseLibre.calls
            .allArgs()
            .filter(([, , reponse]) => reponse.activityId === 'Q-RAPPEL-04:rappel').length,
          paragraphe: lire(fixture, 'etudiant-reflexion-en-attente'),
        }),
        depart: () => ({ renvois: 2, paragraphe: null }),
      },
      {
        attente: 'une reponse en file',
        briqueAffichee: true,
        retenir: async (limite = LIMITE_DE_DEUX_MINUTES) => {
          port.repondre.and.returnValues(
            throwError(() => refusLimite(limite)),
            of(REUSSITE),
            of(REUSSITE),
          );
          const fixture = await rattacherALaSeanceEnCours();
          await repondre(fixture, REPONSE_NUMERIQUE);
          expect(texteDeLaFile(fixture)).toBe(REPONSE_LIMITEE);
          return fixture;
        },
        etatSuivant: () => ({}),
        observerLeDepart: (fixture) => ({
          enFile: pending().length,
          bandeau: lire(fixture, 'etudiant-hors-ligne'),
        }),
        depart: () => ({ enFile: 0, bandeau: null }),
      },
    ];

    const DECLENCHEURS: readonly {
      readonly declencheur: string;
      readonly depuisUneBrique: boolean;
      readonly declencher: (fixture: Fixture, etatSuivant: Partial<EtatSession>) => Promise<void>;
    }[] = [
      {
        declencheur: 'la prochaine action du formateur',
        depuisUneBrique: false,
        declencher: (fixture, etatSuivant) =>
          diffuserPuisStabiliser(fixture, { ...etatSuivant, revision: 14 }),
      },
      {
        declencheur: 'le retour du reseau',
        depuisUneBrique: false,
        declencher: (fixture) => laisserPasserLeReseau(fixture),
      },
      {
        declencheur: 'la reponse suivante, transmise',
        depuisUneBrique: true,
        declencher: (fixture) => repondre(fixture, REPONSE_VOTE),
      },
      {
        declencheur: 'une autre reflexion, enregistree',
        depuisUneBrique: true,
        declencher: (fixture) =>
          emettre(fixture, {
            kind: 'libre',
            screenId: 'ecran-1',
            activityId: 'Q-RAPPEL-05:rappel',
            response: 'On actualise',
            dureeMs: 1500,
          }),
      },
      {
        declencheur: 'une tentative d enigme, transmise',
        depuisUneBrique: true,
        declencher: (fixture) => emettre(fixture, TENTATIVE_DU_SEUIL),
      },
      {
        declencheur: 'un defi, transmis',
        depuisUneBrique: true,
        declencher: (fixture) => emettre(fixture, DEFI_DE_LA_DIZAINE),
      },
    ];

    for (const {
      attente,
      briqueAffichee,
      retenir,
      etatSuivant,
      observerLeDepart,
      depart,
    } of ATTENTES_RETENUES) {
      for (const { declencheur, declencher } of DECLENCHEURS.filter(
        ({ depuisUneBrique }) => briqueAffichee || !depuisUneBrique,
      )) {
        it(`${attente} retenue par la cadence du serveur repart des ${declencheur}`, async () => {
          const fixture = await retenir();

          await declencher(fixture, etatSuivant());

          expect(observerLeDepart(fixture)).toEqual(depart());
        });
      }

      for (const { quand, limite, delaiMs } of [
        { quand: 'au delai annonce', limite: LIMITE_DE_DEUX_MINUTES, delaiMs: 120_000 },
        {
          quand: 'une minute apres un refus sans delai',
          limite: { minutes: null },
          delaiMs: 60_000,
        },
      ]) {
        it(`${attente} retenue par la cadence du serveur repart d elle-meme ${quand}, pas avant`, async () => {
          await sousLHorlogeDuTest(async () => {
            const fixture = await retenir(limite);

            jasmine.clock().tick(delaiMs - 1);
            await stabiliserLaVue(fixture);
            const avantLeDelai = observerLeDepart(fixture);
            jasmine.clock().tick(1);
            await stabiliserLaVue(fixture);

            expect(avantLeDelai).not.toEqual(depart());
            expect(observerLeDepart(fixture)).toEqual(depart());
          });
        });
      }
    }
  });

  describe('l etat d une reflexion se dit une seule fois au poste des cours servis', () => {
    const REFLEXION_LIMITEE =
      'Le serveur limite les envois : la réflexion est gardée sur cet appareil et repartira d’elle-même.';

    function foisDitesAuPoste(fixture: Fixture): number {
      const texte = (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
      return texte.split(REFLEXION_LIMITEE).length - 1;
    }

    it('trouve la brique de reflexion dans les cours servis', () => {
      expect(ECRANS_DE_REFLEXION.length).toBeGreaterThan(0);
    });

    const CACHES_DE_L_ECRAN: readonly {
      readonly cache: string;
      readonly temoin: string;
      readonly cacher: (fixture: Fixture) => void;
    }[] = [
      {
        cache: 'l eviction du poste',
        temoin: 'etudiant-evince',
        cacher: (fixture) => {
          double.diffuserFin('evince');
          fixture.detectChanges();
        },
      },
      {
        cache: 'la place liberee',
        temoin: 'etudiant-poste-libere',
        cacher: (fixture) => {
          double.diffuserFin('revoque');
          fixture.detectChanges();
        },
      },
      {
        cache: 'la fin de la seance',
        temoin: 'etudiant-fin',
        cacher: (fixture) => diffuserSurLaVue(double, fixture, { etat: 'terminee' }),
      },
      {
        cache: 'le retour en attente',
        temoin: 'etudiant-attente',
        cacher: (fixture) => diffuserSurLaVue(double, fixture, { etat: 'attente' }),
      },
    ];

    async function retenirLaReflexionSurSonEcran(
      servi: CoursContent,
      rang: number,
    ): Promise<Fixture> {
      sujet = servi;
      port.lireSujet.and.returnValue(of(sujet));
      port.enregistrerReponseLibre.and.returnValue(
        throwError(() => new ReponseLibreRefusee('reseau', 429, { minutes: 2 })),
      );
      const fixture = await rattacherALaSeanceEnCours();
      await diffuserPuisStabiliser(fixture, { ecranCourant: rang });
      garderLaReflexion(fixture, 'On compare des parts de totaux differents.');
      await jusqua(fixture, () => etatDeLaReflexion(fixture) === 'attente_limite');
      return fixture;
    }

    for (const { prefixe, servi, rang } of ECRANS_DE_REFLEXION) {
      it(
        `${prefixe} ecran ${rang + 1} : la brique dit seule sa reflexion retenue, le poste la dit depuis un autre ecran`,
        async () => {
          const fixture = await retenirLaReflexionSurSonEcran(servi, rang);
          const surSonEcran = foisDitesAuPoste(fixture);
          await diffuserPuisStabiliser(fixture, { ecranCourant: rang === 0 ? 1 : rang - 1 });

          expect([surSonEcran, foisDitesAuPoste(fixture)]).toEqual([1, 1]);
        },
        DELAI_DE_MONTAGE_MS,
      );

      for (const statut of [429, 503]) {
        it(
          `${prefixe} ecran ${rang + 1} : le poste dit la reflexion retenue quand le suivi refuse en ${statut} demonte sa brique`,
          async () => {
            const fixture = await retenirLaReflexionSurSonEcran(servi, rang);

            double.diffuserStatut({ etat: 'refuse', statut });
            fixture.detectChanges();

            expect([
              lire(fixture, 'etudiant-flux-refuse')?.getAttribute('data-statut'),
              etatDeLaReflexion(fixture),
              foisDitesAuPoste(fixture),
            ]).toEqual([String(statut), null, 1]);
          },
          DELAI_DE_MONTAGE_MS,
        );
      }

      for (const { cache, temoin, cacher } of CACHES_DE_L_ECRAN) {
        it(
          `${prefixe} ecran ${rang + 1} : le poste dit la reflexion retenue quand ${cache} cache sa brique`,
          async () => {
            const fixture = await retenirLaReflexionSurSonEcran(servi, rang);

            cacher(fixture);

            expect([
              lire(fixture, temoin) !== null,
              etatDeLaReflexion(fixture),
              foisDitesAuPoste(fixture),
            ]).toEqual([true, null, 1]);
          },
          DELAI_DE_MONTAGE_MS,
        );
      }
    }
  });

  describe('D-19 · la reflexion enregistree par sa brique relance ce que la cadence retient', () => {
    for (const { prefixe, servi, rang } of ECRANS_DE_REFLEXION) {
      it(
        `${prefixe} ecran ${rang + 1} : la reponse en file repart quand la brique enregistre la reflexion`,
        async () => {
          sujet = servi;
          port.lireSujet.and.returnValue(of(sujet));
          port.repondre.and.returnValues(throwError(refusLimite), of(REUSSITE));
          port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
          const fixture = await rattacherALaSeanceEnCours();
          await diffuserPuisStabiliser(fixture, { ecranCourant: rang });
          await emettre(fixture, {
            kind: 'reponse',
            screenId: servi.ecrans[rang].id,
            ...REPONSE_NUMERIQUE,
          });
          expect(texteDeLaFile(fixture)).toBe(REPONSE_LIMITEE);

          garderLaReflexion(fixture, 'On compare des parts de totaux differents.');
          await jusqua(fixture, () => pending().length === 0);

          expect({
            reflexion: etatDeLaReflexion(fixture),
            enFile: pending().length,
            bandeau: lire(fixture, 'etudiant-hors-ligne'),
          }).toEqual({ reflexion: 'enregistre', enFile: 0, bandeau: null });
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  });

  it('envoie au serveur la reponse d une brique avec son identifiant de question', async () => {
    const fixture = await rattacherALaSeanceEnCours();

    await repondre(fixture, REPONSE_VOTE);

    expect(port.repondre).toHaveBeenCalledOnceWith(SESSION, JETON, {
      questionId: 'Q-CAP-03',
      valeur: 'b',
      dureeMs: 400,
    });
  });

  it('ne pose sur la brique que le resultat et l etiquette de confusion (F6)', async () => {
    port.repondre.and.returnValue(of(verdictAvecFuite()));
    const fixture = await rattacherALaSeanceEnCours();
    await repondre(fixture, REPONSE_NUMERIQUE);
    const transmis = JSON.stringify(retoursDe(fixture));

    expect(retoursDe(fixture)).toEqual([CONFUSION_POSEE_SUR_LA_BRIQUE]);
    expect(transmis).not.toContain(VALEUR_ATTENDUE);
    expect(transmis).not.toContain(ETIQUETTE_BRUTE);
    expect(verdictsAffiches(fixture))
      .withContext('le verdict d une brique runtime s affiche dans la brique, pas sous l ecran')
      .toEqual([]);
  });

  it('pose chaque verdict sur l ecran de sa question, pas sur l ecran suivant', async () => {
    port.repondre.and.returnValues(of(REUSSITE), of(CONFUSION));
    const fixture = await rattacherALaSeanceEnCours();

    await repondre(fixture, REPONSE_NUMERIQUE);
    await repondre(fixture, REPONSE_VOTE);

    expect(
      retoursDe(fixture).map((retour) =>
        retour.kind === 'verdict-reponse' ? [retour.questionId, retour.correcte] : retour.kind,
      ),
    ).toEqual([
      ['Q-VA-07', true],
      ['Q-CAP-03', false],
    ]);

    diffuserSurLaVue(double, fixture, { ecranCourant: 1 });

    expect(retoursDe(fixture, sujet.ecrans[1].id)).toEqual([]);
  });

  it('affiche le verdict serveur du QCM d un ecran servi en presentation v2', async () => {
    servirUnQcmVisuelEnPremier();
    port.repondre.and.returnValue(of(CONFUSION));
    const fixture = await rattacherALaSeanceEnCours();

    await repondre(fixture, { questionId: 'b2-s03-prediction', valeur: 'o2', dureeMs: 800 });

    expect(libellesDesVerdicts(fixture)).toEqual([['b2-s03-prediction', 'Question 1 : Manqué']]);
    expect(lire(fixture, 'etudiant-confusion')?.textContent).toContain('composés');
    expect(
      lireLesLibelles(fixture.nativeElement, ['etudiant-verdict', 'etudiant-confusion']),
    ).toEqual({ colles: [], vuesAbsentes: [] });
  });

  it('envoie au retour du reseau la reponse mise en file hors ligne, une seule fois', async () => {
    const fixture = await repondreHorsLigne();

    expect(port.repondre).not.toHaveBeenCalled();
    expect(pending().length).toBe(1);
    expect(lire(fixture, 'etudiant-hors-ligne')).toBeTruthy();

    await laisserPasserLeReseau(fixture);

    expect(port.repondre).toHaveBeenCalledOnceWith(SESSION, JETON, REPONSE_NUMERIQUE);
    attendreLaFileVideeEnLigne(fixture);
    expect(genresDe(fixture)).toEqual(['verdict-reponse']);

    await laisserPasserLeReseau(fixture);

    expect(port.repondre).toHaveBeenCalledTimes(1);
  });

  it('pose sur l ecran d origine, pas sur le nouvel ecran, le verdict d une reponse renvoyee', async () => {
    const fixture = await repondreHorsLigne();
    diffuserSurLaVue(double, fixture, { ecranCourant: 1 });

    await laisserPasserLeReseau(fixture);

    expect(port.repondre).toHaveBeenCalledTimes(1);
    expect(genresDe(fixture)).toEqual(['verdict-reponse']);
    expect(retoursDe(fixture, sujet.ecrans[1].id)).toEqual([]);
    expect(verdictsAffiches(fixture)).toEqual([]);
  });

  describe('ecran auquel renvoie l ecran courant', () => {
    async function renvoiServiVers(cible: EcranContent): Promise<EcranContent | null> {
      sujet = { ...sujet, ecrans: [{ ...sujet.ecrans[0], renvoi: cible.id }, cible] };
      port.lireSujet.and.returnValue(of(sujet));
      const fixture = await rattacherALaSeanceEnCours();
      const presentation = fixture.debugElement.query(By.directive(CoursPresentationComponent));
      return (presentation.componentInstance as CoursPresentationComponent).renvoi();
    }

    it('le donne a la presentation du poste etudiant', async () => {
      const cible = buildEcran({ id: 'ecran-cible' });

      expect(await renvoiServiVers(cible)).toBe(cible);
    });

    it('ne donne rien quand l ecran renvoye est encore verrouille', async () => {
      const cible = buildEcran({ id: 'ecran-cible', type: 'ecran-verrouille', interactif: false });

      expect(await renvoiServiVers(cible)).toBeNull();
    });
  });

  describe('avant le demarrage de la seance', () => {
    function attendrePuisDemarrer(fixture: Fixture, raison: string): void {
      expect(lire(fixture, 'etudiant-attente')?.getAttribute('role')).toBe('status');
      expect(fixture.debugElement.query(By.directive(SlideActivityComponent)))
        .withContext(raison)
        .toBeNull();

      diffuserSurLaVue(double, fixture, { etat: 'en_cours' });

      expect(lire(fixture, 'etudiant-attente')).toBeNull();
      expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
    }

    it('affiche un message d attente au lieu de l ecran, puis l ecran au demarrage', async () => {
      const fixture = await rattacher();

      diffuserSurLaVue(double, fixture, { etat: 'attente' });

      attendrePuisDemarrer(
        fixture,
        'aucune brique ne doit pouvoir etre repondue avant le demarrage',
      );
    });

    it('n expose aucune brique tant que le flux n a annonce aucun etat de la seance', async () => {
      const fixture = await rattacher();

      attendrePuisDemarrer(
        fixture,
        'un flux refuse ou injoignable ne doit pas ouvrir les reponses',
      );
    });

    it('efface le refus de seance non demarree et monte la brique quand la seance passe en cours', async () => {
      const { identite } = saveIdentity({
        prenom: 'Lea',
        nom: 'Dubois',
        email: 'lea.dubois@example.com',
      });
      enqueue(
        buildEnvoiReponse({
          sessionId: SESSION,
          studentKey: identite.studentKey,
          questionId: REPONSE_VOTE.questionId,
        }),
      );
      port.repondre.and.returnValue(
        throwError(() => new ReponseRefusee('seance-non-demarree', 409)),
      );
      const fixture = await rattacher();
      await diffuserPuisStabiliser(fixture, { etat: 'attente' });

      expect(lire(fixture, 'etudiant-reponse-refusee')?.getAttribute('data-motif')).toBe(
        'seance-non-demarree',
      );

      diffuserSurLaVue(double, fixture, { etat: 'en_cours' });

      expect(lire(fixture, 'etudiant-reponse-refusee')).toBeNull();
      expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
    });

    it('ne propose pas l ecran suivant pendant l attente', async () => {
      const fixture = await rattacher();

      diffuserSurLaVue(double, fixture, {
        etat: 'attente',
        modeRythme: 'libre',
        intervalleLibre: { premier: 0, dernier: 3 },
      });

      expect(lire(fixture, 'etudiant-suivant')).toBeNull();
    });
  });

  describe('refus d une reponse par le serveur', () => {
    function refuser(motif: ReponseRefusee['motif'], statut: number): void {
      port.repondre.and.returnValue(throwError(() => new ReponseRefusee(motif, statut)));
    }

    it('relit l etat et marque deja repondue, sans file ni alerte, une reponse deja enregistree (409)', async () => {
      refuser('deja-repondue', 409);
      const fixture = await rattacherALaSeanceEnCours();
      port.lireMonEtat.calls.reset();

      await repondre(fixture, REPONSE_VOTE);

      expect(port.lireMonEtat).toHaveBeenCalledOnceWith(SESSION, JETON);
      expect(retoursDe(fixture)).toEqual([{ kind: 'deja-repondu', questionId: 'Q-CAP-03' }]);
      attendreLaFileVideeEnLigne(fixture);
      expect(lire(fixture, 'etudiant-reponse-refusee')).toBeNull();
    });

    for (const [cas, motif, statut] of [
      ['la seance n a pas demarre (409)', 'seance-non-demarree', 409],
      ['la requete est invalide (400)', 'refusee', 400],
    ] as const) {
      it(`pose sur la brique, sans mettre en file, un refus quand ${cas}`, async () => {
        refuser(motif, statut);
        const fixture = await rattacherALaSeanceEnCours();

        await repondre(fixture, REPONSE_VOTE);

        expect(retoursDe(fixture)).toEqual([
          { kind: 'refus', motif, message: new ReponseRefusee(motif, statut).message },
        ]);
        expect(lire(fixture, 'etudiant-reponse-refusee'))
          .withContext('la brique qui a emis porte le refus, pas un bandeau sous l ecran')
          .toBeNull();
        attendreLaFileVideeEnLigne(fixture);
      });
    }

    it('explique en bandeau le refus d un QCM d ecran visuel, qui n a pas de brique', async () => {
      servirUnQcmVisuelEnPremier();
      refuser('refusee', 400);
      const fixture = await rattacherALaSeanceEnCours();

      await repondre(fixture, { questionId: 'b2-s03-prediction', valeur: 'o2', dureeMs: 800 });
      const alerte = lire(fixture, 'etudiant-reponse-refusee');

      expect(alerte?.getAttribute('role')).toBe('alert');
      expect(alerte?.getAttribute('data-motif')).toBe('refusee');
    });

    it('efface le refus pose sur l ecran des que la brique emet de nouveau', async () => {
      port.repondre.and.returnValues(
        throwError(() => new ReponseRefusee('refusee', 400)),
        of(REUSSITE),
      );
      const fixture = await rattacherALaSeanceEnCours();
      await repondre(fixture, REPONSE_VOTE);

      await repondre(fixture, REPONSE_VOTE);

      expect(genresDe(fixture)).toEqual(['verdict-reponse']);
    });

    async function repondreEnFile(): Promise<Fixture> {
      const fixture = await rattacherALaSeanceEnCours();

      await repondre(fixture, REPONSE_NUMERIQUE);

      expect(pending().length).toBe(1);
      return fixture;
    }

    it('met en file une reponse refusee par une panne du serveur (5xx)', async () => {
      refuser('reseau', 503);
      const fixture = await repondreEnFile();

      expect(lire(fixture, 'etudiant-hors-ligne')).toBeTruthy();
      expect(lire(fixture, 'etudiant-reponse-refusee')).toBeNull();
    });

    async function repondreEnFileParLaLimite(): Promise<Fixture> {
      const fixture = await repondreEnFile();
      expect(texteDeLaFile(fixture)).toBe(REPONSE_LIMITEE);
      return fixture;
    }

    function attendreLaReponseSeuleRetenueParLaLimite(fixture: Fixture): void {
      expect(pending().map(({ questionId }) => questionId)).toEqual([REPONSE_NUMERIQUE.questionId]);
      expect(texteDeLaFile(fixture)).toBe(REPONSE_LIMITEE);
    }

    function unTourDeBoucle(): Promise<void> {
      return new Promise((resoudre) => setTimeout(resoudre));
    }

    function suspendreLeJalon(): Subject<void> {
      const jalonEnVol = new Subject<void>();
      port.declarerJalon.and.returnValue(jalonEnVol);
      return jalonEnVol;
    }

    async function viderJusquAuJalonEnVol(fixture: Fixture): Promise<void> {
      await emettre(fixture, JALON_PERDU);
      window.dispatchEvent(new Event('online'));
      await unTourDeBoucle();
      expect(port.declarerJalon).toHaveBeenCalledTimes(1);
    }

    function enPanne(): ReturnType<FormationsPort['repondre']> {
      return throwError(() => new ReponseRefusee('reseau', 502));
    }

    async function mettreEnFileUneRetenueEtUnePanne(
      ...renvois: ReturnType<FormationsPort['repondre']>[]
    ): Promise<Fixture> {
      port.repondre.and.returnValues(throwError(refusLimite), enPanne(), ...renvois);
      const fixture = await repondreEnFileParLaLimite();
      await repondre(fixture, REPONSE_VOTE);
      expect(pending().length).toBe(2);
      return fixture;
    }

    it('dit d une reponse mise en file par la cadence du serveur qu elle est gardee et repartira seule, pas le reseau, puis la renvoie', async () => {
      port.repondre.and.returnValues(throwError(refusLimite), of(REUSSITE));
      const fixture = await repondreEnFileParLaLimite();

      await laisserPasserLeReseau(fixture);

      expect(port.repondre).toHaveBeenCalledTimes(2);
      attendreLaFileVideeEnLigne(fixture);
    });

    it('dit encore la limite d une reponse retenue quand un autre envoi de la file passe', async () => {
      port.repondre.and.returnValue(throwError(refusLimite));
      const fixture = await repondreHorsLigne();
      await emettre(fixture, JALON_PERDU);
      expect(pending().length).toBe(2);

      await laisserPasserLeReseau(fixture);

      expect(port.declarerJalon).toHaveBeenCalledOnceWith(SESSION, JETON, 'P-PULSE-01', 'perdu');
      attendreLaReponseSeuleRetenueParLaLimite(fixture);
    });

    it('dit encore la limite d une reponse retenue qui entre dans la file pendant un vidage', async () => {
      port.repondre.and.returnValue(throwError(refusLimite));
      const jalonTransmis = suspendreLeJalon();
      const fixture = await rattacherALaSeanceEnCours();
      window.dispatchEvent(new Event('offline'));
      await viderJusquAuJalonEnVol(fixture);

      const ecran = ecranAffiche(fixture) as EcranContent;
      ecranDe(fixture).triggerEventHandler('evenement', {
        kind: 'reponse',
        screenId: ecran.id,
        ...REPONSE_NUMERIQUE,
      });
      await unTourDeBoucle();
      expect(pending().length).toBe(2);

      jalonTransmis.next();
      jalonTransmis.complete();
      await unTourDeBoucle();
      await stabiliserLaVue(fixture);

      attendreLaReponseSeuleRetenueParLaLimite(fixture);
    });

    it('dit le reseau d une reponse limitee quand le poste perd le reseau', async () => {
      port.repondre.and.returnValue(throwError(refusLimite));
      const fixture = await repondreEnFileParLaLimite();

      window.dispatchEvent(new Event('offline'));
      await stabiliserLaVue(fixture);

      expect(texteDeLaFile(fixture)).toBe(ATTENTE_DU_RESEAU);
    });

    it('dit le reseau quand le poste perd le reseau pendant un vidage qui a retenu une reponse par la limite', async () => {
      port.repondre.and.returnValue(throwError(refusLimite));
      const jalonEnVol = suspendreLeJalon();
      const fixture = await repondreHorsLigne();
      await viderJusquAuJalonEnVol(fixture);

      window.dispatchEvent(new Event('offline'));
      jalonEnVol.error(new ReponseRefusee('reseau', 0));
      await unTourDeBoucle();
      await stabiliserLaVue(fixture);

      expect(pending().length).toBe(2);
      expect(texteDeLaFile(fixture)).toBe(ATTENTE_DU_RESEAU);
    });

    it('dit encore la limite quand un envoi direct tombe en panne derriere une reponse retenue en file', async () => {
      const fixture = await mettreEnFileUneRetenueEtUnePanne();

      expect(texteDeLaFile(fixture)).toBe(REPONSE_LIMITEE);
    });

    it('revient au reseau quand la reponse retenue passe au vidage et qu un envoi en panne reste en file', async () => {
      const fixture = await mettreEnFileUneRetenueEtUnePanne(of(REUSSITE), enPanne());

      await diffuserPuisStabiliser(fixture, { revision: 14 });

      expect(pending().map(({ questionId }) => questionId)).toEqual([REPONSE_VOTE.questionId]);
      expect(texteDeLaFile(fixture)).toBe(ATTENTE_DU_RESEAU);
    });

    it('vide la file apres un envoi reussi, sans attendre le retour du reseau', async () => {
      port.repondre.and.returnValues(
        throwError(() => new ReponseRefusee('reseau', 502)),
        of(REUSSITE),
        of(CONFUSION),
      );
      const fixture = await rattacherALaSeanceEnCours();
      await repondre(fixture, REPONSE_NUMERIQUE);

      await repondre(fixture, REPONSE_VOTE);

      expect(port.repondre.calls.allArgs().map(([, , reponse]) => reponse.questionId)).toEqual([
        'Q-VA-07',
        'Q-CAP-03',
        'Q-VA-07',
      ]);
      attendreLaFileVideeEnLigne(fixture);
    });

    it('vide la file a chaque evenement d etat du flux', async () => {
      port.repondre.and.returnValues(
        throwError(() => new ReponseRefusee('reseau', 0)),
        of(REUSSITE),
      );
      const fixture = await rattacherALaSeanceEnCours();
      await repondre(fixture, REPONSE_NUMERIQUE);

      await diffuserPuisStabiliser(fixture, { revision: 14 });

      expect(port.repondre).toHaveBeenCalledTimes(2);
      expect(pending().length).toBe(0);
      expect(genresDe(fixture)).toEqual(['verdict-reponse']);
    });

    it('retire de la file une reponse que le serveur refuse au renvoi, en l expliquant', async () => {
      port.repondre.and.returnValues(
        throwError(() => new ReponseRefusee('reseau', 503)),
        throwError(() => new ReponseRefusee('refusee', 409)),
      );
      const fixture = await rattacherALaSeanceEnCours();
      await repondre(fixture, REPONSE_NUMERIQUE);

      await laisserPasserLeReseau(fixture);

      expect(pending().length).toBe(0);
      expect(lire(fixture, 'etudiant-reponse-refusee')?.getAttribute('data-motif')).toBe('refusee');
    });
  });

  it('remonte les incidents de verrou groupes sans bloquer la reponse en cours', async () => {
    port.signalerIncidents.and.returnValue(NEVER);
    const fixture = await rattacherALaSeanceEnCours();
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('blur'));
    await repondre(fixture, REPONSE_NUMERIQUE);
    const [sessionId, jeton, lot] = port.signalerIncidents.calls.mostRecent().args;

    expect(port.signalerIncidents).toHaveBeenCalledTimes(1);
    expect(sessionId).toBe(SESSION);
    expect(jeton).toBe(JETON);
    expect(lot.length).toBe(2);
    expect(port.repondre).toHaveBeenCalledTimes(1);
    expect(genresDe(fixture)).toEqual(['verdict-reponse']);
  });

  it('ne propose l ecran suivant que si le rythme du flux le permet', async () => {
    const fixture = await rattacher();

    expect(lire(fixture, 'etudiant-suivant')).toBeNull();

    passerEnLibrePuisAvancer(fixture, { premier: 0, dernier: 1 });

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
    diffuserSurLaVue(double, fixture, libre);

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    lire(fixture, 'etudiant-suivant')?.click();
    fixture.detectChanges();
    diffuserSurLaVue(double, fixture, { ...libre, revision: 13 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);

    diffuserSurLaVue(double, fixture, { ...libre, ecranCourant: 3 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);
  });

  it('reste dans l intervalle libre quand le formateur change d ecran et y ramene qui en sort', async () => {
    const fixture = await rattacher();
    const intervalle = { premier: 0, dernier: 3 };
    passerEnLibrePuisAvancer(fixture, intervalle);

    diffuserSurLaVue(double, fixture, {
      modeRythme: 'libre',
      intervalleLibre: intervalle,
      ecranCourant: 2,
    });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    diffuserSurLaVue(double, fixture, {
      modeRythme: 'libre',
      intervalleLibre: { premier: 2, dernier: 3 },
      ecranCourant: 2,
    });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[2]);
  });

  it('ramene l etudiant sur l ecran du formateur quand il repasse en rythme pilote', async () => {
    const fixture = await rattacher();
    passerEnLibrePuisAvancer(fixture, null);

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[1]);

    diffuserSurLaVue(double, fixture, { modeRythme: 'pilote', ecranCourant: 0 });

    expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
    expect(lire(fixture, 'etudiant-suivant')).toBeNull();
  });

  it('ferme le flux a la destruction du composant', async () => {
    attendreLaFermetureDuFlux(double, await rattacher());
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

  const REFUS_EXPLIQUES: ReadonlyArray<{
    readonly cas: string;
    readonly motif: MotifRefusRattachement;
    readonly statut: number;
    readonly explication: string;
    readonly limite?: LimiteDeDebit;
  }> = [
    {
      cas: 'distingue une seance complete d un code inconnu',
      motif: 'seance-complete',
      statut: 409,
      explication: 'capacité',
    },
    {
      cas: 'dit a l etudiant que la seance est terminee',
      motif: 'seance-terminee',
      statut: 409,
      explication: 'terminée',
    },
    {
      cas: 'S1 · dit a l etudiant qu un autre poste occupe deja sa place',
      motif: 'place-deja-prise',
      statut: 409,
      explication: 'libérer votre poste',
    },
    {
      cas: 'S2 · dit a l etudiant retire par le formateur qu il doit le solliciter',
      motif: 'participant-evince',
      statut: 403,
      explication: 'formateur',
    },
    {
      cas: 'dit a l etudiant trop presse d attendre avant de rejoindre',
      motif: 'rattachement-impossible',
      statut: 429,
      explication: 'réessayez plus tard',
      limite: { minutes: null },
    },
  ];

  for (const { cas, motif, statut, explication, limite } of REFUS_EXPLIQUES) {
    it(cas, async () => {
      port.rejoindre.and.returnValue(
        throwError(() => new RattachementRefuse(motif, statut, limite)),
      );
      const fixture = await rattacher();

      expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif')).toBe(motif);
      expect(lire(fixture, 'etudiant-echec')?.textContent).toContain(explication);
    });
  }

  it('S1 · memorise le secret de reprise servi a la jonction', async () => {
    servirUnSecretDeReprise();

    await rattacher();

    expect(lireSecretDeReprise(CODE_NORMALISE)).toBe('secret-servi');
  });

  it('S1 · presente au rechargement le secret de reprise memorise pour ce code', async () => {
    servirUnSecretDeReprise();
    await rattacher();

    await rattacher();

    const [, transmise] = port.rejoindre.calls.mostRecent().args;
    expect(transmise.secretDeReprise).toBe('secret-servi');
  });

  it('S1 · ne presente aucun secret a la premiere jonction du poste', async () => {
    await rattacher();

    const [, transmise] = port.rejoindre.calls.mostRecent().args;
    expect(transmise.secretDeReprise).toBeUndefined();
  });

  it('S5 · efface l identite et le secret du poste a la fin de la seance', async () => {
    servirUnSecretDeReprise();
    const fixture = await rattacher();

    diffuserSurLaVue(double, fixture, { etat: 'terminee' });

    expect(readIdentity()).toBeNull();
    expect(lireSecretDeReprise(CODE_NORMALISE)).toBeUndefined();
  });

  describe('S5 · fin du flux selon sa raison', () => {
    async function rattacherAvecSecret(): Promise<Fixture> {
      servirUnSecretDeReprise();
      return rattacher();
    }

    it('garde l identite et le secret du poste evince, pour qu une readmission le retrouve', async () => {
      const fixture = await rattacherAvecSecret();

      double.diffuserFin('evince');
      fixture.detectChanges();

      expect(readIdentity()).not.toBeNull();
      expect(lireSecretDeReprise(CODE_NORMALISE)).toBe('secret-servi');
    });

    it('annonce au poste evince son eviction, pas la fin de la seance', async () => {
      const fixture = await rattacherAvecSecret();

      double.diffuserFin('evince');
      fixture.detectChanges();

      expect(lire(fixture, 'etudiant-evince')).toBeTruthy();
      expect(lire(fixture, 'etudiant-fin')).toBeNull();
      expect(fixture.debugElement.query(By.directive(SlideActivityComponent))).toBeNull();
    });

    for (const raison of ['cloturee', 'revoque'] as const) {
      it(`efface l identite et le secret quand le flux annonce la fin « ${raison} »`, async () => {
        const fixture = await rattacherAvecSecret();

        double.diffuserFin(raison);
        fixture.detectChanges();

        expect(readIdentity()).toBeNull();
        expect(lireSecretDeReprise(CODE_NORMALISE)).toBeUndefined();
      });
    }

    it('annonce au poste dont la place a ete liberee qu il ne la tient plus', async () => {
      const fixture = await rattacherAvecSecret();

      double.diffuserFin('revoque');
      fixture.detectChanges();

      expect(lire(fixture, 'etudiant-poste-libere')).toBeTruthy();
      expect(lire(fixture, 'etudiant-fin')).toBeNull();
      expect(lire(fixture, 'etudiant-evince')).toBeNull();
    });
  });

  it('clot la seance quand le flux annonce sa fin', async () => {
    port.rejoindre.and.returnValue(
      of(buildRattachement({ sessionId: SESSION, jeton: JETON, modeRythme: 'libre' })),
    );
    const fixture = await rattacher();

    diffuserSurLaVue(double, fixture, { etat: 'terminee', modeRythme: 'libre' });

    expect(lire(fixture, 'etudiant-fin')).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(SlideActivityComponent))).toBeNull();
    expect(lire(fixture, 'etudiant-suivant')).toBeNull();
    expect(lire(fixture, 'etudiant-progression')).toBeNull();
  });

  describe('reprise apres rechargement (§ 9.8)', () => {
    it('relit l etat du participant et pose verdict et deja repondu sur l ecran de la question', async () => {
      port.lireMonEtat.and.returnValue(
        of(
          buildEtatParticipant({
            reponses: [
              {
                questionId: 'Q-VA-07',
                valeur: 1400,
                correcte: false,
                score: null,
                details: null,
                libelleConfusion: ETIQUETTE_LIBELLE,
              },
            ],
          }),
        ),
      );
      const fixture = await rattacherALaSeanceEnCours();

      expect(port.lireMonEtat).toHaveBeenCalledWith(SESSION, JETON);
      expect(retoursDe(fixture)).toEqual([
        CONFUSION_POSEE_SUR_LA_BRIQUE,
        { kind: 'deja-repondu', questionId: 'Q-VA-07' },
      ]);
      expect(lire(fixture, 'etudiant-reprise-indisponible')).toBeNull();
    });

    it('rend aux réflexions les réponses libres que l état du participant porte', async () => {
      port.lireMonEtat.and.returnValue(
        of(
          buildEtatParticipant({
            reponsesLibres: [
              { activityId: 'reflexion-1', response: 'Gardée avant le rechargement.' },
            ],
          }),
        ),
      );

      await rattacherALaSeanceEnCours();

      expect(TestBed.inject(EnvoisDeSeanceService).texteGarde(SESSION, 'reflexion-1')).toBe(
        'Gardée avant le rechargement.',
      );
    });

    it('porte au poste etudiant chaque revision de pilotage diffusee par le formateur', async () => {
      const fixture = await rattacherALaSeanceEnCours();
      const pilotageVu = (): unknown =>
        (ecranDe(fixture).componentInstance as SlideActivityComponent).direct()?.pilotage;

      expect(pilotageVu()).toEqual({});

      await diffuserPuisStabiliser(fixture, {
        revision: 4,
        pilotage: { 'ecran-1': { phase: 'revote' } },
      });

      expect(pilotageVu()).toEqual({ phase: 'revote' });

      await diffuserPuisStabiliser(fixture, {
        revision: 5,
        pilotage: { 'ecran-1': { phase: 'revele', revele: true, etayage: 2 } },
      });

      expect(pilotageVu()).toEqual({ phase: 'revele', revele: true, etayage: 2 });
    });

    it('RET-23 · relit le sujet quand le formateur revele une etape de l exemple travaille', async () => {
      const complet = buildWorkedExemple();
      const servi = (etayage: number): CoursContent => ({
        ...sujet,
        ecrans: [
          buildEcran({
            id: 'ecran-1',
            type: 'fp-worked',
            donnees: {
              exemple: {
                ...complet,
                etapes: complet.etapes.map((etape, rang) =>
                  rang < etayage ? etape : { ...etape, raisonnement: '' },
                ),
              },
              etayage,
            },
          }),
          ...sujet.ecrans.slice(1),
        ],
      });
      port.lireSujet.and.returnValues(of(servi(0)), of(servi(1)));
      const fixture = await rattacherALaSeanceEnCours();

      await diffuserPuisStabiliser(fixture, {
        revision: 4,
        pilotage: { 'ecran-1': { etayage: 1 } },
      });
      await diffuserPuisStabiliser(fixture, {
        revision: 5,
        pilotage: { 'ecran-1': { etayage: 1 } },
      });

      expect(port.lireSujet).toHaveBeenCalledTimes(2);
      expect(ecranAffiche(fixture)).toEqual(servi(1).ecrans[0]);
    });

    it('relit une production deja envoyee et la marque deja repondue a la reprise', async () => {
      port.lireMonEtat.and.returnValue(
        of(
          buildEtatParticipant({
            reponses: [
              {
                questionId: 'Q-VA-07',
                valeur: { type: 'feuille', cellules: { E2: '=C2/$C$5' } },
                correcte: false,
                score: 0.5,
                details: [{ cle: 'E2', juste: true, libelleConfusion: null }],
                libelleConfusion: null,
              },
            ],
          }),
        ),
      );
      const fixture = await rattacherALaSeanceEnCours();

      expect(retoursDe(fixture)).toEqual([
        {
          kind: 'verdict-production',
          questionId: 'Q-VA-07',
          correcte: false,
          score: 0.5,
          details: [{ cle: 'E2', juste: true, libelleConfusion: null }],
          neSaitPas: false,
        },
        { kind: 'deja-repondu', questionId: 'Q-VA-07' },
      ]);
    });

    it('dit a l etudiant que ses reponses n ont pas pu etre relues, sans bloquer la seance', async () => {
      port.lireMonEtat.and.returnValue(throwError(() => new Error('reseau coupe')));
      const fixture = await rattacherALaSeanceEnCours();

      expect(lire(fixture, 'etudiant-reprise-indisponible')?.getAttribute('role')).toBe('status');
      expect(ecranAffiche(fixture)).toBe(sujet.ecrans[0]);
    });

    it('confie a l ecran des brouillons propres a la seance et au participant', async () => {
      localStorage.setItem('fp.autre-seance.participant-9.fp-exit.B-SORTIE-09', '"ancien"');
      localStorage.setItem(`fp.${SESSION}.participant-1.fp-exit.B-SORTIE-09`, '"courant"');
      const fixture = await rattacherALaSeanceEnCours();
      const brouillons = (
        ecranDe(fixture).componentInstance as SlideActivityComponent
      ).brouillons();

      expect(brouillons?.lire('fp-exit', 'B-SORTIE-09')).toBe('courant');
      expect(localStorage.getItem('fp.autre-seance.participant-9.fp-exit.B-SORTIE-09')).toBeNull();
    });

    it('purge les brouillons de la seance quand le flux en annonce la fin', async () => {
      localStorage.setItem(`fp.${SESSION}.participant-1.fp-exit.B-SORTIE-09`, '"courant"');
      const fixture = await rattacherALaSeanceEnCours();

      double.diffuserFin('cloturee');
      fixture.detectChanges();

      expect(lire(fixture, 'etudiant-fin')).toBeTruthy();
      expect(localStorage.getItem(`fp.${SESSION}.participant-1.fp-exit.B-SORTIE-09`)).toBeNull();
    });
  });

  describe('QP-02 · aucun libellé collé à sa valeur au poste étudiant des cours servis', () => {
    const VUES_DU_POSTE = ['etudiant-titre', 'etudiant-progression', 'etudiant-plein-ecran'];

    for (const [prefixe, { sujet: servi }] of INSTANTANES_DES_COURS_SERVIS) {
      it(
        `${prefixe} : l entrée, puis chaque écran avant et après révélation, séparent chaque libellé de sa valeur`,
        async () => {
          sujet = servi;
          port.lireSujet.and.returnValue(of(sujet));
          const entree = lireLesLibelles(monter().nativeElement, ['etudiant-entree']);
          const fixture = await rattacherALaSeanceEnCours();

          const lecture = await lireLesLibellesDeChaqueEcran(
            fixture.nativeElement,
            sujet.ecrans,
            async (ecranCourant, pilotage) => {
              diffuserSurLaVue(double, fixture, { ecranCourant, pilotage });
              await stabiliserLaMiseEnPage(fixture);
            },
            VUES_DU_POSTE,
          );

          expect([entree, lecture]).toEqual([
            { colles: [], vuesAbsentes: [] },
            { colles: [], vuesAbsentes: [] },
          ]);
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  });

  describe('QP-BASCULE · un écran du poste étudiant garde sa mise en page, quel que soit l écran précédent', () => {
    const LARGEUR_DE_CADRE_AU_BORD_DU_SEUIL_COMPACT = 707;

    for (const [prefixe, { sujet: servi }] of INSTANTANES_DES_COURS_SERVIS) {
      it(
        `${prefixe} : au bord du seuil compact, chaque écran a la même mise en page à l aller et au retour`,
        async () => {
          sujet = servi;
          port.lireSujet.and.returnValue(of(sujet));
          const fixture = await rattacherALaSeanceEnCours();
          const hote = fixture.nativeElement as HTMLElement;
          hote.style.display = 'block';
          await stabiliserLaMiseEnPage(fixture);
          const cadre = hote.querySelector<HTMLElement>('[data-testid="cours-cadre"]');
          hote.style.inlineSize = `${hote.offsetWidth - (cadre?.clientWidth ?? 0) + LARGEUR_DE_CADRE_AU_BORD_DU_SEUIL_COMPACT}px`;
          const parcourir = async (
            rangs: readonly number[],
          ): Promise<ReadonlyMap<string, boolean>> => {
            const compactes = new Map<string, boolean>();
            for (const rang of rangs) {
              diffuserSurLaVue(double, fixture, { ecranCourant: rang });
              await stabiliserLaMiseEnPage(fixture);
              compactes.set(
                sujet.ecrans[rang].id,
                hote
                  .querySelector('app-cours-presentation')
                  ?.classList.contains('cours-presentation--compacte') === true,
              );
            }
            return compactes;
          };
          const rangs = sujet.ecrans.map((_, rang) => rang);

          const aller = await parcourir(rangs);
          const retour = await parcourir([...rangs].reverse());

          expect([
            hote.querySelector<HTMLElement>('[data-testid="cours-cadre"]')?.clientWidth,
            [...aller.values()].filter(Boolean).length,
          ]).toEqual([LARGEUR_DE_CADRE_AU_BORD_DU_SEUIL_COMPACT, 0]);
          expect(
            sujet.ecrans
              .filter(({ id }) => aller.get(id) !== retour.get(id))
              .map(({ id }) => `${id} ${aller.get(id) === true ? 'compact' : 'réduit'} à l aller`),
          ).toEqual([]);
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  });

  describe('QA-12 · verdict d un vote des cours servis, retenu par le serveur jusqu a la revelation', () => {
    interface VoteServi {
      readonly cours: string;
      readonly sujetServi: CoursContent;
      readonly ecran: EcranContent;
      readonly rang: number;
      readonly principale: string;
      readonly jumele: boolean;
    }

    const VOTES: readonly VoteServi[] = INSTANTANES_DES_COURS_SERVIS.flatMap(
      ([cours, instantane]) =>
        instantane.sujet.ecrans.flatMap((ecran, rang) => {
          const identifiants = (planDeMontage(ecran) ?? []).flatMap(identifiantsDuMontage);
          const principale = identifiants.at(0);
          return ecran.type !== 'fp-vote' || principale === undefined
            ? []
            : [
                {
                  cours,
                  sujetServi: instantane.sujet,
                  ecran,
                  rang,
                  principale,
                  jumele: identifiants.length > 1,
                },
              ];
        }),
    );
    const VOTES_JUMELES = VOTES.filter(({ jumele }) => jumele);
    const VOTES_SIMPLES = VOTES.filter(({ jumele }) => !jumele);
    const RETENU: VerdictReponse = { reussite: null, libelleConfusion: null };

    function etatAvecLeVote(
      questionId: string,
      correcte: boolean | null,
    ): Observable<EtatParticipant> {
      return of(
        buildEtatParticipant({
          reponses: [
            {
              questionId,
              valeur: 'a',
              correcte,
              score: null,
              details: null,
              libelleConfusion: correcte === false ? ETIQUETTE_LIBELLE : null,
            },
          ],
        }),
      );
    }

    function verdictServi(questionId: string): RetourBrique {
      return {
        kind: 'verdict-reponse',
        questionId,
        correcte: false,
        libelleConfusion: ETIQUETTE_LIBELLE,
      };
    }

    async function suivreLeCoursJusquAuVote(vote: VoteServi): Promise<Fixture> {
      sujet = vote.sujetServi;
      port.lireSujet.and.returnValue(of(sujet));
      return suivreLaSeanceJusquA(vote.rang);
    }

    function reponseAuVote(vote: VoteServi) {
      return {
        kind: 'reponse',
        screenId: vote.ecran.id,
        questionId: vote.principale,
        valeur: 'a',
        dureeMs: 400,
      } as const;
    }

    async function voterSur(vote: VoteServi, verdict: VerdictReponse): Promise<Fixture> {
      port.repondre.and.returnValue(of(verdict));
      const fixture = await suivreLeCoursJusquAuVote(vote);
      await emettre(fixture, reponseAuVote(vote));
      return fixture;
    }

    const REVELE = { phase: 'revele', revele: true } as const;

    async function revelerLeVerdictServi(fixture: Fixture, vote: VoteServi): Promise<void> {
      port.lireMonEtat.and.returnValue(etatAvecLeVote(vote.principale, false));
      await piloterSurLEcran(fixture, vote.rang, vote.ecran.id, REVELE);
    }

    function attendreLeVerdictServi(fixture: Fixture, vote: VoteServi, lectures: number): void {
      expect(port.lireMonEtat).toHaveBeenCalledTimes(lectures);
      expect(retoursDe(fixture, vote.ecran.id)).toContain(verdictServi(vote.principale));
    }

    function revelerPendantLaLecture(vote: VoteServi): void {
      double.diffuser({
        etat: 'en_cours',
        ecranCourant: vote.rang,
        pilotage: { [vote.ecran.id]: REVELE },
      });
    }

    async function stabiliserTantQuIlChange(fixture: Fixture): Promise<void> {
      let attendu: Promise<void>;
      do {
        attendu = fixture.componentInstance.quandStabilise();
        await stabiliserLaVue(fixture);
      } while (fixture.componentInstance.quandStabilise() !== attendu);
    }

    it('trouve des votes jumeles et des votes simples dans les cours servis', () => {
      expect(VOTES_JUMELES.length).toBeGreaterThan(0);
      expect(VOTES_SIMPLES.length).toBeGreaterThan(0);
    });

    for (const vote of VOTES_JUMELES) {
      it(`${vote.cours} · ${vote.ecran.id} : ne pose aucun verdict avant la revelation, relit l etat a chaque pilotage de l ecran, puis pose celui que le serveur sert`, async () => {
        const fixture = await voterSur(vote, RETENU);

        expect(genresDe(fixture, vote.ecran.id)).toEqual([]);

        port.lireMonEtat.calls.reset();
        port.lireMonEtat.and.returnValue(etatAvecLeVote(vote.principale, null));
        await piloterSurLEcran(fixture, vote.rang, vote.ecran.id, { phase: 'discussion' });

        expect(port.lireMonEtat).toHaveBeenCalledTimes(1);
        expect(genresDe(fixture, vote.ecran.id)).not.toContain('verdict-reponse');

        await revelerLeVerdictServi(fixture, vote);

        attendreLeVerdictServi(fixture, vote, 2);

        await piloterSurLEcran(fixture, vote.rang, vote.ecran.id, {
          ...REVELE,
          resultatsProjetes: true,
        });

        expect(port.lireMonEtat).toHaveBeenCalledTimes(2);
      });

      it(`${vote.cours} · ${vote.ecran.id} : Q1 · ne relit son corrigé qu à la révélation, jamais à la seule phase de révélation`, async () => {
        const fixture = await suivreLeCoursJusquAuVote(vote);
        port.lireSujet.calls.reset();

        await piloterSurLEcran(fixture, vote.rang, vote.ecran.id, { phase: 'revele' });

        expect(port.lireSujet).not.toHaveBeenCalled();

        await piloterSurLEcran(fixture, vote.rang, vote.ecran.id, REVELE);

        expect(port.lireSujet).toHaveBeenCalledTimes(1);
      });

      it(`${vote.cours} · ${vote.ecran.id} : a la reprise, relit a la revelation le verdict que le serveur retenait`, async () => {
        port.lireMonEtat.and.returnValue(etatAvecLeVote(vote.principale, null));
        const fixture = await suivreLeCoursJusquAuVote(vote);

        expect(genresDe(fixture, vote.ecran.id)).toEqual(['deja-repondu']);

        await revelerLeVerdictServi(fixture, vote);

        expect(retoursDe(fixture, vote.ecran.id)).toEqual([
          { kind: 'deja-repondu', questionId: vote.principale },
          verdictServi(vote.principale),
        ]);
      });

      it(`${vote.cours} · ${vote.ecran.id} : relit l etat quand la revelation arrive pendant que le vote est en vol`, async () => {
        const enVol = new Subject<VerdictReponse>();
        const envoye = new Promise<void>((resoudre) => {
          port.repondre.and.callFake((): Observable<VerdictReponse> => {
            resoudre();
            return enVol;
          });
        });
        const fixture = await suivreLeCoursJusquAuVote(vote);
        port.lireMonEtat.calls.reset();
        port.lireMonEtat.and.returnValue(etatAvecLeVote(vote.principale, false));

        ecranDe(fixture).triggerEventHandler('evenement', reponseAuVote(vote));
        await envoye;
        revelerPendantLaLecture(vote);
        enVol.next(RETENU);
        enVol.complete();
        await stabiliserTantQuIlChange(fixture);

        attendreLeVerdictServi(fixture, vote, 1);
      });

      it(`${vote.cours} · ${vote.ecran.id} : a la reprise, relit l etat quand la revelation arrive pendant sa lecture`, async () => {
        sujet = vote.sujetServi;
        port.lireSujet.and.returnValue(of(sujet));
        port.lireMonEtat.and.callFake((): Observable<EtatParticipant> => {
          port.lireMonEtat.and.returnValue(etatAvecLeVote(vote.principale, false));
          revelerPendantLaLecture(vote);
          return etatAvecLeVote(vote.principale, null);
        });
        const fixture = await rattacher();
        await stabiliserTantQuIlChange(fixture);

        attendreLeVerdictServi(fixture, vote, 2);
      });
    }

    for (const vote of VOTES_SIMPLES) {
      it(`${vote.cours} · ${vote.ecran.id} : pose aussitot le verdict d un vote simple, sans relire l etat a son pilotage`, async () => {
        const fixture = await voterSur(vote, CONFUSION);

        expect(retoursDe(fixture, vote.ecran.id)).toEqual([verdictServi(vote.principale)]);

        port.lireMonEtat.calls.reset();
        await piloterSurLEcran(fixture, vote.rang, vote.ecran.id, { revele: true });

        expect(port.lireMonEtat).not.toHaveBeenCalled();
      });
    }
  });

  describe('evenements des briques runtime (§ 9.7)', () => {
    function commencerPar(premier: EcranContent): void {
      sujet = { ...sujet, ecrans: [premier, ...sujet.ecrans.slice(1)] };
      port.lireSujet.and.returnValue(of(sujet));
    }

    function commencerParLEcranDeRappel(): void {
      commencerPar(
        buildEcran({
          id: 'ecran-rappel',
          type: 'fp-spaced',
          donnees: { rappel: buildSpacedRappel() },
        }),
      );
    }

    async function tenterPuisReveler(defiId: string): Promise<void> {
      commencerPar(
        buildEcran({
          id: 'ecran-defi',
          type: 'fp-challenge',
          donnees: { probleme: { id: defiId, invite: 'Estimez le delai.' } },
        }),
      );
      const fixture = await rattacherALaSeanceEnCours();
      await emettre(fixture, {
        kind: 'defi',
        screenId: 'ecran-defi',
        defiId,
        texte: 'Une dizaine d annees',
        dureeMs: 90000,
      });
      port.lireStrategies.calls.reset();

      await piloterSurLEcran(fixture, 0, 'ecran-defi', { revele: true });
    }

    it('relit les strategies d un defi deja tente des que le formateur le revele', async () => {
      await tenterPuisReveler('D-DEFI-07');

      expect(port.lireStrategies).toHaveBeenCalledOnceWith(SESSION, JETON, 'D-DEFI-07');
    });

    it('ne relit aucune strategie a la revelation d un defi d identifiant vide', async () => {
      await tenterPuisReveler('');

      expect(port.lireStrategies).not.toHaveBeenCalled();
    });

    it('charge une seule fois les questions dues quand l ecran de rappel est le premier', async () => {
      commencerParLEcranDeRappel();
      const fixture = await rattacherALaSeanceEnCours();

      expect(port.lireRappels).toHaveBeenCalledOnceWith(SESSION, JETON);
      expect(retoursDe(fixture, 'ecran-rappel')).toEqual([
        { kind: 'rappels', questions: [buildSpacedQuestionPublique()] },
      ]);
    });

    for (const { cas, refus, message } of [
      {
        cas: 'dit l attente commune quand les rappels sont limites',
        refus: refusLimite(),
        message: ATTENTE_COMMUNE,
      },
      {
        cas: 'garde le repli des rappels quand le serveur est en panne',
        refus: new ReponseRefusee('reseau', 503),
        message:
          'Les questions à revoir ne sont pas arrivées : réessayez dans un instant, rien n’est perdu',
      },
    ]) {
      it(cas, async () => {
        commencerParLEcranDeRappel();
        port.lireRappels.and.returnValue(throwError(() => refus));
        const fixture = await rattacherALaSeanceEnCours();

        expect(retoursDe(fixture, 'ecran-rappel')).toEqual([
          { kind: 'refus', motif: 'reseau', message },
        ]);
      });
    }

    it('envoie une production et pose son verdict detaille sur l ecran', async () => {
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, {
        kind: 'production',
        screenId: 'ecran-1',
        questionId: 'K-TABLEUR-01',
        valeur: { type: 'feuille', cellules: { E2: '=C2*D2' } },
        dureeMs: 3000,
      });

      expect(port.envoyerProduction).toHaveBeenCalledOnceWith(SESSION, JETON, {
        questionId: 'K-TABLEUR-01',
        valeur: { type: 'feuille', cellules: { E2: '=C2*D2' } },
        dureeMs: 3000,
      });
      expect(retoursDe(fixture)).toEqual([
        jasmine.objectContaining({
          kind: 'verdict-production',
          questionId: 'K-TABLEUR-01',
          score: 0.75,
        }),
      ]);
    });

    it('confie la tentative d enigme au serveur et pose le fragment servi', async () => {
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, TENTATIVE_DU_SEUIL);

      expect(port.tenterEnigme).toHaveBeenCalledOnceWith(SESSION, JETON, 'K-EVASION-01', {
        enigmeId: 'seuil',
        reponse: '30000',
        dureeMs: 40000,
      });
      expect(retoursDe(fixture)).toEqual([
        {
          kind: 'tentative',
          parcoursId: 'K-EVASION-01',
          enigmeId: 'seuil',
          correcte: true,
          fragment: '7',
          tentativesRestantes: 9,
          ...buildEtatDesEnigmes(),
        },
      ]);
    });

    it('resynchronise la progression quand le serveur refuse une tentative epuisee', async () => {
      port.tenterEnigme.and.returnValue(
        throwError(() => new ReponseRefusee('tentatives-epuisees', 409)),
      );
      const fixture = await rattacherALaSeanceEnCours();
      port.lireMonEtat.calls.reset();

      await emettre(fixture, {
        kind: 'tentative',
        screenId: 'ecran-1',
        parcoursId: 'K-EVASION-01',
        enigmeId: 'seuil',
        reponse: '1',
        dureeMs: 100,
      });

      expect(genresDe(fixture)).toEqual(['refus']);
      expect(port.lireMonEtat).toHaveBeenCalledTimes(1);
    });

    for (const { prefixe, servi, rang, parcours } of COFFRES_SERVIS) {
      it(
        `N-D01 · ${prefixe} ecran ${rang + 1} : l enigme que le serveur relit resolue le reste apres un aller-retour d ecran`,
        async () => {
          const [premiere] = parcours.enigmes;
          sujet = servi;
          port.lireSujet.and.returnValue(of(sujet));
          port.tenterEnigme.and.returnValues(
            of(
              buildVerdictTentative({
                correcte: false,
                fragment: null,
                tentativesRestantes: parcours.tentativesMax - 1,
                ...etatDuCoffre(parcours, 0, parcours.tentativesMax - 1),
              }),
            ),
            throwError(() => new ReponseRefusee('deja-repondue', 409)),
          );
          const fixture = await rattacherALaSeanceEnCours();
          await diffuserPuisStabiliser(fixture, { ecranCourant: rang });
          port.lireMonEtat.and.returnValue(
            of(
              buildEtatParticipant({
                enigmes: [
                  {
                    parcoursId: parcours.id,
                    resolues: [{ enigmeId: premiere.id, fragment: 'A' }],
                    tentativesRestantes: { [premiere.id]: parcours.tentativesMax - 2 },
                    ...etatDuCoffre(parcours, 1, parcours.tentativesMax - 2),
                  },
                ],
              }),
            ),
          );
          const tentative = {
            kind: 'tentative',
            screenId: servi.ecrans[rang].id,
            parcoursId: parcours.id,
            enigmeId: premiere.id,
            dureeMs: 100,
          } as const;
          await emettre(fixture, { ...tentative, reponse: '1' });
          await emettre(fixture, { ...tentative, reponse: '2' });

          await diffuserPuisStabiliser(fixture, { ecranCourant: rang - 1 });
          await diffuserPuisStabiliser(fixture, { ecranCourant: rang });
          const coffre = await briqueMontee(fixture, 'fp-escape');
          await stabiliserLaVue(fixture);

          expect(
            noeudsOmbre(coffre, 'enigme')
              .slice(0, 2)
              .map((enigme) => enigme.getAttribute('data-etat')),
          ).toEqual(['resolue', 'ouverte']);
        },
        DELAI_DE_MONTAGE_MS,
      );
    }

    const TENTATIVE_A_REPROPOSER =
      'Tentative non envoyée : vérifiez la connexion et proposez-la de nouveau';
    const CELLULE_A_REVALIDER =
      'Calcul non reçu : vérifiez la connexion et validez de nouveau la cellule';

    const ENVOIS_A_REPROPOSER: readonly {
      readonly nature: string;
      readonly echouerUneFois: (refus: ReponseRefusee) => void;
      readonly evenement: EvenementBrique;
      readonly coupure: string;
      readonly genre: RetourBrique['kind'];
    }[] = [
      {
        nature: 'tentative d enigme',
        echouerUneFois: (refus) =>
          port.tenterEnigme.and.returnValues(
            throwError(() => refus),
            of(buildVerdictTentative()),
          ),
        evenement: {
          kind: 'tentative',
          screenId: 'ecran-1',
          parcoursId: 'K-EVASION-01',
          enigmeId: 'seuil',
          reponse: '1',
          dureeMs: 100,
        },
        coupure: TENTATIVE_A_REPROPOSER,
        genre: 'tentative',
      },
      {
        nature: 'tentative de defi',
        echouerUneFois: (refus) =>
          port.envoyerDefi.and.returnValues(
            throwError(() => refus),
            of({ strategies: [buildStrategiePublique()] }),
          ),
        evenement: DEFI_DE_LA_DIZAINE,
        coupure: TENTATIVE_A_REPROPOSER,
        genre: 'strategies',
      },
      {
        nature: 'evaluation de la machine (F-37)',
        echouerUneFois: (refus) =>
          port.evaluerMachine.and.returnValues(
            throwError(() => refus),
            of(buildSortiesMachine()),
          ),
        evenement: EVALUATION_A_VINGT_ANS,
        coupure: 'Calcul non reçu : vérifiez la connexion et réglez de nouveau la machine',
        genre: 'machine-evaluee',
      },
      {
        nature: 'evaluation de la feuille (F-36)',
        echouerUneFois: (refus) =>
          port.evaluerFeuille.and.returnValues(
            throwError(() => refus),
            of(buildFeuilleEvaluee()),
          ),
        evenement: EVALUATION_DE_LA_FEUILLE,
        coupure: CELLULE_A_REVALIDER,
        genre: 'feuille-evaluee',
      },
      {
        nature: 'evaluation du tableau (F-37)',
        echouerUneFois: (refus) =>
          port.evaluerTableau.and.returnValues(
            throwError(() => refus),
            of(buildTableauEvalue()),
          ),
        evenement: EVALUATION_DU_TABLEAU,
        coupure: CELLULE_A_REVALIDER,
        genre: 'tableau-evalue',
      },
    ];

    for (const { nature, echouerUneFois, evenement, coupure, genre } of ENVOIS_A_REPROPOSER) {
      for (const { cas, refus, message } of [
        { cas: 'un 429 par l attente commune', refus: refusLimite(), message: ATTENTE_COMMUNE },
        {
          cas: 'une coupure par la connexion a verifier',
          refus: new ReponseRefusee('reseau', 0),
          message: coupure,
        },
      ]) {
        it(`dit d une ${nature} refusee ${cas}, puis l efface a l envoi suivant`, async () => {
          echouerUneFois(refus);
          const fixture = await rattacherALaSeanceEnCours();

          await emettre(fixture, evenement);

          expect(retoursDe(fixture)).toEqual([{ kind: 'refus', motif: 'reseau', message }]);

          await emettre(fixture, evenement);

          expect(genresDe(fixture)).toEqual([genre]);
        });
      }
    }

    it('F-37 · confie l evaluation de la machine au serveur et ne garde que la derniere sortie servie', async () => {
      const aVingtAns = buildSortiesMachine({ valeurs: { C: 1000, i: 4, n: 20 } });
      const aTrenteAns = buildSortiesMachineATrenteAns();
      port.evaluerMachine.and.returnValues(of(aVingtAns), of(aTrenteAns));
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, EVALUATION_A_VINGT_ANS);
      await emettre(fixture, { ...EVALUATION_A_VINGT_ANS, reglages: { C: 1000, i: 4, n: 30 } });

      expect(port.evaluerMachine.calls.allArgs()).toEqual([
        [SESSION, JETON, 'ecran-1', { C: 1000, i: 4, n: 20 }],
        [SESSION, JETON, 'ecran-1', { C: 1000, i: 4, n: 30 }],
      ]);
      expect(retoursDe(fixture)).toEqual([{ kind: 'machine-evaluee', sorties: aTrenteAns }]);
    });

    it('F-36 · confie l evaluation de la feuille au serveur et pose la feuille servie avec le rang de sa demande', async () => {
      const evaluee = buildFeuilleEvaluee({ saisies: { C3: '=A3*B3', C4: '=A4*B4' } });
      port.evaluerFeuille.and.returnValue(of(evaluee));
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, EVALUATION_DE_LA_FEUILLE);

      expect(port.evaluerFeuille).toHaveBeenCalledOnceWith(SESSION, JETON, 'K-TABLEUR-01', {
        cellules: { C3: '=A3*B3' },
        recopie: { de: 'C3' },
      });
      expect(retoursDe(fixture)).toEqual([
        { kind: 'feuille-evaluee', planId: 'K-TABLEUR-01', rang: 4, evaluee },
      ]);
    });

    it('F-37 · confie l evaluation du tableau au serveur et pose le tableau servi avec le rang de sa demande', async () => {
      const evalue = buildTableauEvalue({ totaux: {} });
      port.evaluerTableau.and.returnValue(of(evalue));
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, EVALUATION_DU_TABLEAU);

      expect(port.evaluerTableau).toHaveBeenCalledOnceWith(
        SESSION,
        JETON,
        'b2-01-a4-indice-toile',
        [{ rang: 0, cle: 'prix', saisie: '21,6' }],
      );
      expect(retoursDe(fixture)).toEqual([
        { kind: 'tableau-evalue', planId: 'b2-01-a4-indice-toile', rang: 4, evalue },
      ]);
    });

    it('envoie la premiere tentative d un defi et pose les strategies servies', async () => {
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, DEFI_DE_LA_DIZAINE);

      expect(port.envoyerDefi).toHaveBeenCalledOnceWith(SESSION, JETON, 'D-DEFI-07', {
        texte: 'Une dizaine d annees',
        dureeMs: 90000,
      });
      expect(genresDe(fixture)).toEqual(['strategies']);
    });

    it('declare un jalon sans duree et envoie un texte libre par le service des reponses libres', async () => {
      const fixture = await rattacherALaSeanceEnCours();

      await emettre(fixture, JALON_PERDU);
      await emettre(fixture, REFLEXION_DU_RAPPEL);

      expect(port.declarerJalon).toHaveBeenCalledOnceWith(SESSION, JETON, 'P-PULSE-01', 'perdu');
      expect(port.enregistrerReponseLibre).toHaveBeenCalledOnceWith(SESSION, JETON, {
        screenId: 'ecran-1',
        activityId: 'Q-RAPPEL-04:rappel',
        response: 'On capitalise',
        dureeMs: 2000,
      });
    });

    const REFLEXIONS_RETENUES = [
      {
        cause: 'la cadence du serveur',
        refus: new ReponseLibreRefusee('reseau', 429, { minutes: 2 }),
        etat: 'attente_limite',
        message:
          'Le serveur limite les envois : la réflexion est gardée sur cet appareil et repartira d’elle-même.',
      },
      {
        cause: 'le reseau',
        refus: new ReponseLibreRefusee('reseau', 0),
        etat: 'attente_reseau',
        message:
          'En attente de réseau : la réflexion est gardée sur cet appareil et partira au retour de la connexion.',
      },
      {
        cause: 'un ecran plus servi',
        refus: new ReponseLibreRefusee('ecran-non-servi', 404),
        etat: 'ecran_non_servi',
        message:
          'Votre réflexion est gardée sur ce poste : elle partira dès que le formateur réaffichera l’écran.',
      },
    ];

    for (const { cause, refus, etat, message } of REFLEXIONS_RETENUES) {
      it(`dit au poste qu une reflexion retenue par ${cause} est gardee, et ce qui la fera repartir`, async () => {
        port.enregistrerReponseLibre.and.returnValue(throwError(() => refus));
        const fixture = await rattacherALaSeanceEnCours();

        await emettre(fixture, REFLEXION_DU_RAPPEL);
        await stabiliserLaVue(fixture);

        const paragraphe = lire(fixture, 'etudiant-reflexion-en-attente');
        expect(paragraphe?.getAttribute('data-etat')).toBe(etat);
        expect(paragraphe?.textContent?.replace(/\s+/g, ' ').trim()).toBe(message);
      });
    }
  });

  describe('reflexion gardee sur un ecran pas encore servi', () => {
    async function garderPuisRattacher(): Promise<Fixture> {
      const { identite } = saveIdentity({
        prenom: 'Lea',
        nom: 'Dubois',
        email: 'lea.dubois@example.com',
      });
      enqueue(
        buildReponseLibreEnFile({
          sessionId: SESSION,
          studentKey: identite.studentKey,
          screenId: 'ecran-3',
          questionId: 'reflexion-3',
          valeur: 'Ecrite en avance.',
          dureeMs: 1500,
        }),
      );
      return rattacher();
    }

    it('la renvoie des que le formateur sert un nouvel ecran, sans attendre un rechargement', async () => {
      const fixture = await garderPuisRattacher();
      expect(port.enregistrerReponseLibre).not.toHaveBeenCalled();

      await diffuserPuisStabiliser(fixture, { etat: 'en_cours', ecranCourant: 2 });

      expect(port.enregistrerReponseLibre).toHaveBeenCalledOnceWith(SESSION, JETON, {
        screenId: 'ecran-3',
        activityId: 'reflexion-3',
        response: 'Ecrite en avance.',
        dureeMs: 1500,
      });
    });
  });

  describe('poste partage entre deux eleves', () => {
    const DE_A = { prenom: 'Sacha', nom: 'Morel', email: 'sacha.morel@example.com' };

    function valeurDuChamp(fixture: Fixture, nom: string): string {
      return (
        lire(fixture, 'etudiant-entree')?.querySelector<HTMLInputElement>(`[name="${nom}"]`)
          ?.value ?? ''
      );
    }

    it('n affiche pas au suivant l identite laissee par le precedent', () => {
      saveIdentity(DE_A);

      const fixture = monter();

      expect(valeurDuChamp(fixture, 'prenom')).toBe('');
      expect(valeurDuChamp(fixture, 'nom')).toBe('');
      expect(valeurDuChamp(fixture, 'email')).toBe('');
    });

    it('ne transmet aucune cle d etudiant : le serveur la derive du courriel', async () => {
      saveIdentity(DE_A);

      const fixture = await rattacher();

      expect(port.rejoindre).toHaveBeenCalledTimes(1);
      const [, transmise] = port.rejoindre.calls.mostRecent().args;
      expect(Object.keys(transmise as object)).not.toContain('studentKey');
      expect((transmise as { email: string }).email).not.toBe(DE_A.email);
      expect(fixture.componentInstance.etat()).toBe('seance');
    });
  });
});
