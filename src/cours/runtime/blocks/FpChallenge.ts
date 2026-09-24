import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import { estObjet, type StrategieServie } from './retours';

export interface LigneDuDossier {
  readonly libelle: string;
  readonly valeur: string;
}

export interface ChallengeProblemePublic {
  readonly id: string;
  readonly enonce: string;
  readonly invite: string;
  readonly rappel?: readonly LigneDuDossier[];
  readonly strategies: readonly [];
  readonly metadonnees: MetadonneesBrique;
}

const ID_TENTATIVE = 'fp-challenge-tentative';
const VIDE = escapeHtml('');
const OUVERT = safeHtml`open`;

function lireStrategie(valeur: unknown): StrategieServie | null {
  if (
    !estObjet(valeur) ||
    typeof valeur['id'] !== 'string' ||
    typeof valeur['libelle'] !== 'string'
  ) {
    return null;
  }
  const fausse = valeur['fausse'];
  return typeof fausse === 'boolean'
    ? { id: valeur['id'], libelle: valeur['libelle'], fausse }
    : { id: valeur['id'], libelle: valeur['libelle'] };
}

function lireStrategies(valeur: unknown): readonly StrategieServie[] {
  return Array.isArray(valeur)
    ? valeur.map(lireStrategie).filter((strategie) => strategie !== null)
    : [];
}

function lireRappel(valeur: unknown): readonly LigneDuDossier[] {
  return Array.isArray(valeur)
    ? valeur.filter(
        (ligne): ligne is LigneDuDossier =>
          estObjet(ligne) &&
          typeof ligne['libelle'] === 'string' &&
          typeof ligne['valeur'] === 'string',
      )
    : [];
}

function dossier(probleme: ChallengeProblemePublic): EscapedHtml {
  const rappel = probleme.rappel ?? [];
  if (rappel.length === 0) {
    return VIDE;
  }
  const lignes = rappel.map(
    (ligne) =>
      safeHtml`<div class="fp-challenge__ligne"><dt>${escapeHtml(ligne.libelle)}</dt><dd>${escapeHtml(ligne.valeur)}</dd></div>`,
  );
  return safeHtml`<dl class="fp-challenge__rappel" data-testid="rappel">${lignes}</dl>`;
}

export class FpChallenge extends FpBlock {
  private interne: ChallengeProblemePublic | null = null;
  private servies: readonly StrategieServie[] = [];
  private formateur: readonly StrategieServie[] = [];
  private interneRevele = false;
  private tentative = '';
  private message = '';
  private soumise = false;

  set probleme(valeur: ChallengeProblemePublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            enonce: valeur.enonce,
            invite: valeur.invite,
            ...(valeur.rappel === undefined ? {} : { rappel: lireRappel(valeur.rappel) }),
            strategies: [],
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    if (change) {
      this.tentative = '';
      this.message = '';
      this.soumise = false;
      this.servies = [];
    }
    this.refreshSiConnecte();
  }

  get probleme(): ChallengeProblemePublic | null {
    return this.interne;
  }

  set strategies(valeur: readonly StrategieServie[] | null) {
    this.servies = lireStrategies(valeur);
    if (this.servies.length > 0) {
      this.soumise = true;
    }
    this.refreshSiConnecte();
  }

  get strategies(): readonly StrategieServie[] {
    return this.servies;
  }

  set revele(valeur: boolean) {
    this.interneRevele = valeur === true;
    this.refreshSiConnecte();
  }

  get revele(): boolean {
    return this.interneRevele;
  }

  set corrige(valeur: unknown) {
    this.formateur =
      estObjet(valeur) && valeur['type'] === 'defi' ? lireStrategies(valeur['strategies']) : [];
    this.refreshSiConnecte();
  }

  set brouillon(valeur: unknown) {
    if (estObjet(valeur) && typeof valeur['tentative'] === 'string') {
      this.tentative = valeur['tentative'];
      this.noterBrouillonRepris();
      this.refreshSiConnecte();
    }
  }

