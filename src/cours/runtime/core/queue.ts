import { readJson, writeJson } from './storage';

const CLE = 'fp.file-reponses';
const CAPACITE_MAX = 200;
const ECHEC_ECRITURE =
  "Le stockage local de ce poste n'a pas accepté l'écriture — la réponse n'a pas été mise en file";

export type NatureEnvoi = 'reponse' | 'production' | 'jalon';

export interface EnvoiReponse {
  id: number;
  nature: NatureEnvoi;
  sessionId: string;
  studentKey: string;
  questionId: string;
  valeur: unknown;
  dureeMs: number;
  horodatage: string;
}

export type Envoyeur = (envoi: EnvoiReponse) => boolean | Promise<boolean>;

type EnvoiStocke = Omit<EnvoiReponse, 'nature'> & Partial<Pick<EnvoiReponse, 'nature'>>;

export function pending(): readonly EnvoiReponse[] {
  return (readJson<EnvoiStocke[]>(CLE) ?? []).map((envoi) => ({
    ...envoi,
    nature: envoi.nature ?? 'reponse',
  }));
}

export function enqueue(envoi: Omit<EnvoiReponse, 'id'>): void {
  const file = pending();
  if (file.length >= CAPACITE_MAX) {
    throw new Error(
      "La file d'attente des réponses est pleine (200 au maximum) — la réponse n'a pas été mise en file",
    );
  }
  const prochainId = file.reduce((max, existant) => Math.max(max, existant.id), 0) + 1;
  ecrireOuRefuser([...file, { ...envoi, id: prochainId }]);
}

function ecrireOuRefuser(file: readonly EnvoiReponse[]): void {
  let ecrite: boolean;
  try {
    ecrite = writeJson(CLE, file);
  } catch (cause) {
    throw new Error(ECHEC_ECRITURE, { cause });
  }
  if (!ecrite) {
    throw new Error(ECHEC_ECRITURE);
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
