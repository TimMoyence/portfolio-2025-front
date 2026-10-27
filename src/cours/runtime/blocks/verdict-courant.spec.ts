import { creerBrique, enregistrerBrique, noeudOmbre } from '../../../testing/banc-de-brique';
import {
  buildVerdictDeProduction,
  buildVerdictDeReponse,
} from '../../../testing/factories/cours.factory';
import { ecransPublicsDe } from '../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import { FpCardsort } from './FpCardsort';
import { FpRecall } from './FpRecall';
import { FpSheet } from './FpSheet';
import { FpTableBuild } from './FpTableBuild';

interface Contenu {
  readonly id: string;
}

interface BriqueJugee extends HTMLElement {
  verdict: { readonly questionId: string } | null;
}

interface Famille {
  readonly classe: CustomElementConstructor;
  readonly propriete: string;
  readonly verdictDe: (questionId: string) => { readonly questionId: string };
}

const REPONSE = (questionId: string) => buildVerdictDeReponse({ questionId });
const PRODUCTION = (questionId: string) => buildVerdictDeProduction({ questionId });

const BRIQUES_JUGEES: Readonly<Record<string, Famille>> = {
  'fp-recall': { classe: FpRecall, propriete: 'question', verdictDe: REPONSE },
  'fp-sheet': { classe: FpSheet, propriete: 'plan', verdictDe: PRODUCTION },
  'fp-table-build': { classe: FpTableBuild, propriete: 'plan', verdictDe: PRODUCTION },
  'fp-cardsort': { classe: FpCardsort, propriete: 'plan', verdictDe: PRODUCTION },
};

const ECRANS_JUGES = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
  ecransPublicsDe(instantane).flatMap((ecran) => {
    if (!(ecran.type in BRIQUES_JUGEES)) {
      return [];
    }
    const famille = BRIQUES_JUGEES[ecran.type];
    return [
      {
        id: ecran.id,
        brique: ecran.type,
        famille,
        contenu: ecran.donnees?.[famille.propriete] as Contenu,
      },
    ];
  }),
);

function poser(hote: BriqueJugee, propriete: string, contenu: Contenu): void {
  Object.assign(hote, { [propriete]: contenu });
}

describe('L4-F12 · une brique jugée ne garde que le verdict de sa question courante', () => {
  beforeAll(() => {
    for (const [balise, { classe }] of Object.entries(BRIQUES_JUGEES)) {
      enregistrerBrique(balise, classe);
    }
  });

  it('sert chaque brique jugée', () => {
    expect(new Set(ECRANS_JUGES.map(({ brique }) => brique))).toEqual(
      new Set(Object.keys(BRIQUES_JUGEES)),
    );
  });

  for (const { id, brique, famille, contenu } of ECRANS_JUGES) {
    it(`${id} : écarte le verdict d une autre question, garde le sien, l oublie à la question suivante`, () => {
      const hote = creerBrique<BriqueJugee>(brique, (cible) =>
        poser(cible, famille.propriete, contenu),
      );

      hote.verdict = famille.verdictDe(`${contenu.id}-AUTRE`);
      expect(hote.verdict).toBeNull();
      expect(noeudOmbre(hote, 'verdict')).toBeNull();

      const sien = famille.verdictDe(contenu.id);
      hote.verdict = sien;
      expect(hote.verdict).toBe(sien);
      expect(noeudOmbre(hote, 'verdict')).not.toBeNull();

      poser(hote, famille.propriete, { ...contenu, id: `${contenu.id}-SUIVANTE` });
      expect(hote.verdict).toBeNull();
      expect(noeudOmbre(hote, 'verdict')).toBeNull();
      hote.remove();
    });
  }
});
