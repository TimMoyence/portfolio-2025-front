import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { EcranDeroule } from '../../../../cours/content/types';
import type { CardsortPlanPublic } from '../../../../cours/runtime/blocks/FpCardsort';
import type { EscapeParcoursPublic } from '../../../../cours/runtime/blocks/FpEscape';
import type { TableBuildPlanPublic } from '../../../../cours/runtime/blocks/FpTableBuild';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import {
  INSTANTANES_DES_COURS_SERVIS,
  VOTES_JUMELES_DU_PUPITRE,
} from '../../../../testing/fixtures/instantanes-des-cours';
import { identifiantsDuMontage, planDeMontage } from '../../../shared/slides/session/lecture-ecran';
import { buildEcranDeVoteJumele } from '../../../../testing/banc-du-pupitre';
import { lignesDe } from '../../../../testing/lignes-de-texte';
import {
  buildCardsortPlan,
  buildEscapeParcours,
  buildExitBillet,
  buildVoteQuestion,
  buildWorkedExemple,
} from '../../../../testing/factories/cours.factory';
import {
  buildEcranDeroule,
  buildProgressionEnigme,
  buildResultatQuestion,
  buildResultatsSeance,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { cibleMarque, lireMarque as lire } from '../../../../testing/marqueurs-dom';
import { poserLesEntrees } from '../../../../testing/montage-page';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import type { CommandeDEcran, ResultatsDuPupitre } from './cours-panneau-activite.component';
import { CoursPanneauActiviteComponent } from './cours-panneau-activite.component';

type Fixture = ComponentFixture<CoursPanneauActiviteComponent>;

function cellulesDe(ligne: Element): (string | undefined)[] {
  return [...ligne.children].map((cellule) => cellule.textContent?.trim());
}

describe('CoursPanneauActiviteComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;

  function monter(
    ecran: EcranDeroule,
    entrees: Readonly<Record<string, unknown>> = {},
  ): { fixture: Fixture; commandes: CommandeDEcran[] } {
    const fixture = TestBed.createComponent(CoursPanneauActiviteComponent);
    const commandes: CommandeDEcran[] = [];
    fixture.componentInstance.commande.subscribe((commande) => commandes.push(commande));
    poserLesEntrees(fixture, { ecran, ...entrees });
    return { fixture, commandes };
  }

  function texte(fixture: Fixture, marque: string): string {
    return (
      cibleMarque(fixture, marque, 'le panneau d activite')
        .textContent?.replace(/\s+/g, ' ')
        .trim() ?? ''
    );
  }

  function cliquer(fixture: Fixture, marque: string): void {
    (cibleMarque(fixture, marque, 'le panneau d activite') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function resultats(overrides: Partial<ResultatsDuPupitre> = {}): ResultatsDuPupitre {
    return { ...buildResultatsSeance(), ...overrides };
  }

  beforeEach(async () => {
    port = createFormationsPortStub();
    await setupTestBed({
      imports: [CoursPanneauActiviteComponent],
      providers: [{ provide: FORMATIONS_PORT, useValue: port }],
    }).compileComponents();
  });

  describe('instruction par les pairs', () => {
    const vote = buildEcranDeVoteJumele();

    it('annonce la phase pilotee et propose la suivante', () => {
      const { fixture, commandes } = monter(vote, { pilotage: { phase: 'discussion' } });

      expect(texte(fixture, 'activite-phase-courante')).toBe('Discussion entre voisins');
      cliquer(fixture, 'activite-phase-suivante');

      expect(commandes).toEqual([{ screenId: 'ecran-vote', phase: 'revote' }]);
    });

    it('ne propose plus de phase apres la revelation et bloque pendant une commande', () => {
      expect(
        lire(monter(vote, { pilotage: { phase: 'revele' } }).fixture, 'activite-phase-suivante'),
      ).toBeNull();
      const { fixture } = monter(vote, { pilotage: { phase: 'vote' }, pilotageBloque: true });
      expect(
        (cibleMarque(fixture, 'activite-phase-suivante', 'le panneau') as HTMLButtonElement)
          .disabled,
      ).toBeTrue();
    });

    it('ne pilote pas de phase pour un vote sans cas jumeau', () => {
      const simple = buildEcranDeroule({
        type: 'fp-vote',
        donnees: { question: buildVoteQuestion() },
      });
      expect(lire(monter(simple).fixture, 'activite-phase')).toBeNull();
    });

    it('QA-01 · trouve des votes jumeles dans les cours servis', () => {
      expect(VOTES_JUMELES_DU_PUPITRE.length).toBeGreaterThan(0);
    });

    for (const jumele of VOTES_JUMELES_DU_PUPITRE) {
      it(`Q1 · ${jumele.id} : passer à la révélation envoie le même ordre que « Révéler la correction »`, () => {
        const { fixture, commandes } = monter(jumele, { pilotage: { phase: 'revote' } });

        expect(texte(fixture, 'activite-phase-suivante')).toContain('Révélation');
        cliquer(fixture, 'activite-phase-suivante');

        expect(commandes).toEqual([{ screenId: jumele.id, revele: true }]);
      });

      it(`QA-01 · ${jumele.id} : lit la phase servie et n en suppose aucune tant qu aucune n est servie`, () => {
        const sansPhase = monter(jumele, { pilotage: {} }).fixture;

        expect(lire(sansPhase, 'activite-phase')).toBeNull();
        expect(lire(sansPhase, 'activite-correction')).toBeNull();

        const servie = monter(jumele, { pilotage: { phase: 'vote' } }).fixture;

        expect(texte(servie, 'activite-phase-courante')).toBe('Vote individuel');
        expect(texte(servie, 'activite-phase-suivante')).toContain('Discussion entre voisins');
        expect(lire(servie, 'activite-correction')).toBeNull();
      });
    }
  });

  function revelerUneSeuleFois(
    { fixture, commandes }: ReturnType<typeof monter>,
    marque: string,
    screenId: string,
  ): void {
    cliquer(fixture, marque);
    expect(commandes).toEqual([{ screenId, revele: true }]);

    fixture.componentRef.setInput('pilotage', { revele: true });
    fixture.detectChanges();
    expect((cibleMarque(fixture, marque, 'le panneau') as HTMLButtonElement).disabled).toBeTrue();
  }

  it('revele les pistes fausses d un defi une seule fois', () => {
    const defi = buildEcranDeroule({ id: 'ecran-defi', type: 'fp-challenge', donnees: {} });

    revelerUneSeuleFois(monter(defi), 'activite-reveler', 'ecran-defi');
  });

  it('R1 · révèle à l écran la correction d un tri de cartes, une seule fois', () => {
    const tri = buildEcranDeroule({
      id: 'ecran-tri',
      type: 'fp-cardsort',
      donnees: { plan: buildCardsortPlan() },
      corriges: [],
    });

    revelerUneSeuleFois(monter(tri), 'activite-reveler-correction', 'ecran-tri');
  });

  it('T9 · révèle un écran à réponses libres pour déverrouiller sa correction', () => {
    const exercice = buildEcranDeroule({
      id: 'ecran-exercice',
      type: 'fp-pro',
      corriges: [],
      donnees: { cas: { questionsLibres: [{ id: 'exercice:mesure', question: 'Que mesure ?' }] } },
    });
    const { fixture, commandes } = monter(exercice, { corrigeAilleurs: true });

    cliquer(fixture, 'activite-reveler-correction');

    expect(commandes).toEqual([{ screenId: 'ecran-exercice', revele: true }]);
  });

  it('G07 · ne propose aucune révélation sur un écran à réponses libres que rien ne corrige', () => {
    const mission = buildEcranDeroule({
      type: 'fp-pro',
      corriges: [],
      donnees: { cas: { questionsLibres: [{ id: 'mission:mesure', question: 'Que mesure ?' }] } },
    });

    expect(lire(monter(mission).fixture, 'activite-reveler-correction')).toBeNull();
  });

  it('T9 · révèle le raisonnement attendu d une réflexion sans écran de correction', () => {
    const reflexion = buildEcranDeroule({
      type: 'fp-story',
      corriges: [],
      donnees: {},
      corrigeEcran: { type: 'reflexion', attendu: 'Un indicateur rapporté à une base.', suite: '' },
    });

    expect(lire(monter(reflexion).fixture, 'activite-reveler-correction')).not.toBeNull();
  });

  it('F35 · laisse la révélation d un écran corrigé à la lecture de la classe, sans doublon', () => {
    expect(lire(monter(buildEcranDeroule()).fixture, 'activite-reveler-correction')).toBeNull();
  });

  it('R1 · ne propose aucune révélation sur un écran sans corrigé', () => {
    const recit = buildEcranDeroule({ type: 'fp-story', donnees: {}, corriges: [] });

    expect(lire(monter(recit).fixture, 'activite-reveler-correction')).toBeNull();
  });

  describe('F27 · corrige chaque table servie une colonne non donnee par clic', () => {
    const TABLES = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
      ecransDuPupitreDe(instantane).filter((ecran) => ecran.type === 'fp-table-build'),
    );

    it('trouve les tables des cours servis', () => {
      expect(TABLES.length).toBeGreaterThan(0);
    });

    for (const tableau of TABLES) {
      it(`${tableau.id} : nomme chaque colonne a corriger, dans l ordre du plan`, () => {
        const intitules = (tableau.donnees?.['plan'] as TableBuildPlanPublic).colonnes
          .filter(({ role }) => role !== 'donnee')
          .map(({ intitule }) => intitule);
        const { fixture, commandes } = monter(tableau);
        const libelles: string[] = [];

        expect(lire(fixture, 'activite-reveler-correction')).toBeNull();
        intitules.forEach((_, niveau) => {
          libelles.push(texte(fixture, 'activite-tableau-colonne-suivante'));
          cliquer(fixture, 'activite-tableau-colonne-suivante');
          fixture.componentRef.setInput('pilotage', { revele: true, etayage: niveau + 1 });
          fixture.detectChanges();
        });

        expect(libelles).toEqual(
          intitules.map((intitule) => `Corriger : ${intitule}`.replace(/\s+/g, ' ')),
        );
        expect(commandes).toEqual(
          intitules.map((_, niveau) =>
            niveau === 0
              ? { screenId: tableau.id, revele: true, etayage: 1 }
              : { screenId: tableau.id, etayage: niveau + 1 },
          ),
        );
        expect(lire(fixture, 'activite-tableau-colonne-suivante')).toBeNull();
        expect(texte(fixture, 'activite-tableau-corrige')).toBe(
          'Toutes les colonnes sont corrigées.',
        );
        expect(texte(fixture, 'activite-correction-tableau')).not.toMatch(
          /coefficients|prix et les indices/,
        );
      });
    }
  });

  it('F02 · affiche tout de suite les options d un rappel, une seule fois', () => {
    const rappel = buildEcranDeroule({ id: 'ecran-rappel', type: 'fp-recall', donnees: {} });
    const { fixture, commandes } = monter(rappel);

    expect(texte(fixture, 'activite-afficher-options')).toBe('Afficher les options maintenant');
    cliquer(fixture, 'activite-afficher-options');
    expect(commandes).toEqual([{ screenId: 'ecran-rappel', optionsAffichees: true }]);

    fixture.componentRef.setInput('pilotage', { optionsAffichees: true });
    fixture.detectChanges();
    expect(
      (cibleMarque(fixture, 'activite-afficher-options', 'le panneau') as HTMLButtonElement)
        .disabled,
    ).toBeTrue();
    expect(lire(monter(buildEcranDeroule()).fixture, 'activite-afficher-options')).toBeNull();
  });

  it('ne propose pas d afficher les options d un rappel qui les montre d emblee', () => {
    const rappel = buildEcranDeroule({
      id: 'ecran-rappel',
      type: 'fp-recall',
      donnees: { delaiMs: 0 },
    });

    expect(lire(monter(rappel).fixture, 'activite-options-rappel')).toBeNull();
  });

  it('S-01 · corrige étape par étape sur son propre écran l exercice travaillé que rédigent les étudiants', () => {
    const exemple = buildWorkedExemple();
    const exercice = buildEcranDeroule({
      id: 'ecran-exercice',
      type: 'fp-worked',
      donnees: { exemple, etayage: 0 },
    });
    const { fixture, commandes } = monter(exercice);

    expect(texte(fixture, 'activite-etayage-niveau')).toBe(`0 / ${exemple.etapes.length}`);
    expect(lire(fixture, 'activite-reveler-correction')).toBeNull();
    cliquer(fixture, 'activite-etayage-plus');

    expect(commandes).toEqual([{ screenId: 'ecran-exercice', etayage: 1 }]);
  });

  const questionnaireDeLAtelier = (
    ecran: Pick<EcranDeroule, 'questions'> & Partial<EcranDeroule>,
  ): EcranDeroule =>
    buildEcranDeroule({
      id: 'ecran-atelier',
      type: 'questionnaire',
      donnees: {},
      corriges: [],
      ...ecran,
    });

  it('S-02 · corrige le questionnaire question par question, ou tout d un coup', () => {
    const questionnaire = questionnaireDeLAtelier({
      questions: [
        { id: 'q-taux', enonce: 'Quel taux ?', options: null },
        { id: 'q-points', enonce: 'Combien de points ?', options: null },
      ],
      explications: [
        { reference: 'q-taux', texte: '12 ÷ 48 = 25 %.' },
        { reference: 'q-points', texte: '25 − 20 = 5 points.' },
      ],
    });
    const { fixture, commandes } = monter(questionnaire, {
      pilotage: { explicationsDevoilees: 1 },
    });
    const bouton = (marque: string): HTMLButtonElement =>
      cibleMarque(fixture, marque, 'le panneau') as HTMLButtonElement;

    expect(lire(fixture, 'activite-reveler-correction')).toBeNull();
    expect(texte(fixture, 'activite-questions-niveau')).toBe('1 / 2');
    cliquer(fixture, 'activite-question-suivante');
    cliquer(fixture, 'activite-questions-toutes');

    fixture.componentRef.setInput('pilotage', { explicationsDevoilees: 2, revele: true });
    fixture.detectChanges();
    expect(texte(fixture, 'activite-questions-niveau')).toBe('2 / 2');
    expect(bouton('activite-question-suivante').disabled).toBeTrue();
    expect(bouton('activite-questions-toutes').disabled).toBeTrue();
    expect(commandes).toEqual([
      { screenId: 'ecran-atelier', explicationsDevoilees: 2 },
      { screenId: 'ecran-atelier', revele: true },
    ]);
  });

  it('RET-23 · part de zero correction revelee quel que soit l etayage prevu par le cours', () => {
    const exemple = buildWorkedExemple();
    const guide = buildEcranDeroule({
      id: 'ecran-guide',
      type: 'fp-worked',
      donnees: { exemple, etayage: 2, pilote: true },
    });
    const { fixture, commandes } = monter(guide);

    expect(texte(fixture, 'activite-etayage-niveau')).toBe(`0 / ${exemple.etapes.length}`);
    expect(
      (cibleMarque(fixture, 'activite-etayage-moins', 'le panneau') as HTMLButtonElement).disabled,
    ).toBeTrue();
    cliquer(fixture, 'activite-etayage-plus');

    expect(commandes).toEqual([{ screenId: 'ecran-guide', etayage: 1 }]);
  });

  it('RET-32 · revele une seule fois la correction d un questionnaire', () => {
    const questionnaire = questionnaireDeLAtelier({
      questions: [{ id: 'q-atelier', enonce: 'Quel taux ?', options: null }],
    });
    const monte = monter(questionnaire);

    expect(texte(monte.fixture, 'activite-reveler-correction')).toBe('Révéler la correction');
    revelerUneSeuleFois(monte, 'activite-reveler-correction', 'ecran-atelier');
  });

  it('RET-31 · corrige la feuille en deux temps, les formules puis les reponses', () => {
    const feuille = buildEcranDeroule({ id: 'ecran-feuille', type: 'fp-sheet', donnees: {} });
    const bouton = (fixture: Fixture, marque: string): HTMLButtonElement =>
      cibleMarque(fixture, marque, 'le panneau') as HTMLButtonElement;
    const { fixture, commandes } = monter(feuille);

    expect(texte(fixture, 'activite-feuille-formules')).toBe('Afficher les formules');
    expect(texte(fixture, 'activite-feuille-reponses')).toBe('Afficher les réponses');
    expect(bouton(fixture, 'activite-feuille-reponses').disabled).toBeTrue();
    cliquer(fixture, 'activite-feuille-formules');

    fixture.componentRef.setInput('pilotage', { etayage: 1 });
    fixture.detectChanges();
    expect(bouton(fixture, 'activite-feuille-formules').disabled).toBeTrue();
    cliquer(fixture, 'activite-feuille-reponses');

    fixture.componentRef.setInput('pilotage', { etayage: 2 });
    fixture.detectChanges();
    expect(bouton(fixture, 'activite-feuille-reponses').disabled).toBeTrue();
    expect(commandes).toEqual([
      { screenId: 'ecran-feuille', revele: true, etayage: 1 },
      { screenId: 'ecran-feuille', etayage: 2 },
    ]);
  });

  it('RET-23 · presente l etayage de l exemple comme la correction de l exercice', () => {
    const guide = buildEcranDeroule({
      id: 'ecran-guide',
      type: 'fp-worked',
      donnees: { exemple: buildWorkedExemple(), etayage: 0, pilote: true },
    });
    const { fixture } = monter(guide);
    const section = cibleMarque(fixture, 'activite-etayage', 'le panneau');

    expect(section.querySelector('h3')?.textContent?.trim()).toBe('Correction de l’exercice');
    expect(texte(fixture, 'activite-etayage-plus')).toBe('Corriger une étape de plus');
    expect(texte(fixture, 'activite-etayage-moins')).toBe('Masquer la dernière correction');
  });

  it('agrege les productions recues par element, sans nommer d etudiant', () => {
    const classement = buildEcranDeroule({
      type: 'fp-cardsort',
      donnees: { plan: buildCardsortPlan() },
    });
    const { fixture } = monter(classement, {
      resultats: resultats({
        questions: [
          buildResultatQuestion({
            questionId: 'K-CHARGES-01',
            type: 'classement',
            total: 18,
            scoreMoyen: 0.625,
            parCle: { loyer: { total: 18, justes: 15 }, matieres: { total: 18, justes: 9 } },
          }),
        ],
      }),
    });

    expect(texte(fixture, 'activite-production-total')).toBe('18');
    expect(texte(fixture, 'activite-production-score')).toMatch(/^63\s?%$/);
    expect(
      [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll(
          '[data-testid="activite-production-cle"]',
        ),
      ].map(cellulesDe),
    ).toEqual([
      ['Loyer de l atelier', '15 / 18'],
      ['Achat de matieres premieres', '9 / 18'],
    ]);
  });

  it('suit la progression de la classe dans le coffre de son seul parcours', () => {
    const coffre = buildEcranDeroule({
      type: 'fp-escape',
      donnees: { parcours: buildEscapeParcours() },
    });
    const { fixture } = monter(coffre, {
      resultats: resultats({
        enigmes: [
          buildProgressionEnigme({
            parcoursId: 'K-EVASION-01',
            enigmeId: 'seuil',
            ouvertes: 12,
            resolues: 9,
            tentativesMoyennes: 2.5,
            epuisees: 1,
          }),
          buildProgressionEnigme({
            parcoursId: 'K-AUTRE',
            enigmeId: 'autre',
            ouvertes: 1,
            resolues: 0,
            tentativesMoyennes: 1,
            epuisees: 0,
          }),
        ],
      }),
    });
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="activite-enigme"]',
    );

    expect(lignes.length).toBe(1);
    expect(cellulesDe(lignes[0])).toEqual(['Le seuil de rentabilite', '12', '9', '1', '2,5']);
  });

  it('compte les billets de sortie recus face aux participants', () => {
    const sortie = buildEcranDeroule({ type: 'fp-exit', donnees: { billet: buildExitBillet() } });
    const { fixture } = monter(sortie, {
      participants: 22,
      resultats: resultats({
        questions: [buildResultatQuestion({ questionId: 'B-SORTIE-09', total: 17 })],
      }),
    });

    expect(texte(fixture, 'activite-billets-recus')).toBe('17 billets reçus / 22 participants');
  });

  it('ne liste plus les participants, confies a leur propre panneau', () => {
    expect(lire(monter(buildEcranDeroule()).fixture, 'activite-participants')).toBeNull();
  });

  describe('aucun identifiant interne sur les tables, tris et coffres des cours servis', () => {
    interface Attendu {
      readonly cle: string;
      readonly libelle: string;
    }

    const ECRANS = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
      ecransDuPupitreDe(instantane).filter(({ type }) =>
        ['fp-table-build', 'fp-cardsort', 'fp-escape'].includes(type),
      ),
    );

    function attendusDe(ecran: EcranDeroule): readonly Attendu[] {
      const corrige = ecran.corrigeEcran;
      if (ecran.type === 'fp-escape') {
        const parcours = ecran.donnees?.['parcours'] as EscapeParcoursPublic;
        return parcours.enigmes.map(({ id, intitule }) => ({ cle: id, libelle: intitule }));
      }
      if (corrige?.type === 'classement') {
        const plan = ecran.donnees?.['plan'] as CardsortPlanPublic;
        return corrige.attendus.map(({ carteId }) => ({
          cle: carteId,
          libelle: plan.cartes.find(({ id }) => id === carteId)?.libelle ?? '',
        }));
      }
      if (corrige?.type === 'tableau') {
        const plan = ecran.donnees?.['plan'] as TableBuildPlanPublic;
        return corrige.attendus.map(({ rang, cle }) => ({
          cle: `${rang}:${cle}`,
          libelle: `${plan.colonnes.find((colonne) => colonne.cle === cle)?.intitule} — ${plan.libellesLignes[rang]}`,
        }));
      }
      return [];
    }

    function monterAvecChaqueCle(ecran: EcranDeroule, attendus: readonly Attendu[]): Fixture {
      const [identifiant = ''] = (planDeMontage(ecran) ?? []).flatMap(identifiantsDuMontage);
      const compte = { total: 2, justes: 1 };
      return monter(ecran, {
        resultats: resultats({
          questions: [
            buildResultatQuestion({
              questionId: identifiant,
              ecranId: ecran.id,
              type: ecran.type === 'fp-cardsort' ? 'classement' : 'tableau',
              total: 2,
              scoreMoyen: 0.5,
              parCle: Object.fromEntries(attendus.map(({ cle }) => [cle, compte])),
            }),
          ],
          enigmes: attendus.map(({ cle }) =>
            buildProgressionEnigme({
              parcoursId: identifiant,
              enigmeId: cle,
              ouvertes: 2,
              resolues: 1,
              tentativesMoyennes: 1.5,
              epuisees: 0,
            }),
          ),
        }),
      }).fixture;
    }

    it('trouve des tables, des tris et des coffres dans les cours servis', () => {
      const types = new Set(ECRANS.map(({ type }) => type));

      expect([...types].sort((a, b) => a.localeCompare(b))).toEqual([
        'fp-cardsort',
        'fp-escape',
        'fp-table-build',
      ]);
    });

    for (const ecran of ECRANS) {
      it(`${ecran.id} : nomme chaque ligne par son intitulé servi, jamais par sa clé`, () => {
        const attendus = attendusDe(ecran);
        const marque = ecran.type === 'fp-escape' ? 'activite-enigme' : 'activite-production-cle';

        const fixture = monterAvecChaqueCle(ecran, attendus);
        const entetes = [
          ...(fixture.nativeElement as HTMLElement).querySelectorAll(
            `[data-testid="${marque}"] th`,
          ),
        ].map((entete) => entete.textContent?.trim());

        expect(attendus.length).toBeGreaterThan(0);
        expect(entetes).toEqual(attendus.map(({ libelle }) => libelle));
      });
    }

    it('QP-13 · dans un panneau de 482 px (table de 440 px mesurée en QA), aucun intitulé de ligne n est écrasé sur plus de deux lignes dans une colonne de moins de la moitié de la table, et chaque en-tête chiffré tient sur une ligne', () => {
      const fautes = ECRANS.flatMap((ecran) => {
        const fixture = monterAvecChaqueCle(ecran, attendusDe(ecran));
        const hote = fixture.nativeElement as HTMLElement;
        hote.style.inlineSize = '482px';
        fixture.detectChanges();
        const intitules = [...hote.querySelectorAll<HTMLElement>('tbody th[scope="row"]')]
          .filter(
            (entete) =>
              lignesDe(entete) > 2 &&
              entete.offsetWidth < (entete.closest('table')?.offsetWidth ?? 0) / 2,
          )
          .map(
            (entete) =>
              `${ecran.id} « ${entete.textContent?.trim()} » sur ${lignesDe(entete)} lignes dans ${entete.offsetWidth} px`,
          );
        const chiffres = [...hote.querySelectorAll('thead th:not(:first-child)')]
          .filter((entete) => lignesDe(entete) > 1)
          .map(
            (entete) =>
              `${ecran.id} en-tête « ${entete.textContent?.trim()} » sur ${lignesDe(entete)} lignes`,
          );
        fixture.destroy();
        return [...intitules, ...chiffres];
      });

      expect(ECRANS.some(({ type }) => type === 'fp-escape')).toBeTrue();
      expect(fautes).toEqual([]);
    });
  });
});
