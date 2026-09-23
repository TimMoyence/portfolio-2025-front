import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { attendreQue, briqueMontee } from '../../../../testing/briques-montees';
import {
  buildCardsortPlan,
  buildEcran,
  buildEcranQuestionnaire,
  buildExitBillet,
  buildNumericQuestion,
  buildSheetPlan,
  createBrouillonsStub,
} from '../../../../testing/factories/cours.factory';
import { buildDetailDeBrique } from '../../../../testing/factories/evenements-brique.factory';
import {
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../../testing/factories/formations.factory';
import {
  TRI_CORRIGE,
  buildVerdictDuTri,
  buildVisualQuizSlide,
  buildVisualSlide,
  buildVisualSortReviewSlide,
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

function directRevele(revele: boolean) {
  return { pilotage: revele ? { revele: true } : {}, resultats: null, comptesJalon: null };
}

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

  it('L4 · transmet les retours du tri a l ecran de correction pour border les cartes mal placees', () => {
    const fixture = monter({
      slide: buildVisualSortReviewSlide(),
      role: 'etudiant',
      sessionId: 'seance-1',
      retours: new Map([[TRI_CORRIGE.screenId, [buildVerdictDuTri({ inflation: false })]]]),
    });

    const erreurs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '.slide-sort-review__carte--erreur',
    );
    expect([...erreurs].map((carte) => carte.dataset['carte'])).toEqual(['inflation']);
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

  it('RET-20 · projette l histogramme des votes d un questionnaire une fois la correction revelee', async () => {
    const resultats = [
      buildResultatQuestion({ questionId: 'Q-CAP-03', total: 4, parOption: { a: 1, b: 3 } }),
    ];
    const direct = (revele: boolean) => ({
      pilotage: revele ? { revele: true } : {},
      resultats,
      comptesJalon: null,
    });
    const fixture = monter({
      slide: buildEcranQuestionnaire(),
      render: 'stage',
      role: 'presentateur',
      direct: direct(false),
    });
    const vote = await brique(fixture, 'fp-vote');
    const barres = (): number =>
      vote.shadowRoot?.querySelectorAll('[data-testid="barre"]').length ?? 0;

    expect(barres()).toBe(0);
    fixture.componentRef.setInput('direct', direct(true));
    fixture.detectChanges();
    expect(barres()).toBeGreaterThan(0);
  });

  it('RET-32 · projette la bonne reponse de chaque question du questionnaire une fois revelee', async () => {
    const reponses = {
      type: 'reponses',
      reponses: { 'Q-VA-07': '1 480,24', 'Q-CAP-03': '1 480,24 €' },
    };
    const direct = directRevele;
    const fixture = monter({
      slide: buildEcranQuestionnaire(),
      render: 'stage',
      role: 'presentateur',
      direct: direct(false),
      donneesFormateur: reponses,
    });
    const vote = await brique(fixture, 'fp-vote');
    const numerique = await brique(fixture, 'fp-numeric');

    expect(dans(vote, 'bonne-reponse')).toBeNull();
    expect(dans(numerique, 'bonne-reponse')).toBeNull();
    fixture.componentRef.setInput('direct', direct(true));
    fixture.detectChanges();
    expect(dans(vote, 'bonne-reponse')?.textContent).toContain('1 480,24 €');
    expect(dans(numerique, 'bonne-reponse')?.textContent).toContain('1 480,24');
  });

  it('RET-32 · ferme aux reponses le poste etudiant une fois la correction du questionnaire revelee', async () => {
    const direct = directRevele;
    const fixture = monter({
      slide: buildEcranQuestionnaire(),
      role: 'etudiant',
      sessionId: 'seance-1',
      direct: direct(false),
    });
    const vote = await brique(fixture, 'fp-vote');
    const numerique = await brique(fixture, 'fp-numeric');
    const options = (): HTMLButtonElement[] => [
      ...(vote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-option]') ?? []),
    ];

    expect(options().every((option) => !option.disabled)).toBeTrue();
    expect((dans(numerique, 'champ') as HTMLInputElement).disabled).toBeFalse();
    fixture.componentRef.setInput('direct', direct(true));
    fixture.detectChanges();
    expect(options().length).toBeGreaterThan(0);
    expect(options().every((option) => option.disabled)).toBeTrue();
    expect((dans(numerique, 'champ') as HTMLInputElement).disabled).toBeTrue();
    expect(dans(numerique, 'reponses-closes')).not.toBeNull();
  });

  it('RET-31 · projette la correction de la feuille au rythme de l etayage du pupitre', async () => {
    const direct = (etayage: number) => ({
      pilotage: etayage === 0 ? {} : { etayage },
      resultats: null,
      comptesJalon: null,
    });
    const fixture = monter({
      slide: buildEcran({
        id: 'b2-01-feuille',
        type: 'fp-sheet',
        donnees: { plan: buildSheetPlan() },
      }),
      render: 'stage',
      role: 'presentateur',
      direct: direct(0),
      donneesFormateur: {
        type: 'feuille',
        attendus: [{ reference: 'D3', formuleReference: '=C3*(1+$B$1)', valeur: 64.8 }],
      },
    });
    const feuille = await brique(fixture, 'fp-sheet');

    expect(dans(feuille, 'correction-feuille')).toBeNull();
    fixture.componentRef.setInput('direct', direct(1));
    fixture.detectChanges();
    expect(dans(feuille, 'correction-feuille')?.textContent?.trim()).toBe('=C3*(1+$B$1)');
    fixture.componentRef.setInput('direct', direct(2));
    fixture.detectChanges();
    expect(dans(feuille, 'correction-feuille')?.textContent?.trim()).toBe('=C3*(1+$B$1) 64,8');
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

  it('L3 · relaie les reponses libres d un cas professionnel a la seance', async () => {
    const fixture = monter({ slide: ECRAN_NUMERIQUE });
    const recus = evenements(fixture);
    const numerique = await brique(fixture, 'fp-numeric');

    numerique.dispatchEvent(
      new CustomEvent('fp-pro-submit', {
        detail: buildDetailDeBrique('fp-pro-submit'),
        bubbles: true,
        composed: true,
      }),
    );

    expect(recus).toEqual([
      jasmine.objectContaining({ kind: 'libre', activityId: 'b2-01-a1-mission:mesure' }),
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
