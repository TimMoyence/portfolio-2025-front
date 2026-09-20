import type { OuvertureFlux } from '../cours/runtime/core/sync';

const ENCODEUR = new TextEncoder();

export interface FluxFactice {
  url: string;
  entetes: Record<string, string>;
  envoyer(morceau: string): Promise<void>;
  couper(): Promise<void>;
}

export async function vider(): Promise<void> {
  for (let tour = 0; tour < 200; tour += 1) {
    await Promise.resolve();
  }
}

export async function laisserPasserLeFlux(): Promise<void> {
  for (let tour = 0; tour < 5; tour += 1) {
    await new Promise<void>((resoudre) => {
      const canal = new MessageChannel();
      canal.port1.onmessage = () => resoudre();
      canal.port2.postMessage(null);
    });
    await vider();
  }
}

export function creerOuverture(flux: FluxFactice[], statut = 200): OuvertureFlux {
  return (url, entetes) => {
    const enAttente: { morceau: string | null; servi: () => void }[] = [];
    let reclame: (() => void) | null = null;

    const corps = new ReadableStream<Uint8Array>({
      pull: async (controleur) => {
        while (enAttente.length === 0) {
          await new Promise<void>((resoudre) => {
            reclame = resoudre;
          });
        }
        const suivant = enAttente.shift();
        if (!suivant) {
          return;
        }
        if (suivant.morceau === null) {
          controleur.close();
        } else {
          controleur.enqueue(ENCODEUR.encode(suivant.morceau));
        }
        suivant.servi();
      },
    });

    const deposer = (morceau: string | null): Promise<void> =>
      new Promise<void>((resoudre) => {
        enAttente.push({ morceau, servi: resoudre });
        reclame?.();
        reclame = null;
      });

    flux.push({
      url,
      entetes,
      envoyer: async (morceau) => {
        await deposer(morceau);
        await vider();
      },
      couper: async () => {
        await deposer(null);
        await vider();
      },
    });
    return Promise.resolve(new Response(corps, { status: statut }));
  };
}

export function bloc(nom: string, charge: unknown): string {
  return `event: ${nom}\ndata: ${JSON.stringify(charge)}\n\n`;
}
