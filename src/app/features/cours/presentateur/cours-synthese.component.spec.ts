import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type {
  FormationsPort,
  ParticipantRapporte,
  RapportSeance,
  ReponseRapportee,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
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

function rapportDe(participants: readonly ParticipantRapporte[]): RapportSeance {
  return {
    courseSlug: 'maths-financieres',
    code: '4821',
    ouverteLe: '2026-09-12T08:00:00.000Z',
    fermeeLe: '2026-09-12T09:30:00.000Z',
    participants,
    conceptsFragiles: ['interets-composes', 'actualisation'],
  };
}

function textes(fixture: Fixture, nom: string): readonly string[] {
  const racine = fixture.nativeElement as HTMLElement;
  return [...racine.querySelectorAll(`[data-testid='${nom}']`)].map((element) =>
    (element.textContent ?? '').trim(),
  );
}

async function monter(rapport: RapportSeance): Promise<Fixture> {
  const port = { lireResultats: () => of(rapport) } as unknown as FormationsPort;
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

    expect(lignes[0]).toBe('prenom;nom;adresse;question;concept;valeur;duree_ms');
    expect(lignes.length).toBe(5);
    expect(lignes[1]).toBe(
      'Malik;Durand;malik@example.com;Q-interets-composes;interets-composes;1400;4200',
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
