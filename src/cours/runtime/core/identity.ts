import { creerCle } from './cle';
import { persistJson, readJson, removeKey } from './storage';

const CLE = 'fp.identite';
const EMAIL_MOTIF = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,24}$/;

export interface Identity {
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  secretsDeReprise?: Readonly<Record<string, string>>;
}

export interface IdentityInput {
  prenom: string;
  nom: string;
  email: string;
}

export interface IdentityRegistration {
  identite: Identity;
  persistee: boolean;
}

let enMemoire: Identity | null = null;

export function readIdentity(): Identity | null {
  return readJson<Identity>(CLE) ?? enMemoire;
}

export function saveIdentity(input: IdentityInput): IdentityRegistration {
  const prenom = input.prenom.trim();
  const nom = input.nom.trim();
  const email = input.email.trim().toLowerCase();
  if (prenom.length === 0 || nom.length === 0) {
    throw new Error('Le prénom et le nom sont obligatoires');
  }
  if (!EMAIL_MOTIF.test(email)) {
    throw new Error('Adresse électronique invalide');
  }
  const existante = readIdentity();
  const memeEtudiant =
    existante !== null &&
    existante.prenom === prenom &&
    existante.nom === nom &&
    existante.email === email;
  const identite: Identity = memeEtudiant
    ? existante
    : { studentKey: creerCle(), prenom, nom, email };
  return { identite, persistee: enregistrer(identite) };
}

export function memoriserSecretDeReprise(code: string, secret: string): void {
  const identite = readIdentity();
  if (identite === null) {
    return;
  }
  enregistrer({
    ...identite,
    secretsDeReprise: { ...identite.secretsDeReprise, [code]: secret },
  });
}

export function lireSecretDeReprise(code: string): string | undefined {
  const secrets = readIdentity()?.secretsDeReprise;
  return secrets !== undefined && Object.hasOwn(secrets, code) ? secrets[code] : undefined;
}

function enregistrer(identite: Identity): boolean {
  enMemoire = identite;
  return persistJson(CLE, identite);
}

export function clearIdentity(): void {
  enMemoire = null;
  removeKey(CLE);
}
