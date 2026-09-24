import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { EcranDeroule } from '../../../../cours/content/types';
import {
  buildCardsortPlan,
  buildEscapeParcours,
  buildExitBillet,
  buildVoteQuestion,
  buildWorkedExemple,
} from '../../../../testing/factories/cours.factory';
import {
  buildEcranDeroule,
  buildResultatQuestion,
  buildResultatsSeance,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { cibleMarque, lireMarque as lire } from '../../../../testing/marqueurs-dom';
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
    fixture.componentRef.setInput('ecran', ecran);
    for (const [nom, valeur] of Object.entries(entrees)) {
      fixture.componentRef.setInput(nom, valeur);
    }
    fixture.detectChanges();
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
    const vote = buildEcranDeroule({
      id: 'ecran-vote',
      type: 'fp-vote',
      donnees: {
        question: buildVoteQuestion(),
        questionJumelle: buildVoteQuestion({ id: 'Q-CAP-03-bis' }),
      },
    });

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
      const { fixture } = monter(vote, { pilotageBloque: true });
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

  it('F27 · corrige le tableau en deux temps, les coefficients puis les prix et indices', () => {
    const tableau = buildEcranDeroule({
      id: 'ecran-tableau',
      type: 'fp-table-build',
      donnees: {},
      corriges: [],
    });
    const { fixture, commandes } = monter(tableau);

    expect(lire(fixture, 'activite-reveler-correction')).toBeNull();
    cliquer(fixture, 'activite-tableau-coefficients');
    fixture.componentRef.setInput('pilotage', { etayage: 1 });
    fixture.detectChanges();
    cliquer(fixture, 'activite-tableau-valeurs');

    expect(commandes).toEqual([
      { screenId: 'ecran-tableau', revele: true, etayage: 1 },
      { screenId: 'ecran-tableau', etayage: 2 },
    ]);
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

  it('T7 · ne pilote aucune etape sur l exercice travaille non pilote, corrige a l ecran suivant', () => {
    const exercice = buildEcranDeroule({
      id: 'ecran-exercice',
      type: 'fp-worked',
      donnees: { exemple: buildWorkedExemple(), etayage: 0 },
    });

    expect(lire(monter(exercice).fixture, 'activite-etayage')).toBeNull();
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
    const questionnaire = buildEcranDeroule({
      id: 'ecran-atelier',
      type: 'questionnaire',
      donnees: {},
      corriges: [],
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
      ['loyer', '15 / 18'],
      ['matieres', '9 / 18'],
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
          {
            parcoursId: 'K-EVASION-01',
            enigmeId: 'seuil',
            ouvertes: 12,
            resolues: 9,
            tentativesMoyennes: 2.5,
            epuisees: 1,
          },
          {
            parcoursId: 'K-AUTRE',
            enigmeId: 'autre',
            ouvertes: 1,
            resolues: 0,
            tentativesMoyennes: 1,
            epuisees: 0,
          },
        ],
      }),
    });
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="activite-enigme"]',
    );

    expect(lignes.length).toBe(1);
    expect(cellulesDe(lignes[0])).toEqual(['seuil', '12', '9', '1', '2.5']);
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
});
