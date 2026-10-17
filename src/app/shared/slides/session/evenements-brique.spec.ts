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

const PLANS_OU_RANGS_FAUTIFS = [{ planId: '' }, { rang: -1 }, { rang: 1.5 }];

function refuserChacun(nom: string, fautifs: readonly Readonly<Record<string, unknown>>[]): void {
  for (const fautif of fautifs) {
    expect(traduire(nom, fautif)).withContext(JSON.stringify(fautif)).toEqual([]);
  }
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
    ).toEqual(['E-CAP-01:etape-2']);
  });

  it('RET-21 · traduit le reglage de la machine en commande de reglage de l ecran', () => {
    expect(traduire('fp-concept4-reglage')).toEqual([
      { kind: 'reglage', screenId: ECRAN, reglages: { prix: 250, taux: -12 } },
    ]);
    expect(traduire('fp-concept4-reglage', { reglages: { prix: 'cent' } })).toEqual([]);
  });

  it('F-37 · traduit la demande d evaluation de la machine en evaluation de l ecran, distincte du reglage', () => {
    expect(traduire('fp-concept4-evaluation')).toEqual([
      { kind: 'evaluation-machine', screenId: ECRAN, reglages: { tauxUn: 50, tauxDeux: -50 } },
    ]);
    expect(traduire('fp-concept4-evaluation', { reglages: { tauxUn: 'cinquante' } })).toEqual([]);
    expect(traduire('fp-concept4-evaluation', { reglages: {} })).toEqual([]);
  });

  it('F-36 · traduit la demande d evaluation de la feuille en evaluation de son plan, recopie comprise', () => {
    const evaluation: Extract<EvenementBrique, { kind: 'evaluation-feuille' }> = {
      kind: 'evaluation-feuille',
      screenId: ECRAN,
      planId: 'K-TABLEUR-01',
      rang: 3,
      demande: { cellules: { C3: '=A3*B3' } },
    };

    expect(traduire('fp-sheet-evaluation')).toEqual([evaluation]);
    expect(traduire('fp-sheet-evaluation', { recopie: { de: 'C3' } })).toEqual([
      { ...evaluation, demande: { cellules: { C3: '=A3*B3' }, recopie: { de: 'C3' } } },
    ]);
    expect(traduire('fp-sheet-evaluation', { cellules: { C3: 7, D3: '=C3' } })).toEqual([
      jasmine.objectContaining({ demande: { cellules: { D3: '=C3' } } }),
    ]);
  });

  it('F-36 · refuse une demande d evaluation de feuille sans plan, sans rang entier, sans cellules ou a la recopie sans origine', () => {
    refuserChacun('fp-sheet-evaluation', [
      ...PLANS_OU_RANGS_FAUTIFS,
      { cellules: null },
      { recopie: {} },
      { recopie: { de: '' } },
      { recopie: 'C3' },
    ]);
  });

  it('F-37 · traduit la demande d evaluation du tableau en evaluation de son plan, saisies brutes comprises', () => {
    expect(traduire('fp-table-build-evaluation')).toEqual([
      {
        kind: 'evaluation-tableau',
        screenId: ECRAN,
        planId: 'b2-01-a4-indice-toile',
        rang: 2,
        saisies: [{ rang: 0, cle: 'prix', saisie: '21,6' }],
      },
    ]);
    expect(traduire('fp-table-build-evaluation', { saisies: [] })).toEqual([
      jasmine.objectContaining({ saisies: [] }),
    ]);
    expect(
      traduire('fp-table-build-evaluation', {
        saisies: [
          { rang: 0, cle: 'prix', saisie: 21.6 },
          { rang: -1, cle: 'prix', saisie: '1' },
          { rang: 1.5, cle: 'prix', saisie: '1' },
          { rang: 1, cle: '', saisie: '1' },
          null,
          { rang: 1, cle: 'indice', saisie: '102,6' },
        ],
      }),
    ).toEqual([
      jasmine.objectContaining({ saisies: [{ rang: 1, cle: 'indice', saisie: '102,6' }] }),
    ]);
  });

  it('F-37 · refuse une demande d evaluation de tableau sans plan, sans rang entier ou sans liste de saisies', () => {
    refuserChacun('fp-table-build-evaluation', [
      ...PLANS_OU_RANGS_FAUTIFS,
      { saisies: null },
      { saisies: { rang: 0, cle: 'prix', saisie: '1' } },
    ]);
  });

  it('L3 · traduit chaque reponse non vide d un cas professionnel en texte libre de sa question', () => {
    expect(traduire('fp-pro-submit')).toEqual([
      {
        kind: 'libre',
        screenId: ECRAN,
        activityId: 'b2-01-a1-mission:mesure',
        response: 'Un montant de chiffre d affaires',
        dureeMs: 1200,
      },
    ]);
    expect(traduire('fp-pro-submit', { casId: '' })).toEqual([]);
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

  it('transmet a la seance une duree nulle, celle d un poste dont l horloge a recule', () => {
    expect(traduire('fp-numeric-submit', { dureeMs: 0 })).toEqual([
      { kind: 'reponse', screenId: ECRAN, questionId: 'Q-VA-07', valeur: 1480.24, dureeMs: 0 },
    ]);
  });
});
