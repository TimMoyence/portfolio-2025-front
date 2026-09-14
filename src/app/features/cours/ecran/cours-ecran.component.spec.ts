import type { Provider } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { EcranContent, RenderMode, Role } from '../../../../cours/content/types';
import {
  buildEcran,
  buildEcranQuestionnaire,
  buildExitBillet,
  buildNumericQuestion,
  buildVoteQuestion,
} from '../../../../testing/factories/cours.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { ReponseBrique } from './cours-ecran.component';
import {
  CoursEcranComponent,
  ENREGISTREUR_DES_BRIQUES,
  PROPRIETES_PAR_BRIQUE,
} from './cours-ecran.component';

type Fixture = ComponentFixture<CoursEcranComponent>;

type BriqueMontee = HTMLElement & {
  readonly question?: { readonly id: string } | null;
  readonly billet?: { readonly id: string } | null;
};

interface OptionsDeMontage {
  readonly rendu?: RenderMode;
  readonly role?: Role;
  readonly providers?: Provider[];
}

interface EcranMonte {
  readonly fixture: Fixture;
  readonly hote: HTMLElement;
  readonly reponses: ReponseBrique[];
}

function cible(fixture: Fixture, nom: string): HTMLElement {
  const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    `[data-testid='${nom}']`,
  );
  if (element === null) {
    throw new Error(`Aucun element « ${nom} » dans l ecran monte`);
  }
  return element;
}

function briquesDe(hote: HTMLElement): BriqueMontee[] {
  return [...hote.children] as BriqueMontee[];
}

function nomsCrees(creations: jasmine.Spy<Document['createElement']>): string[] {
  return creations.calls.allArgs().map(([nom]) => nom.toLowerCase());
}

function soumission(nom: string, detail: unknown): CustomEvent {
  return new CustomEvent(nom, { bubbles: true, composed: true, detail });
}

async function stabiliser(fixture: Fixture): Promise<void> {
  fixture.detectChanges();
  await fixture.componentInstance.quandMonte();
  fixture.detectChanges();
}

async function monter(ecran: EcranContent, options: OptionsDeMontage = {}): Promise<EcranMonte> {
  setupTestBed({ imports: [CoursEcranComponent], http: false, providers: options.providers });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(CoursEcranComponent);
  fixture.componentRef.setInput('ecran', ecran);
  if (options.rendu !== undefined) {
    fixture.componentRef.setInput('rendu', options.rendu);
  }
  if (options.role !== undefined) {
    fixture.componentRef.setInput('role', options.role);
  }
  const reponses: ReponseBrique[] = [];
  fixture.componentInstance.reponse.subscribe((reponse) => reponses.push(reponse));
  await stabiliser(fixture);
  return { fixture, hote: cible(fixture, 'cours-ecran-hote'), reponses };
}

function ecranNumerique(): EcranContent {
  return buildEcran({ type: 'fp-numeric', donnees: { question: buildNumericQuestion() } });
}

function ecranDeSortie(): EcranContent {
  return buildEcran({
    id: 'ecran-sortie',
    type: 'fp-exit',
    donnees: { billet: buildExitBillet() },
  });
}

