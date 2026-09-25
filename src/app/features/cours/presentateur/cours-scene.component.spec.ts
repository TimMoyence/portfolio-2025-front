import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import type {
  ConfusionComptee,
  DerouleCours,
  ResultatsSeance,
} from '../../../../cours/content/types';
import type { EtatSession } from '../../../../cours/runtime/core/sync';
import {
  attendreAucunEnTeteSansSession,
  buildEcranDeMission,
  buildEcranDeVoteCorrige,
  buildReponsesALaMission,
  demonterLeBancDuPupitre,
  JETON_FORMATEUR,
  monterLeBancSurLeDeroule,
  monterSurLeBanc,
} from '../../../../testing/banc-du-pupitre';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../../testing/factories/formations.factory';
import type { FpPlot } from '../../../../cours/runtime/blocks/FpPlot';
import { attendreQue, briqueMontee } from '../../../../testing/briques-montees';
import { buildPlotEnBarres, buildVoteQuestion } from '../../../../testing/factories/cours.factory';
import { buildVisualSlide } from '../../../../testing/factories/visual-slide.factory';
import type { FluxDouble } from '../../../../testing/factories/sync.factory';
import { cibleMarque } from '../../../../testing/marqueurs-dom';
import {
  attendreLaFermetureDuFlux,
  diffuserSurLaVue,
  ecransMontes,
  idsDesEcransMontes,
  stabiliserLaVue,
} from '../../../../testing/vue-de-seance';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { CoursPresentationComponent } from '../../../shared/slides/session/cours-presentation.component';
import type { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { ecransDuPupitreB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { CoursSceneComponent } from './cours-scene.component';
import { sourceCorrigeePar } from './sources-de-correction';

type Fixture = ComponentFixture<CoursSceneComponent>;

const SESSION = 'seance-1';
const JETON = JETON_FORMATEUR;

const CONFUSIONS_DE_LA_CLASSE: readonly ConfusionComptee[] = [
  { id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés', nombre: 1 },
];

function derouleDeSeance(): DerouleCours {
  return buildDerouleCours({
    ecrans: [
      buildEcranDeVoteCorrige(CONFUSIONS_DE_LA_CLASSE, {
        notes: 'Rappeler la formule de capitalisation avant de lancer le vote.',
      }),
      buildEcranDeroule({ id: 'ecran-rappel', notes: '', seuil: null, corriges: [] }),
    ],
  });
}

describe('CoursSceneComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let double: FluxDouble;
  const deroule = derouleDeSeance();

  function cible(fixture: Fixture, marque: string): HTMLElement {
    return cibleMarque(fixture, marque, 'la scene');
  }

  function apercu(fixture: Fixture): SlideActivityComponent | null {
    return ecransMontes(fixture).at(0) ?? null;
  }

  function monter(): Fixture {
    const fixture = monterSurLeBanc(CoursSceneComponent);
    fixture.componentRef.setInput('sessionId', SESSION);
    fixture.detectChanges();
    return fixture;
  }

  async function monterEtStabiliser(): Promise<Fixture> {
    const fixture = monter();
    await stabiliserLaVue(fixture);
    return fixture;
  }

  function monterSur(ecrans: DerouleCours['ecrans']): Promise<Fixture> {
    port.lireDeroule.and.returnValue(of(buildDerouleCours({ ecrans })));
    return monterEtStabiliser();
  }

  beforeEach(async () => {
    ({ port, double } = await monterLeBancSurLeDeroule(CoursSceneComponent, deroule));
  });

  afterEach(demonterLeBancDuPupitre);

  it('E10 · projette en miniature, sans corrigé, l écran auquel renvoie l écran courant', async () => {
    const [vote, rappel] = derouleDeSeance().ecrans;
    const cadrageDuRenvoi = { part: 70, extrait: { champs: ['situation'] } };
    const fixture = await monterSur([vote, { ...rappel, renvoi: vote.id, cadrageDuRenvoi }]);

    diffuserSurLaVue(double, fixture, { ecranCourant: 1 });
    const ecrans = ecransMontes(fixture).map((ecran) => ecran.slide());
    const presentation = fixture.debugElement.query(By.directive(CoursPresentationComponent))
      .componentInstance as CoursPresentationComponent;

    expect(ecrans.map(({ id }) => id)).toEqual([rappel.id, vote.id]);
    expect(Object.hasOwn(ecrans[1], 'corriges')).toBeFalse();
    expect(presentation.slide()?.cadrageDuRenvoi).toEqual(cadrageDuRenvoi);
  });

  it('R4 · ne projette sur un écran qui renvoie à la mission aucune réponse donnée à la mission', async () => {
    const mission = buildEcranDeMission();
    const question = buildEcranDeroule({
      id: 'ecran-question',
      type: 'fp-story',
      corriges: [],
      renvoi: mission.id,
    });
    port.lireReponsesLibres.and.returnValue(
      of(buildReponsesALaMission('Réponse donnée à la mission.')),
    );
    const fixture = await monterSur([mission, question]);

    diffuserSurLaVue(double, fixture, {
      ecranCourant: 1,
      pilotage: { [question.id]: { resultatsProjetes: true } },
    });

    expect(port.lireReponsesLibres).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Réponse donnée à la mission.',
    );
  });

  describe('miniature d un écran de correction du B2-01', () => {
    const ecrans = ecransDuPupitreB2_01();
    const renvoyant = ecrans.findIndex(({ renvoi }) => renvoi === 'B2-01-A1-05-CORRECTION');
    const source = sourceCorrigeePar(
      ecrans.find(({ id }) => id === 'B2-01-A1-05-CORRECTION') ?? ecrans[0],
    );

    async function miniaturesDuRenvoyant(
      pilotage: EtatSession['pilotage'],
    ): Promise<readonly string[]> {
      const fixture = await monterSur(ecrans);
      diffuserSurLaVue(double, fixture, { etat: 'en_cours', ecranCourant: renvoyant, pilotage });
      return idsDesEcransMontes(fixture);
    }

    it('SEC-4 · ne projette pas la correction tant que sa source n est pas révélée', async () => {
      const miniatures = await miniaturesDuRenvoyant({});

      expect(renvoyant).toBeGreaterThan(-1);
      expect(source).not.toBeNull();
      expect(miniatures).toEqual([ecrans[renvoyant].id]);
    });

    it('SEC-4 · projette la correction une fois sa source révélée', async () => {
      const miniatures = await miniaturesDuRenvoyant({ [source ?? '']: { revele: true } });

      expect(miniatures).toEqual([ecrans[renvoyant].id, 'B2-01-A1-05-CORRECTION']);
    });
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
    expect(apercu(fixture)?.apercu()).toBeFalse();
    expect(apercu(fixture)?.role()).toBe('presentateur');

    diffuserSurLaVue(double, fixture, { ecranCourant: 1 });

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

    attendreAucunEnTeteSansSession(double);
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

  it('remplace la projection precedente au changement de type d ecran', async () => {
    const activite = buildEcranDeroule({
      id: 'ecran-activite',
      type: 'fp-vote',
      donnees: { question: buildVoteQuestion() },
    });
    const visuel = buildEcranDeroule(buildVisualSlide({ id: 'ecran-visuel' }));
    const fixture = await monterSur([activite, visuel]);
    expect(fixture.nativeElement.querySelectorAll('section.slide').length).toBe(1);
    expect(fixture.nativeElement.querySelector('section.slide')?.id).toBe('ecran-activite');

    diffuserSurLaVue(double, fixture, { ecranCourant: 1 });

    expect(fixture.nativeElement.querySelectorAll('section.slide').length).toBe(1);
    expect(fixture.nativeElement.querySelector('section.slide')?.id).toBe('ecran-visuel');
    expect(fixture.nativeElement.querySelector('fp-vote')).toBeNull();
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

    diffuserSurLaVue(double, fixture, { etat: 'terminee', ecranCourant: 0 });

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

  it('RET-22 · occupe toute la surface de projection sans débordement, la toile tenant dans l écran', async () => {
    const fixture = await monterEtStabiliser();
    const hote = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(hote);

    expect(style.overflowX).toBe('hidden');
    expect(style.overflowY).toBe('hidden');
    expect(style.boxSizing).toBe('border-box');
    expect(hote.getBoundingClientRect().height).toBe(window.innerHeight);
    expect(hote.getBoundingClientRect().width).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  });

  it('RET-32 · confie a la projection les bonnes reponses d un questionnaire', async () => {
    port.lireDeroule.and.returnValue(
      of(
        buildDerouleCours({
          ecrans: [
            buildEcranDeroule({
              id: 'ecran-atelier',
              type: 'questionnaire',
              donnees: {
                questions: [{ brique: 'fp-vote', donnees: { question: buildVoteQuestion() } }],
              },
              corriges: [{ questionId: 'Q-CAP-03', bonneReponse: 'b', confusions: [] }],
              corrigeEcran: null,
            }),
          ],
        }),
      ),
    );
    const fixture = await monterEtStabiliser();

    expect(apercu(fixture)?.donneesFormateur()).toEqual({
      type: 'reponses',
      reponses: { 'Q-CAP-03': jasmine.objectContaining({ cible: 'b' }) },
    });
  });

  it('ferme le flux a la destruction de la scene', async () => {
    attendreLaFermetureDuFlux(double, await monterEtStabiliser());
  });

  it('R1 · projette dans la toile la réponse attendue une fois la correction révélée, pas avant', async () => {
    const fixture = await monterEtStabiliser();
    const bandeau = (): string | undefined =>
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="cours-toile"] [data-testid="cours-correction"]')
        ?.textContent?.replace(/\s+/g, ' ');

    diffuserSurLaVue(double, fixture, { ecranCourant: 0 });

    expect(bandeau()).toBeUndefined();

    diffuserSurLaVue(double, fixture, {
      ecranCourant: 0,
      pilotage: { 'ecran-vote': { revele: true } },
    });

    expect(bandeau()).toContain('1 480,24');
  });

  it('ne projette les comptes d un jalon qu a partir de cinq reponses', async () => {
    const annexe = { type: 'revelation' as const, titre: 'Méthode', lignes: ['Capitaliser'] };
    const fixture = await monterSur([
      buildEcranDeroule({
        id: 'ecran-jalon',
        type: 'fp-pulse',
        donnees: { sondage: { id: 'P-PULSE-01' } },
        corrigeEcran: annexe,
      }),
    ]);
    diffuserSurLaVue(double, fixture, {
      ecranCourant: 0,
      pilotage: { 'ecran-jalon': { revele: true } },
    });

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

  it('T10 · projette les résultats de l écran quand le pupitre les demande, puis les retire', async () => {
    const fixture = await monterEtStabiliser();
    const projetes = (): HTMLElement | null =>
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="cours-toile"] [data-testid="resultats-projetes"]',
      );
    diffuserSurLaVue(double, fixture, { ecranCourant: 0 });
    double.diffuserResultats(
      buildResultatsSeance({
        questions: [buildResultatQuestion({ ecranId: 'ecran-vote', total: 7 })],
      }),
    );
    fixture.detectChanges();

    expect(projetes()).toBeNull();

    diffuserSurLaVue(double, fixture, {
      ecranCourant: 0,
      pilotage: { 'ecran-vote': { resultatsProjetes: true } },
    });

    expect(
      projetes()?.querySelector('[data-testid="resultats-projetes-total"]')?.textContent?.trim(),
    ).toBe('7');

    diffuserSurLaVue(double, fixture, {
      ecranCourant: 0,
      pilotage: { 'ecran-vote': { resultatsProjetes: false } },
    });

    expect(projetes()).toBeNull();
  });

  it('T11 · règle la brique projetée sur les réglages manipulés au pupitre', async () => {
    const fixture = await monterSur([
      buildEcranDeroule({
        id: 'ecran-trace',
        type: 'fp-plot',
        donnees: { definition: buildPlotEnBarres() },
        corriges: [],
      }),
    ]);
    diffuserSurLaVue(double, fixture, { ecranCourant: 0 });
    const trace = (await briqueMontee(fixture, 'fp-plot')) as FpPlot;

    expect(trace.valeurs).toEqual({ origine: 284000 });

    diffuserSurLaVue(double, fixture, {
      ecranCourant: 0,
      pilotage: { 'ecran-trace': { reglages: { origine: 0 } } },
    });
    await attendreQue(fixture, () => trace.valeurs['origine'] === 0, 'le réglage piloté');

    expect(trace.valeurs).toEqual({ origine: 0 });
  });
});
