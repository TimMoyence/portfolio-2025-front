import type {
  ComptesJalon,
  ConfusionComptee,
  FreeRange,
  PacingMode,
  PilotageEcran,
  ProgressionEnigme,
  ResultatQuestion,
  ResultatsSeance,
  ResumeBareme,
  TypeQuestion,
  VotePhase,
} from '../../content/types';

export type StatutSession = 'attente' | 'en_cours' | 'terminee';

export interface EtatSession {
  etat: StatutSession;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  participants: number;
  revision: number;
  pilotage: Readonly<Record<string, PilotageEcran>>;
}

type ChampsV3DeLEtat = Pick<EtatSession, 'revision' | 'pilotage'>;

type EtatRecu = Omit<EtatSession, keyof ChampsV3DeLEtat> & Partial<ChampsV3DeLEtat>;

type ChampsV3DuResultat = Pick<
  ResultatQuestion,
  'ecranId' | 'type' | 'noteCompte' | 'parOption' | 'scoreMoyen' | 'parCle'
>;

type ResultatRecu = Omit<ResultatQuestion, keyof ChampsV3DuResultat> & Partial<ChampsV3DuResultat>;

type ResultatsRecus = Omit<ResultatsSeance, 'questions'> &
  Partial<Pick<ResultatsDuFlux, 'jalons' | 'enigmes' | 'bareme'>> & {
    readonly questions: readonly ResultatRecu[];
  };

const ETAT_SERVI_PAR_UN_SERVEUR_V2: ChampsV3DeLEtat = { revision: 0, pilotage: {} };

const RESULTAT_SERVI_PAR_UN_SERVEUR_V2: ChampsV3DuResultat = {
  ecranId: '',
  type: 'vote',
  noteCompte: true,
  parOption: null,
  scoreMoyen: null,
  parCle: null,
};

export type StatutFlux =
  | { readonly etat: 'connecte' }
  | { readonly etat: 'reconnexion' }
  | { readonly etat: 'refuse'; readonly statut: number };

export interface ResultatsDuFlux extends ResultatsSeance {
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
  readonly bareme: ResumeBareme | null;
}

export type RaisonDeFin = 'cloturee' | 'introuvable' | 'expiree' | 'evince' | 'revoque';

export type SyncListener = (etat: EtatSession) => void;
export type ResultatsListener = (resultats: ResultatsDuFlux) => void;
export type StatutListener = (statut: StatutFlux) => void;
export type FinListener = (raison: RaisonDeFin | null) => void;

export type OuvertureFlux = (url: string, entetes: Record<string, string>) => Promise<Response>;

export type CheminFlux = 'stream' | 'presenter-stream';