describe('CoursEcranComponent', () => {
  it('monte la brique numerique avec sa question, son rendu et son role', async () => {
    const question = buildNumericQuestion();
    const { fixture, hote } = await monter(
      buildEcran({ type: 'fp-numeric', donnees: { question } }),
      { rendu: 'stage', role: 'presentateur' },
    );

    const briques = briquesDe(hote);
    expect(briques.map((brique) => brique.localName)).toEqual(['fp-numeric']);
    expect(briques[0].question?.id).toBe(question.id);
    expect(briques[0].shadowRoot?.textContent)
      .withContext('la question doit passer par le setter de la brique enregistree')
      .toContain(question.enonce);
    expect(briques[0].getAttribute('render')).toBe('stage');
    expect(briques[0].getAttribute('role')).toBe('presentateur');
    expect(fixture.componentInstance.pret()).toBeTrue();
  });

  it('ne liste que des proprietes dont chaque brique enregistree expose le setter', async () => {
    await monter(ecranNumerique());

    for (const [nom, cles] of Object.entries(PROPRIETES_PAR_BRIQUE)) {
      const prototype: object = customElements.get(nom)?.prototype ?? {};
      for (const cle of cles) {
        expect(Object.getOwnPropertyDescriptor(prototype, cle)?.set)
          .withContext(`${nom} n expose pas de setter « ${cle} »`)
          .toBeDefined();
      }
    }
  });

  it('pose le role avant les donnees pour que la brique projette selon ce role', async () => {
    const billet = buildExitBillet();
    const { hote } = await monter(ecranDeSortie(), { role: 'presentateur' });

    const [brique] = briquesDe(hote) as (HTMLElement & { billet: typeof billet | null })[];
    expect(brique.billet?.options).toEqual(billet.options);
  });

  it('n affecte jamais une propriete absente de la liste blanche de la brique', async () => {
    const { hote } = await monter(
      buildEcran({
        type: 'fp-numeric',
        donnees: {
          question: buildNumericQuestion(),
          innerHTML: '<img src="x" data-testid="injecte">',
        },
      }),
    );

    const [brique] = briquesDe(hote);
    expect(hote.innerHTML).not.toContain('injecte');
    expect(brique.shadowRoot?.innerHTML).not.toContain('injecte');
    expect(hote.querySelector('img')).toBeNull();
  });

  it('monte les questions d un questionnaire dans leur ordre, en rendu main et role etudiant', async () => {
    const { hote } = await monter(buildEcranQuestionnaire());

    const briques = briquesDe(hote);
    expect(briques.map((brique) => brique.localName)).toEqual(['fp-numeric', 'fp-vote']);
    expect(briques.map((brique) => brique.question?.id)).toEqual([
      buildNumericQuestion().id,
      buildVoteQuestion().id,
    ]);
    for (const brique of briques) {
      expect(brique.getAttribute('render')).toBe('hand');
      expect(brique.getAttribute('role')).toBe('etudiant');
    }
  });

  for (const type of ['iframe', 'script', 'constructor', '__proto__', 'fp-sheet']) {
    it(`signale le type d ecran inconnu « ${type} » sans creer d element`, async () => {
      const creations = spyOn(document, 'createElement').and.callThrough();
      const { fixture, hote } = await monter(
        buildEcran({ type, donnees: { question: buildNumericQuestion() } }),
      );

      expect(cible(fixture, 'cours-ecran-inconnu').getAttribute('role')).toBe('alert');
      expect(hote.childElementCount).toBe(0);
      expect(nomsCrees(creations)).not.toContain(type);
      expect(hote.querySelector('*')).toBeNull();
    });
  }

  const questionnairesInvalides: readonly { readonly cas: string; readonly questions: unknown }[] =
    [
      { cas: 'sans liste de questions', questions: 'fp-numeric' },
      { cas: 'vide', questions: [] },
      {
        cas: 'dont une brique est inconnue',
        questions: [
          { brique: 'fp-numeric', donnees: { question: buildNumericQuestion() } },
          { brique: 'script', donnees: {} },
        ],
      },
      { cas: 'dont une question n est pas un objet', questions: ['fp-numeric'] },
    ];

  for (const { cas, questions } of questionnairesInvalides) {
    it(`ne monte aucune brique d un questionnaire ${cas}`, async () => {
      const creations = spyOn(document, 'createElement').and.callThrough();
      const { fixture, hote } = await monter(
        buildEcranQuestionnaire({ donnees: { regime: 'focus', questions } }),
      );

      expect(cible(fixture, 'cours-ecran-inconnu')).toBeTruthy();
      expect(hote.childElementCount).toBe(0);
      expect(nomsCrees(creations).filter((nom) => nom.startsWith('fp-'))).toEqual([]);
    });
  }

  it('relaie la soumission du billet de sortie sans son texte libre', async () => {
    const { hote, reponses } = await monter(ecranDeSortie());

    briquesDe(hote)[0].dispatchEvent(
      new CustomEvent('fp-exit-submit', {
        bubbles: true,
        detail: { billetId: 'Q-EXIT', valeur: 'o2', texteLibre: 'x', dureeMs: 1200 },
      }),
    );

    expect(reponses).toEqual([{ questionId: 'Q-EXIT', valeur: 'o2', dureeMs: 1200 }]);
  });

  it('relaie les soumissions des questions numerique, de vote et de rappel', async () => {
    const { hote, reponses } = await monter(buildEcranQuestionnaire());
    const [numerique, vote] = briquesDe(hote);

    numerique.dispatchEvent(
      soumission('fp-numeric-submit', { questionId: 'Q-VA-07', valeur: 1480.24, dureeMs: 900 }),
    );
    vote.dispatchEvent(
      soumission('fp-vote-submit', { questionId: 'Q-CAP-03', valeur: 'b', dureeMs: 400 }),
    );
    vote.dispatchEvent(
      soumission('fp-recall-submit', {
        questionId: 'Q-RAPPEL-04',
        valeur: 'a',
        dureeMs: 3000,
        rappel: true,
      }),
    );

    expect(reponses).toEqual([
      { questionId: 'Q-VA-07', valeur: 1480.24, dureeMs: 900 },
      { questionId: 'Q-CAP-03', valeur: 'b', dureeMs: 400 },
      { questionId: 'Q-RAPPEL-04', valeur: 'a', dureeMs: 3000 },
    ]);
  });

  it('ignore une soumission sans identifiant ou dont la valeur est invalide', async () => {
    const { hote, reponses } = await monter(ecranNumerique());
    const [brique] = briquesDe(hote);
    const invalides: readonly unknown[] = [
      { valeur: 'o2', dureeMs: 1200 },
      { questionId: '', valeur: 'o2', dureeMs: 1200 },
      { questionId: 42, valeur: 'o2', dureeMs: 1200 },
      { billetId: '', valeur: 'o2', dureeMs: 1200 },
      { questionId: 'Q-VA-07', dureeMs: 1200 },
      { questionId: 'Q-VA-07', valeur: Number.NaN, dureeMs: 1200 },
      { questionId: 'Q-VA-07', valeur: Number.POSITIVE_INFINITY, dureeMs: 1200 },
      { questionId: 'Q-VA-07', valeur: { html: '<b>x</b>' }, dureeMs: 1200 },
      null,
      'Q-VA-07',
    ];

    for (const detail of invalides) {
      brique.dispatchEvent(soumission('fp-numeric-submit', detail));
    }

    expect(reponses).toEqual([]);
  });

  it('ramene a zero une duree negative, fractionnaire ou non numerique', async () => {
    const { hote, reponses } = await monter(ecranNumerique());
    const [brique] = briquesDe(hote);
    const durees: readonly unknown[] = [-5, 1.5, '1200', undefined, Number.NaN];

    for (const dureeMs of durees) {
      brique.dispatchEvent(
        soumission('fp-numeric-submit', { questionId: 'Q-VA-07', valeur: 3, dureeMs }),
      );
    }

    expect(reponses.map((reponse) => reponse.dureeMs)).toEqual([0, 0, 0, 0, 0]);
  });

  it('remplace les briques quand l ecran change', async () => {
    const { fixture, hote } = await monter(ecranNumerique());

    fixture.componentRef.setInput('ecran', ecranDeSortie());
    await stabiliser(fixture);

    const briques = briquesDe(hote);
    expect(briques.map((brique) => brique.localName)).toEqual(['fp-exit']);
    expect(briques[0].billet?.id).toBe(buildExitBillet().id);
  });

  it('retire l alerte quand un ecran inconnu laisse place a un ecran reconnu', async () => {
    const { fixture, hote } = await monter(buildEcran({ type: 'iframe' }));

    fixture.componentRef.setInput('ecran', ecranNumerique());
    await stabiliser(fixture);

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector("[data-testid='cours-ecran-inconnu']")).toBeNull();
    expect(briquesDe(hote).map((brique) => brique.localName)).toEqual(['fp-numeric']);
  });

  it('signale une brique dont le setter refuse ses donnees sans rien laisser dans l hote', async () => {
    const { fixture, hote } = await monter(
      buildEcran({ type: 'fp-vote', donnees: { question: {} } }),
      { rendu: 'hand' },
    );

    expect(cible(fixture, 'cours-ecran-inconnu').getAttribute('role')).toBe('alert');
    expect(hote.childElementCount).toBe(0);
    expect(fixture.componentInstance.pret()).toBeTrue();
  });

  it('ne monte aucune brique d un questionnaire dont la deuxieme question est mal formee', async () => {
    const creations = spyOn(document, 'createElement').and.callThrough();
    const { fixture, hote } = await monter(
      buildEcranQuestionnaire({
        donnees: {
          regime: 'focus',
          questions: [
            { brique: 'fp-numeric', donnees: { question: buildNumericQuestion() } },
            { brique: 'fp-vote', donnees: { question: {} } },
          ],
        },
      }),
    );

    expect(nomsCrees(creations)).toContain('fp-vote');
    expect(cible(fixture, 'cours-ecran-inconnu')).toBeTruthy();
    expect(hote.childElementCount).toBe(0);
  });

  it('garde la meme brique et met a jour son attribut quand le rendu change', async () => {
    const { fixture, hote } = await monter(ecranNumerique());
    const [avant] = briquesDe(hote);

    fixture.componentRef.setInput('rendu', 'stage');
    await stabiliser(fixture);

    const [apres] = briquesDe(hote);
    expect(apres).toBe(avant);
    expect(apres.getAttribute('render')).toBe('stage');
  });

  it('remonte la brique quand le role change', async () => {
    const { fixture, hote } = await monter(ecranNumerique());
    const [avant] = briquesDe(hote);

    fixture.componentRef.setInput('role', 'presentateur');
    await stabiliser(fixture);

    const briques = briquesDe(hote);
    expect(briques.length).toBe(1);
    expect(briques[0]).not.toBe(avant);
    expect(briques[0].getAttribute('role')).toBe('presentateur');
  });

  it('ne monte rien quand le composant est detruit pendant le chargement des briques', async () => {
    setupTestBed({ imports: [CoursEcranComponent], http: false });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(CoursEcranComponent);
    fixture.componentRef.setInput('ecran', ecranNumerique());
    fixture.detectChanges();
    const hote = cible(fixture, 'cours-ecran-hote');

    fixture.destroy();
    await fixture.componentInstance.quandMonte();

    expect(hote.childElementCount).toBe(0);
    expect(fixture.componentInstance.pret()).toBeFalse();
  });

  it('signale l echec du chargement des briques sans rien monter', async () => {
    const { fixture, hote } = await monter(ecranNumerique(), {
      providers: [
        {
          provide: ENREGISTREUR_DES_BRIQUES,
          useValue: () => Promise.reject(new Error('module des briques introuvable')),
        },
      ],
    });

    expect(cible(fixture, 'cours-ecran-echec').getAttribute('role')).toBe('alert');
    expect(hote.childElementCount).toBe(0);
    expect(fixture.componentInstance.pret()).toBeFalse();
  });
});
