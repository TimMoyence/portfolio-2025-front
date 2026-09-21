import { buildDetailDeBrique } from '../../../../testing/factories/evenements-brique.factory';
import type { EvenementBrique } from './contrat-hote';
import { EVENEMENTS_DES_BRIQUES, evenementsDe } from './evenements-brique';

const ECRAN = 'b2-01-atelier-1';

function traduire(
  nom: string,
  overrides: Readonly<Record<string, unknown>> = {},
): EvenementBrique[] {
  return evenementsDe(nom, buildDetailDeBrique(nom, overrides), ECRAN);
}

describe('evenementsDe : traduction des evenements de brique vers le contrat hote (§ 9.7)', () => {
  it('traduit chaque evenement declare en au moins un evenement de seance', () => {
    for (const nom of EVENEMENTS_DES_BRIQUES) {
      expect(traduire(nom).length).withContext(nom).toBeGreaterThan(0);
      expect(traduire(nom).every((evenement) => evenement.screenId === ECRAN))
        .withContext(nom)
        .toBeTrue();
    }
  });

  it('traduit une reponse numerique ou un vote en reponse de question', () => {
    expect(traduire('fp-numeric-submit')).toEqual([
      { kind: 'reponse', screenId: ECRAN, questionId: 'Q-VA-07', valeur: 1480.24, dureeMs: 1200 },
    ]);
    expect(traduire('fp-spaced-reponse')).toEqual([
      { kind: 'reponse', screenId: ECRAN, questionId: 'Q-ACT-01', valeur: 'act-a', dureeMs: 1200 },
    ]);
  });

  it('separe la reponse fermee et le texte libre du rappel et du billet de sortie', () => {
    expect(traduire('fp-recall-submit').map((evenement) => evenement.kind)).toEqual([
      'reponse',
      'libre',
    ]);
    expect(traduire('fp-recall-submit')[1]).toEqual(
      jasmine.objectContaining({ activityId: 'Q-RAPPEL-04:rappel' }),
    );
    expect(traduire('fp-exit-submit', { texteLibre: '   ' }).map((evenement) => evenement.kind))
      .withContext('un texte libre vide ne part pas')
      .toEqual(['reponse']);
  });

  it('traduit les productions avec leur forme typee', () => {
    expect(traduire('fp-sheet-submit')).toEqual([
      {
        kind: 'production',
        screenId: ECRAN,
        questionId: 'K-TABLEUR-01',
        valeur: { type: 'feuille', cellules: { C3: '=A3*B3' } },
        dureeMs: 1200,
      },
    ]);
    expect(traduire('fp-table-build-submit')[0]).toEqual(
      jasmine.objectContaining({
        valeur: { type: 'tableau', saisies: [{ rang: 0, cle: 'prix', valeur: 21.6 }] },
      }),
    );
    expect(traduire('fp-cardsort-submit', { classement: undefined, neSaitPas: true })[0]).toEqual(
      jasmine.objectContaining({ valeur: { type: 'classement', neSaitPas: true } }),
    );
  });

  it('ecarte une saisie de tableau non finie et un tableau sans saisie valide', () => {
    expect(
      traduire('fp-table-build-submit', {
        saisies: [
          { rang: 0, cle: 'prix', valeur: Number.NaN },
          { rang: '1', cle: 'prix', valeur: 3 },
        ],
      }),
    ).toEqual([]);
  });

  it('traduit une tentative d enigme, un defi et un jalon', () => {
    expect(traduire('fp-escape-tentative')[0]).toEqual(
      jasmine.objectContaining({
        kind: 'tentative',
        parcoursId: 'K-EVASION-01',
        enigmeId: 'seuil',
      }),
    );
    expect(traduire('fp-challenge-submit')[0]).toEqual(
      jasmine.objectContaining({ kind: 'defi', defiId: 'D-DEFI-07' }),
    );
    expect(traduire('fp-pulse-change')).toEqual([
      { kind: 'jalon', screenId: ECRAN, sondageId: 'P-PULSE-01', etat: 'perdu' },
    ]);
  });

  it('traduit chaque redaction non vide d un exemple guide en texte libre', () => {
    expect(
      traduire('fp-worked-submit').map((evenement) =>
        evenement.kind === 'libre' ? evenement.activityId : evenement.kind,
      ),
    ).toEqual(['E-CAP-01:etape-2', 'E-CAP-01:etape-2:pourquoi']);
  });

  it('refuse un detail sans duree entiere, sans identifiant ou d etat inconnu', () => {
    expect(traduire('fp-vote-submit', { dureeMs: -1 })).toEqual([]);
    expect(traduire('fp-vote-submit', { dureeMs: 1.5 })).toEqual([]);
    expect(traduire('fp-vote-submit', { questionId: '' })).toEqual([]);
    expect(traduire('fp-numeric-submit', { valeur: Number.POSITIVE_INFINITY })).toEqual([]);
    expect(traduire('fp-pulse-change', { etat: 'furieux' })).toEqual([]);
    expect(evenementsDe('fp-vote-submit', 'texte brut', ECRAN)).toEqual([]);
    expect(evenementsDe('fp-inconnu-submit', { dureeMs: 1 }, ECRAN)).toEqual([]);
  });
});
