import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import { estObjet, type StrategieServie } from './retours';

export interface ChallengeProblemePublic {
  readonly id: string;
  readonly enonce: string;
  readonly invite: string;
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

  renderHand(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <fieldset class="fp-carte fp-challenge__probleme">
        <legend>${escapeHtml(probleme.enonce)}</legend>
        <p class="fp-challenge__consigne" data-testid="consigne">${escapeHtml(this.texte('challenge-consigne'))}</p>
        <label class="fp-challenge__invite" for="${escapeHtml(ID_TENTATIVE)}">${escapeHtml(probleme.invite)}</label>
        <textarea class="fp-challenge__champ" id="${escapeHtml(ID_TENTATIVE)}" data-testid="tentative" rows="5">${escapeHtml(this.tentative)}</textarea>
        <button type="button" class="fp-challenge__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <p class="fp-challenge__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.annonces()}
        ${this.liste(this.servies, false)}
      </fieldset>
    `;
  }

  renderStage(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml``;
    }
    const projetees = this.formateur.length > 0 ? this.formateur : this.servies;
    return safeHtml`
      <fieldset class="fp-carte fp-challenge__probleme">
        <legend>${escapeHtml(probleme.enonce)}</legend>
        <p class="fp-challenge__consigne" data-testid="consigne">${escapeHtml(this.texte('challenge-consigne'))}</p>
        <label class="fp-challenge__invite" for="${escapeHtml(ID_TENTATIVE)}">${escapeHtml(probleme.invite)}</label>
        <textarea class="fp-challenge__champ" id="${escapeHtml(ID_TENTATIVE)}" rows="5" disabled></textarea>
        ${this.interneRevele ? this.liste(projetees, true) : VIDE}
      </fieldset>
    `;
  }

  renderBoard(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = probleme.metadonnees;
    return safeHtml`
      <div class="fp-carte fp-challenge__probleme">
        <p class="fp-enonce">${escapeHtml(probleme.enonce)}</p>
        <p class="fp-challenge__concepts" data-testid="concepts">${escapeHtml(metadonnees.concepts.join(' · '))}</p>
        <p class="fp-reperes">${this.reperes(metadonnees)}</p>
        ${this.roleActuel() === 'presentateur' ? this.liste(this.formateur, true) : VIDE}
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.probleme?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
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
