import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import type {
  ParticipantRapporte,
  RapportSeance,
  ReponseRapportee,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import type {
  ConfusionComptee,
  DerouleCours,
  ResultatsSeance,
} from '../../../../cours/content/types';
import {
  buildNumericQuestion,
  buildVoteQuestion,
} from '../../../../testing/factories/cours.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildResultatQuestion,
  buildResultatsSeance,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { buildVisualQuizSlide } from '../../../../testing/factories/visual-slide.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
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
    completion: reponses.length,
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
  rapport: RapportSeance,
  deroule: Observable<DerouleCours> = of(buildDerouleCours()),
): Promise<Fixture> {
  const port = createFormationsPortStub();
  port.lireResultats.and.returnValue(of(rapport));
  port.lireDeroule.and.returnValue(deroule);
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

  it('affiche les concepts fragiles avec leur effectif, du plus lourd au plus leger', async () => {
    const fixture = await monter(rapportDe([MALIK, NORA, CHLOE]));

    expect(textes(fixture, 'synthese-fragile-concept')).toEqual([
      'interets-composes',
      'actualisation',
    ]);
    expect(textes(fixture, 'synthese-fragile-effectif')).toEqual(['2', '1']);
  });

  it('additionne les confusions au travers des questions et les trie par nombre decroissant', async () => {
    const resultats = buildResultatsSeance({
      participants: 3,
      questions: [
        buildResultatQuestion({
          questionId: 'Q-1',
          confusions: [confusion('interet-simple', 3), confusion('base-arrivee', 1)],
        }),
        buildResultatQuestion({
          questionId: 'Q-2',
          confusions: [confusion('interet-simple', 2), confusion('base-arrivee', 5)],
        }),
      ],
    });
    const fixture = await monter(rapportDe([MALIK], resultats));

    expect(textes(fixture, 'synthese-confusion-libelle')).toEqual([
      'Libelle base-arrivee',
      'Libelle interet-simple',
    ]);
    expect(textes(fixture, 'synthese-confusion-nombre')).toEqual(['6', '5']);
  });

  it('classe les confusions a egalite de nombre par id croissant', async () => {
    const resultats = buildResultatsSeance({
      participants: 3,
      questions: [
        buildResultatQuestion({
          questionId: 'Q-1',
          confusions: [confusion('zeta', 4), confusion('alpha', 4)],
        }),
      ],
    });
    const fixture = await monter(rapportDe([MALIK], resultats));

    expect(textes(fixture, 'synthese-confusion-libelle')).toEqual([
      'Libelle alpha',
      'Libelle zeta',
    ]);
  });

  it('garde cinq confusions au plus meme si la classe en genere davantage', async () => {
    const resultats = buildResultatsSeance({
      participants: 6,
      questions: [
        buildResultatQuestion({
          questionId: 'Q-1',
          confusions: [
            confusion('c1', 9),
            confusion('c2', 8),
            confusion('c3', 7),
            confusion('c4', 6),
            confusion('c5', 5),
            confusion('c6', 4),
          ],
        }),
      ],
    });
    const fixture = await monter(rapportDe([MALIK], resultats));

    expect(textes(fixture, 'synthese-confusion-libelle')).toEqual([
      'Libelle c1',
      'Libelle c2',
      'Libelle c3',
      'Libelle c4',
      'Libelle c5',
    ]);
  });

  it('affiche a zero une question a laquelle personne n a repondu', async () => {
    const resultats = buildResultatsSeance({
      participants: 3,
      questions: [
        buildResultatQuestion({ questionId: 'Q-1' }),
        buildResultatQuestion({
          questionId: 'Q-2',
          total: 0,
          correctes: 0,
          neSaitPas: 0,
          confusions: [],
        }),
      ],
    });
    const fixture = await monter(rapportDe([MALIK], resultats));

    expect(textes(fixture, 'synthese-question-id')).toEqual(['Q-1', 'Q-2']);
    expect(textes(fixture, 'synthese-question-correctes')).toEqual(['16', '0']);
    expect(textes(fixture, 'synthese-question-total')).toEqual(['24', '0']);
    expect(textes(fixture, 'synthese-question-ne-sait-pas')).toEqual(['2', '0']);
  });

  describe('tableau des resultats par question', () => {
    const VOTE = buildVoteQuestion({ id: 'Q-1', enonce: 'Que vaut le capital apres dix ans ?' });
    const NUMERIQUE = buildNumericQuestion({ id: 'Q-2', enonce: 'Quelle valeur acquise ?' });

    function resultatsDeDeuxQuestions(): ResultatsSeance {
      return buildResultatsSeance({
        participants: 3,
        questions: [
          buildResultatQuestion({ questionId: 'Q-1' }),
          buildResultatQuestion({ questionId: 'Q-2' }),
        ],
      });
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

    it('nomme par son enonce, a l ecran et dans le CSV, le QCM d un ecran servi en presentation v2', async () => {
      const participant = etudiant('Ana', 9, false, [
        { ...reponse('echelle', 'o2'), questionId: 'b2-s03-prediction' },
      ]);
      const fixture = await monter(
        rapportDe(
          [participant],
          buildResultatsSeance({
            participants: 1,
            questions: [buildResultatQuestion({ questionId: 'b2-s03-prediction' })],
          }),
        ),
        of(buildDerouleCours({ ecrans: [buildEcranDeroule(buildVisualQuizSlide())] })),
      );

      expect(textes(fixture, 'synthese-question-libelle')).toEqual(['Quelle échelle ?']);
      expect(fixture.componentInstance.exporterCsv().split('\n')[1]).toBe(
        'Ana;Durand;ana@example.com;b2-s03-prediction;Quelle échelle ?;echelle;o2;4200',
      );
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

  it('exporte une ligne d entete puis une ligne par reponse', async () => {
    const fixture = await monter(rapportDe([MALIK, NORA, CHLOE, THEO]));

    const lignes = fixture.componentInstance.exporterCsv().split('\n');

    expect(lignes[0]).toBe('prenom;nom;adresse;question;enonce;concept;valeur;duree_ms');
    expect(lignes.length).toBe(5);
    expect(lignes[1]).toBe(
      'Malik;Durand;malik@example.com;Q-interets-composes;;interets-composes;1400;4200',
    );
  });

  it('protege les champs qui portent un point-virgule ou un retour a la ligne', async () => {
    const porteur = {
      ...etudiant('Ana', 9, true, [reponse('actualisation', 'premiere ligne\nseconde ligne')]),
      nom: 'Dupont;Martin',
    };
    const fixture = await monter(rapportDe([porteur]));

    const lignes = fixture.componentInstance.exporterCsv().split('\n');

    expect(lignes[1]).toContain('"Dupont;Martin"');
    expect(lignes[1]).toContain('"premiere ligne');
    expect(fixture.componentInstance.exporterCsv()).toContain(
      '"premiere ligne\nseconde ligne";4200',
    );
  });

  it('neutralise un champ qu Excel interpreterait comme une formule', async () => {
    const porteur = {
      ...etudiant('Ana', 9, true, [reponse('actualisation', '+1+1')]),
      nom: '=HYPERLINK("http://evil.example","Cliquez ici")',
    };
    const fixture = await monter(rapportDe([porteur]));

    const csv = fixture.componentInstance.exporterCsv();

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+1+1");
  });

  it('laisse un montant negatif intact et sommable', async () => {
    const porteur = etudiant('Ana', 9, true, [reponse('actualisation', '-1500')]);
    const fixture = await monter(rapportDe([porteur]));

    const csv = fixture.componentInstance.exporterCsv();

    expect(csv).toContain('-1500');
    expect(csv).not.toContain("'-1500");
  });

  it('neutralise un moins qui n est pas un nombre valide', async () => {
    const porteur = etudiant('Ana', 9, true, [reponse('actualisation', '-=1+1')]);
    const fixture = await monter(rapportDe([porteur]));

    expect(fixture.componentInstance.exporterCsv()).toContain("'-=1+1");
  });

  it('une seance sans participant affiche un message plutot qu un tableau vide', async () => {
    const fixture = await monter(rapportDe([]));

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector("[data-testid='synthese-vide']")).toBeTruthy();
    expect(racine.querySelector("[data-testid='synthese-classement']")).toBeNull();
    expect((racine.textContent ?? '').trim()).toContain('Aucun participant');
  });
});
