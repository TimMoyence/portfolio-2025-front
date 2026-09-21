import * as fc from 'fast-check';
import type { FluxFactice } from '../../../testing/flux-sse';
import { bloc, creerOuverture, vider } from '../../../testing/flux-sse';
import type { EtatSession, RaisonDeFin, ResultatsDuFlux, Sync } from './sync';
import { createSync } from './sync';

const BASE = 'https://api.test';
const SESSION = 'seance-simulee';
const JETON = 'jeton-participant';
const GRAINE = 20260920;
const TOURS = 30;

type Evenement =
  | { readonly nom: 'etat'; readonly ecranCourant: number; readonly revision: number }
  | { readonly nom: 'heartbeat' }
  | { readonly nom: 'resultats'; readonly participants: number }
  | { readonly nom: 'fin'; readonly raison: RaisonDeFin };

interface Recolte {
  readonly etats: readonly EtatSession[];
  readonly resultats: readonly ResultatsDuFlux[];
  readonly fins: readonly (RaisonDeFin | null)[];
}

const evenementSansFin: fc.Arbitrary<Evenement> = fc.oneof(
  fc
    .record({ ecranCourant: fc.integer({ min: 0, max: 51 }), revision: fc.nat({ max: 99 }) })
    .map((champs) => ({ nom: 'etat' as const, ...champs })),
  fc.constant({ nom: 'heartbeat' as const }),
  fc.nat({ max: 40 }).map((participants) => ({ nom: 'resultats' as const, participants })),
);

const raison: fc.Arbitrary<RaisonDeFin> = fc.constantFrom<RaisonDeFin[]>(
  'cloturee',
  'introuvable',
  'expiree',
);

function texteDe(evenement: Evenement): string {
  if (evenement.nom === 'etat') {
    return bloc('etat', {
      etat: 'en_cours',
      modeRythme: 'pilote',
      ecranCourant: evenement.ecranCourant,
      intervalleLibre: null,
      participants: 12,
      revision: evenement.revision,
      pilotage: { 'B2-01-A3-01': { phase: 'revote' } },
      majLe: '2026-09-20T08:00:00.000Z',
    });
  }
  if (evenement.nom === 'resultats') {
    return bloc('resultats', { participants: evenement.participants, questions: [] });
  }
  if (evenement.nom === 'fin') {
    return bloc('fin', { raison: evenement.raison });
  }
  return bloc('heartbeat', { ts: '2026-09-20T08:00:00.000Z' });
}

function decouper(texte: string, coupes: readonly number[]): readonly string[] {
  const bornes = [...new Set(coupes.map((coupe) => coupe % Math.max(1, texte.length)))]
    .filter((borne) => borne > 0 && borne < texte.length)
    .sort((a, b) => a - b);
  const morceaux: string[] = [];
  let debut = 0;
  for (const borne of [...bornes, texte.length]) {
    morceaux.push(texte.slice(debut, borne));
    debut = borne;
  }
  return morceaux.filter((morceau) => morceau !== '');
}

async function jouer(
  morceaux: readonly string[],
  attendus: number,
): Promise<{ recolte: Recolte; sync: Sync }> {
  const flux: FluxFactice[] = [];
  const etats: EtatSession[] = [];
  const resultats: ResultatsDuFlux[] = [];
  const fins: (RaisonDeFin | null)[] = [];
  const sync = createSync({
    baseUrl: BASE,
    sessionId: SESSION,
    jeton: JETON,
    ouvrirFlux: creerOuverture(flux),
  });
  sync.onState((etat) => etats.push(etat));
  sync.onResultats((recus) => resultats.push(recus));
  sync.onFin((motif) => fins.push(motif));
  sync.ouvrir();
  await vider();
  for (const morceau of morceaux) {
    await flux[0].envoyer(morceau);
  }
  const livres = (): number => etats.length + resultats.length + fins.length;
  for (let tour = 0; tour < 60 && livres() < attendus; tour += 1) {
    await new Promise((resoudre) => setTimeout(resoudre, 0));
  }
  await vider();
  return { recolte: { etats, resultats, fins }, sync };
}

describe('simulation : le flux de séance livre exactement ce que le back a émis', () => {
  it('rend chaque état et chaque résultat dans l’ordre, quelles que soient les coupures d’octets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(evenementSansFin, { minLength: 1, maxLength: 8 }),
        fc.array(fc.nat({ max: 4000 }), { maxLength: 10 }),
        async (evenements, coupes) => {
          const texte = evenements.map(texteDe).join('');
          const porteurs = evenements.filter((evenement) => evenement.nom !== 'heartbeat').length;
          const { recolte, sync } = await jouer(decouper(texte, coupes), porteurs);
          sync.close();

          expect(recolte.etats.map((etat) => etat.ecranCourant)).toEqual(
            evenements
              .filter((evenement) => evenement.nom === 'etat')
              .map((evenement) => evenement.ecranCourant),
          );
          expect(recolte.etats.map((etat) => etat.revision)).toEqual(
            evenements
              .filter((evenement) => evenement.nom === 'etat')
              .map((evenement) => evenement.revision),
          );
          expect(recolte.resultats.map((recus) => recus.participants)).toEqual(
            evenements
              .filter((evenement) => evenement.nom === 'resultats')
              .map((evenement) => evenement.participants),
          );
          expect(recolte.fins).toEqual([]);
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('coupe tout à la fin de séance : rien de ce qui suit n’atteint le poste', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(evenementSansFin, { minLength: 1, maxLength: 5 }),
        fc.array(evenementSansFin, { minLength: 1, maxLength: 5 }),
        raison,
        async (avant, apres, motif) => {
          const texte = [...avant, { nom: 'fin' as const, raison: motif }, ...apres]
            .map(texteDe)
            .join('');
          const porteurs = avant.filter((evenement) => evenement.nom !== 'heartbeat').length;
          const { recolte, sync } = await jouer([texte], porteurs + 1);
          sync.close();

          expect(recolte.fins).toEqual([motif]);
          expect(recolte.etats.length).toBe(
            avant.filter((evenement) => evenement.nom === 'etat').length,
          );
          expect(recolte.resultats.length).toBe(
            avant.filter((evenement) => evenement.nom === 'resultats').length,
          );
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('ignore un état ou un résultat que le serveur sert hors contrat, sans rompre le flux', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          bloc('etat', { etat: 'inconnu', modeRythme: 'pilote' }),
          bloc('etat', { etat: 'en_cours', modeRythme: 'chaotique' }),
          bloc('resultats', { participants: 'douze', questions: [] }),
          bloc('resultats', { participants: 3, questions: [{ questionId: 'Q-1' }] }),
        ),
        fc.integer({ min: 0, max: 51 }),
        async (horsContrat, ecranCourant) => {
          const bon = texteDe({ nom: 'etat', ecranCourant, revision: 4 });
          const { recolte, sync } = await jouer([horsContrat, bon], 1);
          sync.close();

          expect(recolte.etats.map((etat) => etat.ecranCourant)).toEqual([ecranCourant]);
          expect(recolte.resultats).toEqual([]);
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});
