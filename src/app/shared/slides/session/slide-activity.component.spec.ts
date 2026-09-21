import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { attendreQue, briqueMontee } from '../../../../testing/briques-montees';
import {
  buildCardsortPlan,
  buildEcran,
  buildEcranQuestionnaire,
  buildExitBillet,
  buildNumericQuestion,
  createBrouillonsStub,
} from '../../../../testing/factories/cours.factory';
import { buildDetailDeBrique } from '../../../../testing/factories/evenements-brique.factory';
import {
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../../testing/factories/formations.factory';
import {
  buildVisualQuizSlide,
  buildVisualSlide,
} from '../../../../testing/factories/visual-slide.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { EvenementBrique, RetourBrique } from './contrat-hote';
import { EVENEMENTS_DES_BRIQUES } from './evenements-brique';
import { SlideActivityComponent } from './slide-activity.component';

type Fixture = ComponentFixture<SlideActivityComponent>;

const ECRAN_NUMERIQUE = buildEcran({
  id: 'b2-01-numerique',
  type: 'fp-numeric',
  donnees: { question: buildNumericQuestion() },
});
const ECRAN_BILLET = buildEcran({
  id: 'b2-01-sortie',
  type: 'fp-exit',
  donnees: { billet: buildExitBillet() },
});
const ECRAN_CLASSEMENT = buildEcran({
  id: 'b2-01-classement',
  type: 'fp-cardsort',
  donnees: { plan: buildCardsortPlan() },
});
const ATTENDUS = {
  type: 'classement',
  attendus: [{ carteId: 'loyer', categorieId: 'fixe', justification: 'Indépendant du volume' }],
};
const VERDICT: RetourBrique = {
  kind: 'verdict-reponse',
  questionId: 'Q-VA-07',
  correcte: false,
  libelleConfusion: 'Intérêts simples au lieu de composés',
};
function monter(entrees: Readonly<Record<string, unknown>>): Fixture {
  const fixture = TestBed.createComponent(SlideActivityComponent);
  for (const [nom, valeur] of Object.entries(entrees)) {
    fixture.componentRef.setInput(nom, valeur);
  }
  fixture.detectChanges();
  return fixture;
}

const brique = briqueMontee;

function evenements(fixture: Fixture): EvenementBrique[] {
  const recus: EvenementBrique[] = [];
  fixture.componentInstance.evenement.subscribe((evenement) => recus.push(evenement));
  return recus;
}

function dans(element: HTMLElement, testid: string): HTMLElement | null {
  return element.shadowRoot?.querySelector<HTMLElement>(`[data-testid="${testid}"]`) ?? null;
}

function repondre(numerique: HTMLElement, saisie: string): void {
  const champ = dans(numerique, 'champ') as HTMLInputElement;
  champ.value = saisie;
  champ.dispatchEvent(new Event('input'));
  dans(numerique, 'valider')?.click();
}

describe('SlideActivityComponent : deck visuel B2', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('projette le quiz v2 sans interaction pour le formateur et compte les reponses recues', () => {
    const fixture = monter({
      slide: buildVisualQuizSlide(),
      render: 'stage',
      role: 'presentateur',
      resultats: buildResultatsSeance({
        participants: 12,
        questions: [buildResultatQuestion({ questionId: 'b2-s03-prediction', total: 7 })],
      }),
    });

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('button.slide-quiz__option').length).toBe(0);
    expect(element.querySelectorAll('.slide-quiz__option').length).toBe(2);
    expect(
      element
        .querySelector('[data-testid="slide-quiz-reponses-recues"]')
        ?.textContent?.replace(/\s+/g, ' '),
    ).toContain('7 / 12');
  });

  it('utilise le même renderer visuel que le catalogue pour l’étudiant', () => {
    const fixture = monter({ slide: buildVisualSlide(), role: 'etudiant' });

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-slide-visual app-slide-hero')).not.toBeNull();
    expect(element.textContent).toContain('Lire un chiffre');
    expect(element.querySelector('fp-story')).toBeNull();
  });

  it('transmet le choix QCM à la séance comme événement de brique, sans bonne réponse côté client', () => {
    const fixture = monter({
      slide: buildVisualQuizSlide(),
      role: 'etudiant',
      sessionId: 'seance-1',
    });
    const recus = evenements(fixture);

    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.slide-quiz__option')[1]
      .click();
    fixture.detectChanges();

    expect(recus).toEqual([
      jasmine.objectContaining({
        kind: 'reponse',
        screenId: 'B2-01-S03-PREDICTION',
        questionId: 'b2-s03-prediction',
        valeur: 'o2',
      }),
    ]);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'La bonne réponse est',
    );
  });
});

