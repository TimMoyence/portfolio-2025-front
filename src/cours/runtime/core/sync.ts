import type {
  ConfusionComptee,
  FreeRange,
  PacingMode,
  ResultatQuestion,
  ResultatsSeance,
} from '../../content/types';
import type { Identity } from './identity';
import { enqueue } from './queue';

export type StatutSession = 'attente' | 'en_cours' | 'terminee';

export interface EtatSession {
  etat: StatutSession;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  participants: number;
}

export type SyncListener = (etat: EtatSession) => void;
export type ResultatsListener = (resultats: ResultatsSeance) => void;

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
  join(identite: Identity): void;
  ouvrir(): void;
  submit(questionId: string, valeur: unknown, dureeMs: number): void;
  onState(listener: SyncListener): () => void;
  onResultats(listener: ResultatsListener): () => void;
  close(): void;
}

const DELAI_INITIAL_MS = 1000;
const DELAI_MAX_MS = 30000;

const ENTETE_JETON = 'x-participant-token';
const TYPE_FLUX = 'text/event-stream';
const EVENEMENT_FIN = 'fin';
const EVENEMENT_RESULTATS = 'resultats';
const CHEMIN_PAR_DEFAUT: CheminFlux = 'stream';
const FLUX_REFUSE = "Le serveur a refusé l'ouverture du flux de séance";

const STATUTS_VALIDES: readonly StatutSession[] = ['attente', 'en_cours', 'terminee'];
const MODES_RYTHME_VALIDES: readonly PacingMode[] = ['pilote', 'libre'];

function estMembre<T extends string>(valeurs: readonly T[], valeur: unknown): valeur is T {
  return typeof valeur === 'string' && (valeurs as readonly string[]).includes(valeur);
}

function estFreeRange(valeur: unknown): valeur is FreeRange {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return typeof candidat['premier'] === 'number' && typeof candidat['dernier'] === 'number';
}

function estEtatSession(valeur: unknown): valeur is EtatSession {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return (
    estMembre(STATUTS_VALIDES, candidat['etat']) &&
    estMembre(MODES_RYTHME_VALIDES, candidat['modeRythme']) &&
    typeof candidat['ecranCourant'] === 'number' &&
    typeof candidat['participants'] === 'number' &&
    (candidat['intervalleLibre'] === null || estFreeRange(candidat['intervalleLibre']))
  );
}

function estConfusionComptee(valeur: unknown): valeur is ConfusionComptee {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return (
    typeof candidat['id'] === 'string' &&
    typeof candidat['libelle'] === 'string' &&
    typeof candidat['nombre'] === 'number'
  );
}

function estResultatQuestion(valeur: unknown): valeur is ResultatQuestion {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return (
    typeof candidat['questionId'] === 'string' &&
    typeof candidat['total'] === 'number' &&
    typeof candidat['correctes'] === 'number' &&
    typeof candidat['neSaitPas'] === 'number' &&
    Array.isArray(candidat['confusions']) &&
    candidat['confusions'].every(estConfusionComptee)
  );
}

function estResultatsSeance(valeur: unknown): valeur is ResultatsSeance {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return (
    typeof candidat['participants'] === 'number' &&
    Array.isArray(candidat['questions']) &&
    candidat['questions'].every(estResultatQuestion)
  );
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

export function createSync(options: SyncOptions): Sync {
  const ecoutes = new Set<SyncListener>();
  const ecoutesResultats = new Set<ResultatsListener>();

  let controleur: AbortController | null = null;
  let identite: Identity | null = null;
  let etatCourant: EtatSession | null = null;
  let ferme = false;
  let delai = DELAI_INITIAL_MS;
  let relanceId: ReturnType<typeof setTimeout> | null = null;

  const ouvrirFlux = options.ouvrirFlux ?? ouvertureNative(() => controleur);

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
    controleur?.abort();
    controleur = null;
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

  const notifier = (etat: EtatSession): void => {
    for (const ecoute of ecoutes) {
      ecoute(etat);
    }
  };

  const notifierResultats = (resultats: ResultatsSeance): void => {
    for (const ecoute of ecoutesResultats) {
      ecoute(resultats);
    }
  };

  const terminer = (): void => {
    ferme = true;
    annulerRelance();
    interrompre();
  };

  const distribuer = (evenement: EvenementFlux): void => {
    if (evenement.nom === EVENEMENT_FIN) {
      terminer();
      return;
    }
    if (evenement.nom === EVENEMENT_RESULTATS) {
      const resultats = analyser(evenement.donnees);
      if (estResultatsSeance(resultats)) {
        notifierResultats(resultats);
      }
      return;
    }
    const charge = analyser(evenement.donnees);
    if (!estEtatSession(charge)) {
      return;
    }
    etatCourant = charge;
    notifier(charge);
  };

  const consommer = async (reponse: Response): Promise<void> => {
    const corps = reponse.body;
    if (!corps) {
      return;
    }
    const lecteur = corps.getReader();
    const decodeur = new TextDecoder();
    const analyseur = creerAnalyseurFlux(distribuer);
    let acheve = false;
    while (!acheve) {
      const morceau = await lecteur.read();
      acheve = morceau.done;
      if (morceau.value) {
        analyseur(decodeur.decode(morceau.value, { stream: true }));
      }
    }
  };

  const lireFlux = async (propre: AbortController, promesse: Promise<Response>): Promise<void> => {
    const reponse = await promesse;
    if (controleur !== propre) {
      return;
    }
    if (!reponse.ok) {
      throw new Error(FLUX_REFUSE);
    }
    delai = DELAI_INITIAL_MS;
    if (etatCourant) {
      notifier(etatCourant);
    }
    await consommer(reponse);
  };

  const suivre = async (propre: AbortController, promesse: Promise<Response>): Promise<void> => {
    await lireFlux(propre, promesse).catch(() => undefined);
    if (controleur === propre) {
      controleur = null;
      planifierRelance();
    }
  };

  const tenterOuverture = (): void => {
    if (ferme || !ouvrirFlux) {
      return;
    }
    const propre = new AbortController();
    controleur = propre;
    void suivre(propre, ouvrirFlux(urlFlux(), entetes()));
  };

  const demarrer = (): void => {
    annulerRelance();
    interrompre();
    delai = DELAI_INITIAL_MS;
    ferme = false;
    tenterOuverture();
  };

  return {
    join(nouvelleIdentite) {
      identite = nouvelleIdentite;
      demarrer();
    },
    ouvrir() {
      demarrer();
    },
    submit(questionId, valeur, dureeMs) {
      if (!identite) {
        throw new Error("Rejoignez la session avant d'envoyer une réponse");
      }
      enqueue({
        sessionId: options.sessionId,
        studentKey: identite.studentKey,
        questionId,
        valeur,
        dureeMs,
        horodatage: new Date().toISOString(),
      });
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
    close() {
      terminer();
    },
  };
}
