import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { NEVER, of, throwError } from 'rxjs';
import type { CoursContent, DerouleCours } from '../../../../cours/content/types';
import { clearIdentity } from '../../../../cours/runtime/core/identity';
import { pending } from '../../../../cours/runtime/core/queue';
import type { EtatSession, Sync, SyncOptions } from '../../../../cours/runtime/core/sync';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type {
  FormationsPort,
  IncidentEtudiant,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  ReponseEtudiant,
  SeanceOuverte,
  VerdictReponse,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, RattachementRefuse } from '../../../core/ports/formations.port';
import { CoursEtudiantComponent, CREATEUR_FLUX } from './cours-etudiant.component';

const JETON = 'jeton-participant-7f3a91';
const SESSION = 'sess-42';
const GRAINE_A = 424242;
const GRAINE_B = 987654;
const CODE_SAISI = '12 34';
const CODE_NORMALISE = '1234';
const ETIQUETTE_BRUTE = 'interets-simples';
const VALEUR_ATTENDUE = '1480.24';
const REPONSE_FAUSSE = '1400';

const IDENTITE: readonly (readonly [string, string])[] = [
  ['prenom', 'Lea'],
  ['nom', 'Dubois'],
  ['email', 'lea.dubois@example.com'],
];

const HORS_PARCOURS = 'Methode hors du parcours etudiant';

const ETIQUETTE_LIBELLE = 'Les intérêts ont été additionnés au lieu d’être composés.';

const VERDICT_JUSTE: VerdictReponse = { correcte: true, libelleConfusion: null };

function verdictAvecFuite(): VerdictReponse {
  const recu: Record<string, unknown> = {
    reponseAttendue: VALEUR_ATTENDUE,
    correcte: false,
    misconception: ETIQUETTE_BRUTE,
    libelleConfusion: ETIQUETTE_LIBELLE,
  };
  return recu as unknown as VerdictReponse;
}

interface LotIncidents {
  readonly jeton: string;
  readonly incidents: readonly IncidentEtudiant[];
}

class FormationsDouble implements FormationsPort {
  seed = GRAINE_A;
  refus: RattachementRefuse | null = null;
  verdict: VerdictReponse = VERDICT_JUSTE;
  incidentsSansReponse = false;
  readonly codes: string[] = [];
  readonly reponses: ReponseEtudiant[] = [];
  readonly jetons: string[] = [];
  readonly lots: LotIncidents[] = [];

  rejoindre(code: string): Observable<Rattachement> {
    this.codes.push(code);
    const refus = this.refus;
    if (refus !== null) {
      return throwError(() => refus);
    }
    const rattachement: Rattachement = {
      participantId: 'p-1',
      sessionId: SESSION,
      seed: this.seed,
      ecranCourant: 0,
      modeRythme: 'libre',
      jeton: JETON,
    };
    return of(rattachement);
  }

  repondre(sessionId: string, jeton: string, reponse: ReponseEtudiant): Observable<VerdictReponse> {
    this.jetons.push(jeton);
    this.reponses.push(reponse);
    return of(this.verdict);
  }

  signalerIncidents(
    sessionId: string,
    jeton: string,
    incidents: readonly IncidentEtudiant[],
  ): Observable<void> {
    this.lots.push({ jeton, incidents });
    return this.incidentsSansReponse ? NEVER : of(undefined);
  }

  ouvrirSeance(): Observable<SeanceOuverte> {
    throw new Error(HORS_PARCOURS);
  }

  lireDeroule(): Observable<DerouleCours> {
    throw new Error(HORS_PARCOURS);
  }

  lireSujet(): Observable<CoursContent> {
    throw new Error(HORS_PARCOURS);
  }

  demarrer(): Observable<void> {
    throw new Error(HORS_PARCOURS);
  }

  piloter(): Observable<void> {
    throw new Error(HORS_PARCOURS);
  }

  cloturer(): Observable<void> {
    throw new Error(HORS_PARCOURS);
  }

  lireResultats(): Observable<RapportSeance> {
    throw new Error(HORS_PARCOURS);
  }