describe('SlideActivityComponent : hôte des briques runtime (§ 9.7)', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('monte la brique de l ecran avec son rendu et le role du poste (F3)', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE, render: 'board', role: 'presentateur' });
    const numerique = await brique(fixture, 'fp-numeric');

    expect(numerique.getAttribute('render')).toBe('board');
    expect(numerique.getAttribute('data-cours-role')).toBe('presentateur');
    expect(numerique.hasAttribute('data-apercu')).toBeFalse();
  });

  it('pose l entete d un questionnaire et monte une brique par question', async () => {
    const fixture = monter({ slide: buildEcranQuestionnaire() });
    await brique(fixture, 'fp-vote');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="slide-activity-entete"] h2')?.textContent).toBe(
      'Atelier 1 — Lire, rapporter, estimer',
    );
    expect(element.querySelectorAll('fp-numeric, fp-vote').length).toBe(2);
  });

  it('traduit la soumission d une brique en evenement de seance', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE, sessionId: 'seance-1' });
    const recus = evenements(fixture);
    repondre(await brique(fixture, 'fp-numeric'), '1 480,24');

    expect(recus).toEqual([
      {
        kind: 'reponse',
        screenId: 'b2-01-numerique',
        questionId: 'Q-VA-07',
        valeur: 1480.24,
        dureeMs: jasmine.any(Number),
      },
    ]);
  });

  it('relaie chaque evenement declare par les briques', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE });
    const recus = evenements(fixture);
    const numerique = await brique(fixture, 'fp-numeric');

    for (const nom of EVENEMENTS_DES_BRIQUES) {
      const avant = recus.length;
      numerique.dispatchEvent(
        new CustomEvent(nom, { detail: buildDetailDeBrique(nom), bubbles: true, composed: true }),
      );
      expect(recus.length).withContext(nom).toBeGreaterThan(avant);
    }
  });

  it('pose les retours sans remonter la brique ni perdre la saisie en cours (F6)', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE });
    const numerique = await brique(fixture, 'fp-numeric');
    const champ = dans(numerique, 'champ') as HTMLInputElement;
    champ.value = '1 400';
    champ.dispatchEvent(new Event('input'));

    fixture.componentRef.setInput('retours', new Map([['b2-01-numerique', [VERDICT]]]));
    fixture.detectChanges();

    expect(await brique(fixture, 'fp-numeric')).toBe(numerique);
    expect((dans(numerique, 'champ') as HTMLInputElement).value).toBe('1 400');
    expect(dans(numerique, 'confusion')?.textContent).toBe('Intérêts simples au lieu de composés');
  });

  it('annonce deja repondu sur la brique visee', async () => {
    const fixture = monter({
      slide: ECRAN_NUMERIQUE,
      retours: new Map([['b2-01-numerique', [{ kind: 'deja-repondu', questionId: 'Q-VA-07' }]]]),
    });
    const numerique = await brique(fixture, 'fp-numeric');

    expect(dans(numerique, 'deja-repondu')?.textContent).toBe(
      'Réponse déjà enregistrée : voici votre verdict',
    );
    expect((dans(numerique, 'champ') as HTMLInputElement).disabled).toBeTrue();
  });

  it('montre un refus a la seule brique qui vient d emettre', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE });
    const numerique = await brique(fixture, 'fp-numeric');
    repondre(numerique, '12');

    fixture.componentRef.setInput(
      'retours',
      new Map([
        [
          'b2-01-numerique',
          [
            {
              kind: 'refus',
              motif: 'phase-fermee',
              message: 'Le vote est fermé pour cette question',
            },
          ],
        ],
      ]),
    );
    fixture.detectChanges();

    expect(dans(numerique, 'erreur')?.textContent).toBe('Le vote est fermé pour cette question');
    expect((dans(numerique, 'champ') as HTMLInputElement).disabled).toBeFalse();
  });

  it('n emet rien et marque les briques en apercu hors seance', async () => {
    const brouillons = createBrouillonsStub();
    const fixture = monter({ slide: ECRAN_NUMERIQUE, apercu: true, brouillons });
    const recus = evenements(fixture);
    const numerique = await brique(fixture, 'fp-numeric');
    repondre(numerique, '1 480,24');

    expect(numerique.hasAttribute('data-apercu')).toBeTrue();
    expect(recus).toEqual([]);
    expect(dans(numerique, 'retour')?.textContent).toBe(
      'Aperçu : les réponses s’envoient pendant la séance',
    );
    expect(brouillons.lire).not.toHaveBeenCalled();
  });

  it('reprend le brouillon de la brique au montage et memorise chaque frappe', async () => {
    const brouillons = createBrouillonsStub();
    brouillons.lire.and.returnValue({ texteLibre: 'Repris apres rechargement', choix: 'b' });
    const fixture = monter({ slide: ECRAN_BILLET, brouillons });
    const billet = await brique(fixture, 'fp-exit');

    expect(brouillons.lire).toHaveBeenCalledWith('fp-exit', 'B-SORTIE-09');
    expect((dans(billet, 'texte-libre') as HTMLTextAreaElement).value).toBe(
      'Repris apres rechargement',
    );

    const champ = dans(billet, 'texte-libre') as HTMLTextAreaElement;
    champ.value = 'Nouvelle frappe';
    champ.dispatchEvent(new Event('input'));

    expect(brouillons.ecrire).toHaveBeenCalledWith(
      'fp-exit',
      'B-SORTIE-09',
      jasmine.objectContaining({ texteLibre: 'Nouvelle frappe' }),
    );
  });

  it('ne donne le classement de reference qu au pupitre', async () => {
    const etudiant = monter({
      slide: ECRAN_CLASSEMENT,
      render: 'board',
      donneesFormateur: ATTENDUS,
    });
    expect(dans(await brique(etudiant, 'fp-cardsort'), 'attendus')).toBeNull();

    const pupitre = monter({
      slide: ECRAN_CLASSEMENT,
      render: 'board',
      role: 'presentateur',
      donneesFormateur: ATTENDUS,
    });
    expect(dans(await brique(pupitre, 'fp-cardsort'), 'attendu')?.textContent).toContain(
      'Indépendant du volume',
    );
  });

  it('remonte la brique quand le rendu change', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE });
    const avant = await brique(fixture, 'fp-numeric');
    fixture.componentRef.setInput('render', 'stage');
    fixture.detectChanges();
    await fixture.whenStable();
    const apres = await brique(fixture, 'fp-numeric');

    expect(apres).not.toBe(avant);
    expect(apres.getAttribute('render')).toBe('stage');
  });

  it('presente un ecran verrouille par son titre et sa duree, sans brique', () => {
    const fixture = monter({
      slide: buildEcran({
        id: 'b2-01-verrou',
        type: 'ecran-verrouille',
        titre: 'Atelier 3',
        duree: 12,
      }),
    });
    const verrou = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="slide-activity-verrouille"]',
    );

    expect(verrou?.textContent?.replace(/\s+/g, ' ')).toContain('Atelier 3');
    expect(verrou?.textContent?.replace(/\s+/g, ' ')).toContain(
      '12 min · Disponible pendant la séance',
    );
  });

  it('signale un ecran dont la brique n est pas connue', async () => {
    const fixture = monter({ slide: buildEcran({ id: 'b2-01-inconnu', type: 'fp-inconnue' }) });
    const inconnu = (): Element | null =>
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="slide-activity-unknown"]',
      );

    await attendreQue(fixture, () => inconnu() !== null, 'l ecran inconnu');

    expect(inconnu()?.getAttribute('role')).toBe('alert');
  });
});
