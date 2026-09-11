import { readJson, writeJson } from './storage';

const CLE = 'fp.file-reponses';
const CAPACITE_MAX = 200;

export interface EnvoiReponse {
  sessionId: string;
  studentKey: string;
  questionId: string;
  valeur: unknown;
  dureeMs: number;
  horodatage: string;
}

export type Envoyeur = (envoi: EnvoiReponse) => boolean | Promise<boolean>;

export function pending(): readonly EnvoiReponse[] {
  return readJson<EnvoiReponse[]>(CLE) ?? [];
}

export function enqueue(envoi: EnvoiReponse): void {
  const file = [...pending(), envoi];
  const bornee = file.length > CAPACITE_MAX ? file.slice(file.length - CAPACITE_MAX) : file;
  writeJson(CLE, bornee);
}

export async function flush(envoyer: Envoyeur): Promise<void> {
  const restantes: EnvoiReponse[] = [];
  for (const envoi of pending()) {
    const reussi = await envoyer(envoi);
    if (!reussi) {
      restantes.push(envoi);
    }
  }
  writeJson(CLE, restantes);
}