  lireQuestionsDues(): Observable<QuestionsDues> {
    throw new Error(HORS_PARCOURS);
  }
}

interface TraceFlux {
  options: SyncOptions | null;
  joints: number;
  fermetures: number;
  readonly ecoutes: ((etat: EtatSession) => void)[];
}

function creerFluxDouble(): { trace: TraceFlux; fabrique: (options: SyncOptions) => Sync } {
  const trace: TraceFlux = { options: null, joints: 0, fermetures: 0, ecoutes: [] };
  const fabrique = (options: SyncOptions): Sync => {
    trace.options = options;
    return {
      join: () => {
        trace.joints += 1;
      },
      ouvrir: () => undefined,
      submit: () => undefined,
      onState: (ecoute) => {
        trace.ecoutes.push(ecoute);
        return () => undefined;
      },
      onResultats: () => () => undefined,
      close: () => {
        trace.fermetures += 1;
      },
    };
  };
  return { trace, fabrique };
}

function etatTermine(): EtatSession {
  return {
    etat: 'terminee',
    modeRythme: 'libre',
    ecranCourant: 0,
    intervalleLibre: null,
    participants: 3,
  };
}

describe('CoursEtudiantComponent', () => {
  let port: FormationsDouble;
  let flux: { trace: TraceFlux; fabrique: (options: SyncOptions) => Sync };
  const montees: ComponentFixture<CoursEtudiantComponent>[] = [];

  function lire(fixture: ComponentFixture<CoursEtudiantComponent>, marque: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(`[data-testid='${marque}']`);
  }

  function renseigner(
    formulaire: HTMLFormElement | null,
    valeurs: readonly (readonly [string, string])[],
  ): void {
    for (const [nom, valeur] of valeurs) {
      const champ = formulaire?.querySelector<HTMLInputElement>(`[name="${nom}"]`);
      if (champ) {
        champ.value = valeur;
      }
    }
    formulaire?.dispatchEvent(new Event('submit'));
  }

  async function rattacher(code = CODE_SAISI): Promise<ComponentFixture<CoursEtudiantComponent>> {
    const fixture = TestBed.createComponent(CoursEtudiantComponent);
    montees.push(fixture);
    fixture.detectChanges();
    renseigner(lire(fixture, 'etudiant-entree') as HTMLFormElement | null, [
      ['code', code],
      ...IDENTITE,
    ]);
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
    return fixture;
  }

  async function repondre(
    fixture: ComponentFixture<CoursEtudiantComponent>,
    valeur: string,
  ): Promise<void> {
    renseigner(lire(fixture, 'etudiant-reponse') as HTMLFormElement | null, [['valeur', valeur]]);
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
  }

  async function laisserPasserLeReseau(
    fixture: ComponentFixture<CoursEtudiantComponent>,
  ): Promise<void> {
    window.dispatchEvent(new Event('online'));
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    clearIdentity();
    port = new FormationsDouble();
    flux = creerFluxDouble();
    await setupTestBed({
      imports: [CoursEtudiantComponent],
      providers: [
        { provide: FORMATIONS_PORT, useValue: port },
        { provide: CREATEUR_FLUX, useValue: flux.fabrique },
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
    expect(port.codes).toEqual([]);
    expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif')).toBe('code-invalide');
    expect(fixture.componentInstance.etat()).toBe('code');
  });

  it('retire les espaces du code avant de le transmettre au serveur', async () => {
    const fixture = await rattacher();
    expect(port.codes).toEqual([CODE_NORMALISE]);
    expect(fixture.componentInstance.etat()).toBe('seance');
  });

  it('ordonne les questions avec la graine recue du serveur', async () => {
    port.seed = GRAINE_A;
    const premiere = await rattacher();
    const ordreA = premiere.componentInstance.ordreDesQuestions().map((question) => question.id);
    premiere.destroy();
    port.seed = GRAINE_B;
    const seconde = await rattacher();
    const ordreB = seconde.componentInstance.ordreDesQuestions().map((question) => question.id);

    expect(premiere.componentInstance.graine()).toBe(GRAINE_A);
    expect(seconde.componentInstance.graine()).toBe(GRAINE_B);
    expect(ordreA.length).toBeGreaterThan(1);
    expect(ordreB).not.toEqual(ordreA);
  });

  it('porte le jeton au flux sans jamais l ecrire dans le stockage local', async () => {
    await rattacher();
    const ecrit = Object.keys(localStorage)
      .map((cle) => localStorage.getItem(cle) ?? '')
      .join('|');

    expect(flux.trace.options?.jeton).toBe(JETON);
    expect(flux.trace.joints).toBe(1);
    expect(ecrit.length).toBeGreaterThan(0);
    expect(ecrit).not.toContain(JETON);
  });

  it('envoie au retour du reseau la reponse mise en file hors ligne, une seule fois', async () => {
    const fixture = await rattacher();
    window.dispatchEvent(new Event('offline'));
    await repondre(fixture, REPONSE_FAUSSE);

    expect(port.reponses).toEqual([]);
    expect(pending().length).toBe(1);
    expect(lire(fixture, 'etudiant-hors-ligne')).toBeTruthy();

    await laisserPasserLeReseau(fixture);
    expect(port.reponses.length).toBe(1);
    expect(port.reponses[0].valeur).toBe(REPONSE_FAUSSE);
    expect(pending().length).toBe(0);

    await laisserPasserLeReseau(fixture);
    expect(port.reponses.length).toBe(1);
  });

  it('n affiche que le resultat et l etiquette de confusion', async () => {
    port.verdict = verdictAvecFuite();
    const fixture = await rattacher();
    await repondre(fixture, REPONSE_FAUSSE);
    const rendu = (fixture.nativeElement as HTMLElement).innerHTML;

    expect(lire(fixture, 'etudiant-verdict')?.getAttribute('data-reussite')).toBe('false');
    expect(lire(fixture, 'etudiant-confusion')?.textContent).toContain('composés');
    expect(rendu).not.toContain(VALEUR_ATTENDUE);
    expect(rendu).not.toContain(ETIQUETTE_BRUTE);
  });

  it('remonte les incidents de verrou groupes sans bloquer la reponse en cours', async () => {
    port.incidentsSansReponse = true;
    const fixture = await rattacher();
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('blur'));
    await repondre(fixture, REPONSE_FAUSSE);

    expect(port.lots.length).toBe(1);
    expect(port.lots[0].incidents.length).toBe(2);
    expect(port.lots[0].jeton).toBe(JETON);
    expect(port.reponses.length).toBe(1);
    expect(lire(fixture, 'etudiant-verdict')).toBeTruthy();
  });

  it('ferme le flux a la destruction du composant', async () => {
    const fixture = await rattacher();
    expect(flux.trace.fermetures).toBe(0);
    fixture.destroy();
    expect(flux.trace.fermetures).toBe(1);
  });

  it('dit a l etudiant que le code de seance est inconnu', async () => {
    port.refus = new RattachementRefuse('code-inconnu', 404);
    const fixture = await rattacher();
    const alerte = lire(fixture, 'etudiant-echec');

    expect(alerte?.getAttribute('data-motif')).toBe('code-inconnu');
    expect(alerte?.textContent).toContain("n'existe pas");
    expect(fixture.componentInstance.etat()).toBe('code');
  });

  it('distingue une inscription deja enregistree d un code inconnu', async () => {
    port.refus = new RattachementRefuse('deja-inscrit', 409);
    const fixture = await rattacher();

    expect(lire(fixture, 'etudiant-echec')?.getAttribute('data-motif')).toBe('deja-inscrit');
    expect(lire(fixture, 'etudiant-echec')?.textContent).toContain('déjà enregistrée');
  });

  it('clot la seance quand le flux annonce sa fin', async () => {
    const fixture = await rattacher();
    for (const ecoute of flux.trace.ecoutes) {
      ecoute(etatTermine());
    }
    fixture.detectChanges();

    expect(lire(fixture, 'etudiant-fin')).toBeTruthy();
    expect(lire(fixture, 'etudiant-reponse')).toBeNull();
  });
});
