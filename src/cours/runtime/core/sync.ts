import { z } from 'zod';
import {
  PACING_MODES,
  PHASES_DE_VOTE,
  type ComptesJalon,
  type FreeRange,
  type PacingMode,
  type PilotageEcran,
  type ProgressionEnigme,
  type ResultatsSeance,
  type ResumeBareme,
  type StatistiquesSeance,
} from '../../content/types';
import { abonner, diffuserA } from './ecoutes';
import { ENTETE_JETON_PARTICIPANT } from './jeton-participant';
import {
  comptesJalon,
  entierPositif,
  progressionEnigme,
  resultatServi,
  resumeBareme,
  sortiesDeMachine,
  statistiquesServies,
  valeursParCle,
} from './schemas-communs';
import { jsonOuNull } from './valeurs';

export type StatutSession = 'attente' | 'en_cours' | 'terminee';

export interface EtatSession {
  etat: StatutSession;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  participants: number;
  revision: number;
  pilotage: Readonly<Record<string, PilotageEcran>>;
  majLe: string;
}

export type StatutFlux =
  | { readonly etat: 'connecte' }
  | { readonly etat: 'reconnexion' }
  | { readonly etat: 'refuse'; readonly statut: number };

export interface ResultatsDuFlux extends ResultatsSeance {
  readonly statistiques: StatistiquesSeance;
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
  readonly bareme: ResumeBareme;
}

export type RaisonDeFin = 'cloturee' | 'introuvable' | 'expiree' | 'evince' | 'revoque';

export type SyncListener = (etat: EtatSession) => void;
export type ResultatsListener = (resultats: ResultatsDuFlux) => void;
export type StatutListener = (statut: StatutFlux) => void;
export type FinListener = (raison: RaisonDeFin | null) => void;

export type OuvertureFlux = (url: string, entetes: Record<string, string>) => Promise<Response>;

export type CheminFlux = 'stream' | 'presenter-stream';

export type IssueDuRenouvellement = 'reussi' | 'refuse' | 'injoignable';

export interface SyncOptions {
  baseUrl: string;
  sessionId: string;
  jeton?: string;
  chemin?: CheminFlux;
  entetes?: () => Readonly<Record<string, string>>;
  preparerLaSession?: (forcer: boolean) => Promise<IssueDuRenouvellement>;
  ouvrirFlux?: OuvertureFlux;
}

export interface Sync {
  ouvrir(): void;
  onState(listener: SyncListener): () => void;
  onResultats(listener: ResultatsListener): () => void;
  onStatut(listener: StatutListener): () => void;
  onFin(listener: FinListener): () => void;
  close(): void;
}

const DELAI_INITIAL_MS = 1000;
const DELAI_MAX_MS = 30000;
const SILENCE_MAX_MS = 45000;
const SILENCE_AU_REVEIL_MS = 20000;

const SIGNAUX_DE_FENETRE = ['online', 'pageshow'] as const;
const SIGNAUX_DE_DOCUMENT = ['resume', 'visibilitychange'] as const;

function ecouterLeReveil(surReveil: () => void): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }
  const siVisible = (): void => {
    if (document.visibilityState !== 'hidden') {
      surReveil();
    }
  };
  SIGNAUX_DE_FENETRE.forEach((signal) => window.addEventListener(signal, siVisible));
  SIGNAUX_DE_DOCUMENT.forEach((signal) => document.addEventListener(signal, siVisible));
  return () => {
    SIGNAUX_DE_FENETRE.forEach((signal) => window.removeEventListener(signal, siVisible));
    SIGNAUX_DE_DOCUMENT.forEach((signal) => document.removeEventListener(signal, siVisible));
  };
}

const TYPE_FLUX = 'text/event-stream';
const EVENEMENT_FIN = 'fin';
const EVENEMENT_RESULTATS = 'resultats';
const CHEMIN_PAR_DEFAUT: CheminFlux = 'stream';
const FLUX_REFUSE = "Le serveur a refusé l'ouverture du flux de séance";
const FLUX_ABANDONNE = 'Ouverture du flux abandonnée pendant la préparation de la session';
const SESSION_INJOIGNABLE = 'Session du compte injoignable avant l ouverture du flux';

const STATUTS_VALIDES = [
  'attente',
  'en_cours',
  'terminee',
] as const satisfies readonly StatutSession[];

