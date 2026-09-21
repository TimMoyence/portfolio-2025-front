import { persistJson, readJson, removeKey } from './storage';

const CLE = 'fp.identite';
const EMAIL_MOTIF = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,24}$/;

export interface Identity {
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
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
  const identite: Identity = {
    studentKey: memeEtudiant ? existante.studentKey : creerCle(),
    prenom,
    nom,
    email,
  };
  enMemoire = identite;
  return { identite, persistee: persistJson(CLE, identite) };
}

export function clearIdentity(): void {
  enMemoire = null;
  removeKey(CLE);
}

function creerCle(): string {
  const crypto = globalThis.crypto;
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (!crypto || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Votre navigateur ne permet pas de générer un identifiant sécurisé');
  }
  const octets = new Uint8Array(16);
  crypto.getRandomValues(octets);
  octets[6] = (octets[6] & 0x0f) | 0x40;
  octets[8] = (octets[8] & 0x3f) | 0x80;
  const hex = [...octets].map((octet) => octet.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
