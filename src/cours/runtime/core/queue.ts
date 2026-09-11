import { readJson, writeJson } from './storage';

const CLE = 'fp.file-reponses';
const CAPACITE_MAX = 200;

export interface EnvoiReponse {
  id: number;
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

export function enqueue(envoi: Omit<EnvoiReponse, 'id'>): void {
  const file = pending();
  if (file.length >= CAPACITE_MAX) {
    throw new Error(
      "La file d'attente des réponses est pleine (200 au maximum) — la réponse n'a pas été mise en file",
    );
  }
  const prochainId = file.reduce((max, existant) => Math.max(max, existant.id), 0) + 1;
  if (!writeJson(CLE, [...file, { ...envoi, id: prochainId }])) {
    throw new Error(
      "Le stockage local est indisponible sur ce poste — la réponse n'a pas été mise en file",
    );
  }
}

function retirer(id: number): void {
  writeJson(
    CLE,
    pending().filter((envoi) => envoi.id !== id),
  );
}

export async function flush(envoyer: Envoyeur): Promise<void> {
  for (const envoi of pending()) {
    const reussi = await envoyer(envoi);
    if (reussi) {
      retirer(envoi.id);
    }
  }
}