const pilotageServi = z
  .object({
    phase: z.enum(PHASES_DE_VOTE).optional(),
    revele: z.boolean().optional(),
    etayage: entierPositif.optional(),
    etayageAtteint: entierPositif.optional(),
    explicationsDevoilees: entierPositif.optional(),
    reglages: valeursParCle.optional(),
    resultatsProjetes: z.boolean().optional(),
    optionsAffichees: z.boolean().optional(),
    sortiesProjetees: sortiesDeMachine.optional(),
    questionAffichee: z.string().optional(),
    questionOuverte: z.string().nullable().optional(),
  })
  .strict();

export const etatServi: z.ZodType<EtatSession> = z
  .object({
    etat: z.enum(STATUTS_VALIDES),
    modeRythme: z.enum(PACING_MODES),
    ecranCourant: z.number(),
    intervalleLibre: z.object({ premier: z.number(), dernier: z.number() }).strict().nullable(),
    participants: z.number(),
    revision: entierPositif,
    pilotage: z.record(z.string(), pilotageServi),
    majLe: z.iso.datetime(),
  })
  .strict();

export const resultatsServis: z.ZodType<ResultatsDuFlux> = z
  .object({
    participants: z.number(),
    questions: z.array(resultatServi),
    statistiques: statistiquesServies,
    jalons: z.record(z.string(), comptesJalon),
    enigmes: z.array(progressionEnigme),
    bareme: resumeBareme,
  })
  .strict();

const RAISONS_DE_FIN = [
  'cloturee',
  'introuvable',
  'expiree',
  'evince',
  'revoque',
] as const satisfies readonly RaisonDeFin[];

export const finServie = z.object({ raison: z.enum(RAISONS_DE_FIN) }).strict();

function lireLeFlux<T>(schema: z.ZodType<T>, donnees: string): T | null {
  const lu = schema.safeParse(jsonOuNull(donnees));
  return lu.success ? lu.data : null;
}

export interface EvenementFlux {
  nom: string;
  donnees: string;
}

type Distributeur = (evenement: EvenementFlux) => void;

export function creerAnalyseurFlux(distribuer: Distributeur): (morceau: string) => void {
  let tampon = '';
  let nom = '';
  let donnees = '';

  const cloturer = (): void => {
    const evenement: EvenementFlux = { nom, donnees };
    nom = '';
    donnees = '';
    if (evenement.nom !== '' || evenement.donnees !== '') {
      distribuer(evenement);
    }
  };

  const champ = (ligne: string): void => {
    const separateur = ligne.indexOf(':');
    const cle = separateur === -1 ? ligne : ligne.slice(0, separateur);
    const brut = separateur === -1 ? '' : ligne.slice(separateur + 1);
    const valeur = brut.startsWith(' ') ? brut.slice(1) : brut;
    if (cle === 'event') {
      nom = valeur;
    } else if (cle === 'data') {
      donnees = donnees === '' ? valeur : `${donnees}\n${valeur}`;
    }
  };

  const traiter = (brute: string): void => {
    const ligne = brute.endsWith('\r') ? brute.slice(0, -1) : brute;
    if (ligne === '') {
      cloturer();
      return;
    }
    champ(ligne);
  };

  return (morceau: string): void => {
    tampon += morceau;
    const lignes = tampon.split('\n');
    tampon = lignes.pop() ?? '';
    for (const ligne of lignes) {
      traiter(ligne);
    }
  };
}

function ouvertureNative(courant: () => AbortController | null): OuvertureFlux | null {
  if (typeof fetch === 'undefined') {
    return null;
  }
  return (url, entetes) => fetch(url, { headers: entetes, signal: courant()?.signal ?? null });
}

const REFUS_SANS_RELANCE: readonly number[] = [401, 403];
const STATUT_JETON_REFUSE = 401;
const STATUT_SATURATION = 429;

export type MotifDuRefus = 'session' | 'saturation' | 'autre';

export interface RefusDuFlux {
  readonly statut: number;
  readonly motif: MotifDuRefus;
}

function motifDuRefus(statut: number): MotifDuRefus {
  if (REFUS_SANS_RELANCE.includes(statut)) {
    return 'session';
  }
  return statut === STATUT_SATURATION ? 'saturation' : 'autre';
}

export function refusDuFlux(statut: StatutFlux | null): RefusDuFlux | null {
  return statut?.etat === 'refuse'
    ? { statut: statut.statut, motif: motifDuRefus(statut.statut) }
    : null;
}

