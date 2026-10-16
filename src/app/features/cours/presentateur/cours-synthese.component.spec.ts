import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { isObservable, of, throwError } from 'rxjs';
import type {
  FichierTelecharge,
  ParticipantRapporte,
  RapportSeance,
  ReponseLibreRapportee,
  ReponseRapportee,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import type {
  ConfusionComptee,
  DerouleCours,
  ResultatQuestion,
  ResultatsSeance,
} from '../../../../cours/content/types';
import {
  buildNumericQuestion,
  buildVoteQuestion,
} from '../../../../testing/factories/cours.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildFichierTelecharge,
  buildResultatQuestion,
  buildResultatsDeChaqueQuestion,
  buildResultatsSeance,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { buildVisualQuizSlide } from '../../../../testing/factories/visual-slide.factory';
import { INSTANTANE_B3_01 } from '../../../../testing/fixtures/instantane-b3-01';
import { DELAI_DE_MONTAGE_MS } from '../../../../testing/briques-montees';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { lireLesLibelles } from '../../../../testing/libelles-colles';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { enoncesDesActivites } from '../../../shared/slides/session/lecture-ecran';
import { CoursSyntheseComponent } from './cours-synthese.component';

type Fixture = ComponentFixture<CoursSyntheseComponent>;

function reponse(concept: string, valeur: string, dureeMs = 4200): ReponseRapportee {
  return {
    questionId: `Q-${concept}`,
    concept,
    valeur,
    correcte: false,
    misconception: 'taux-simple',
    dureeMs,
  };
}

function confusion(id: string, nombre: number): ConfusionComptee {
  return { id, libelle: `Libelle ${id}`, nombre };
}

function etudiant(
  prenom: string,
  note: number,
  sousSeuil: boolean,
  reponses: readonly ReponseRapportee[],
): ParticipantRapporte {
  return {
    prenom,
    nom: 'Durand',
    email: `${prenom.toLowerCase()}@example.com`,
    completion: reponses.length / 4,
    note,
    sousSeuil,
    reponses,
    incidents: 0,
  };
}

const MALIK = etudiant('Malik', 4, true, [
  reponse('interets-composes', '1400'),
  reponse('actualisation', '910'),
]);
const NORA = etudiant('Nora', 6, true, [reponse('interets-composes', '1450')]);
const CHLOE = etudiant('Chloe', 12, false, [reponse('actualisation', '905', 3100)]);
const THEO = etudiant('Theo', 0, false, []);

function rapportDe(
  participants: readonly ParticipantRapporte[],
  resultats: ResultatsSeance = buildResultatsSeance({ participants: participants.length }),
): RapportSeance {
  return {
    courseSlug: 'maths-financieres',
    code: '4821',
    ouverteLe: '2026-09-12T08:00:00.000Z',
    fermeeLe: '2026-09-12T09:30:00.000Z',
    participants,
    conceptsFragiles: ['interets-composes', 'actualisation'],
    resultats,
  };
}

function textes(fixture: Fixture, nom: string): readonly string[] {
  const racine = fixture.nativeElement as HTMLElement;
  return [...racine.querySelectorAll(`[data-testid='${nom}']`)].map((element) =>
    (element.textContent ?? '').trim(),
  );
}

async function monter(
  rapport: RapportSeance | Observable<RapportSeance>,
  deroule: Observable<DerouleCours> = of(buildDerouleCours()),
  csv: Observable<FichierTelecharge> = of(buildFichierTelecharge()),
): Promise<Fixture> {
  const port = createFormationsPortStub();
  port.lireResultats.and.returnValue(isObservable(rapport) ? rapport : of(rapport));
  port.lireDeroule.and.returnValue(deroule);
  port.telechargerRapportCsv.and.returnValue(csv);
  setupTestBed({
    imports: [CoursSyntheseComponent],
    providers: [{ provide: FORMATIONS_PORT, useValue: port }],
  });
  const fixture = TestBed.createComponent(CoursSyntheseComponent);
  fixture.componentRef.setInput('sessionId', 'S-1');
  fixture.detectChanges();
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
  return fixture;
}

function resultatsDe(
  participants: number,
  questions: readonly Partial<ResultatQuestion>[],
): ResultatsSeance {
  return buildResultatsSeance({
    participants,
    questions: questions.map((question) => buildResultatQuestion(question)),
  });
}

function monterMalikFace(
  participants: number,
  questions: readonly Partial<ResultatQuestion>[],
): Promise<Fixture> {
  return monter(rapportDe([MALIK], resultatsDe(participants, questions)));
}

describe('CoursSyntheseComponent', () => {
  it('classe les etudiants du plus bas score au plus haut', async () => {
    const fixture = await monter(rapportDe([CHLOE, MALIK, NORA]));

    expect(textes(fixture, 'synthese-nom')).toEqual([
      'Malik Durand',
      'Nora Durand',
      'Chloe Durand',
    ]);
    expect(textes(fixture, 'synthese-score')).toEqual(['4', '6', '12']);
  });

  it('écrit la note sur 20 à la française, avec une virgule', async () => {
    const QA = etudiant('Qa', 18.9, false, [reponse('actualisation', '905')]);

    const fixture = await monter(rapportDe([QA]));

    expect(textes(fixture, 'synthese-score')).toEqual(['18,9']);
  });

  it('affiche les concepts fragiles avec leur effectif, du plus lourd au plus leger', async () => {
    const fixture = await monter(rapportDe([MALIK, NORA, CHLOE]));

    expect(textes(fixture, 'synthese-fragile-concept')).toEqual([
      'interets-composes',
      'actualisation',
    ]);
    expect(textes(fixture, 'synthese-fragile-effectif')).toEqual(['2', '1']);
  });

  it('nomme un concept fragile par son libellé quand le rapport le sert', async () => {
    const fixture = await monter({
      ...rapportDe([MALIK, NORA, CHLOE]),
      libellesDesConcepts: { 'interets-composes': 'Intérêts composés' },
    });

    expect(textes(fixture, 'synthese-fragile-concept')).toEqual([
      'Intérêts composés',
      'actualisation',
    ]);
  });

  it('exprime l avancement en pourcentage des questions notées', async () => {
    const fixture = await monter(rapportDe([MALIK, NORA]));

    expect(textes(fixture, 'synthese-avancement').map((texte) => texte.replace(/\s/g, ''))).toEqual(
      ['50%', '25%'],
    );
  });

  it('additionne les confusions au travers des questions et les trie par nombre decroissant', async () => {
    const fixture = await monterMalikFace(3, [
      {
        questionId: 'Q-1',
        confusions: [confusion('interet-simple', 3), confusion('base-arrivee', 1)],
      },
      {
        questionId: 'Q-2',
        confusions: [confusion('interet-simple', 2), confusion('base-arrivee', 5)],
      },
    ]);

    expect(textes(fixture, 'synthese-confusion-libelle')).toEqual([
      'Libelle base-arrivee',
      'Libelle interet-simple',
    ]);
    expect(textes(fixture, 'synthese-confusion-nombre')).toEqual(['6', '5']);
  });

  it('classe les confusions a egalite de nombre par id croissant', async () => {
    const fixture = await monterMalikFace(3, [
      { questionId: 'Q-1', confusions: [confusion('zeta', 4), confusion('alpha', 4)] },
    ]);

    expect(textes(fixture, 'synthese-confusion-libelle')).toEqual([
      'Libelle alpha',
      'Libelle zeta',
    ]);
  });

  it('garde cinq confusions au plus meme si la classe en genere davantage', async () => {
    const fixture = await monterMalikFace(6, [
      {
        questionId: 'Q-1',
        confusions: [
          confusion('c1', 9),
          confusion('c2', 8),
          confusion('c3', 7),
          confusion('c4', 6),
          confusion('c5', 5),
          confusion('c6', 4),
        ],
      },
    ]);

    expect(textes(fixture, 'synthese-confusion-libelle')).toEqual([
      'Libelle c1',
      'Libelle c2',
      'Libelle c3',
      'Libelle c4',
      'Libelle c5',
    ]);
  });

  it('affiche a zero une question a laquelle personne n a repondu', async () => {
    const fixture = await monterMalikFace(3, [
      { questionId: 'Q-1' },
      { questionId: 'Q-2', total: 0, correctes: 0, neSaitPas: 0, confusions: [] },
    ]);

    expect(textes(fixture, 'synthese-question-id')).toEqual(['Q-1', 'Q-2']);
    expect(textes(fixture, 'synthese-question-correctes')).toEqual(['16', '0']);
    expect(textes(fixture, 'synthese-question-total')).toEqual(['24', '0']);
    expect(textes(fixture, 'synthese-question-ne-sait-pas')).toEqual(['2', '0']);
  });

  describe('tableau des resultats par question', () => {
    const VOTE = buildVoteQuestion({ id: 'Q-1', enonce: 'Que vaut le capital apres dix ans ?' });
    const NUMERIQUE = buildNumericQuestion({ id: 'Q-2', enonce: 'Quelle valeur acquise ?' });

    function resultatsDeDeuxQuestions(): ResultatsSeance {
      return resultatsDe(3, [{ questionId: 'Q-1' }, { questionId: 'Q-2' }]);
    }

    function derouleDesDeuxQuestions(): DerouleCours {
      return buildDerouleCours({
        ecrans: [
          buildEcranDeroule({ type: 'fp-vote', donnees: { question: VOTE } }),
          buildEcranDeroule({
            type: 'questionnaire',
            donnees: { questions: [{ brique: 'fp-numeric', donnees: { question: NUMERIQUE } }] },
          }),
        ],
      });
    }

    it('porte une legende', async () => {
      const fixture = await monter(rapportDe([MALIK], resultatsDeDeuxQuestions()));
      const legende = (fixture.nativeElement as HTMLElement).querySelector(
        "[data-testid='synthese-questions'] caption",
      );

      expect(legende).not.toBeNull();
      expect(legende?.textContent?.trim()).toContain('question');
    });

    it('nomme chaque question par son enonce au deroule, en gardant son identifiant', async () => {
      const fixture = await monter(
        rapportDe([MALIK], resultatsDeDeuxQuestions()),
        of(derouleDesDeuxQuestions()),
      );

      expect(textes(fixture, 'synthese-question-libelle')).toEqual([VOTE.enonce, NUMERIQUE.enonce]);
      expect(textes(fixture, 'synthese-question-id')).toEqual(['Q-1', 'Q-2']);
    });

    it('nomme par son enonce le QCM d un ecran servi en presentation v2', async () => {
      const participant = etudiant('Ana', 9, false, [
        { ...reponse('echelle', 'o2'), questionId: 'b2-s03-prediction' },
      ]);
      const fixture = await monter(
        rapportDe([participant], resultatsDe(1, [{ questionId: 'b2-s03-prediction' }])),
        of(buildDerouleCours({ ecrans: [buildEcranDeroule(buildVisualQuizSlide())] })),
      );

      expect(textes(fixture, 'synthese-question-libelle')).toEqual(['Quelle échelle ?']);
    });

    it('nomme la question par son identifiant quand le deroule ne peut pas etre lu', async () => {
      const fixture = await monter(
        rapportDe([MALIK], resultatsDeDeuxQuestions()),
        throwError(() => new Error('reseau coupe')),
      );

      expect(textes(fixture, 'synthese-question-libelle')).toEqual([]);
      expect(textes(fixture, 'synthese-question-id')).toEqual(['Q-1', 'Q-2']);
      expect(textes(fixture, 'synthese-echec')).toEqual([]);
    });
  });

  it('marque l etudiant sans aucune reponse au lieu de lui donner un score de zero', async () => {
    const fixture = await monter(rapportDe([MALIK, THEO]));

    const marques = textes(fixture, 'synthese-sans-reponse');
    expect(marques.length).toBe(1);
    expect(marques[0]).toContain('aucune question');
    expect(textes(fixture, 'synthese-score')).toEqual(['4']);
    expect(textes(fixture, 'synthese-nom')).toEqual(['Malik Durand', 'Theo Durand']);
  });

  describe('règles du cahier et ce qui reste flou, écrits en réponse libre (V6)', () => {
    const REGLE_VISUALISER = 'b3-01-a3-regles:regle-visualiser';
    const REGLE_DECIDER = 'b3-01-a3-regles:regle-decider';
    const FLOU = 'b3-01-a3-flou:ce-qui-reste-flou';
    const QUESTION_FLOU = 'En une phrase : qu’est-ce qui reste flou pour vous après cette séance ?';
    const QUESTION_VISUALISER =
      'Niveau 5 · Visualiser : votre règle avant de choisir un graphique.';
    const QUESTION_DECIDER = 'Niveau 6 · Décider : votre règle pour écrire une recommandation.';

    function libre(
      activityId: string,
      texte: string,
      screenId = 'B3-01-A3-12-CAHIER-DE-REGLES',
    ): ReponseLibreRapportee {
      return { screenId, activityId, reponse: texte };
    }

    const ANA = {
      ...etudiant('Ana', 14, false, [reponse('cle-et-relation', '660')]),
      reponsesLibres: [
        libre(REGLE_VISUALISER, 'Je pose la question avant le graphique.'),
        libre(REGLE_DECIDER, 'Je chiffre le constat avant l action.'),
      ],
    };
    const BASILE = {
      ...etudiant('Basile', 0, false, []),
      reponsesLibres: [
        libre(REGLE_VISUALISER, 'Je lis l axe avant la barre.'),
        libre(FLOU, 'Le modèle de données.', 'B3-01-A3-13-CE-QUI-RESTE-FLOU'),
      ],
    };

    function monterLeB301(participants: readonly ParticipantRapporte[]): Promise<Fixture> {
      return monter(rapportDe(participants), of(INSTANTANE_B3_01.deroule));
    }

    it('affiche les réponses libres de chaque étudiant sous son nom, chacune avec sa question', async () => {
      const fixture = await monterLeB301([ANA, BASILE]);

      expect(textes(fixture, 'synthese-libres-etudiant')).toEqual(['Ana Durand', 'Basile Durand']);
      expect(textes(fixture, 'synthese-libre-question')).toEqual([
        QUESTION_VISUALISER,
        QUESTION_DECIDER,
        QUESTION_VISUALISER,
        QUESTION_FLOU,
      ]);
      expect(textes(fixture, 'synthese-libre-reponse')).toEqual([
        'Je pose la question avant le graphique.',
        'Je chiffre le constat avant l action.',
        'Je lis l axe avant la barre.',
        'Le modèle de données.',
      ]);
    });

    it('nomme le billet de sortie noté par sa question, et sa réponse libre par son invite, sous le même identifiant', async () => {
      const BILLET = 'b3-01-a3-billet';
      const QUESTION_DU_BILLET =
        'Une ligne porte une date_livraison antérieure à sa date_commande. La corrige-t-on automatiquement ?';
      const INVITE_DU_BILLET = 'En une phrase : pourquoi ce choix ?';
      const CLEMENT = {
        ...etudiant('Clement', 11, false, [
          { ...reponse('qualite-des-donnees', 'non-on-la-signale'), questionId: BILLET },
        ]),
        reponsesLibres: [
          {
            screenId: 'B3-01-A3-14-BILLET-DE-SORTIE',
            activityId: BILLET,
            reponse: 'Une date incohérente se signale.',
          },
        ],
      };

      const fixture = await monter(
        rapportDe([CLEMENT], resultatsDe(1, [{ questionId: BILLET }])),
        of(INSTANTANE_B3_01.deroule),
      );

      expect(textes(fixture, 'synthese-question-libelle')).toEqual([QUESTION_DU_BILLET]);
      expect(textes(fixture, 'synthese-libre-question')).toEqual([INVITE_DU_BILLET]);
    });

    it('nomme une règle par son activité quand le déroulé ne peut pas être lu', async () => {
      const fixture = await monter(
        rapportDe([BASILE]),
        throwError(() => new Error('reseau coupe')),
      );

      expect(textes(fixture, 'synthese-libre-question')).toEqual([REGLE_VISUALISER, FLOU]);
    });

    it('n affiche aucune section de règles quand le rapport n en porte pas', async () => {
      const fixture = await monter(rapportDe([MALIK, NORA]));

      expect(
        (fixture.nativeElement as HTMLElement).querySelector("[data-testid='synthese-libres']"),
      ).toBeNull();
    });
  });

  const DEFIS_SERVIS = INSTANTANES_DES_COURS_SERVIS.flatMap(([, { deroule }]) =>
    deroule.ecrans.flatMap((ecran) => {
      const { id, invite } = (ecran.donnees?.['probleme'] ?? {}) as Partial<
        Record<'id' | 'invite', string>
      >;
      return ecran.type === 'fp-challenge' && id !== undefined && invite !== undefined
        ? [{ deroule, screenId: ecran.id, activityId: id, invite }]
        : [];
    }),
  );

  it('trouve des défis dans les cours servis', () => {
    expect(DEFIS_SERVIS.length).toBeGreaterThan(0);
  });

  for (const { deroule, screenId, activityId, invite } of DEFIS_SERVIS) {
    it(`${screenId} : titre la tentative au défi par l invite de son problème, jamais par son identifiant`, async () => {
      const LEA = {
        ...etudiant('Lea', 10, false, []),
        reponsesLibres: [
          { screenId, activityId, reponse: 'La marge se calcule sur le prix de vente.' },
        ],
      };

      const fixture = await monter(rapportDe([LEA]), of(deroule));

      expect(textes(fixture, 'synthese-libre-question')).toEqual([invite]);
    });
  }

  function exporter(fixture: Fixture): void {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>("[data-testid='synthese-export']")
      ?.click();
    fixture.detectChanges();
  }

  it('télécharge le CSV que le serveur produit pour la séance, sous le nom qu il lui donne', async () => {
    const creation = spyOn(URL, 'createObjectURL').and.returnValue('blob:synthese');
    spyOn(URL, 'revokeObjectURL');
    const clic = spyOn(HTMLAnchorElement.prototype, 'click');
    const csv = buildFichierTelecharge({
      nom: 'session-4821.csv',
      contenu: new Blob(['﻿prénom;nom'], { type: 'text/csv; charset=utf-8' }),
    });
    const fixture = await monter(rapportDe([MALIK]), of(buildDerouleCours()), of(csv));

    exporter(fixture);
    const telecharge = creation.calls.mostRecent().args[0] as Blob;

    expect({
      nom: (clic.calls.mostRecent().object as HTMLAnchorElement).download,
      type: telecharge.type,
      texte: await telecharge.text(),
    }).toEqual({
      nom: 'session-4821.csv',
      type: csv.contenu.type,
      texte: await csv.contenu.text(),
    });
  });

  it('signale un export CSV en échec', async () => {
    const fixture = await monter(
      rapportDe([MALIK]),
      of(buildDerouleCours()),
      throwError(() => new Error('500')),
    );

    exporter(fixture);

    expect(textes(fixture, 'synthese-export-echec').length).toBe(1);
  });

  it('L4-F17 · alerte quand le rapport de la seance ne peut pas etre lu', async () => {
    const fixture = await monter(throwError(() => new Error('reseau coupe')));

    expect(textes(fixture, 'synthese-echec')).toEqual([
      "La synthèse n'a pas pu être lue. Rechargez la page, puis réessayez.",
    ]);
    expect(textes(fixture, 'synthese-ligne')).toEqual([]);
  });

  it('une seance sans participant affiche un message plutot qu un tableau vide', async () => {
    const fixture = await monter(rapportDe([]));

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector("[data-testid='synthese-vide']")).toBeTruthy();
    expect(racine.querySelector("[data-testid='synthese-classement']")).toBeNull();
    expect((racine.textContent ?? '').trim()).toContain('Aucun participant');
  });

  describe('QP-02 · aucun libellé collé à sa valeur sur la synthèse des cours servis', () => {
    const VUES_DE_LA_SYNTHESE = [
      'synthese-ligne',
      'synthese-question-libelle',
      'synthese-confusion',
      'synthese-fragile',
      'synthese-libre-question',
    ];

    for (const [prefixe, { deroule: servi }] of INSTANTANES_DES_COURS_SERVIS) {
      it(
        `${prefixe} : sépare chaque libellé de sa valeur, réponses libres comprises`,
        async () => {
          const reponsesLibres = servi.ecrans.flatMap((ecran) =>
            [...enoncesDesActivites(ecran).keys()].map((activityId) => ({
              screenId: ecran.id,
              activityId,
              reponse: 'Je compare les bases avant les pourcentages.',
            })),
          );
          const fixture = await monter(
            rapportDe(
              [{ ...MALIK, reponsesLibres }, NORA, CHLOE, THEO],
              buildResultatsDeChaqueQuestion(servi.ecrans),
            ),
            of(servi),
          );

          expect(lireLesLibelles(fixture.nativeElement, VUES_DE_LA_SYNTHESE)).toEqual({
            colles: [],
            vuesAbsentes: [],
          });
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  });
});