  render(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const reponse = this.presentateur()
      ? safeHtml`<p class="fp-challenge__invite">${escapeHtml(probleme.invite)}</p>`
      : safeHtml`<label class="fp-challenge__invite" for="${escapeHtml(ID_TENTATIVE)}">${escapeHtml(probleme.invite)}</label>
        <textarea class="fp-challenge__champ" id="${escapeHtml(ID_TENTATIVE)}" data-testid="tentative" rows="4" aria-label="${escapeHtml(this.texte('challenge-reponse'))}">${escapeHtml(this.tentative)}</textarea>
        <button type="button" class="fp-challenge__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <p class="fp-challenge__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-challenge__probleme">
        <legend class="fp-enonce">${escapeHtml(probleme.enonce)}</legend>
        ${dossier(probleme)}
        ${reponse}
        ${this.correction()}
      </fieldset>
    `;
  }

  private correction(): EscapedHtml {
    const connues = this.formateur.length > 0 ? this.formateur : this.servies;
    if (this.interneRevele) {
      return this.liste(connues, true);
    }
    return this.presentateur() ? VIDE : this.liste(this.servies, false);
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.probleme?.id ?? null);
    const champ = racine.querySelector<HTMLTextAreaElement>('[data-testid="tentative"]');
    const envoyer = racine.querySelector<HTMLButtonElement>('[data-testid="envoyer"]');
    if (champ === null || envoyer === null) {
      return;
    }
    const verrouille = this.verrouilleApresEnvoi(this.soumise, this.servies.length > 0);
    champ.disabled = verrouille;
    envoyer.disabled = verrouille;
    champ.addEventListener('input', () => {
      this.tentative = champ.value;
      this.signalerBrouillon(this.interne?.id ?? '', { tentative: champ.value });
    });
    envoyer.addEventListener('click', () => this.envoyer(champ.value));
  }

  private marque(strategie: StrategieServie): EscapedHtml {
    if (strategie.fausse !== true) {
      return VIDE;
    }
    return safeHtml`<span class="fp-challenge__marque" data-testid="marque">${escapeHtml(this.texte('challenge-fausse'))}</span>`;
  }

  private liste(strategies: readonly StrategieServie[], ouverte: boolean): EscapedHtml {
    if (strategies.length === 0) {
      return VIDE;
    }
    const lignes = strategies.map(
      (strategie) =>
        safeHtml`<li class="fp-challenge__strategie" data-testid="strategie" data-strategie="${escapeHtml(strategie.id)}"><span class="fp-challenge__libelle">${escapeHtml(strategie.libelle)}</span>${this.marque(strategie)}</li>`,
    );
    const attente =
      strategies.some((strategie) => strategie.fausse !== undefined) || this.interneRevele
        ? VIDE
        : safeHtml`<p class="fp-challenge__attente" data-testid="attente-revelation">${escapeHtml(this.texte('challenge-attente-revelation'))}</p>`;
    return safeHtml`<details class="fp-challenge__revelation" data-testid="revelation" ${ouverte ? OUVERT : VIDE}><summary class="fp-challenge__titre">${escapeHtml(this.texte(ouverte ? 'challenge-strategies' : 'challenge-reveler'))}</summary><ul class="fp-challenge__strategies">${lignes}</ul>${attente}</details>`;
  }

  private envoyer(brut: string): void {
    if (this.verrouilleApresEnvoi(this.soumise, this.servies.length > 0)) {
      return;
    }
    this.tentative = brut;
    if (brut.trim().length === 0) {
      this.message = this.texte('challenge-tentative-vide');
      this.refresh();
      return;
    }
    this.soumise = true;
    this.message = this.messageApresEnvoi();
    this.emit('fp-challenge-submit', {
      problemeId: this.probleme?.id,
      tentative: brut,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
