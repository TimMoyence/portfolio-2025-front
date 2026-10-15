import {
  cliquerOmbre,
  creerBrique,
  detailsEmis,
  enregistrerBrique,
  libelleOmbre,
  noeudOmbre,
} from '../../../testing/banc-de-brique';
import { buildVerdictDeProduction } from '../../../testing/factories/cours.factory';
import { ecransPublicsDe } from '../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import { FpCardsort } from './FpCardsort';
import { FpSheet } from './FpSheet';
import { FpTableBuild } from './FpTableBuild';
import type { VerdictDeProduction } from './retours';

const BRIQUES_DE_PRODUCTION: Readonly<Record<string, readonly [CustomElementConstructor, string]>> =
  {
    'fp-sheet': [FpSheet, 'fp-sheet-submit'],
    'fp-table-build': [FpTableBuild, 'fp-table-build-submit'],
    'fp-cardsort': [FpCardsort, 'fp-cardsort-submit'],
  };

interface BriqueDeProduction extends HTMLElement {
  plan: { readonly id: string } | null;
  verdict: VerdictDeProduction | null;
}

const PRODUCTIONS_SERVIES = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
  ecransPublicsDe(instantane)
    .filter((ecran) => ecran.type in BRIQUES_DE_PRODUCTION)
    .map((ecran) => ({
      id: ecran.id,
      brique: ecran.type,
      plan: ecran.donnees?.['plan'] as { readonly id: string },
    })),
);

function reperes(hote: HTMLElement, selecteur: string): HTMLElement[] {
  return [...(hote.shadowRoot?.querySelectorAll<HTMLElement>(selecteur) ?? [])];
}

function ouverte(cellule: HTMLElement): boolean {
  if (cellule instanceof HTMLInputElement) {
    return !cellule.readOnly && !cellule.disabled;
  }
  return cellule instanceof HTMLSelectElement && !cellule.disabled;
}

function enregistrerLesProductions(): void {
  for (const [balise, [classe]] of Object.entries(BRIQUES_DE_PRODUCTION)) {
    enregistrerBrique(balise, classe);
  }
}

function verdictAffiche(hote: HTMLElement): readonly (string | null | undefined)[] {
  const verdict = noeudOmbre(hote, 'verdict');
  return [
    verdict?.getAttribute('data-etat'),
    verdict?.querySelector('strong')?.textContent,
    libelleOmbre(hote, 'score'),
  ];
}

describe('QA-06 · « je ne sais pas » à chaque production des cours servis', () => {
  beforeAll(enregistrerLesProductions);

  it('sert des feuilles, des tables et des tris', () => {
    expect(new Set(PRODUCTIONS_SERVIES.map(({ brique }) => brique))).toEqual(
      new Set(Object.keys(BRIQUES_DE_PRODUCTION)),
    );
  });

  for (const { id, brique, plan } of PRODUCTIONS_SERVIES) {
    it(`${id} : dit « je ne sais pas » sans score ni décompte, et ne marque ni ne rouvre aucune case`, () => {
      const [, evenement] = BRIQUES_DE_PRODUCTION[brique];
      const hote = creerBrique<BriqueDeProduction>(brique, (production) => {
        production.plan = plan;
      });
      const envois = detailsEmis<Readonly<Record<string, unknown>>>(hote, evenement);
      cliquerOmbre(hote, 'je-ne-sais-pas');
      hote.verdict = buildVerdictDeProduction({
        questionId: plan.id,
        correcte: false,
        score: 0,
        details: [],
        neSaitPas: true,
      });

      expect(envois.map((envoi) => envoi['neSaitPas'])).toEqual([true]);
      expect(libelleOmbre(hote, 'verdict')).toBe('Vous avez répondu « Je ne sais pas ».');
      expect(noeudOmbre(hote, 'decompte')).toBeNull();
      expect(noeudOmbre(hote, 'score')).toBeNull();
      expect(reperes(hote, '[data-etat="a-revoir"], [data-etat="confirme"]')).toEqual([]);
      expect(
        reperes(hote, '[data-testid="valider"], [data-testid="je-ne-sais-pas"]').map(
          (bouton) => (bouton as HTMLButtonElement).disabled,
        ),
      ).toEqual([true, true]);
      expect(reperes(hote, '[data-testid="cellule"]').filter(ouverte)).toEqual([]);
      hote.remove();
    });
  }
});

describe('QP-05 · une production des cours servis n est « Juste » que toute juste', () => {
  beforeAll(enregistrerLesProductions);

  for (const { id, brique, plan } of PRODUCTIONS_SERVIES) {
    it(`${id} : dit « À revoir » à une production juste à 80 %, score gardé, et « Juste » à la seule production toute juste`, () => {
      const hote = creerBrique<BriqueDeProduction>(brique, (production) => {
        production.plan = plan;
      });

      hote.verdict = buildVerdictDeProduction({ questionId: plan.id, correcte: false, score: 0.8 });
      expect(verdictAffiche(hote)).toEqual(['a-revoir', 'À revoir', 'Score : 80 %']);

      hote.verdict = buildVerdictDeProduction({ questionId: plan.id, correcte: true, score: 1 });
      expect(verdictAffiche(hote)).toEqual(['confirme', 'Juste', 'Score : 100 %']);
      hote.remove();
    });
  }
});