export interface SyncOptions {
  baseUrl: string;
  sessionId: string;
  jeton?: string;
  chemin?: CheminFlux;
  entetes?: () => Readonly<Record<string, string>>;
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

const ENTETE_JETON = 'x-participant-token';
const TYPE_FLUX = 'text/event-stream';
const EVENEMENT_FIN = 'fin';
const EVENEMENT_RESULTATS = 'resultats';
const CHEMIN_PAR_DEFAUT: CheminFlux = 'stream';
const FLUX_REFUSE = "Le serveur a refusé l'ouverture du flux de séance";

const STATUTS_VALIDES: readonly StatutSession[] = ['attente', 'en_cours', 'terminee'];
const MODES_RYTHME_VALIDES: readonly PacingMode[] = ['pilote', 'libre'];
const PHASES_VALIDES: readonly VotePhase[] = ['vote', 'discussion', 'revote', 'revele'];
const TYPES_QUESTION_VALIDES: readonly TypeQuestion[] = [
  'numeric',
  'vote',
  'feuille',
  'tableau',
  'classement',
  'enigme',
];

function estMembre<T extends string>(valeurs: readonly T[], valeur: unknown): valeur is T {
  return typeof valeur === 'string' && (valeurs as readonly string[]).includes(valeur);
}

function estDictionnaire(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function absentOu(valeur: unknown, estValide: (valeur: unknown) => boolean): boolean {
  return valeur === undefined || estValide(valeur);
}

function nulOu(valeur: unknown, estValide: (valeur: unknown) => boolean): boolean {
  return valeur === null || estValide(valeur);
}

function estNombre(valeur: unknown): boolean {
  return typeof valeur === 'number';
}

function estEntierPositif(valeur: unknown): boolean {
  return typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 0;
}

function estPilotageEcran(valeur: unknown): boolean {
  return (
    estDictionnaire(valeur) &&
    absentOu(valeur['phase'], (phase) => estMembre(PHASES_VALIDES, phase)) &&
    absentOu(valeur['revele'], (revele) => typeof revele === 'boolean') &&
    absentOu(valeur['etayage'], estEntierPositif)
  );
}

function estPilotage(valeur: unknown): boolean {
  return estDictionnaire(valeur) && Object.values(valeur).every(estPilotageEcran);
}

function estComptesParCle(valeur: unknown): boolean {
  return (
    estDictionnaire(valeur) &&
    Object.values(valeur).every(
      (compte) =>
        estDictionnaire(compte) && estNombre(compte['total']) && estNombre(compte['justes']),
    )
  );
}

function estComptesParOption(valeur: unknown): boolean {
  return estDictionnaire(valeur) && Object.values(valeur).every(estNombre);
}

function estFreeRange(valeur: unknown): valeur is FreeRange {
  return estDictionnaire(valeur) && estNombre(valeur['premier']) && estNombre(valeur['dernier']);
}

function estEtatSession(valeur: unknown): valeur is EtatRecu {
  return (
    estDictionnaire(valeur) &&
    estMembre(STATUTS_VALIDES, valeur['etat']) &&
    estMembre(MODES_RYTHME_VALIDES, valeur['modeRythme']) &&
    estNombre(valeur['ecranCourant']) &&
    estNombre(valeur['participants']) &&
    nulOu(valeur['intervalleLibre'], estFreeRange) &&
    absentOu(valeur['revision'], estEntierPositif) &&
    absentOu(valeur['pilotage'], estPilotage)
  );
}

function completerEtat(recu: EtatRecu): EtatSession {
  return { ...ETAT_SERVI_PAR_UN_SERVEUR_V2, ...recu };
}

function estConfusionComptee(valeur: unknown): valeur is ConfusionComptee {
  return (
    estDictionnaire(valeur) &&
    typeof valeur['id'] === 'string' &&
    typeof valeur['libelle'] === 'string' &&
    estNombre(valeur['nombre'])
  );
}

function aDesChampsV3Valides(candidat: Record<string, unknown>): boolean {
  return (
    absentOu(candidat['ecranId'], (ecranId) => typeof ecranId === 'string') &&
    absentOu(candidat['type'], (type) => estMembre(TYPES_QUESTION_VALIDES, type)) &&
    absentOu(candidat['noteCompte'], (noteCompte) => typeof noteCompte === 'boolean') &&
    absentOu(candidat['parOption'], (parOption) => nulOu(parOption, estComptesParOption)) &&
    absentOu(candidat['scoreMoyen'], (scoreMoyen) => nulOu(scoreMoyen, estNombre)) &&
    absentOu(candidat['parCle'], (parCle) => nulOu(parCle, estComptesParCle))
  );
}

function estResultatQuestion(valeur: unknown): valeur is ResultatRecu {
  return (
    estDictionnaire(valeur) &&
    typeof valeur['questionId'] === 'string' &&
    estNombre(valeur['total']) &&
    estNombre(valeur['correctes']) &&
    estNombre(valeur['neSaitPas']) &&
    Array.isArray(valeur['confusions']) &&
    valeur['confusions'].every(estConfusionComptee) &&
    aDesChampsV3Valides(valeur)
  );
}

function estComptesJalon(valeur: unknown): valeur is ComptesJalon {
  return (
    estDictionnaire(valeur) &&
    estNombre(valeur['perdu']) &&
    estNombre(valeur['ca-va']) &&
    estNombre(valeur['clair']) &&
    estNombre(valeur['total'])
  );
}

function estProgressionEnigme(valeur: unknown): valeur is ProgressionEnigme {
  return (
    estDictionnaire(valeur) &&
    typeof valeur['parcoursId'] === 'string' &&
    typeof valeur['enigmeId'] === 'string' &&
    ['ouvertes', 'resolues', 'tentativesMoyennes', 'epuisees'].every((cle) =>
      estNombre(valeur[cle]),
    )
  );
}

function estResumeBareme(valeur: unknown): valeur is ResumeBareme {
  return (
    estDictionnaire(valeur) &&
    estNombre(valeur['questionsNotees']) &&
    estDictionnaire(valeur['parType'])
  );
}

function aDesChampsEnDirectValides(candidat: Record<string, unknown>): boolean {
  return (
    absentOu(
      candidat['jalons'],
      (jalons) => estDictionnaire(jalons) && Object.values(jalons).every(estComptesJalon),
    ) &&
    absentOu(
      candidat['enigmes'],
      (enigmes) => Array.isArray(enigmes) && enigmes.every(estProgressionEnigme),
    ) &&
    absentOu(candidat['bareme'], (bareme) => nulOu(bareme, estResumeBareme))
  );
}

function estResultatsSeance(valeur: unknown): valeur is ResultatsRecus {
  return (
    estDictionnaire(valeur) &&
    estNombre(valeur['participants']) &&
    Array.isArray(valeur['questions']) &&
    valeur['questions'].every(estResultatQuestion) &&
    aDesChampsEnDirectValides(valeur)
  );
}

function completerResultats(recus: ResultatsRecus): ResultatsDuFlux {
  return {
    jalons: {},
    enigmes: [],
    bareme: null,
    ...recus,
    questions: recus.questions.map((question) => ({
      ...RESULTAT_SERVI_PAR_UN_SERVEUR_V2,
      ...question,
    })),
  };
}

const RAISONS_DE_FIN: readonly RaisonDeFin[] = [
  'cloturee',
  'introuvable',
  'expiree',
  'evince',
  'revoque',
];

function lireRaisonDeFin(donnees: string): RaisonDeFin | null {
  const charge = analyser(donnees);
  const raison = estDictionnaire(charge) ? charge['raison'] : null;
  return estMembre(RAISONS_DE_FIN, raison) ? raison : null;
}

function analyser(brut: string): unknown {
  try {
    return JSON.parse(brut);
  } catch {
    return null;
  }
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

function diffuserA<T>(ecoutes: ReadonlySet<(valeur: T) => void>, valeur: T): void {
  for (const ecoute of ecoutes) {
    ecoute(valeur);
  }
}

const REFUS_SANS_RELANCE: readonly number[] = [401, 403];

interface Tentative {
  readonly controleur: AbortController;
  lecteur: ReadableStreamDefaultReader<Uint8Array> | null;
  garde: ReturnType<typeof setTimeout> | null;
  refusee: boolean;
  definitive: boolean;
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
  let arreterLeReveil: (() => void) | null = null;

  const ouvrirFlux = options.ouvrirFlux ?? ouvertureNative(() => tentative?.controleur ?? null);

  const urlFlux = (): string =>
    `${options.baseUrl}/sessions/${encodeURIComponent(options.sessionId)}/${options.chemin ?? CHEMIN_PAR_DEFAUT}`;

  const entetes = (): Record<string, string> => {
    const valeurs: Record<string, string> = { accept: TYPE_FLUX };
    if (options.jeton !== undefined && options.jeton !== '') {
      valeurs[ENTETE_JETON] = options.jeton;
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
      diffuserA(ecoutesFin, lireRaisonDeFin(evenement.donnees));
      return;
    }
    if (evenement.nom === EVENEMENT_RESULTATS) {
      const resultats = analyser(evenement.donnees);
      if (estResultatsSeance(resultats)) {
        diffuserA(ecoutesResultats, completerResultats(resultats));
      }
      return;
    }
    const charge = analyser(evenement.donnees);
    if (!estEtatSession(charge)) {
      return;
    }
    etatCourant = completerEtat(charge);
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

  const lireFlux = async (propre: Tentative, promesse: Promise<Response>): Promise<void> => {
    const reponse = await promesse;
    if (tentative !== propre) {
      return;
    }
    if (!reponse.ok) {
      propre.refusee = true;
      propre.definitive = REFUS_SANS_RELANCE.includes(reponse.status);
      diffuserA(ecoutesStatut, { etat: 'refuse', statut: reponse.status });
      throw new Error(FLUX_REFUSE);
    }
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
      if (!propre.definitive) {
        planifierRelance();
      }
    }
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
    };
    tentative = propre;
    rearmerLaGarde(propre);
    void suivre(propre, ouvrirFlux(urlFlux(), entetes()));
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
    arreterLeReveil ??= ecouterLeReveil(reveiller);
    tenterOuverture();
  };

  return {
    ouvrir() {
      demarrer();
    },
    onState(listener) {
      ecoutes.add(listener);
      return () => {
        ecoutes.delete(listener);
      };
    },
    onResultats(listener) {
      ecoutesResultats.add(listener);
      return () => {
        ecoutesResultats.delete(listener);
      };
    },
    onStatut(listener) {
      ecoutesStatut.add(listener);
      return () => {
        ecoutesStatut.delete(listener);
      };
    },
    onFin(listener) {
      ecoutesFin.add(listener);
      return () => {
        ecoutesFin.delete(listener);
      };
    },
    close() {
      terminer();
    },
  };
}
