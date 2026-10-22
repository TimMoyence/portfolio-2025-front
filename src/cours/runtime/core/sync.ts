import type {
  EtatDeSeance,
  EtatDeSeanceResponseDto,
  FormationsPresenterControllerPresenterStreamResponse as EvenementDeSeance,
  RaisonDeFin as RaisonDeFinServie,
  ResultatsEnDirectResponseDto,
} from '../../../../contrat/types.gen';
import { zFormationsPresenterControllerPresenterStreamResponse } from '../../../../contrat/zod.gen';
import { urlDeLaSeance } from './adresse-de-seance';
import { abonner, diffuserA } from './ecoutes';
import { ENTETE_JETON_PARTICIPANT } from './jeton-participant';
import { refuseLaSession, STATUT_LIMITE_DE_DEBIT } from './statuts-http';
import { jsonOuNull } from './valeurs';

export type StatutSession = EtatDeSeance;
export type EtatSession = EtatDeSeanceResponseDto;
export type ResultatsDuFlux = ResultatsEnDirectResponseDto;
export type RaisonDeFin = RaisonDeFinServie;

export type StatutFlux =
  | { readonly etat: 'connecte' }
  | { readonly etat: 'reconnexion' }
  | { readonly etat: 'refuse'; readonly statut: number };

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
const CHEMIN_PAR_DEFAUT: CheminFlux = 'stream';
const FLUX_REFUSE = "Le serveur a refusé l'ouverture du flux de séance";
const FLUX_ABANDONNE = 'Ouverture du flux abandonnée pendant la préparation de la session';
const SESSION_INJOIGNABLE = 'Session du compte injoignable avant l ouverture du flux';

function lireLeFlux(evenement: EvenementFlux): EvenementDeSeance | null {
  const lu = zFormationsPresenterControllerPresenterStreamResponse.safeParse({
    event: evenement.nom,
    data: jsonOuNull(evenement.donnees),
  });
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

const STATUT_JETON_REFUSE = 401;

export type MotifDuRefus = 'session' | 'saturation' | 'autre';

export interface RefusDuFlux {
  readonly statut: number;
  readonly motif: MotifDuRefus;
}

function motifDuRefus(statut: number): MotifDuRefus {
  if (refuseLaSession(statut)) {
    return 'session';
  }
  return statut === STATUT_LIMITE_DE_DEBIT ? 'saturation' : 'autre';
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
    `${urlDeLaSeance(options.baseUrl, options.sessionId)}/${options.chemin ?? CHEMIN_PAR_DEFAUT}`;

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
    const lu = lireLeFlux(evenement);
    if (evenement.nom === EVENEMENT_FIN && lu?.event === 'fin' && lu.data.raison === 'expiree') {
      interrompre();
      tenterOuverture();
      return;
    }
    if (evenement.nom === EVENEMENT_FIN) {
      terminer();
      diffuserA(ecoutesFin, lu?.event === 'fin' ? lu.data.raison : null);
      return;
    }
    if (lu?.event === 'resultats') {
      diffuserA(ecoutesResultats, lu.data);
    } else if (lu?.event === 'etat') {
      etatCourant = lu.data;
      diffuserA(ecoutes, etatCourant);
    }
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
