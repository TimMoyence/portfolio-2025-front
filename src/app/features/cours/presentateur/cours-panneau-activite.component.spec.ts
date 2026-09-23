import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
  buildParticipantDeSeance,
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

const SESSION = 'seance-1';

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

  it('revele les pistes fausses d un defi une seule fois', () => {
    const defi = buildEcranDeroule({ id: 'ecran-defi', type: 'fp-challenge', donnees: {} });
    const { fixture, commandes } = monter(defi);

    cliquer(fixture, 'activite-reveler');
    expect(commandes).toEqual([{ screenId: 'ecran-defi', revele: true }]);

    fixture.componentRef.setInput('pilotage', { revele: true });
    fixture.detectChanges();
    expect(
      (cibleMarque(fixture, 'activite-reveler', 'le panneau') as HTMLButtonElement).disabled,
    ).toBeTrue();
  });

  it('dose l etayage de l exemple guide entre zero et le nombre d etapes', () => {
    const exemple = buildWorkedExemple();
    const guide = buildEcranDeroule({
      id: 'ecran-guide',
      type: 'fp-worked',
      donnees: { exemple, etayage: 2 },
    });
    const { fixture, commandes } = monter(guide);

    expect(texte(fixture, 'activite-etayage-niveau')).toBe(`2 / ${exemple.etapes.length}`);
    cliquer(fixture, 'activite-etayage-moins');
    cliquer(fixture, 'activite-etayage-plus');

    expect(commandes).toEqual([
      { screenId: 'ecran-guide', etayage: 1 },
      { screenId: 'ecran-guide', etayage: 3 },
    ]);
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

  describe('participants de la seance', () => {
    const ecran = buildEcranDeroule();

    it('alerte quand la liste des participants ne peut pas etre lue', async () => {
      port.lireParticipants.and.returnValue(throwError(() => new Error('reseau coupe')));
      const { fixture } = monter(ecran, { sessionId: SESSION });

      cliquer(fixture, 'activite-participants-afficher');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(lire(fixture, 'activite-participants-echec')?.getAttribute('role')).toBe('alert');
    });

    const afficherDeuxParticipants = async (): Promise<Fixture> => {
      port.lireParticipants.and.returnValue(
        of({
          participants: [
            buildParticipantDeSeance(),
            buildParticipantDeSeance({ id: 'participant-2', prenom: 'Sami' }),
          ],
        }),
      );
      const { fixture } = monter(ecran, { sessionId: SESSION });

      cliquer(fixture, 'activite-participants-afficher');
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };

    const cliquerLePremier = async (fixture: Fixture, marque: string): Promise<void> => {
      const boutons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        `[data-testid="${marque}"]`,
      );
      expect(boutons.length).withContext(marque).toBeGreaterThan(0);
      boutons[0].click();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    const evinces = (fixture: Fixture): readonly (string | null)[] =>
      [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll(
          '[data-testid="activite-participant"]',
        ),
      ].map((ligne) => ligne.getAttribute('data-evince'));

    it('lit les participants puis marque evince celui que le formateur retire', async () => {
      const fixture = await afficherDeuxParticipants();

      await cliquerLePremier(fixture, 'activite-evincer');

      expect(port.evincerParticipant).toHaveBeenCalledOnceWith(SESSION, 'participant-1');
      expect(evinces(fixture)).toEqual(['true', 'false']);
    });

    it('R5 · referme la liste des participants a la demande du formateur', async () => {
      const fixture = await afficherDeuxParticipants();

      await cliquerLePremier(fixture, 'activite-participants-masquer');

      expect(lire(fixture, 'activite-participant')).toBeNull();
      expect(lire(fixture, 'activite-participants-afficher')).not.toBeNull();
    });

    it('readmet l evince que le formateur avait retire par erreur', async () => {
      const fixture = await afficherDeuxParticipants();
      await cliquerLePremier(fixture, 'activite-evincer');

      await cliquerLePremier(fixture, 'activite-readmettre');

      expect(port.readmettreParticipant).toHaveBeenCalledOnceWith(SESSION, 'participant-1');
      expect(evinces(fixture)).toEqual(['false', 'false']);
    });

    it('alerte quand la readmission est refusee, la place ayant ete reprise', async () => {
      const fixture = await afficherDeuxParticipants();
      await cliquerLePremier(fixture, 'activite-evincer');
      port.readmettreParticipant.and.returnValue(throwError(() => new Error('seance complete')));

      await cliquerLePremier(fixture, 'activite-readmettre');

      expect(lire(fixture, 'activite-participants-echec')?.getAttribute('role')).toBe('alert');
    });

    it('ne lit rien sans seance ouverte', () => {
      const { fixture } = monter(ecran);
      expect(
        (cibleMarque(fixture, 'activite-participants-afficher', 'le panneau') as HTMLButtonElement)
          .disabled,
      ).toBeTrue();
    });
  });
});