interface Tentative {
  readonly controleur: AbortController;
  lecteur: ReadableStreamDefaultReader<Uint8Array> | null;
  garde: ReturnType<typeof setTimeout> | null;
  refusee: boolean;
  definitive: boolean;
  renouvelable: boolean;
}

function desarmerLaGarde(tentative: Tentative): void {
  if (tentative.garde !== null) {
    clearTimeout(tentative.garde);
    tentative.garde = null;
  }
}

function abandonner(tentative: Tentative): void {
  desarmerLaGarde(tentative);
  tentative.controleur.abort();
}

function rearmerLaGarde(tentative: Tentative): void {
  desarmerLaGarde(tentative);
  tentative.garde = setTimeout(() => {
    abandonner(tentative);
    void tentative.lecteur?.cancel().catch(() => undefined);
  }, SILENCE_MAX_MS);
}

export function createSync(options: SyncOptions): Sync {
  const ecoutes = new Set<SyncListener>();
  const ecoutesResultats = new Set<ResultatsListener>();
  const ecoutesStatut = new Set<StatutListener>();
  const ecoutesFin = new Set<FinListener>();

  let tentative: Tentative | null = null;
  let etatCourant: EtatSession | null = null;
  let ferme = false;
  let delai = DELAI_INITIAL_MS;
  let relanceId: ReturnType<typeof setTimeout> | null = null;
  let dernierSigne = 0;
  let refusDefinitif = false;
  let renouvellement: 'permis' | 'a-faire' | 'fait' = 'permis';
  let arreterLeReveil: (() => void) | null = null;

  const ouvrirFlux = options.ouvrirFlux ?? ouvertureNative(() => tentative?.controleur ?? null);

  const urlFlux = (): string =>
    `${options.baseUrl}/sessions/${encodeURIComponent(options.sessionId)}/${options.chemin ?? CHEMIN_PAR_DEFAUT}`;

  const entetes = (): Record<string, string> => {
    const valeurs: Record<string, string> = { accept: TYPE_FLUX };
    if (options.jeton !== undefined && options.jeton !== '') {
      valeurs[ENTETE_JETON_PARTICIPANT] = options.jeton;
    }
    return { ...valeurs, ...options.entetes?.() };
  };

  const interrompre = (): void => {
    if (tentative !== null) {
      abandonner(tentative);
    }
    tentative = null;
  };

  const annulerRelance = (): void => {
    if (relanceId !== null) {
      clearTimeout(relanceId);
      relanceId = null;
    }
  };

  const planifierRelance = (): void => {
    if (ferme) {
      return;
    }
    const delaiCourant = delai;
    delai = Math.min(delai * 2, DELAI_MAX_MS);
    annulerRelance();
    relanceId = setTimeout(() => {
      relanceId = null;
      tenterOuverture();
    }, delaiCourant);
  };

  const terminer = (): void => {
    ferme = true;
    annulerRelance();
    interrompre();
    arreterLeReveil?.();
    arreterLeReveil = null;
  };

  const distribuer = (evenement: EvenementFlux): void => {
    if (ferme) {
      return;
    }
    if (evenement.nom === EVENEMENT_FIN) {
      terminer();
      diffuserA(ecoutesFin, lireLeFlux(finServie, evenement.donnees)?.raison ?? null);
      return;
    }
    if (evenement.nom === EVENEMENT_RESULTATS) {
      const resultats = lireLeFlux(resultatsServis, evenement.donnees);
      if (resultats !== null) {
        diffuserA(ecoutesResultats, resultats);
      }
      return;
    }
    const etat = lireLeFlux(etatServi, evenement.donnees);
    if (etat === null) {
      return;
    }
    etatCourant = etat;
    diffuserA(ecoutes, etatCourant);
  };

  const consommer = async (propre: Tentative, reponse: Response): Promise<void> => {
    const corps = reponse.body;
    if (!corps) {
      return;
    }
    const lecteur = corps.getReader();
    propre.lecteur = lecteur;
    const decodeur = new TextDecoder();
    const analyseur = creerAnalyseurFlux(distribuer);
    let acheve = false;
    while (!acheve) {
      const morceau = await lecteur.read();
      acheve = morceau.done;
      if (morceau.value) {
        dernierSigne = Date.now();
        rearmerLaGarde(propre);
        analyseur(decodeur.decode(morceau.value, { stream: true }));
      }
    }
  };

  const refuser = (propre: Tentative, statutDuRefus: number): Error => {
    propre.refusee = true;
    propre.renouvelable =
      statutDuRefus === STATUT_JETON_REFUSE &&
      renouvellement === 'permis' &&
      options.preparerLaSession !== undefined;
    propre.definitive = !propre.renouvelable && motifDuRefus(statutDuRefus) === 'session';
    const statut: StatutFlux = propre.renouvelable
      ? { etat: 'reconnexion' }
      : { etat: 'refuse', statut: statutDuRefus };
    diffuserA(ecoutesStatut, statut);
    return new Error(FLUX_REFUSE);
  };

  const lireFlux = async (propre: Tentative, promesse: Promise<Response>): Promise<void> => {
    const reponse = await promesse;
    if (tentative !== propre) {
      return;
    }
    if (!reponse.ok) {
      throw refuser(propre, reponse.status);
    }
    renouvellement = 'permis';
    delai = DELAI_INITIAL_MS;
    dernierSigne = Date.now();
    rearmerLaGarde(propre);
    diffuserA(ecoutesStatut, { etat: 'connecte' });
    if (etatCourant) {
      diffuserA(ecoutes, etatCourant);
    }
    await consommer(propre, reponse);
  };

  const suivre = async (propre: Tentative, promesse: Promise<Response>): Promise<void> => {
    await lireFlux(propre, promesse).catch(() => undefined);
    desarmerLaGarde(propre);
    if (tentative === propre) {
      tentative = null;
      if (!propre.refusee) {
        diffuserA(ecoutesStatut, { etat: 'reconnexion' });
      }
      refusDefinitif = propre.definitive;
      if (propre.renouvelable) {
        renouvellement = 'a-faire';
        tenterOuverture();
      } else if (!propre.definitive) {
        planifierRelance();
      }
    }
  };

  const ouvrirApresLaSession = (
    propre: Tentative,
    ouvrir: OuvertureFlux,
    issue: IssueDuRenouvellement,
  ): Promise<Response> => {
    if (tentative !== propre || propre.controleur.signal.aborted) {
      throw new Error(FLUX_ABANDONNE);
    }
    if (issue === 'refuse') {
      renouvellement = 'fait';
      throw refuser(propre, STATUT_JETON_REFUSE);
    }
    if (issue === 'injoignable') {
      throw new Error(SESSION_INJOIGNABLE);
    }
    if (renouvellement === 'a-faire') {
      renouvellement = 'fait';
    }
    return ouvrir(urlFlux(), entetes());
  };

  const ouvrirLaTentative = (propre: Tentative, ouvrir: OuvertureFlux): Promise<Response> => {
    const preparer = options.preparerLaSession;
    if (preparer === undefined) {
      return ouvrir(urlFlux(), entetes());
    }
    return preparer(renouvellement === 'a-faire').then((issue) =>
      ouvrirApresLaSession(propre, ouvrir, issue),
    );
  };

  const tenterOuverture = (): void => {
    if (ferme || !ouvrirFlux) {
      return;
    }
    const propre: Tentative = {
      controleur: new AbortController(),
      lecteur: null,
      garde: null,
      refusee: false,
      definitive: false,
      renouvelable: false,
    };
    tentative = propre;
    rearmerLaGarde(propre);
    void suivre(propre, ouvrirLaTentative(propre, ouvrirFlux));
  };

  const reveiller = (): void => {
    if (ferme || refusDefinitif) {
      return;
    }
    if (tentative === null || Date.now() - dernierSigne > SILENCE_AU_REVEIL_MS) {
      demarrer();
    }
  };

  const demarrer = (): void => {
    annulerRelance();
    interrompre();
    delai = DELAI_INITIAL_MS;
    ferme = false;
    refusDefinitif = false;
    renouvellement = 'permis';
    arreterLeReveil ??= ecouterLeReveil(reveiller);
    tenterOuverture();
  };

  return {
    ouvrir() {
      demarrer();
    },
    onState(listener) {
      return abonner(ecoutes, listener);
    },
    onResultats(listener) {
      return abonner(ecoutesResultats, listener);
    },
    onStatut(listener) {
      return abonner(ecoutesStatut, listener);
    },
    onFin(listener) {
      return abonner(ecoutesFin, listener);
    },
    close() {
      terminer();
    },
  };
}
