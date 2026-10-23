import { zJoinSessionRequestDto } from '../../../../contrat/zod.gen';
import { creerCle } from './cle';
import { longueurDeTexte } from './longueur-de-texte';
import { persistJson, readJson, removeKey } from './storage';

const CLE = 'fp.identite';

export const DUREE_DE_CONSERVATION_DE_L_IDENTITE_MS = 12 * 60 * 60 * 1000;

const SAISIE_D_IDENTITE = zJoinSessionRequestDto.shape;

export const LONGUEURS_MAX_DE_L_IDENTITE: Readonly<
  Record<Exclude<keyof IdentityInput, 'email'>, number>
> = {
  prenom: SAISIE_D_IDENTITE.prenom.maxLength ?? Infinity,
  nom: SAISIE_D_IDENTITE.nom.maxLength ?? Infinity,
};

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

interface IdentiteConservee extends Identity {
  readonly expireLe?: number;
}

let enMemoire: Identity | null = null;

export function readIdentity(): Identity | null {
  const conservee = readJson<IdentiteConservee>(CLE);
  if (conservee === null) {
    return enMemoire;
  }
  if (!(typeof conservee.expireLe === 'number' && conservee.expireLe > Date.now())) {
    clearIdentity();
    return null;
  }
  return conservee;
}

export function saveIdentity(input: IdentityInput): IdentityRegistration {
  const prenom = input.prenom.trim();
  const nom = input.nom.trim();
  const email = input.email.trim().toLowerCase();
  if (prenom.length === 0 || nom.length === 0) {
    throw new Error('Le prénom et le nom sont obligatoires');
  }
  if (
    longueurDeTexte(prenom) > LONGUEURS_MAX_DE_L_IDENTITE.prenom ||
    longueurDeTexte(nom) > LONGUEURS_MAX_DE_L_IDENTITE.nom
  ) {
    throw new Error('Identité trop longue');
  }
  if (!SAISIE_D_IDENTITE.email.safeParse(email).success) {
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
  const conservee: IdentiteConservee = {
    ...identite,
    expireLe: Date.now() + DUREE_DE_CONSERVATION_DE_L_IDENTITE_MS,
  };
  return persistJson(CLE, conservee);
}

export function clearIdentity(): void {
  enMemoire = null;
  removeKey(CLE);
}
